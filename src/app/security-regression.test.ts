import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const appDir = join(process.cwd(), "src", "app");

describe("security regressions", () => {
  test("report detail page does not expose raw AI JSON to users", () => {
    const reportDetailPage = readFileSync(join(appDir, "(app)", "reports", "[reportId]", "page.tsx"), "utf8");

    expect(reportDetailPage).not.toContain("aiRawJson");
  });

  test("register API hashes passwords instead of storing plaintext", () => {
    const registerRoute = readFileSync(join(appDir, "api", "register", "route.ts"), "utf8");

    expect(registerRoute).toContain("bcrypt.hash");
    expect(registerRoute).toContain("passwordHash");
    expect(registerRoute).not.toContain("password: parsed.data.password");
  });
});
