import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireDefaultWorkspace } from "@/lib/permissions";
import { formatBytes, formatDateTime } from "@/lib/format";
import { readCsvPreview } from "@/lib/files/read-csv-preview";
import { fileStatusLabels, jobStatusLabels } from "@/lib/status-labels";
import type { ColumnProfile, DataQualityIssue } from "@/lib/csv/types";
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

  const storedPreview = toStoredPreview(file.previewJson);
  const preview = storedPreview ?? (await readCsvPreview(file.storagePath).catch(() => null));
  const columnProfiles = toColumnProfiles(file.columnProfileJson);
  const qualityIssues = toQualityIssues(file.dataQualityJson);

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

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white">
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
                      <td className="px-4 py-3 text-slate-600">{columnTypeLabels[column.type]}</td>
                      <td className="px-4 py-3 text-slate-600">{column.nullCount}</td>
                      <td className="px-4 py-3 text-slate-600">{column.uniqueCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-slate-600">worker 完成解析后会显示字段画像。</p>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold">数据质量</h2>
          </div>
          {qualityIssues.length ? (
            <div className="divide-y divide-slate-100">
              {qualityIssues.map((issue, index) => (
                <div className="px-5 py-4" key={`${issue.code}-${issue.field ?? index}`}>
                  <p className="text-sm font-medium">{issue.message}</p>
                  <p className="mt-1 text-xs text-slate-500">{severityLabels[issue.severity]}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-slate-600">暂未发现数据质量问题，或文件尚未完成解析。</p>
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

const columnTypeLabels: Record<ColumnProfile["type"], string> = {
  number: "数字",
  date: "日期",
  boolean: "布尔",
  category: "分类",
  text: "文本",
  unknown: "未知"
};

const severityLabels: Record<DataQualityIssue["severity"], string> = {
  low: "轻微",
  medium: "中等",
  high: "严重"
};

function toStoredPreview(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const preview = value as {
    fields?: unknown;
    rows?: unknown;
  };

  if (!Array.isArray(preview.fields) || !Array.isArray(preview.rows)) {
    return null;
  }

  return {
    fields: preview.fields.filter((field): field is string => typeof field === "string"),
    rows: preview.rows.filter((row): row is Record<string, string> => Boolean(row) && typeof row === "object")
  };
}

function toColumnProfiles(value: unknown): ColumnProfile[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is ColumnProfile => {
    return Boolean(item) && typeof item === "object" && "name" in item && "type" in item;
  });
}

function toQualityIssues(value: unknown): DataQualityIssue[] {
  if (!value || typeof value !== "object" || !("issues" in value)) {
    return [];
  }

  const issues = (value as { issues?: unknown }).issues;

  if (!Array.isArray(issues)) {
    return [];
  }

  return issues.filter((issue): issue is DataQualityIssue => {
    return Boolean(issue) && typeof issue === "object" && "code" in issue && "message" in issue && "severity" in issue;
  });
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-lg font-semibold">{value}</p>
    </div>
  );
}
