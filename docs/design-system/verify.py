"""Validate the design reference; optionally render its static SVG overview."""

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


def luminance(color):
    channels = [int(color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    linear = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in channels]
    return sum(v * w for v, w in zip(linear, (0.2126, 0.7152, 0.0722)))


def contrast(first, second):
    high, low = sorted((luminance(first), luminance(second)), reverse=True)
    return (high + 0.05) / (low + 0.05)


def pairs():
    result = [(f"{role}-foreground", role, 4.5) for role in
              ("card", "popover", "primary", "secondary", "accent", "destructive",
               "sidebar", "sidebar-primary", "sidebar-accent")]
    result.append(("foreground", "background", 4.5))
    result.append(("primary-foreground", "primary-hover", 4.5))
    for surface in ("background", "card", "popover", "muted", "secondary"):
        result += [("foreground", surface, 4.5), ("muted-foreground", surface, 4.5)]
    for role in ("success", "warning", "info", "destructive"):
        result.append((role, f"{role}-muted", 4.5))
        result.append(("foreground", f"{role}-muted", 4.5))
        for surface in ("background", "card", "popover"):
            result.append((role, surface, 4.5))
    result.append(("muted-foreground", "accent", 4.5))
    for surface in ("background", "card", "popover", "muted", "secondary", "accent"):
        result += [("input", surface, 3), ("ring", surface, 3)]
    result += [("primary", "background", 4.5), ("primary", "card", 4.5),
               ("sidebar-ring", "sidebar", 3)]
    return result


def validate(data):
    errors = []
    ratios = []
    themes = data["themes"]
    if set(themes) != {"light", "dark"}:
        errors.append("Both light and dark themes are required")
    if set(themes["light"]) != set(themes["dark"]):
        errors.append("Theme token names differ")
    for mode, colors in themes.items():
        for name, color in colors.items():
            if not re.fullmatch(r"#[0-9A-F]{6}", color):
                errors.append(f"Invalid sRGB color: {mode}.{name}")
        for front, back, minimum in pairs():
            ratio = contrast(colors[front], colors[back])
            ratios.append((mode, front, back, ratio, minimum))
            if ratio < minimum:
                errors.append(f"{mode}: {front}/{back} = {ratio:.2f}:1; requires {minimum}:1")
    for path in DOCUMENTS:
        source = path.read_text(encoding="utf-8")
        for match in re.finditer(r"\[[^\]\n]*\]\(([^)\n]+)\)", source):
            target = match.group(1).strip().strip("<>").split("#", 1)[0]
            if not target or re.match(r"[a-z]+://", target):
                continue
            if not (path.parent / target).exists():
                errors.append(f"Missing file link: {path.relative_to(ROOT)} -> {target}")
    # Keep the normative palette table synchronized with the structured tokens.
    master = (HERE / "README.md").read_text(encoding="utf-8")
    for line in master.splitlines():
        cells = [cell.strip() for cell in line.split("|")[1:-1]]
        if len(cells) == 4 and " / " in cells[1]:
            front, back = cells[1].split(" / ", 1)
            if front in themes["light"] and back in themes["light"]:
                for mode, measured in zip(("light", "dark"), cells[2:4]):
                    colors = themes[mode]
                    expected = f"{contrast(colors[front], colors[back]):.2f}:1".replace(".", ",")
                    if measured != expected:
                        errors.append(f"Contrast table differs for {mode}: {front}/{back}")
        if len(cells) != 4 or not cells[0].startswith("`"):
            continue
        names = re.findall(r"`([a-z-]+)`", cells[0])
        if not names or any(name not in themes["light"] for name in names):
            continue
        for mode, cell in zip(("light", "dark"), cells[1:3]):
            actual = re.findall(r"#[0-9A-F]{6}", cell)
            expected = [themes[mode][name] for name in names]
            if actual != expected:
                errors.append(f"Palette table differs for {mode}: {names}")
    if errors:
        raise SystemExit("Validation failed:\n" + "\n".join(errors))
    lowest_text = min((r for r in ratios if r[4] == 4.5), key=lambda r: r[3])
    lowest_ui = min((r for r in ratios if r[4] == 3), key=lambda r: r[3])
    print(f"PASS: {len(ratios)} contrast pairs across light/dark; {len(DOCUMENTS)} document link scans; palette/contrast table parity")
    for label, row in (("Lowest text", lowest_text), ("Lowest control/focus", lowest_ui)):
        print(f"{label}: {row[0]} {row[1]}/{row[2]} = {row[3]:.2f}:1")


def render(data):
    parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1020" viewBox="0 0 1280 1020" role="img" aria-labelledby="title desc">',
             '<title id="title">WhitePlate — Porcelaine et encre</title>',
             '<desc id="desc">Planche de conception : palettes et exemples statiques de catalogue, formulaire et ticket cuisine dans les thèmes clair et sombre. Aucun écran de production migré.</desc>']

    def rect(x, y, w, h, color, radius=0, stroke=None, stroke_width=1):
        edge = f' stroke="{stroke}" stroke-width="{stroke_width}"' if stroke else ""
        parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{color}"{edge}/>')

    def text(x, y, value, color, size=16, weight=400):
        parts.append(f'<text x="{x}" y="{y}" fill="{color}" font-family="Segoe UI, Helvetica Neue, Arial, sans-serif" font-size="{size}" font-weight="{weight}">{escape(value)}</text>')

    def button(x, y, w, label, c):
        rect(x, y, w, 48, c["primary"], 8)
        text(x + 16, y + 30, label, c["primary-foreground"], 16, 600)

    for index, mode in enumerate(("light", "dark")):
        c = data["themes"][mode]
        x = index * 640
        rect(x, 0, 640, 1020, c["background"])
        text(x + 32, 54, "WhitePlate", c["foreground"], 24, 600)
        text(x + 32, 86, "Porcelaine et encre", c["foreground"], 32, 600)
        text(x + 32, 116, "Référence de design · " + ("Thème clair" if mode == "light" else "Thème sombre"), c["muted-foreground"], 14)
        roles = [("card", "Porcelaine"), ("primary", "Encre"), ("success", "Prête"), ("warning", "Attente"), ("destructive", "Erreur")]
        for i, (role, label) in enumerate(roles):
            sx = x + 32 + i * 116
            rect(sx, 146, 96, 48, c[role], 8, c["border"] if role == "card" else None)
            text(sx, 219, label, c["foreground"], 14, 600)
            text(sx, 239, c[role], c["muted-foreground"], 12)
        text(x + 32, 294, "Gestion · Catalogue", c["foreground"], 20, 600)
        rect(x + 32, 316, 576, 152, c["card"], 12, c["border"])
        rect(x + 48, 332, 136, 40, c["accent"], 8)
        text(x + 64, 358, "Catalogue", c["accent-foreground"], 16, 600)
        text(x + 204, 359, "Bistro du Port", c["foreground"], 18, 600)
        text(x + 52, 405, "Sandwich poulet", c["foreground"], 16, 600)
        text(x + 483, 405, "9,50 €", c["foreground"], 16, 600)
        text(x + 52, 435, "Disponible · Pain au choix", c["muted-foreground"], 14)
        text(x + 32, 515, "Formulaire · Focus et action", c["foreground"], 20, 600)
        text(x + 32, 546, "Nom du produit", c["foreground"], 16, 600)
        rect(x + 30, 558, 580, 52, c["background"], 10, c["ring"], 2)
        rect(x + 34, 562, 572, 44, c["card"], 8, c["input"])
        text(x + 48, 591, "Soupe de saison", c["foreground"], 16)
        text(x + 32, 637, "Le nom sera visible dans le menu.", c["muted-foreground"], 14)
        button(x + 32, 655, 260, "Enregistrer les modifications", c)
        text(x + 32, 750, "Cuisine · Une action évidente", c["foreground"], 20, 600)
        rect(x + 32, 772, 576, 180, c["card"], 12, c["border"])
        text(x + 52, 805, "Commande A82F", c["foreground"], 18, 600)
        rect(x + 384, 785, 204, 32, c["info-muted"], 16)
        text(x + 400, 806, "En préparation", c["info"], 14, 600)
        text(x + 52, 835, "Camille · 12:42", c["muted-foreground"], 14)
        text(x + 52, 865, "2 × Sandwich poulet", c["foreground"], 18, 600)
        text(x + 384, 865, "Total : 23,00 €", c["foreground"], 16, 600)
        button(x + 52, 885, 240, "Marquer comme prête", c)
        text(x + 32, 990, "v1.0 · Planche statique · Écrans existants à migrer", c["muted-foreground"], 14)
    parts.append("</svg>")
    (HERE / "overview.svg").write_text("\n".join(parts) + "\n", encoding="utf-8")
    print("Rendered docs/design-system/overview.svg from tokens.json")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--render", action="store_true", help="regenerate the static design overview after validation")
    args = parser.parse_args()
    tokens = json.loads((HERE / "tokens.json").read_text(encoding="utf-8"))
    validate(tokens)
    if args.render:
        render(tokens)
