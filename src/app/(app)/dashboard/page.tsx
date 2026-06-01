import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireDefaultWorkspace } from "@/lib/permissions";
import { formatDateTime } from "@/lib/format";
import { fileStatusLabels, reportStatusLabels } from "@/lib/status-labels";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireAuth();
  const workspace = await requireDefaultWorkspace(user.id);

  const [fileCount, reportCount, pendingJobCount, latestFiles, latestReports] = await Promise.all([
    prisma.fileAsset.count({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      }
    }),
    prisma.report.count({
      where: {
        workspaceId: workspace.id
      }
    }),
    prisma.importJob.count({
      where: {
        workspaceId: workspace.id,
        status: {
          in: ["PENDING", "PROCESSING"]
        }
      }
    }),
    prisma.fileAsset.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 5
    }),
    prisma.report.findMany({
      where: {
        workspaceId: workspace.id
      },
      include: {
        file: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 5
    })
  ]);

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{user.name ?? user.email}</p>
          <h1 className="mt-2 text-3xl font-semibold">工作台</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">查看文件处理进度、报告生成情况和当前工作区用量。</p>
        </div>
        <Link className="inline-flex w-fit rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white" href="/files/new">
          上传 CSV
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="文件数量" value={fileCount} />
        <MetricCard label="报告数量" value={reportCount} />
        <MetricCard label="处理中任务" value={pendingJobCount} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold">最近文件</h2>
            <Link className="text-sm font-medium text-slate-600 hover:text-slate-950" href="/files">
              查看全部
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {latestFiles.length ? (
              latestFiles.map((file) => (
                <Link className="block px-5 py-4 hover:bg-slate-50" href={`/files/${file.id}`} key={file.id}>
                  <div className="flex items-center justify-between gap-4">
                    <p className="truncate text-sm font-medium">{file.originalName}</p>
                    <span className="shrink-0 text-xs text-slate-500">{fileStatusLabels[file.status]}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{formatDateTime(file.createdAt)}</p>
                </Link>
              ))
            ) : (
              <EmptyState actionHref="/files/new" actionLabel="上传 CSV" text="上传第一份 CSV 后，文件会出现在这里。" />
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold">最近报告</h2>
            <Link className="text-sm font-medium text-slate-600 hover:text-slate-950" href="/reports">
              查看全部
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {latestReports.length ? (
              latestReports.map((report) => (
                <Link className="block px-5 py-4 hover:bg-slate-50" href={`/reports/${report.id}`} key={report.id}>
                  <div className="flex items-center justify-between gap-4">
                    <p className="truncate text-sm font-medium">{report.title}</p>
                    <span className="shrink-0 text-xs text-slate-500">{reportStatusLabels[report.status]}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{report.file.originalName}</p>
                </Link>
              ))
            ) : (
              <EmptyState actionHref="/files/new" actionLabel="上传 CSV" text="生成第一份报告后，历史报告会出现在这里。" />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function EmptyState({ actionHref, actionLabel, text }: { actionHref: string; actionLabel: string; text: string }) {
  return (
    <div className="px-5 py-8">
      <p className="text-sm text-slate-600">{text}</p>
      <Link className="mt-4 inline-flex rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white" href={actionHref}>
        {actionLabel}
      </Link>
    </div>
  );
}
