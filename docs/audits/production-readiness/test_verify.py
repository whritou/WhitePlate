"""Tests for the production-readiness audit verifier."""

import contextlib
import io
import tempfile
import unittest
from pathlib import Path

import verify

FINDING = """\
### PUB-03 — Checkout accepts client-supplied unit price

- **Workstream:** W3
- **Location:** `apps/api/WhitePlate.Application/Orders/CreateOrderHandler.cs:88`
- **Evidence:** `curl -X POST … ` returned `201` with `total: 0.01`
- **Impact:** A guest can pay any amount.
- **Severity:** Blocker
- **Fix direction:** Recompute line prices from the catalog snapshot server-side.
- **Regression test:** Sketch below
- **Status:** Confirmed
"""


def write(root, relative, content):
    path = Path(root) / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def finding(**overrides):
    return {"id": "SEC-01", "severity": "Should", "source": "w2.md", **overrides}


def readme(w5_row):
    rows = [f"| W{n} | Covered | |" for n in range(1, 10) if n != 5]
    rows.insert(4, w5_row)
    return "## Coverage\n\n| Workstream | Status | Reason |\n| --- | --- | --- |\n" + "\n".join(rows) + "\n"


class ParseFindingsTests(unittest.TestCase):
    def test_valid_finding_parses(self):
        findings, errors = verify.parse_findings(FINDING, "w3.md")
        self.assertEqual(errors, [])
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0]["id"], "PUB-03")
        self.assertEqual(findings[0]["severity"], "Blocker")
        self.assertEqual(findings[0]["source"], "w3.md")

    def test_missing_field_is_reported(self):
        text = FINDING.replace("- **Impact:** A guest can pay any amount.\n", "")
        _, errors = verify.parse_findings(text, "w3.md")
        self.assertTrue(any("PUB-03" in e and "Impact" in e for e in errors), errors)

    def test_invalid_severity_is_reported(self):
        _, errors = verify.parse_findings(FINDING.replace("Severity:** Blocker", "Severity:** blocker"), "w3.md")
        self.assertTrue(any("Severity" in e for e in errors), errors)

    def test_invalid_id_prefix_is_reported(self):
        _, errors = verify.parse_findings("### XYZ-01 — t\n", "w3.md")
        self.assertTrue(any("XYZ-01" in e for e in errors), errors)

    def test_duplicate_ids_across_files(self):
        text = FINDING.replace("PUB-03", "SEC-01")
        first, _ = verify.parse_findings(text, "a.md")
        second, _ = verify.parse_findings(text, "b.md")
        errors = verify.check_duplicates(first + second)
        self.assertEqual(len(errors), 1)
        self.assertIn("SEC-01", errors[0])
        self.assertIn("a.md", errors[0])
        self.assertIn("b.md", errors[0])


