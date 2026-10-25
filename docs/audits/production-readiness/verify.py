"""Validate the production-readiness audit findings, coverage matrix, backlog and README."""

import re
import sys
from pathlib import Path

AUDIT_DIR = "docs/audits/production-readiness"
ID_RE = re.compile(r"^(SEC|AUTH|PUB|DATA|CFG|A11Y|CODE|HOST|PERF)-\d{2}$")
HEADING_RE = re.compile(r"^###\s+([A-Za-z0-9]+-\d+)\b\s*(.*)$")
FIELD_RE = re.compile(r"^-\s+\*\*([^:*]+):\*\*\s*(.*)$")
FIELDS = {
    "Workstream": "workstream",
    "Location": "location",
    "Evidence": "evidence",
    "Impact": "impact",
    "Severity": "severity",
    "Fix direction": "fix",
    "Regression test": "regression",
    "Status": "status",
}
SEVERITIES = {"Blocker", "Should", "Could"}
STATUSES = {"Confirmed", "Suspected"}
REGRESSION_RE = re.compile(r"^(None|Sketch below|Existing\s+\S.*)$")
WORKSTREAM_RE = re.compile(r"^W[1-9]$")
MATRIX_HEADING = "## Endpoint × role × tenant matrix"
HTTP_METHODS = "GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS"
COVERAGE_STATUSES = {"Covered", "Partial", "Not run"}
USE_SERVER_RE = re.compile(r"""\s*(?://[^\n]*\n\s*|/\*.*?\*/\s*)*["']use server["']""", re.S)


def parse_findings(text, source):
    """Return (findings, errors) for every `### ID — title` section in text."""
    findings, errors = [], []
    sections = []  # (id, rest-of-heading, body lines), or None for any other heading
    for line in text.splitlines():
        heading = HEADING_RE.match(line)
        if heading:
            sections.append((heading.group(1), heading.group(2), []))
        elif line.startswith("#"):
            sections.append(None)
        elif sections and sections[-1] is not None:
            sections[-1][2].append(line)
    for section in sections:
        if section is None:
            continue
        finding_id, rest, body = section
        where = f"{source}: {finding_id}"
        if not ID_RE.match(finding_id):
            errors.append(f"{where}: invalid ID (expected SEC|AUTH|PUB|DATA|CFG|A11Y|CODE|HOST|PERF-NN)")
        title = rest[1:].strip() if rest.startswith("—") else None
        if not title:
            errors.append(f"{where}: heading must be '### ID — title' with an em dash and a title")
        values, last = {}, None
        for line in body:
            field = FIELD_RE.match(line)
            if field and field.group(1).strip() in FIELDS:
                last = FIELDS[field.group(1).strip()]
                values[last] = field.group(2).strip()
            elif line[:1] in (" ", "\t") and last and line.strip():
                values[last] = f"{values[last]} {line.strip()}".strip()
        for label, key in FIELDS.items():
            if key not in values:
                errors.append(f"{where}: missing field {label}")
            elif not values[key]:
                errors.append(f"{where}: empty field {label}")
        if values.get("workstream") and not WORKSTREAM_RE.match(values["workstream"]):
            errors.append(f"{where}: Workstream must be W1..W9, got '{values['workstream']}'")
        if values.get("severity") and values["severity"] not in SEVERITIES:
            errors.append(f"{where}: Severity must be Blocker, Should or Could, got '{values['severity']}'")
        if values.get("status") and values["status"] not in STATUSES:
            errors.append(f"{where}: Status must be Confirmed or Suspected, got '{values['status']}'")
        if values.get("regression") and not REGRESSION_RE.match(values["regression"]):
            errors.append(f"{where}: Regression test must be None, 'Existing <path>' or 'Sketch below'")
        findings.append({"id": finding_id, "title": title or "", "source": source,
                         **{key: values.get(key, "") for key in FIELDS.values()}})
    return findings, errors


def check_duplicates(findings):
    """Report finding IDs that appear more than once, naming every source."""
    sources = {}
    for item in findings:
        sources.setdefault(item["id"], []).append(item["source"])
    return [f"Duplicate finding ID {finding_id} in {', '.join(found)}"
            for finding_id, found in sources.items() if len(found) > 1]


