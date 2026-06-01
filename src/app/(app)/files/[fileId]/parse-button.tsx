"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ParseButton({ fileId }: { fileId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    setError("");
    setSubmitting(true);

    const response = await fetch(`/api/files/${fileId}/parse`, {
      method: "POST"
    });
    const payload = (await response.json()) as {
      ok: boolean;
      error?: {
        message?: string;
      };
    };

    setSubmitting(false);

    if (!payload.ok) {
      setError(payload.error?.message ?? "重新解析失败，请稍后重试。");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <button
        className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={submitting}
        onClick={handleClick}
        type="button"
      >
        {submitting ? "提交中..." : "重新解析"}
      </button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
