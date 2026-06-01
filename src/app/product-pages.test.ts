import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const appDir = join(process.cwd(), "src", "app");

describe("Phase 3 product pages", () => {
  test("defines all required App Router pages", () => {
    const requiredPages = [
      "page.tsx",
      "login/page.tsx",
      "register/page.tsx",
      "(app)/dashboard/page.tsx",
      "(app)/files/page.tsx",
      "(app)/files/new/page.tsx",
      "(app)/files/[fileId]/page.tsx",
      "(app)/reports/page.tsx",
      "(app)/reports/[reportId]/page.tsx",
      "(app)/settings/page.tsx"
    ];

    for (const page of requiredPages) {
      expect(existsSync(join(appDir, page))).toBe(true);
    }
  });

  test("protects authenticated product pages in the shared app layout", () => {
    const layout = readFileSync(join(appDir, "(app)", "layout.tsx"), "utf8");

    expect(layout).toContain("requireAuth");
    expect(layout).toContain("requireDefaultWorkspace");
  });
});
