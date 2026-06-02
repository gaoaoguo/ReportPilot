import { AppError } from "@/lib/errors";

export type UsageLimits = {
  maxFiles: number;
  maxRowsPerFile: number;
  maxAiTokensPerMonth: number;
};

export type UsageCounters = {
  filesProcessed: number;
  rowsProcessed: number;
  reportsGenerated: number;
  aiTokensUsed: number;
};

export type UsageSummary = {
  files: {
    used: number;
    limit: number;
    percent: number;
  };
  rows: {
    used: number;
  };
  reports: {
    used: number;
  };
  aiTokens: {
    used: number;
    limit: number;
    percent: number;
  };
  rowsPerFileLimit: {
    limit: number;
  };
};

export function getUsageLimits(): UsageLimits {
  return {
    maxFiles: readPositiveInt("FREE_MAX_FILES", 10),
    maxRowsPerFile: readPositiveInt("FREE_MAX_ROWS_PER_FILE", 5000),
    maxAiTokensPerMonth: readPositiveInt("FREE_MAX_AI_TOKENS_PER_MONTH", 200000)
  };
}

export function buildUsageSummary(counters: UsageCounters, limits: UsageLimits): UsageSummary {
  return {
    files: {
      used: normalizeCount(counters.filesProcessed),
      limit: limits.maxFiles,
      percent: percent(counters.filesProcessed, limits.maxFiles)
    },
    rows: {
      used: normalizeCount(counters.rowsProcessed)
    },
    reports: {
      used: normalizeCount(counters.reportsGenerated)
    },
    aiTokens: {
      used: normalizeCount(counters.aiTokensUsed),
      limit: limits.maxAiTokensPerMonth,
      percent: percent(counters.aiTokensUsed, limits.maxAiTokensPerMonth)
    },
    rowsPerFileLimit: {
      limit: limits.maxRowsPerFile
    }
  };
}

export function assertCanUploadFile({ currentFileCount, maxFiles }: { currentFileCount: number; maxFiles: number }) {
  if (currentFileCount >= maxFiles) {
    throw new AppError("UPLOAD_QUOTA_EXCEEDED", `当前免费额度最多上传 ${maxFiles} 个文件`, 403);
  }
}

function readPositiveInt(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function percent(used: number, limit: number) {
  if (!Number.isFinite(used) || !Number.isFinite(limit) || limit <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((used / limit) * 100)));
}

function normalizeCount(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}
