import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireDefaultWorkspace } from "@/lib/permissions";
import { formatDateTime } from "@/lib/format";
import { reportStatusLabels } from "@/lib/status-labels";
import { normalizeReportInsights } from "@/lib/reports/report-view-model";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await requireAuth();
  const workspace = await requireDefaultWorkspace(user.id);
  const reports = await prisma.report.findMany({
    where: {
      workspaceId: workspace.id
    },
    include: {
      file: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">报告</h1>
          <p className="mt-2 text-sm text-slate-600">查看当前工作区已经生成的历史报告。</p>
        </div>
        <Link className="inline-flex w-fit rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white" href="/files/new">
          上传 CSV
        </Link>
      </section>

      {reports.length ? (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="hidden grid-cols-[1fr_1fr_96px_96px_180px] gap-4 border-b border-slate-100 px-5 py-3 text-sm font-medium text-slate-500 md:grid">
            <span>报告</span>
            <span>来源文件</span>
            <span>评分</span>
            <span>状态</span>
            <span>生成时间</span>
          </div>
          <div className="divide-y divide-slate-100">
            {reports.map((report) => {
              const insights = normalizeReportInsights(report.insightsJson);

              return (
                <Link
                  className="grid gap-2 px-5 py-4 text-sm hover:bg-slate-50 md:grid-cols-[1fr_1fr_96px_96px_180px] md:gap-4"
                  href={`/reports/${report.id}`}
                  key={report.id}
                >
                  <span className="truncate font-medium">{report.title}</span>
                  <span className="truncate text-slate-600">{report.file.originalName}</span>
                  <span className="text-slate-600">{formatScore(report.qualityScore)}</span>
                  <span className="text-slate-600">{reportStatusLabels[report.status]}</span>
                  <span className="text-slate-600">{formatDateTime(report.createdAt)}</span>
                  {insights.items.length ? <span className="text-xs text-slate-500 md:col-span-5">{insights.items.length} 条关键洞察</span> : null}
                </Link>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white p-8">
          <h2 className="text-lg font-semibold">还没有报告</h2>
          <p className="mt-2 text-sm text-slate-600">上传 CSV 并完成分析后，报告会出现在这里。</p>
          <Link className="mt-5 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white" href="/files/new">
            上传 CSV
          </Link>
        </section>
      )}
    </div>
  );
}

function formatScore(value: number | null) {
  return typeof value === "number" ? `${value}` : "-";
}
