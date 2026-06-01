import { prisma } from "@/lib/prisma";
import { requireAuth, requireDefaultWorkspace } from "@/lib/permissions";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireAuth();
  const workspace = await requireDefaultWorkspace(user.id);
  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user.id
      }
    }
  });

  return (
    <div className="space-y-6">
      <section className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-semibold">设置</h1>
        <p className="mt-2 text-sm text-slate-600">查看账号、工作区和当前套餐信息。</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold">账号</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <InfoRow label="姓名" value={user.name ?? "-"} />
            <InfoRow label="邮箱" value={user.email} />
            <InfoRow label="创建时间" value={formatDateTime(user.createdAt)} />
          </dl>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold">工作区</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <InfoRow label="名称" value={workspace.name} />
            <InfoRow label="套餐" value={workspace.plan === "FREE" ? "免费版" : "专业版"} />
            <InfoRow label="角色" value={member?.role === "OWNER" ? "所有者" : "成员"} />
          </dl>
        </div>
      </section>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}
