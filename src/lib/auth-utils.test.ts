import { describe, expect, it } from "vitest";
import { buildDefaultWorkspaceName, buildWorkspaceSlug, normalizeEmail } from "./auth-utils";
import { registerSchema } from "./validators/register";

describe("auth utils", () => {
  it("normalizes email before lookup and storage", () => {
    expect(normalizeEmail("  Demo@Example.COM  ")).toBe("demo@example.com");
  });

  it("builds a stable default workspace name", () => {
    expect(buildDefaultWorkspaceName("高澳国")).toBe("高澳国的工作区");
    expect(buildDefaultWorkspaceName("")).toBe("我的工作区");
  });

  it("builds a workspace slug with user scope", () => {
    expect(buildWorkspaceSlug("cm_user_123")).toMatch(/^workspace-cm-user-123-[a-z0-9]{6}$/);
  });
});

describe("register schema", () => {
  it("accepts valid register input and normalizes email", () => {
    const parsed = registerSchema.parse({
      email: "  Demo@Example.COM ",
      password: "password123",
      name: "Demo"
    });

    expect(parsed.email).toBe("demo@example.com");
  });

  it("rejects weak passwords", () => {
    const result = registerSchema.safeParse({
      email: "demo@example.com",
      password: "123",
      name: "Demo"
    });

    expect(result.success).toBe(false);
  });
});
