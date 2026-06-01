const allowedMimeTypes = new Set(["text/csv", "application/csv", "application/vnd.ms-excel", "text/plain", ""]);

export type UploadValidationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      code: string;
      message: string;
    };

export function validateCsvUpload(file: File | null | undefined, maxSizeMb: number): UploadValidationResult {
  if (!file) {
    return {
      ok: false,
      code: "FILE_REQUIRED",
      message: "请选择 CSV 文件"
    };
  }

  if (file.size <= 0) {
    return {
      ok: false,
      code: "FILE_EMPTY",
      message: "文件不能为空"
    };
  }

  if (file.size > maxSizeMb * 1024 * 1024) {
    return {
      ok: false,
      code: "FILE_TOO_LARGE",
      message: `文件不能超过 ${maxSizeMb}MB`
    };
  }

  if (!file.name.toLowerCase().endsWith(".csv") || !allowedMimeTypes.has(file.type)) {
    return {
      ok: false,
      code: "INVALID_FILE_TYPE",
      message: "请上传 CSV 文件"
    };
  }

  return { ok: true };
}

export function getMaxUploadSizeMb() {
  const parsed = Number(process.env.MAX_UPLOAD_SIZE_MB ?? "10");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
}
