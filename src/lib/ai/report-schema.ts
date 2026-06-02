import { z } from "zod";

const dataQualityIssueSchema = z.object({
  severity: z.enum(["low", "medium", "high"]),
  message: z.string().min(1).max(500)
});

const insightSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(1000),
  severity: z.enum(["info", "warning", "critical"]).default("info")
});

const chartSchema = z.object({
  title: z.string().min(1).max(120),
  type: z.enum(["bar", "line", "pie", "table"]),
  xField: z.string().min(1),
  yField: z.string().min(1).optional(),
  reason: z.string().min(1).max(500)
});

export const reportInsightSchema = z.object({
  title: z.string().min(1).max(255),
  summary: z.string().min(1).max(3000),
  dataQuality: z.object({
    score: z.number().int().min(0).max(100),
    issues: z.array(dataQualityIssueSchema).max(20)
  }),
  insights: z.array(insightSchema).min(1).max(12),
  recommendedCharts: z.array(chartSchema).max(8),
  nextActions: z.array(z.string().min(1).max(300)).max(10)
});

export type ReportInsight = z.infer<typeof reportInsightSchema>;

export function parseReportInsightJson(content: string, availableFields: string[]): ReportInsight {
  const parsed = reportInsightSchema.parse(JSON.parse(extractJsonObject(content)));
  const fieldSet = new Set(availableFields);
  const invalidChart = parsed.recommendedCharts.find((chart) => {
    return !fieldSet.has(chart.xField) || Boolean(chart.yField && !fieldSet.has(chart.yField));
  });

  if (invalidChart) {
    throw new Error("推荐图表字段不存在");
  }

  return parsed;
}

function extractJsonObject(content: string) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}
