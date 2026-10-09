"""Validate Culinary Commerce design tokens and optionally render their static preview."""

import argparse
import json
import re
from html import escape
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
DOCUMENTS = [
    HERE / "README.md",
    ROOT / "AGENTS.md",
    ROOT / "apps/frontend/AGENTS.md",
    ROOT / "docs/README.md",
    ROOT / "docs/development.md",
    ROOT / "docs/coding-standards.md",
    ROOT / "docs/architecture/WHITEPLATE_FRONTEND_ARCHITECTURE.md",
    ROOT / "docs/architecture/frontend-conventions.md",
    ROOT / "docs/documentation-review.md",
    ROOT / "readme.md",
]

EXPECTED_SOURCE_PALETTE = {
    "obsidian": "#0F172A",
    "warmCharcoal": "#1E293B",
    "tangerine": ["#FF5A1F", "#F97316"],
    "mint": "#10B981",
    "light": {"canvas": "#F8FAFC", "surface": "#FFFFFF", "muted": "#F1F5F9", "border": "#E2E8F0"},
    "dark": {"canvas": "#020617", "layer1": "#0B0F19", "layer2": "#1E293B", "border": "#334155"},
    "statuses": {
        "pending": {"solid": "#F59E0B", "text": "#B45309", "tint": "#FEF3C7"},
        "preparing": {"solid": "#3B82F6", "text": "#1D4ED8", "tint": "#DBEAFE"},
        "ready": {"solid": "#10B981", "text": "#047857", "tint": "#D1FAE5"},
        "cancelled": {"solid": "#EF4444", "text": "#B91C1C", "tint": "#FEE2E2"},
    },
}


def luminance(color):
    channels = [int(color[index:index + 2], 16) / 255 for index in (1, 3, 5)]
    linear = [value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4 for value in channels]
    return sum(value * weight for value, weight in zip(linear, (0.2126, 0.7152, 0.0722)))


def contrast(first, second):
    high, low = sorted((luminance(first), luminance(second)), reverse=True)
    return (high + 0.05) / (low + 0.05)


def contrast_pairs():
    pairs = [("primary-foreground", "primary", 4.5), ("primary-foreground", "primary-hover", 4.5),
             ("destructive-foreground", "destructive-solid", 4.5)]
    pairs += [("foreground", surface, 4.5) for surface in ("background", "card", "popover", "muted", "secondary", "accent")]
    pairs += [("muted-foreground", surface, 4.5) for surface in ("background", "card", "popover", "muted", "secondary")]
    for status in ("success", "warning", "info", "destructive"):
        pairs.append((status, f"{status}-muted", 4.5))
        for surface in ("background", "card", "popover"):
            pairs.append((status, surface, 4.5))
    for surface in ("background", "card", "popover", "muted", "secondary", "accent"):
        pairs += [("input", surface, 3), ("ring", surface, 3)]
    pairs.append(("sidebar-ring", "sidebar", 3))
    return pairs


def css_color_tokens(source, selector):
    escaped_selector = re.escape(selector)
    match = re.search(rf"{escaped_selector}\s*\{{([^}}]+)\}}", source)
    if not match:
        return None
    return css_declarations(match.group(1))


def css_declarations(block):
    return {
        name: color.upper()
        for name, color in re.findall(r"--([a-z-]+):\s*(#[0-9A-Fa-f]{6});", block)
    }


