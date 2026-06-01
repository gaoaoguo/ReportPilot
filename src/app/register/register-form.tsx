"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        name: String(formData.get("name") ?? "")
      })
    });

    const payload = (await response.json()) as {
      ok: boolean;
      error?: {
        message?: string;
      };
    };

    setSubmitting(false);

    if (!payload.ok) {
      setError(payload.error?.message ?? "注册失败，请稍后重试。");
      return;
    }

    router.push("/login");
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-slate-700">
        姓名
        <input
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          maxLength={50}
          name="name"
          required
          type="text"
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        邮箱
        <input
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          name="email"
          required
          type="email"
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        密码
        <input
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          minLength={8}
          name="password"
          required
          type="password"
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        className="w-full rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={submitting}
        type="submit"
      >
        {submitting ? "创建中..." : "创建账号"}
      </button>
    </form>
  );
}