def enumerate_surface(repo_root):
    """Return the audited surface keys: controller actions, hub methods, route handlers, server actions."""
    repo_root = Path(repo_root)
    surface = set()
    controllers = repo_root / "apps/api/WhitePlate.Api/Controllers"
    for path in sorted(controllers.glob("*.cs")):
        lines = path.read_text(encoding="utf-8").splitlines()
        for index, line in enumerate(lines):
            if not re.match(r"\s*\[Http\w+", line):
                continue
            for following in lines[index + 1:]:
                stripped = following.strip()
                if not stripped or stripped.startswith("["):
                    continue
                name = re.search(r"(\w+)\s*(?:<[^()]*>)?\s*\(", stripped)
                if name:
                    surface.add(f"{path.stem}.{name.group(1)}")
                break
    hub = repo_root / "apps/api/WhitePlate.Api/Realtime/KitchenHub.cs"
    if hub.exists():
        for line in hub.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if not stripped.startswith("public ") or "(" not in stripped or re.search(r"\bclass\b", stripped):
                continue
            tokens = stripped.split("(")[0].split()
            if "override" in tokens or "static" in tokens:
                continue
            surface.add("KitchenHub." + re.sub(r"<.*", "", tokens[-1]))
    frontend = repo_root / "apps/frontend"
    methods_all = set(HTTP_METHODS.split("|"))
    for path in sorted((frontend / "app/api").glob("**/route.ts")):
        relative = path.relative_to(frontend).as_posix()
        text = path.read_text(encoding="utf-8")
        methods = set(re.findall(rf"^export\s+(?:async\s+)?function\s+({HTTP_METHODS})\b", text, re.M))
        methods |= set(re.findall(rf"^export\s+const\s+({HTTP_METHODS})\b\s*[=:]", text, re.M))
        for group in re.findall(r"^export\s+(?:const\s*)?\{([^}]*)\}", text, re.M):
            methods |= {part.split(":")[0].split(" as ")[-1].strip() for part in group.split(",")} & methods_all
        surface |= {f"{relative}#{method}" for method in methods}
    for path in sorted((frontend / "actions").glob("*.ts")):
        text = path.read_text(encoding="utf-8")
        if not USE_SERVER_RE.match(text):
            continue
        relative = path.relative_to(frontend).as_posix()
        names = re.findall(r"^export\s+async\s+function\s+(\w+)", text, re.M)
        names += re.findall(r"^export\s+const\s+(\w+)\s*=\s*async\b", text, re.M)
        surface |= {f"{relative}#{name}" for name in names}
    return surface


def matrix_rows(text):
    """Return backticked first cells of table rows under the matrix heading."""
    rows, inside = set(), False
    for line in text.splitlines():
        if line.startswith("## "):
            inside = line.strip() == MATRIX_HEADING
        elif inside and line.lstrip().startswith("|"):
            first = line.strip().strip("|").split("|")[0].strip()
            cell = re.fullmatch(r"`([^`]+)`", first)
            if cell:
                rows.add(cell.group(1))
    return rows


def check_matrix(surface, rows):
    return [f"Matrix row missing for {key}" for key in sorted(surface - rows)]


def check_backlog(findings, backlog_text):
    """Every Blocker and Should finding must be referenced in the remediation backlog."""
    return [f"{item['id']}: {item['severity']} finding is not batched in remediation-backlog.md ({item['source']})"
            for item in findings
            if item["severity"] in ("Blocker", "Should") and item["id"] not in backlog_text]


def check_readme(readme_text):
    """Require a `## Coverage` table with W1..W9 rows, valid statuses and reasons for gaps."""
    match = re.search(r"^## Coverage\s*$(.*?)(?=^## |\Z)", readme_text, re.M | re.S)
    if not match:
        return ["README.md: missing '## Coverage' section"]
    rows = {}
    for line in match.group(1).splitlines():
        if not line.lstrip().startswith("|"):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if re.fullmatch(r"W[1-9]", cells[0]):
            rows[cells[0]] = cells
    errors = []
    for number in range(1, 10):
        key = f"W{number}"
        if key not in rows:
            errors.append(f"README.md: Coverage table is missing row {key}")
            continue
        cells = rows[key]
        status = cells[1] if len(cells) > 1 else ""
        reason = " ".join(cells[2:]).strip()
        if status not in COVERAGE_STATUSES:
            errors.append(f"README.md: {key} status must be Covered, Partial or Not run, got '{status}'")
        elif status != "Covered" and not reason:
            errors.append(f"README.md: {key} is {status} and needs a reason")
    return errors


def main(argv):
    args = list(argv)
    root = Path(__file__).resolve().parents[3]
    if "--root" in args:
        root = Path(args[args.index("--root") + 1])
    audit = root / AUDIT_DIR
    errors, findings = [], []
    readme = audit / "README.md"
    backlog = audit / "remediation-backlog.md"
    if readme.exists():
        errors += check_readme(readme.read_text(encoding="utf-8"))
    if audit.exists():
        for path in sorted(audit.glob("*.md")):
            if path in (readme, backlog):
                continue
            parsed, found_errors = parse_findings(path.read_text(encoding="utf-8"), path.name)
            findings += parsed
            errors += found_errors
    errors += check_duplicates(findings)
    matrix_files = [path for path in sorted(audit.glob("w1-*.md"))
                    if MATRIX_HEADING in path.read_text(encoding="utf-8").splitlines()]
    if matrix_files:
        rows = set().union(*(matrix_rows(path.read_text(encoding="utf-8")) for path in matrix_files))
        errors += check_matrix(enumerate_surface(root), rows)
    if backlog.exists():
        errors += check_backlog(findings, backlog.read_text(encoding="utf-8"))
    if errors:
        print("\n".join(errors))
        return 1
    print("OK")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
