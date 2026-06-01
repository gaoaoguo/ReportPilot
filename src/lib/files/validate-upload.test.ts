import { describe, expect, test } from "vitest";
import { validateCsvUpload } from "./validate-upload";

describe("validateCsvUpload", () => {
  test("accepts a non-empty CSV file within size limit", () => {
    const file = new File(["name,amount\nA,1"], "demo.csv", { type: "text/csv" });

    expect(validateCsvUpload(file, 10)).toEqual({ ok: true });
  });

  test("rejects empty files", () => {
    const file = new File([""], "demo.csv", { type: "text/csv" });

    expect(validateCsvUpload(file, 10)).toEqual({
      ok: false,
      code: "FILE_EMPTY",
      message: "文件不能为空"
    });
  });

  test("rejects non-csv extension", () => {
    const file = new File(["name,amount\nA,1"], "demo.xlsx", { type: "text/csv" });

    expect(validateCsvUpload(file, 10)).toEqual({
      ok: false,
      code: "INVALID_FILE_TYPE",
      message: "请上传 CSV 文件"
    });
  });

  test("rejects files over configured size limit", () => {
    const file = new File(["123456"], "demo.csv", { type: "text/csv" });

    expect(validateCsvUpload(file, 0.000001)).toEqual({
      ok: false,
      code: "FILE_TOO_LARGE",
      message: "文件不能超过 0.000001MB"
    });
  });
});
