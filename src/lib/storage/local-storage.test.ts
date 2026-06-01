import { describe, expect, test } from "vitest";
import { buildUploadStorageTarget } from "./local-storage";

describe("buildUploadStorageTarget", () => {
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
});
