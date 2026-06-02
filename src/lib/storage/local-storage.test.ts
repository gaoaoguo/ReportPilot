import { afterEach, describe, expect, test, vi } from "vitest";
import { buildUploadStorageTarget, getUploadRootDir, resolveStoredUploadPath } from "./local-storage";

describe("buildUploadStorageTarget", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("builds a system-controlled CSV storage path", () => {
    const target = buildUploadStorageTarget("workspace-1", "file-1");

    expect(target.relativePath).toBe("workspace-1/file-1/original.csv");
    expect(target.absolutePath.endsWith("workspace-1\\file-1\\original.csv") || target.absolutePath.endsWith("workspace-1/file-1/original.csv")).toBe(
      true
    );
  });

  test("rejects path traversal identifiers", () => {
    expect(() => buildUploadStorageTarget("../workspace", "file-1")).toThrow("INVALID_STORAGE_PATH");
    expect(() => buildUploadStorageTarget("workspace-1", "../file")).toThrow("INVALID_STORAGE_PATH");
  });

  test("rejects stored paths outside the upload root", () => {
    expect(() => resolveStoredUploadPath("../secret.csv")).toThrow("INVALID_STORAGE_PATH");
  });

  test("rejects upload roots under public directory", () => {
    vi.stubEnv("LOCAL_STORAGE_DIR", "./public/uploads");

    expect(() => getUploadRootDir()).toThrow("INVALID_STORAGE_ROOT");
  });
});
