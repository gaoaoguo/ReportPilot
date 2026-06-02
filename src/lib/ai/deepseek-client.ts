import type { ReportPromptPayload } from "./report-prompt";

export type DeepSeekModelKind = "fast" | "pro";

export type DeepSeekUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type DeepSeekReportResponse = {
  content: string;
  usage: DeepSeekUsage;
  latencyMs: number;
  modelName: string;
};

export class DeepSeekRequestError extends Error {
  code: string;
  status?: number;
  final: boolean;

  constructor({ code, message, status, final }: { code: string; message: string; status?: number; final: boolean }) {
    super(message);
    this.name = "DeepSeekRequestError";
    this.code = code;
    this.status = status;
    this.final = final;
  }
}

export async function requestDeepSeekReport(
  payload: ReportPromptPayload,
  options: {
    modelKind?: DeepSeekModelKind;
    fetchImpl?: typeof fetch;
  } = {}
): Promise<DeepSeekReportResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const modelName = getDeepSeekModelName(options.modelKind ?? "fast");

  if (isPlaceholderApiKey(apiKey)) {
    throw new DeepSeekRequestError({
      code: "AI_CONFIG_ERROR",
      message: "DeepSeek API Key 未配置",
      final: true
    });
  }

  const startedAt = Date.now();
  const response = await (options.fetchImpl ?? fetch)(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: "system", content: payload.system },
        { role: "user", content: payload.user }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new DeepSeekRequestError({
      code: getErrorCode(response.status),
      message: getErrorMessage(response.status),
      status: response.status,
      final: response.status === 401 || response.status === 402
    });
  }

  const content = json?.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new DeepSeekRequestError({
      code: "AI_EMPTY_RESPONSE",
      message: "DeepSeek 返回内容为空",
      final: false
    });
  }

  return {
    content,
    usage: {
      promptTokens: toNumber(json?.usage?.prompt_tokens),
      completionTokens: toNumber(json?.usage?.completion_tokens),
      totalTokens: toNumber(json?.usage?.total_tokens)
    },
    latencyMs: Date.now() - startedAt,
    modelName
  };
}

function isPlaceholderApiKey(value: string | undefined) {
  return !value || value === "change-me" || value === "替换我";
}

export function getDeepSeekModelName(kind: DeepSeekModelKind) {
  if (kind === "pro") {
    return process.env.DEEPSEEK_MODEL_PRO ?? "deepseek-v4-pro";
  }

  return process.env.DEEPSEEK_MODEL_FAST ?? "deepseek-v4-flash";
}

function getErrorCode(status: number) {
  if (status === 401) {
    return "AI_AUTH_ERROR";
  }

  if (status === 402) {
    return "AI_BALANCE_ERROR";
  }

  if (status === 429) {
    return "AI_RATE_LIMIT";
  }

  if (status >= 500) {
    return "AI_PROVIDER_ERROR";
  }

  return "AI_REQUEST_ERROR";
}

function getErrorMessage(status: number) {
  if (status === 401) {
    return "DeepSeek API Key 无效或未授权";
  }

  if (status === 402) {
    return "DeepSeek 账户余额不足或额度不可用";
  }

  if (status === 429) {
    return "DeepSeek 请求过于频繁，请稍后重试";
  }

  if (status >= 500) {
    return "DeepSeek 服务暂时不可用，请稍后重试";
  }

  return "DeepSeek 请求失败";
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
