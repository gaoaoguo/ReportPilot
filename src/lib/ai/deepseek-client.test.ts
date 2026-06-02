import { afterEach, describe, expect, test, vi } from "vitest";
import { DeepSeekRequestError, requestDeepSeekReport } from "./deepseek-client";
import type { ReportPromptPayload } from "./report-prompt";

const payload: ReportPromptPayload = {
  system: "只输出合法 JSON",
  user: "生成报告",
  data: {
    file: {
      originalName: "orders.csv",
      rowCount: 1,
      columnCount: 1
    },
    columnProfiles: [],
    dataQuality: {
      score: 100,
      issues: []
    },
    sampleRows: []
  }
};

describe("deepseek client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("returns content and token usage from DeepSeek response", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "key");
    vi.stubEnv("DEEPSEEK_BASE_URL", "https://deepseek.test");
    vi.stubEnv("DEEPSEEK_MODEL_FAST", "deepseek-test");
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "{\"summary\":\"ok\"}" } }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30
          }
        }),
        { status: 200 }
      )
    );

    const result = await requestDeepSeekReport(payload, { fetchImpl });

    expect(result.content).toBe("{\"summary\":\"ok\"}");
    expect(result.usage.totalTokens).toBe(30);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://deepseek.test/chat/completions",
      expect.objectContaining({
        method: "POST"
      })
    );
  });

  test("marks 401 errors as final configuration failures", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "key");
    const fetchImpl = vi.fn().mockResolvedValue(new Response("{}", { status: 401 }));

    await expect(requestDeepSeekReport(payload, { fetchImpl })).rejects.toMatchObject({
      code: "AI_AUTH_ERROR",
      final: true
    } satisfies Partial<DeepSeekRequestError>);
  });

  test("treats placeholder API keys as missing configuration", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "替换我");

    await expect(requestDeepSeekReport(payload, { fetchImpl: vi.fn() })).rejects.toMatchObject({
      code: "AI_CONFIG_ERROR",
      final: true
    } satisfies Partial<DeepSeekRequestError>);
  });
});
