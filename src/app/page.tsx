import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f6f7f4] px-6 py-10 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-between">
        <nav className="flex items-center justify-between">
          <p className="text-lg font-semibold">ReportPilot</p>
          <div className="flex items-center gap-3">
            <Link className="text-sm font-medium text-slate-600 hover:text-slate-950" href="/login">
              登录
            </Link>
            <Link className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white" href="/register">
              创建账号
            </Link>
          </div>
        </nav>

        <div className="grid gap-10 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="mb-4 text-sm font-medium text-slate-600">AI 数据清洗与报表生成系统</p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-normal text-slate-950">
              ReportPilot
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-700">
              上传 CSV，系统会在本地保存文件，异步解析数据结构，生成质量检查和业务报告。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="rounded-md bg-slate-950 px-5 py-3 text-sm font-medium text-white" href="/register">
                开始使用
              </Link>
              <Link className="rounded-md border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700" href="/login">
                进入工作台
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="grid grid-cols-2 gap-3">
              {["上传文件", "解析任务", "质量评分", "业务报告"].map((item) => (
                <div className="rounded-md border border-slate-100 bg-slate-50 p-4" key={item}>
                  <p className="text-sm font-medium">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
