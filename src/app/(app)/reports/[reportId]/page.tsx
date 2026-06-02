import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireDefaultWorkspace } from "@/lib/permissions";
import { formatDateTime } from "@/lib/format";
import { reportStatusLabels } from "@/lib/status-labels";
import { ReportChart } from "@/components/reports/report-chart";
import {
  buildChartData,
  normalizeColumnProfiles,
  normalizeReportCharts,
  normalizeReportDataQuality,
  normalizeReportInsights,
  normalizeReportPreview,
  type ReportChartView,
  type ReportDataQualityView
} from "@/lib/reports/report-view-model";

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

  const dataQuality = normalizeReportDataQuality(report.dataQualityJson);
  const insights = normalizeReportInsights(report.insightsJson);
  const charts = normalizeReportCharts(report.chartsJson);
  const columnProfiles = normalizeColumnProfiles(report.columnProfileJson);
  const preview = normalizeReportPreview(report.file.previewJson);

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
        <QualityScoreCard score={report.qualityScore ?? dataQuality.score} />
        <InfoCard label="生成时间" value={formatDateTime(report.createdAt)} />
        <InfoCard label="更新时间" value={formatDateTime(report.updatedAt)} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold">摘要</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{report.summary || "报告内容生成后，会在这里显示摘要。"}</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
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

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
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

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold">推荐图表</h2>
          <p className="mt-1 text-sm text-slate-600">基于脱敏预览数据绘制，字段由后端校验后使用。</p>
        </div>
        {charts.length ? (
          <div className="grid gap-0 divide-y divide-slate-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            {charts.map((chart, index) => (
              <div className="min-w-0" key={`${chart.title}-${index}`}>
                <div className="border-b border-slate-100 px-5 py-4">
                  <p className="text-sm font-medium">{chart.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {chartTypeLabels[chart.type]} · {chart.xField}
                    {chart.yField ? ` / ${chart.yField}` : ""}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{chart.reason}</p>
                </div>
                <ReportChart chart={chart} data={buildChartData(chart, preview)} />
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-8 text-sm text-slate-600">暂时没有可推荐的图表。</p>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold">数据质量问题</h2>
        </div>
        {dataQuality.issues.length ? (
          <div className="grid divide-y divide-slate-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            {dataQuality.issues.map((issue, index) => (
              <div className="px-5 py-4" key={`${issue.message}-${index}`}>
                <p className="text-sm font-medium">{issue.message}</p>
                <p className="mt-1 text-xs text-slate-500">{qualitySeverityLabels[issue.severity]}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-8 text-sm text-slate-600">暂未发现需要优先处理的数据质量问题。</p>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
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
                    <td className="px-4 py-3 text-slate-600">{columnTypeLabels[column.type] ?? "未知"}</td>
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

function QualityScoreCard({ score }: { score: number | null | undefined }) {
  const value = typeof score === "number" && Number.isFinite(score) ? Math.round(score) : null;
  const label = value === null ? "-" : `${value}`;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">质量评分</p>
      <div className="mt-3 flex items-end gap-3">
        <p className="text-2xl font-semibold">{label}</p>
        <div className="mb-2 h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-slate-950" style={{ width: `${Math.max(0, Math.min(value ?? 0, 100))}%` }} />
        </div>
      </div>
    </div>
  );
}

const chartTypeLabels: Record<ReportChartView["type"], string> = {
  bar: "柱状图",
  line: "折线图",
  pie: "饼图",
  table: "表格"
};

const qualitySeverityLabels: Record<ReportDataQualityView["issues"][number]["severity"], string> = {
  low: "轻微",
  medium: "中等",
  high: "严重"
};

const columnTypeLabels: Record<string, string> = {
  number: "数字",
  date: "日期",
  boolean: "布尔",
  category: "分类",
  text: "文本",
  unknown: "未知"
};
