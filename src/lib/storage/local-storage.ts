import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const safeIdPattern = /^[a-zA-Z0-9_-]+$/;

export type UploadStorageTarget = {
  rootDir: string;
  relativePath: string;
  absolutePath: string;
};

export function getUploadRootDir() {
  return path.resolve(process.cwd(), process.env.LOCAL_STORAGE_DIR ?? ".local-storage/uploads");
}

export function buildUploadStorageTarget(workspaceId: string, fileId: string): UploadStorageTarget {
  if (!safeIdPattern.test(workspaceId) || !safeIdPattern.test(fileId)) {
    throw new Error("INVALID_STORAGE_PATH");
  }

  const rootDir = getUploadRootDir();
  const relativePath = path.posix.join(workspaceId, fileId, "original.csv");
  const absolutePath = path.resolve(rootDir, workspaceId, fileId, "original.csv");
  const relativeToRoot = path.relative(rootDir, absolutePath);

  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    throw new Error("INVALID_STORAGE_PATH");
  }

  return {
    rootDir,
    relativePath,
    absolutePath
  };
}

export function resolveStoredUploadPath(relativePath: string) {
  const rootDir = getUploadRootDir();
  const absolutePath = path.resolve(rootDir, relativePath);
  const relativeToRoot = path.relative(rootDir, absolutePath);

  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    throw new Error("INVALID_STORAGE_PATH");
  }

  return absolutePath;
}

export async function saveUploadedFile(file: File, target: UploadStorageTarget) {
  const bytes = Buffer.from(await file.arrayBuffer());

  await mkdir(path.dirname(target.absolutePath), { recursive: true });
  await writeFile(target.absolutePath, bytes, { flag: "wx" });

  return {
    checksum: createHash("sha256").update(bytes).digest("hex"),
    sizeBytes: bytes.length
  };
}