def validate(data):
    errors = []
    ratios = []
    themes = data.get("themes", {})
    if set(themes) != {"light", "dark"}:
        errors.append("Both light and dark themes are required")
    elif set(themes["light"]) != set(themes["dark"]):
        errors.append("Theme token names differ")

    for mode, colors in themes.items():
        for name, color in colors.items():
            if not isinstance(color, str) or not re.fullmatch(r"#[0-9A-F]{6}", color):
                errors.append(f"Invalid uppercase sRGB color: {mode}.{name}")
        if not all(name in colors for pair in contrast_pairs() for name in pair[:2]):
            errors.append(f"{mode}: missing a required semantic contrast token")
            continue
        for front, back, minimum in contrast_pairs():
            ratio = contrast(colors[front], colors[back])
            ratios.append((mode, front, back, ratio, minimum))
            if ratio < minimum:
                errors.append(f"{mode}: {front}/{back} = {ratio:.2f}:1; requires {minimum}:1")

    presentation = data.get("presentationPalette", {})
    light_surface_names = ("background", "card", "popover", "muted", "secondary", "accent")
    light_surfaces = [themes.get("light", {}).get(name) for name in light_surface_names]
    light_surfaces += [presentation.get(name) for name in (
        "surface-container-low", "surface-container", "surface-container-high",
        "surface-variant", "surface-dim", "secondary-fixed",
    )]
    dark_surface_names = ("background", "card", "popover", "muted", "secondary")
    dark_surfaces = [themes.get("dark", {}).get(name) for name in dark_surface_names]
    dark_surfaces += [presentation.get("obsidian"), themes.get("dark", {}).get("border")]
    for mode, foreground, surfaces in (
        ("light", presentation.get("brand-text-light"), light_surfaces),
        ("dark", presentation.get("brand-text-dark"), dark_surfaces),
    ):
        for surface in surfaces:
            if not foreground or not surface:
                errors.append(f"{mode}: missing brand text or surface contrast token")
                break
            ratio = contrast(foreground, surface)
            ratios.append((mode, "brand-text", surface, ratio, 4.5))
            if ratio < 4.5:
                errors.append(f"{mode}: brand-text/{surface} = {ratio:.2f}:1; requires 4.5:1")

    for mode, hover_surface, pressed_surface in (
        ("light", presentation.get("surface-variant"), presentation.get("surface-dim")),
        ("dark", themes.get("dark", {}).get("border"), themes.get("dark", {}).get("border")),
    ):
        colors = themes.get(mode, {})
        for role, surface in (
            ("foreground", hover_surface), ("foreground", pressed_surface),
            ("secondary-foreground", hover_surface), ("secondary-foreground", pressed_surface),
            ("ring", hover_surface), ("ring", pressed_surface),
        ):
            if role not in colors or not surface:
                errors.append(f"{mode}: missing interaction contrast token {role}")
                continue
            minimum = 3 if role == "ring" else 4.5
            ratio = contrast(colors[role], surface)
            ratios.append((mode, role, surface, ratio, minimum))
            if ratio < minimum:
                errors.append(f"{mode}: {role}/{surface} = {ratio:.2f}:1; requires {minimum}:1")
        pressed_foreground = "#" + "".join(
            f"{int(colors['primary-foreground'][index:index + 2], 16) * 9 // 10:02X}"
            for index in (1, 3, 5)
        )
        pressed_background = "#" + "".join(
            f"{int(colors['primary-hover'][index:index + 2], 16) * 9 // 10:02X}"
            for index in (1, 3, 5)
        )
        ratio = contrast(pressed_foreground, pressed_background)
        ratios.append((mode, "pressed-primary", pressed_background, ratio, 4.5))
        if ratio < 4.5:
            errors.append(f"{mode}: pressed-primary/{pressed_background} = {ratio:.2f}:1; requires 4.5:1")

    if data.get("name") != "Culinary Commerce System":
        errors.append("Canonical token name must be Culinary Commerce System")
    if data.get("sourcePalette") != EXPECTED_SOURCE_PALETTE:
        errors.append("sourcePalette differs from the user-supplied named prose HEX values")
    expected_radius = {"sm": 0.25, "default": 0.5, "md": 0.75, "lg": 1, "xl": 1.5}
    if data.get("radiusRem") != expected_radius:
        errors.append("Radius tokens differ from the supplied YAML scale")
    if data.get("radiusPx") != {"full": 9999}:
        errors.append("Full-pill radius must remain 9999px")
    expected_spacing = {"gutter": 1.5, "gutterMobile": 1, "margin": 2, "marginMobile": 1,
                        "xs": 0.25, "sm": 0.5, "md": 1, "lg": 1.5, "xl": 2.5}
    if data.get("spacingRem") != expected_spacing:
        errors.append("Spacing tokens differ from the supplied YAML scale")
    if data.get("breakpointsPx") != {"mobileMax": 640, "tabletMax": 1024, "desktopMax": 1440}:
        errors.append("Breakpoints must preserve the approved 640/1024/1440px boundaries")
    if set(data.get("typography", {})) != {
        "display-hero", "display-hero-mobile", "headline-lg", "headline-lg-mobile",
        "headline-md", "headline-sm", "title-md", "body-lg", "body-md", "body-sm",
        "label-md", "label-sm", "kpi-number",
    }:
        errors.append("Typography tokens do not match the supplied YAML scale")

    runtime_css = (ROOT / "apps/frontend/app/globals.css").read_text(encoding="utf-8")
    for selector, expected in (
        (":root, .design-reference", presentation.get("brand-text-light")),
        (".dark", presentation.get("brand-text-dark")),
    ):
        declarations = re.findall(rf"{re.escape(selector)}\s*\{{([^}}]+)\}}", runtime_css)
        if not any(re.search(r"--presentation-brand-text:\s*" + re.escape(expected or ""), block)
                   for block in declarations):
            errors.append(f"Runtime {selector} brand text differs from canonical presentation tokens")
    for mode, selector in (("light", ":root"), ("dark", ".dark")):
        actual = css_color_tokens(runtime_css, selector)
        if actual != themes.get(mode):
            errors.append(f"{selector} CSS colors differ from canonical {mode} tokens")

    root_match = re.search(r":root\s*\{([^}]+)\}", runtime_css)
    theme_match = re.search(r"@theme inline\s*\{([^}]+)\}", runtime_css)
    if not root_match or not theme_match:
        errors.append("Runtime root/theme declarations are missing")
    else:
        root_values = css_declarations(root_match.group(1))
        theme_values = css_declarations(theme_match.group(1))
        # CSS non-color custom properties use values other than HEX too.
        root_values.update({name: value.strip() for name, value in re.findall(r"--([a-z-]+):\s*([^;]+);", root_match.group(1))})
        theme_values.update({name: value.strip() for name, value in re.findall(r"--([a-z-]+):\s*([^;]+);", theme_match.group(1))})
        if "Inter" not in root_values.get("font-sans", "") or "Plus Jakarta Sans" not in root_values.get("font-heading", ""):
            errors.append("Runtime font stacks must prioritize Inter and Plus Jakarta Sans")
        for key, value in expected_spacing.items():
            if key in ("gutter", "gutterMobile", "margin", "marginMobile"):
                css_name = {"gutter": "gutter", "gutterMobile": "gutter-mobile",
                            "margin": "margin", "marginMobile": "margin-mobile"}[key]
                expected = f"{value:g}rem"
                if root_values.get(css_name) != expected:
                    errors.append(f"Runtime --{css_name} differs from canonical spacing")
            else:
                expected = f"{value:g}rem"
                if root_values.get(f"space-{key}") != expected or theme_values.get(f"spacing-{key}") != f"var(--space-{key})":
                    errors.append(f"Runtime spacing token {key} differs from canonical spacing")
        if root_values.get("radius") != f"{expected_radius['default']:g}rem":
            errors.append("Runtime default radius differs from canonical tokens")
        for role in ("sm", "md", "lg", "xl"):
            if theme_values.get(f"radius-{role}") != f"{expected_radius[role]:g}rem":
                errors.append(f"Runtime radius {role} differs from canonical tokens")
        if theme_values.get("radius-full") != f"{data['radiusPx']['full']}px":
            errors.append("Runtime full radius differs from canonical tokens")
        for name, role in (("mobileMax", "tablet"), ("tabletMax", "desktop"), ("desktopMax", "ultrawide")):
            expected = f"{data['breakpointsPx'][name] / 16:g}rem"
            if theme_values.get(f"breakpoint-{role}") != expected:
                errors.append(f"Runtime breakpoint {role} differs from canonical tokens")
        if theme_values.get("container-storefront") != f"{data['storefrontMaxWidthPx'] / 16:g}rem":
            errors.append("Runtime storefront container width differs from canonical tokens")
        for name, scale in data["typography"].items():
            css_name = f"text-{name}"
            if theme_values.get(css_name) != f"{scale['sizePx'] / 16:g}rem":
                errors.append(f"Runtime text size differs for {name}")
            if theme_values.get(f"{css_name}--line-height") != f"{scale['lineHeightPx'] / 16:g}rem":
                errors.append(f"Runtime line height differs for {name}")
            if theme_values.get(f"{css_name}--font-weight") != str(scale["weight"]):
                errors.append(f"Runtime font weight differs for {name}")
            if scale.get("letterSpacing") and theme_values.get(f"{css_name}--letter-spacing") != scale["letterSpacing"]:
                errors.append(f"Runtime letter spacing differs for {name}")

    master = (HERE / "README.md").read_text(encoding="utf-8")
    for line in master.splitlines():
        cells = [cell.strip() for cell in line.split("|")[1:-1]]
        if len(cells) != 4 or not cells[0].startswith("`"):
            continue
        role = cells[0].strip("`")
        if role not in themes.get("light", {}):
            continue
        values = [re.findall(r"#[0-9A-Fa-f]{6}", cell) for cell in cells[1:3]]
        expected = [[themes[mode][role]] for mode in ("light", "dark")]
        if values != expected:
            errors.append(f"README palette row differs from tokens for {role}")
    for color in re.findall(r"#[0-9A-F]{6}", json.dumps(EXPECTED_SOURCE_PALETTE)):
        if color not in master:
            errors.append(f"README does not document supplied source color {color}")
            break

    for path in DOCUMENTS:
        source = path.read_text(encoding="utf-8")
        for match in re.finditer(r"\[[^\]\n]*\]\(([^)\n]+)\)", source):
            target = match.group(1).strip().strip("<>").split("#", 1)[0]
            if not target or re.match(r"[a-z]+://", target):
                continue
            if not (path.parent / target).exists():
                errors.append(f"Missing file link: {path.relative_to(ROOT)} -> {target}")

    contrast_note = data.get("contrastExceptions", [{}])[0]
    if contrast_note.get("foreground") != "primary-foreground" or contrast_note.get("background") != "primary":
        errors.append("Primary action contrast rationale is missing")
    elif round(contrast(contrast_note["foreground"] if contrast_note["foreground"].startswith("#") else themes["light"][contrast_note["foreground"]],
                       contrast_note["background"] if contrast_note["background"].startswith("#") else themes["light"][contrast_note["background"]]), 2) != 5.72:
        errors.append("Obsidian-on-Tangerine primary contrast must calculate to 5.72:1")

    if errors:
        raise SystemExit("Validation failed:\n" + "\n".join(errors))
    lowest_text = min((row for row in ratios if row[4] == 4.5), key=lambda row: row[3])
    lowest_ui = min((row for row in ratios if row[4] == 3), key=lambda row: row[3])
    print(f"PASS: {len(ratios)} contrast pairs across light/dark; CSS/token parity; palette parity; {len(DOCUMENTS)} documentation link scans")
    print(f"Lowest text: {lowest_text[0]} {lowest_text[1]}/{lowest_text[2]} = {lowest_text[3]:.2f}:1")
    print(f"Lowest control/focus: {lowest_ui[0]} {lowest_ui[1]}/{lowest_ui[2]} = {lowest_ui[3]:.2f}:1")


