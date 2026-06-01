import Link from "next/link";
import { ReactNode } from "react";
import { requireAuth, requireDefaultWorkspace } from "@/lib/permissions";

const navItems = [
  { href: "/dashboard", label: "工作台" },
  { href: "/files", label: "文件" },
  { href: "/reports", label: "报告" },
  { href: "/settings", label: "设置" }
];

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireAuth();
  const workspace = await requireDefaultWorkspace(user.id);

  return (
    <div className="min-h-screen bg-[#f6f7f4] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link className="text-lg font-semibold" href="/dashboard">
              ReportPilot
            </Link>
            <p className="mt-1 text-sm text-slate-500">{workspace.name}</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
