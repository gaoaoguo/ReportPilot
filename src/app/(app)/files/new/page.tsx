import { UploadForm } from "./upload-form";
import { getUsageLimits } from "@/lib/usage/usage-limits";

export const dynamic = "force-dynamic";

export default function UploadPage() {
  const limits = getUsageLimits();

  return (
    <div className="space-y-6">
      <section className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-semibold">上传 CSV</h1>
        <p className="mt-2 text-sm text-slate-600">
          选择一个 CSV 文件，上传后会创建导入任务。当前免费额度最多 {limits.maxFiles} 个文件，单文件最多处理 {limits.maxRowsPerFile} 行。
        </p>
      </section>

      <UploadForm maxFiles={limits.maxFiles} maxRowsPerFile={limits.maxRowsPerFile} />
    </div>
  );
}
