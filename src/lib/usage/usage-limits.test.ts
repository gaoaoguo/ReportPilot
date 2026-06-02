import { describe, expect, test, vi } from "vitest";
import { assertCanUploadFile, buildUsageSummary, getUsageLimits } from "./usage-limits";

describe("usage limits", () => {
  test("reads free plan limits from environment variables", () => {
    vi.stubEnv("FREE_MAX_FILES", "3");
    vi.stubEnv("FREE_MAX_ROWS_PER_FILE", "200");
    vi.stubEnv("FREE_MAX_AI_TOKENS_PER_MONTH", "5000");

    expect(getUsageLimits()).toEqual({
      maxFiles: 3,
      maxRowsPerFile: 200,
      maxAiTokensPerMonth: 5000
    });

    vi.unstubAllEnvs();
  });

  test("builds percentages without returning NaN", () => {
    const summary = buildUsageSummary(
      {
        filesProcessed: 2,
        rowsProcessed: 150,
        reportsGenerated: 1,
        aiTokensUsed: 250
      },
      {
        maxFiles: 10,
        maxRowsPerFile: 500,
        maxAiTokensPerMonth: 1000
      }
    );

    expect(summary.files.percent).toBe(20);
    expect(summary.aiTokens.percent).toBe(25);
    expect(summary.rowsPerFileLimit.limit).toBe(500);
  });

  test("rejects uploads when free file quota is reached", () => {
    expect(() =>
      assertCanUploadFile({
        currentFileCount: 10,
        maxFiles: 10
      })
    ).toThrow("当前免费额度最多上传 10 个文件");
  });
});
