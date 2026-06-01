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
