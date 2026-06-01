import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireDefaultWorkspace } from "@/lib/permissions";
import { formatBytes, formatDateTime } from "@/lib/format";
import { fileStatusLabels } from "@/lib/status-labels";

export const dynamic = "force-dynamic";

export default async function FilesPage() {
  const user = await requireAuth();
  const workspace = await requireDefaultWorkspace(user.id);
  const files = await prisma.fileAsset.findMany({
    where: {
      workspaceId: workspace.id,
      deletedAt: null
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">文件</h1>
          <p className="mt-2 text-sm text-slate-600">管理当前工作区上传的 CSV 文件和解析状态。</p>
        </div>
        <Link className="inline-flex w-fit rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white" href="/files/new">
          上传 CSV
        </Link>
      </section>

      {files.length ? (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="grid grid-cols-[1fr_120px_120px_180px] gap-4 border-b border-slate-100 px-5 py-3 text-sm font-medium text-slate-500">
            <span>文件名</span>
            <span>大小</span>
            <span>状态</span>
            <span>上传时间</span>
          </div>
          <div className="divide-y divide-slate-100">
            {files.map((file) => (
              <Link
                className="grid grid-cols-[1fr_120px_120px_180px] gap-4 px-5 py-4 text-sm hover:bg-slate-50"
                href={`/files/${file.id}`}
                key={file.id}
              >
                <span className="truncate font-medium">{file.originalName}</span>
                <span className="text-slate-600">{formatBytes(file.sizeBytes)}</span>
                <span className="text-slate-600">{fileStatusLabels[file.status]}</span>
                <span className="text-slate-600">{formatDateTime(file.createdAt)}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white p-8">
          <h2 className="text-lg font-semibold">还没有文件</h2>
          <p className="mt-2 text-sm text-slate-600">上传第一份 CSV 后，系统会在这里展示文件状态和解析结果。</p>
          <Link className="mt-5 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white" href="/files/new">
            上传 CSV
          </Link>
        </section>
      )}
    </div>
  );
}