def render(data):
    parts = [
        '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="680" viewBox="0 0 1280 680" role="img" aria-labelledby="title desc">',
        '<title id="title">WhitePlate — Culinary Commerce System</title>',
        '<desc id="desc">Static reference board showing light and dark palette tokens, status colors, and typography. This is not a screenshot of the application.</desc>',
    ]

    def rect(x, y, width, height, fill, radius=0, stroke=None):
        outline = f' stroke="{stroke}"' if stroke else ""
        parts.append(f'<rect x="{x}" y="{y}" width="{width}" height="{height}" rx="{radius}" fill="{fill}"{outline}/>')

    def text(x, y, value, fill, size=16, weight=400, family="Inter, Segoe UI, Arial, sans-serif"):
        parts.append(f'<text x="{x}" y="{y}" fill="{fill}" font-family="{family}" font-size="{size}" font-weight="{weight}">{escape(value)}</text>')

    swatches = [
        ("Canvas", "background"), ("Surface", "card"), ("Muted", "muted"),
        ("Tangerine", "primary"), ("Mint status", "success-solid"), ("Blue status", "info-solid"),
    ]
    statuses = [("Pending", "warning-muted", "warning"), ("Preparing", "info-muted", "info"),
                ("Ready", "success-muted", "success"), ("Cancelled", "destructive-muted", "destructive")]
    for index, mode in enumerate(("light", "dark")):
        colors = data["themes"][mode]
        x = index * 640
        rect(x, 0, 640, 680, colors["background"])
        text(x + 32, 54, "WhitePlate", colors["foreground"], 20, 700, "Plus Jakarta Sans, Segoe UI, Arial, sans-serif")
        text(x + 32, 100, "Culinary Commerce System", colors["foreground"], 28, 700, "Plus Jakarta Sans, Segoe UI, Arial, sans-serif")
        text(x + 32, 128, f"Canonical token reference · {mode.title()} theme", colors["muted-foreground"], 14)
        for swatch_index, (label, role) in enumerate(swatches):
            sx = x + 32 + (swatch_index % 3) * 188
            sy = 164 + (swatch_index // 3) * 104
            rect(sx, sy, 164, 58, colors[role], 8, colors["border"])
            text(sx, sy + 80, label, colors["foreground"], 14, 600)
            text(sx, sy + 99, colors[role], colors["muted-foreground"], 12)
        text(x + 32, 404, "Operational states", colors["foreground"], 18, 700, "Plus Jakarta Sans, Segoe UI, Arial, sans-serif")
        for status_index, (label, tint, foreground) in enumerate(statuses):
            sy = 422 + status_index * 48
            rect(x + 32, sy, 280, 36, colors[tint], 18)
            text(x + 48, sy + 24, label, colors[foreground], 14, 600)
            text(x + 334, sy + 24, f"{colors[foreground]} / {colors[tint]}", colors["muted-foreground"], 12)
        rect(x + 32, 632, 576, 1, colors["border"])
        text(x + 32, 662, "Static reference generated from tokens.json", colors["muted-foreground"], 12)
    parts.append("</svg>")
    (HERE / "overview.svg").write_text("\n".join(parts) + "\n", encoding="utf-8")
    print("Rendered docs/design-system/overview.svg from tokens.json")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--render", action="store_true", help="render the static palette preview after validation")
    args = parser.parse_args()
    token_data = json.loads((HERE / "tokens.json").read_text(encoding="utf-8"))
    validate(token_data)
    if args.render:
        render(token_data)