class SurfaceTests(unittest.TestCase):
    def test_surface_enumeration(self):
        with tempfile.TemporaryDirectory() as root:
            write(root, "apps/api/WhitePlate.Api/Controllers/OrdersController.cs", """\
public sealed class OrdersController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<IActionResult> List(Guid tenantId, CancellationToken ct)
    {
        return Ok();
    }

    [HttpPost("x")]
    public IActionResult Create() => Ok();

    private IActionResult Fail() => BadRequest();
}
""")
            write(root, "apps/api/WhitePlate.Api/Realtime/KitchenHub.cs", """\
public sealed class KitchenHub : Hub
{
    public async Task JoinRestaurant(Guid tenantId) { }

    public override Task OnDisconnectedAsync(Exception? exception) => base.OnDisconnectedAsync(exception);
}
""")
            write(root, "apps/frontend/app/api/kitchen/orders/route.ts", """\
export async function GET(request: Request) { return Response.json([]) }
export async function POST(request: Request) { return Response.json([]) }
""")
            write(root, "apps/frontend/app/.well-known/openid-configuration/route.ts", """\
export const dynamic = "force-dynamic"

export function GET() { return Response.json({}) }
""")
            write(root, "apps/api/WhitePlate.Api/Program.cs", """\
app.MapGet("/health/live", () => Results.Text("Healthy", "text/plain"))
    .AllowAnonymous();
app.MapHealthChecks("/health/ready", new HealthCheckOptions());
app.MapHub<KitchenHub>("/hubs/orders");
""")
            write(root, "apps/frontend/actions/checkout.ts", """\
"use server"

import { x } from "y"

export async function placeOrder() {}
async function helper() {}
""")
            write(root, "apps/frontend/actions/checkout.test.ts", """\
import { it } from "vitest"
export async function notAnAction() {}
""")
            self.assertEqual(verify.enumerate_surface(Path(root)), {
                "OrdersController.List", "OrdersController.Create", "KitchenHub.JoinRestaurant",
                "app/api/kitchen/orders/route.ts#GET", "app/api/kitchen/orders/route.ts#POST",
                "actions/checkout.ts#placeOrder", "app/.well-known/openid-configuration/route.ts#GET",
                "Program.cs#GET /health/live", "Program.cs#GET /health/ready",
            })

    def test_route_handlers_declared_as_constants(self):
        with tempfile.TemporaryDirectory() as root:
            write(root, "apps/frontend/app/api/auth/[...all]/route.ts",
                  "export const { GET, POST } = toNextJsHandler(auth)\n"
                  "export const PUT = (request: Request) => handle(request)\n")
            self.assertEqual(verify.enumerate_surface(Path(root)), {
                "app/api/auth/[...all]/route.ts#GET", "app/api/auth/[...all]/route.ts#POST",
                "app/api/auth/[...all]/route.ts#PUT",
            })


class MatrixTests(unittest.TestCase):
    def test_missing_matrix_row_is_reported(self):
        text = ("## Endpoint × role × tenant matrix\n\n| Endpoint | Anonymous |\n| --- | --- |\n"
                "| `A.B` | 401 |\n\n## Other\n\n| `C.D` | ignored |\n")
        rows = verify.matrix_rows(text)
        self.assertEqual(rows, {"A.B"})
        self.assertEqual(verify.check_matrix({"A.B", "C.D"}, rows), ["Matrix row missing for C.D"])


class BacklogTests(unittest.TestCase):
    def test_unbatched_should_finding_is_reported(self):
        errors = verify.check_backlog([finding(id="SEC-01", severity="Should")], "nothing here")
        self.assertTrue(any("SEC-01" in e for e in errors), errors)
        self.assertEqual(verify.check_backlog([finding(id="SEC-02", severity="Could")], "nothing here"), [])
        self.assertEqual(verify.check_backlog([finding(id="SEC-01", severity="Should")], "Batch 1: SEC-01"), [])


class ReadmeTests(unittest.TestCase):
    def test_readme_requires_reason_for_not_run(self):
        self.assertTrue(verify.check_readme(readme("| W5 | Not run | |")))
        self.assertEqual(verify.check_readme(readme("| W5 | Not run | Docker unavailable |")), [])

    def test_readme_rejects_unknown_status_and_missing_rows(self):
        text = readme("| W5 | Done | |").replace("| W9 | Covered | |\n", "")
        errors = verify.check_readme(text)
        self.assertTrue(any("W5" in e for e in errors), errors)
        self.assertTrue(any("W9" in e for e in errors), errors)


class MainTests(unittest.TestCase):
    def run_main(self, root):
        with contextlib.redirect_stdout(io.StringIO()):
            return verify.main(["--root", str(root)])

    def test_empty_audit_folder_is_ok(self):
        with tempfile.TemporaryDirectory() as root:
            (Path(root) / "docs/audits/production-readiness").mkdir(parents=True)
            self.assertEqual(self.run_main(root), 0)

    def test_invalid_finding_fails(self):
        with tempfile.TemporaryDirectory() as root:
            write(root, "docs/audits/production-readiness/w3-x.md", "### XYZ-01 — t\n")
            self.assertEqual(self.run_main(root), 1)


if __name__ == "__main__":
    unittest.main()
