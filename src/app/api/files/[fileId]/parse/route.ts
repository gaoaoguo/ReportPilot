import { NextResponse } from "next/server";
import { apiSuccess } from "@/lib/api-response";
import { requireApiDefaultWorkspace, requireApiUser } from "@/lib/api-auth";
import { AppError } from "@/lib/errors";
import { handleApiError } from "@/lib/handle-api-error";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  try {
    const { fileId } = await params;
    const user = await requireApiUser();
    const workspace = await requireApiDefaultWorkspace(user.id);
    const file = await prisma.fileAsset.findFirst({
      where: {
        id: fileId,
        workspaceId: workspace.id,
        deletedAt: null
      }
    });

    if (!file) {
      throw new AppError("FILE_NOT_FOUND", "文件不存在", 404);
    }

    const job = await prisma.importJob.create({
      data: {
        workspaceId: workspace.id,
        fileId: file.id,
        type: "IMPORT_FILE",
        status: "PENDING"
      }
    });

    await prisma.fileAsset.update({
      where: {
        id: file.id
      },
      data: {
        status: "UPLOADED",
        parseError: null
      }
    });

    return NextResponse.json(
      apiSuccess({
        jobId: job.id
      }),
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "重新解析失败，请稍后重试。");
  }
}
