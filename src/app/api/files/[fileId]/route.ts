import { NextResponse } from "next/server";
import { apiSuccess } from "@/lib/api-response";
import { requireApiDefaultWorkspace, requireApiUser } from "@/lib/api-auth";
import { AppError } from "@/lib/errors";
import { handleApiError } from "@/lib/handle-api-error";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  try {
    const { fileId } = await params;
    const user = await requireApiUser();
    const workspace = await requireApiDefaultWorkspace(user.id);
    const file = await prisma.fileAsset.findFirst({
      where: {
        id: fileId,
        workspaceId: workspace.id,
        deletedAt: null
      },
      include: {
        jobs: {
          orderBy: {
            createdAt: "desc"
          },
          take: 5
        },
        reports: {
          orderBy: {
            createdAt: "desc"
          },
          take: 5
        }
      }
    });

    if (!file) {
      throw new AppError("FILE_NOT_FOUND", "文件不存在", 404);
    }

    return NextResponse.json(apiSuccess({ file }));
  } catch (error) {
    return handleApiError(error);
  }
}
