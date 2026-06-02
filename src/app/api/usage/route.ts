import { NextResponse } from "next/server";
import { apiSuccess } from "@/lib/api-response";
import { requireApiDefaultWorkspace, requireApiUser } from "@/lib/api-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { getWorkspaceUsage } from "@/lib/usage/get-workspace-usage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireApiUser();
    const workspace = await requireApiDefaultWorkspace(user.id);
    const usage = await getWorkspaceUsage(workspace.id);

    return NextResponse.json(apiSuccess({ usage }));
  } catch (error) {
    return handleApiError(error, "用量统计获取失败，请稍后重试。");
  }
}
