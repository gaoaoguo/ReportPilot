import { customAlphabet } from "nanoid";

const slugSuffix = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 6);

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function buildDefaultWorkspaceName(name?: string | null) {
  const normalizedName = name?.trim();
  return normalizedName ? `${normalizedName}的工作区` : "我的工作区";
}

export function buildWorkspaceSlug(userId: string) {
  const safeUserId = userId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `workspace-${safeUserId || "user"}-${slugSuffix()}`;
}
