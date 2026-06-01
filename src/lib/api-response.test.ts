import { describe, expect, it } from "vitest";
import { apiError, apiSuccess } from "./api-response";

describe("api response helpers", () => {
  it("creates a stable success payload", () => {
    expect(apiSuccess({ status: "ok" })).toEqual({
      ok: true,
      data: {
        status: "ok"
      }
    });
  });

  it("creates a stable error payload", () => {
    expect(apiError("FILE_TOO_LARGE", "文件不能超过 10MB")).toEqual({
      ok: false,
      error: {
        code: "FILE_TOO_LARGE",
        message: "文件不能超过 10MB"
      }
    });
  });
}
);
