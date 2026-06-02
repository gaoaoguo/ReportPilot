import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireDefaultWorkspace } from "@/lib/permissions";
import { formatDateTime } from "@/lib/format";
import { reportStatusLabels } from "@/lib/status-labels";

export const dynamic = "force-dynamic";

export default async function ReportDetailPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const user = await requireAuth();
  const workspace = await requireDefaultWorkspace(user.id);
  const report = await prisma.report.findFirst({
    where: {
      id: reportId,
      workspaceId: workspace.id
    },
    include: {
      file: true
    }
  });

  if (!report) {
    notFound();
  }

  const dataQuality = toReportDataQuality(report.dataQualityJson);
  const insights = toInsights(report.insightsJson);
  const charts = toCharts(report.chartsJson);
  const columnProfiles = toColumnProfiles(report.columnProfileJson);

  return (
    <div className="space-y-6">
      <section className="border-b border-slate-200 pb-6">
        <Link className="text-sm font-medium text-slate-500 hover:text-slate-950" href="/reports">
          返回报告
        </Link>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">{report.title}</h1>
            <p className="mt-2 text-sm text-slate-600">{report.file.originalName}</p>
          </div>
          <span className="w-fit rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600">
            {reportStatusLabels[report.status]}
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <InfoCard label="质量评分" value={report.qualityScore?.toString() ?? "-"} />
        <InfoCard label="生成时间" value={formatDateTime(report.createdAt)} />
        <InfoCard label="更新时间" value={formatDateTime(report.updatedAt)} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold">摘要</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{report.summary || "报告内容生成后，会在这里显示摘要。"}</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold">关键洞察</h2>
          </div>
          {insights.items.length ? (
            <div className="divide-y divide-slate-100">
              {insights.items.map((insight, index) => (
                <div className="px-5 py-4" key={`${insight.title}-${index}`}>
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{insight.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-slate-600">报告完成后会显示关键洞察。</p>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold">下一步建议</h2>
          </div>
          {insights.nextActions.length ? (
            <div className="divide-y divide-slate-100">
              {insights.nextActions.map((action, index) => (
                <p className="px-5 py-4 text-sm text-slate-700" key={`${action}-${index}`}>
                  {action}
                </p>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-slate-600">报告完成后会显示下一步建议。</p>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold">推荐图表</h2>
          </div>
          {charts.length ? (
            <div className="divide-y divide-slate-100">
              {charts.map((chart, index) => (
                <div className="px-5 py-4" key={`${chart.title}-${index}`}>
                  <p className="text-sm font-medium">{chart.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {chartTypeLabels[chart.type] ?? "图表"} · {chart.xField}
                    {chart.yField ? ` / ${chart.yField}` : ""}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{chart.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-slate-600">暂时没有可推荐的图表。</p>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold">数据质量问题</h2>
          </div>
          {dataQuality.issues.length ? (
            <div className="divide-y divide-slate-100">
              {dataQuality.issues.map((issue, index) => (
                <div className="px-5 py-4" key={`${issue.message}-${index}`}>
                  <p className="text-sm font-medium">{issue.message}</p>
                  <p className="mt-1 text-xs text-slate-500">{qualitySeverityLabels[issue.severity] ?? "需关注"}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-slate-600">暂未发现需要优先处理的数据质量问题。</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold">字段画像</h2>
        </div>
        {columnProfiles.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">字段</th>
                  <th className="px-4 py-3 font-medium">类型</th>
                  <th className="px-4 py-3 font-medium">空值</th>
                  <th className="px-4 py-3 font-medium">唯一值</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {columnProfiles.map((column) => (
                  <tr key={column.name}>
                    <td className="px-4 py-3 font-medium">{column.name}</td>
                    <td className="px-4 py-3 text-slate-600">{column.type}</td>
                    <td className="px-4 py-3 text-slate-600">{column.nullCount}</td>
                    <td className="px-4 py-3 text-slate-600">{column.uniqueCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-8 text-sm text-slate-600">报告完成后会显示字段画像。</p>
        )}
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-lg font-semibold">{value}</p>
    </div>
  );
}

type ReportDataQuality = {
  score: number;
  issues: Array<{
    severity: "low" | "medium" | "high";
    message: string;
  }>;
};

type ReportInsightView = {
  items: Array<{
    title: string;
    description: string;
  }>;
  nextActions: string[];
};

type ReportChartView = {
  title: string;
  type: "bar" | "line" | "pie" | "table";
  xField: string;
  yField?: string;
  reason: string;
};

type ReportColumnProfile = {
  name: string;
  type: string;
  nullCount: number;
  uniqueCount: number;
};

const chartTypeLabels: Record<ReportChartView["type"], string> = {
  bar: "柱状图",
  line: "折线图",
  pie: "饼图",
  table: "表格"
};

const qualitySeverityLabels: Record<ReportDataQuality["issues"][number]["severity"], string> = {
  low: "轻微",
  medium: "中等",
  high: "严重"
};

function toReportDataQuality(value: unknown): ReportDataQuality {
  if (!value || typeof value !== "object") {
    return {
      score: 0,
      issues: []
    };
  }

  const quality = value as Partial<ReportDataQuality>;

  return {
    score: typeof quality.score === "number" ? quality.score : 0,
    issues: Array.isArray(quality.issues)
      ? quality.issues.filter((issue): issue is ReportDataQuality["issues"][number] => {
          return Boolean(issue) && typeof issue === "object" && "message" in issue && "severity" in issue;
        })
      : []
  };
}

function toInsights(value: unknown): ReportInsightView {
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

function toCharts(value: unknown): ReportChartView[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((chart): chart is ReportChartView => {
    return Boolean(chart) && typeof chart === "object" && "title" in chart && "type" in chart && "xField" in chart && "reason" in chart;
  });
}

function toColumnProfiles(value: unknown): ReportColumnProfile[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((column): column is ReportColumnProfile => {
    return Boolean(column) && typeof column === "object" && "name" in column && "type" in column;
  });
}
