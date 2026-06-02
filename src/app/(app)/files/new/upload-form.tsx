"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function UploadForm({ maxFiles, maxRowsPerFile }: { maxFiles: number; maxRowsPerFile: number }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/files", {
      method: "POST",
      body: formData
    });
    const payload = (await response.json()) as {
      ok: boolean;
      data?: {
        fileId: string;
      };
      error?: {
        message?: string;
      };
    };

    setSubmitting(false);

    if (!payload.ok || !payload.data?.fileId) {
      setError(payload.error?.message ?? "上传失败，请稍后重试。");
      return;
    }

    router.push(`/files/${payload.data.fileId}`);
    router.refresh();
  }

  return (
    <form className="rounded-lg border border-slate-200 bg-white p-6" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-slate-700">
        CSV 文件
        <input
          accept=".csv,text/csv"
          className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
          name="file"
          required
          type="file"
        />
      </label>
      <p className="mt-3 text-sm text-slate-500">
        文件会保存到本地上传目录；当前最多上传 {maxFiles} 个文件，超出 {maxRowsPerFile} 行时仅处理前 {maxRowsPerFile} 行。
      </p>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <button
        className="mt-5 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={submitting}
        type="submit"
      >
        {submitting ? "上传中..." : "上传 CSV"}
      </button>
    </form>
  );
}
