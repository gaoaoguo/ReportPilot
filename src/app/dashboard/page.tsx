import Link from "next/link";
import { requireAuth, requireDefaultWorkspace } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireAuth();
  const workspace = await requireDefaultWorkspace(user.id);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{workspace.name}</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">工作台</h1>
            <p className="mt-2 text-sm text-slate-600">上传 CSV 后，系统会异步生成数据画像和报告。</p>
          </div>
          <Link className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white" href="/files/new">
            上传 CSV
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">当前用户</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{user.name ?? user.email}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">套餐</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">免费版</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">下一步</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">上传 CSV</p>
          </div>
        </div>
      </section>
    </main>
  );
}
