export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <p className="mb-4 text-sm font-medium text-slate-600">ReportPilot</p>
      <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-slate-950">
        AI 数据清洗与报表生成系统
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-7 text-slate-700">
        上传 CSV，系统会在本地保存文件，异步解析数据结构，生成质量检查和业务报告。
      </p>
    </main>
  );
}
