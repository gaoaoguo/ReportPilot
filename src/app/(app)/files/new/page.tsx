import Link from "next/link";

export const dynamic = "force-dynamic";

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <section className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-semibold">上传 CSV</h1>
        <p className="mt-2 text-sm text-slate-600">上传入口暂未开放。</p>
      </section>

      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8">
        <h2 className="text-lg font-semibold">上传入口尚未启用</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">请先返回文件列表，上传功能会在文件处理流程接通后开放。</p>
        <Link className="mt-5 inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700" href="/files">
          返回文件列表
        </Link>
      </section>
    </div>
  );
}
