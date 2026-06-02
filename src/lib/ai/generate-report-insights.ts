import type { AiModel, Prisma } from "@prisma/client";
import type { CsvAnalysisResult } from "@/lib/csv/analyze-csv-file";
import type { ColumnProfile, CsvRow, DataQualitySummary } from "@/lib/csv/types";
import { prisma } from "@/lib/prisma";
import { JobProcessingError } from "@/workers/job-runner";
import { DeepSeekRequestError, type DeepSeekReportResponse, requestDeepSeekReport } from "./deepseek-client";
import { buildReportPromptPayload, buildReportRepairPromptPayload, type ReportPromptPayload } from "./report-prompt";
import { parseReportInsightJson, type ReportInsight } from "./report-schema";

export async function generateReportForFile(input: {
  workspaceId: string;
  userId: string;
  fileId: string;
  jobId: string;
  originalName: string;
  analysis: CsvAnalysisResult;
}) {
  const columnProfiles = toColumnProfiles(input.analysis.columnProfileJson);
  const dataQuality = toDataQuality(input.analysis.dataQualityJson);
  const sampleRows = toSampleRows(input.analysis.previewJson.rows);
  const prompt = buildReportPromptPayload({
    file: {
      originalName: input.originalName,
      rowCount: input.analysis.rowCount,
      columnCount: input.analysis.columnCount
    },
    columnProfiles,
    dataQuality,
    sampleRows
  });
  const model = "DEEPSEEK_V4_FLASH" satisfies AiModel;

  try {
    const availableFields = columnProfiles.map((column) => column.name);
    const { reportInsight, response } = await requestAndParseReport({
      prompt,
      availableFields,
      workspaceId: input.workspaceId,
      userId: input.userId,
      model
    });

    await prisma.$transaction(async (tx) => {
      const report = await tx.report.create({
        data: {
          workspaceId: input.workspaceId,
          fileId: input.fileId,
          jobId: input.jobId,
          title: reportInsight.title,
          summary: reportInsight.summary,
          status: "READY",
          columnProfileJson: columnProfiles as unknown as Prisma.InputJsonValue,
          dataQualityJson: reportInsight.dataQuality as unknown as Prisma.InputJsonValue,
          chartsJson: reportInsight.recommendedCharts as unknown as Prisma.InputJsonValue,
          insightsJson: {
            insights: reportInsight.insights,
            nextActions: reportInsight.nextActions
          } as unknown as Prisma.InputJsonValue,
          aiRawJson: reportInsight as unknown as Prisma.InputJsonValue,
          qualityScore: reportInsight.dataQuality.score
        },
        select: {
          id: true
        }
      });

      await tx.aiCallLog.create({
        data: {
          workspaceId: input.workspaceId,
          userId: input.userId,
          reportId: report.id,
          provider: "DEEPSEEK",
          model,
          promptTokens: response.usage.promptTokens,
          completionTokens: response.usage.completionTokens,
          totalTokens: response.usage.totalTokens,
          latencyMs: response.latencyMs,
          success: true
        }
      });
    });
  } catch (error) {
    if (error instanceof DeepSeekRequestError) {
      throw new JobProcessingError({
        code: error.code,
        message: error.message,
        final: error.final
      });
    }

    throw new JobProcessingError({
      code: "AI_OUTPUT_INVALID",
      message: error instanceof Error ? error.message : "DeepSeek 输出校验失败",
      final: false
    });
  }
}

async function requestAndParseReport(input: {
  prompt: ReportPromptPayload;
  availableFields: string[];
  workspaceId: string;
  userId: string;
  model: AiModel;
}): Promise<{
  reportInsight: ReportInsight;
  response: DeepSeekReportResponse;
}> {
  let prompt = input.prompt;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    let response: DeepSeekReportResponse | null = null;

    try {
      response = await requestDeepSeekReport(prompt, {
        modelKind: "fast"
      });

      return {
        reportInsight: parseReportInsightJson(response.content, input.availableFields),
        response
      };
    } catch (error) {
      if (error instanceof DeepSeekRequestError) {
        await recordFailedAiCall({
          workspaceId: input.workspaceId,
          userId: input.userId,
          model: input.model,
          error,
          response
        });

        if (error.final || attempt === 2) {
          throw error;
        }
      } else {
        await recordFailedAiCall({
          workspaceId: input.workspaceId,
          userId: input.userId,
          model: input.model,
          error,
          response,
          code: "AI_OUTPUT_INVALID"
        });

        if (attempt === 2) {
          throw error;
        }
      }

      prompt = buildReportRepairPromptPayload(prompt, response?.content ?? "");
    }
  }

  throw new Error("DeepSeek 输出校验失败");
}

function toColumnProfiles(value: unknown): ColumnProfile[] {
  return Array.isArray(value) ? (value as ColumnProfile[]) : [];
}

function toSampleRows(value: unknown): CsvRow[] {
  return Array.isArray(value) ? (value as CsvRow[]) : [];
}

function toDataQuality(value: unknown): DataQualitySummary {
  if (!value || typeof value !== "object") {
    return {
      score: 0,
      issues: []
    };
  }

  const quality = value as Partial<DataQualitySummary>;

  return {
    score: typeof quality.score === "number" ? quality.score : 0,
    issues: Array.isArray(quality.issues) ? quality.issues : []
  };
}

async function recordFailedAiCall(input: {
  workspaceId: string;
  userId: string;
  model: AiModel;
  error: unknown;
  response?: DeepSeekReportResponse | null;
  code?: string;
}) {
  await prisma.aiCallLog.create({
    data: {
      workspaceId: input.workspaceId,
      userId: input.userId,
      provider: "DEEPSEEK",
      model: input.model,
      promptTokens: input.response?.usage.promptTokens,
      completionTokens: input.response?.usage.completionTokens,
      totalTokens: input.response?.usage.totalTokens,
      latencyMs: input.response?.latencyMs,
      success: false,
      errorCode: input.code ?? (input.error instanceof DeepSeekRequestError ? input.error.code : "AI_OUTPUT_INVALID"),
      errorMessage: input.error instanceof Error ? input.error.message : "DeepSeek 报告生成失败"
    }
  });
}
