import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-500">ReportPilot</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">创建账号</h1>
        <p className="mt-2 text-sm text-slate-600">注册后会自动创建默认工作区。</p>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-slate-600">
          已有账号？
          <Link className="ml-1 font-medium text-slate-950" href="/login">
            去登录
          </Link>
        </p>
      </section>
    </main>
  );
}
