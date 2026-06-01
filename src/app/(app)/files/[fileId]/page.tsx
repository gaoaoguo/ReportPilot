import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireDefaultWorkspace } from "@/lib/permissions";
import { formatBytes, formatDateTime } from "@/lib/format";
import { readCsvPreview } from "@/lib/files/read-csv-preview";
import { fileStatusLabels, jobStatusLabels } from "@/lib/status-labels";
import { ParseButton } from "./parse-button";

export const dynamic = "force-dynamic";

export default async function FileDetailPage({ params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  const user = await requireAuth();
  const workspace = await requireDefaultWorkspace(user.id);
  const file = await prisma.fileAsset.findFirst({
    where: {
      id: fileId,
      workspaceId: workspace.id,
      deletedAt: null
    },
    include: {
      jobs: {
        orderBy: {
          createdAt: "desc"
        },
        take: 5
      },
      reports: {
        orderBy: {
          createdAt: "desc"
        },
        take: 5
      }
    }
  });

  if (!file) {
    notFound();
  }

  const preview = await readCsvPreview(file.storagePath).catch(() => null);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link className="text-sm font-medium text-slate-500 hover:text-slate-950" href="/files">
            返回文件
          </Link>
          <h1 className="mt-3 text-3xl font-semibold">{file.originalName}</h1>
          <p className="mt-2 text-sm text-slate-600">{fileStatusLabels[file.status]}</p>
        </div>
        <ParseButton fileId={file.id} />
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <InfoCard label="文件大小" value={formatBytes(file.sizeBytes)} />
        <InfoCard label="行数" value={file.rowCount?.toString() ?? "-"} />
        <InfoCard label="列数" value={file.columnCount?.toString() ?? "-"} />
        <InfoCard label="上传时间" value={formatDateTime(file.createdAt)} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold">任务记录</h2>
          </div>
          {file.jobs.length ? (
            <div className="divide-y divide-slate-100">
              {file.jobs.map((job) => (
                <div className="px-5 py-4" key={job.id}>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium">{jobStatusLabels[job.status]}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(job.createdAt)}</p>
                  </div>
                  {job.errorMessage ? <p className="mt-2 text-sm text-red-600">{job.errorMessage}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-slate-600">还没有解析任务。</p>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold">关联报告</h2>
          </div>
          {file.reports.length ? (
            <div className="divide-y divide-slate-100">
              {file.reports.map((report) => (
                <Link className="block px-5 py-4 hover:bg-slate-50" href={`/reports/${report.id}`} key={report.id}>
                  <p className="text-sm font-medium">{report.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDateTime(report.createdAt)}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-slate-600">生成报告后，会在这里显示关联记录。</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold">文件预览</h2>
        </div>
        {preview?.fields.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {preview.fields.map((field) => (
                    <th className="whitespace-nowrap px-4 py-3 font-medium" key={field}>
                      {field}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preview.rows.map((row, index) => (
                  <tr key={index}>
                    {preview.fields.map((field) => (
                      <td className="max-w-[220px] truncate px-4 py-3 text-slate-700" key={field}>
                        {row[field] || "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-8 text-sm text-slate-600">暂时无法预览该文件。</p>
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
