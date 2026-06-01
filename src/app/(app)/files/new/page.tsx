import { UploadForm } from "./upload-form";

export const dynamic = "force-dynamic";

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <section className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-semibold">上传 CSV</h1>
        <p className="mt-2 text-sm text-slate-600">选择一个 CSV 文件，上传后会创建导入任务。</p>
      </section>

      <UploadForm />
    </div>
  );
}
