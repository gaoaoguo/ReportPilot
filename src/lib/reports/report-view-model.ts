import type { ColumnProfile } from "@/lib/csv/types";

export type ReportInsightView = {
  items: Array<{
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
  }>;
  nextActions: string[];
};

export type ReportChartView = {
  title: string;
  type: "bar" | "line" | "pie" | "table";
  xField: string;
  yField?: string;
  reason: string;
};

export type ReportDataQualityView = {
  score: number;
  issues: Array<{
    severity: "low" | "medium" | "high";
    message: string;
  }>;
};

export type ReportPreview = {
  fields: string[];
  rows: Array<Record<string, string>>;
};

export type ChartDatum = {
  name: string;
  value: number;
};

export function normalizeReportInsights(value: unknown): ReportInsightView {
  if (!value || typeof value !== "object") {
    return {
      items: [],
      nextActions: []
    };
  }

  const data = value as {
    insights?: unknown;
    nextActions?: unknown;
  };

  return {
    items: Array.isArray(data.insights)
      ? data.insights.filter((insight): insight is ReportInsightView["items"][number] => {
          return Boolean(insight) && typeof insight === "object" && "title" in insight && "description" in insight;
        })
      : [],
    nextActions: Array.isArray(data.nextActions) ? data.nextActions.filter((action): action is string => typeof action === "string") : []
  };
}

export function normalizeReportCharts(value: unknown): ReportChartView[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((chart): chart is ReportChartView => {
    return Boolean(chart) && typeof chart === "object" && "title" in chart && "type" in chart && "xField" in chart && "reason" in chart;
  });
}

export function normalizeReportDataQuality(value: unknown): ReportDataQualityView {
  if (!value || typeof value !== "object") {
    return {
      score: 0,
      issues: []
    };
  }

  const quality = value as Partial<ReportDataQualityView>;

  return {
    score: typeof quality.score === "number" ? quality.score : 0,
    issues: Array.isArray(quality.issues)
      ? quality.issues.filter((issue): issue is ReportDataQualityView["issues"][number] => {
          return Boolean(issue) && typeof issue === "object" && "message" in issue && "severity" in issue;
        })
      : []
  };
}

export function normalizeColumnProfiles(value: unknown): ColumnProfile[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((column): column is ColumnProfile => {
    return Boolean(column) && typeof column === "object" && "name" in column && "type" in column;
  });
}

export function normalizeReportPreview(value: unknown): ReportPreview {
  if (!value || typeof value !== "object") {
    return {
      fields: [],
      rows: []
    };
  }

  const preview = value as {
    fields?: unknown;
    rows?: unknown;
  };

  return {
    fields: Array.isArray(preview.fields) ? preview.fields.filter((field): field is string => typeof field === "string") : [],
    rows: Array.isArray(preview.rows)
      ? preview.rows.filter((row): row is Record<string, string> => Boolean(row) && typeof row === "object")
      : []
  };
}

export function buildChartData(chart: ReportChartView | undefined, preview: ReportPreview): ChartDatum[] {
  if (!chart || !preview.fields.includes(chart.xField) || (chart.yField && !preview.fields.includes(chart.yField))) {
    return [];
  }

  const grouped = new Map<string, number>();

  for (const row of preview.rows) {
    const name = cleanChartName(row[chart.xField]);

    if (!name) {
      continue;
    }

    const value = chart.yField ? Number(row[chart.yField]) : 1;

    if (!Number.isFinite(value)) {
      continue;
    }

    grouped.set(name, (grouped.get(name) ?? 0) + value);
  }

  return [...grouped.entries()]
    .map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 12);
}

function cleanChartName(value: string | undefined) {
  const name = value?.trim();
  return name || "";
}
