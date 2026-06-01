import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

describe("DashboardPage", () => {
  test("uses dynamic rendering because it reads the authenticated session", () => {
    const pagePath = fileURLToPath(new URL("./page.tsx", import.meta.url));
    const source = readFileSync(pagePath, "utf8");

    expect(source).toContain('export const dynamic = "force-dynamic";');
  });
});
