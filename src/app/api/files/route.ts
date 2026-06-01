import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { apiSuccess } from "@/lib/api-response";
import { requireApiDefaultWorkspace, requireApiUser } from "@/lib/api-auth";
import { AppError } from "@/lib/errors";
import { getMaxUploadSizeMb, validateCsvUpload } from "@/lib/files/validate-upload";
import { handleApiError } from "@/lib/handle-api-error";
import { prisma } from "@/lib/prisma";
import { buildUploadStorageTarget, saveUploadedFile } from "@/lib/storage/local-storage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireApiUser();
    const workspace = await requireApiDefaultWorkspace(user.id);
    const files = await prisma.fileAsset.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      },
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        status: true,
        rowCount: true,
        columnCount: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(apiSuccess({ files }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const workspace = await requireApiDefaultWorkspace(user.id);
    const formData = await request.formData();
    const fileValue = formData.get("file");
    const file = fileValue instanceof File ? fileValue : null;
    const validation = validateCsvUpload(file, getMaxUploadSizeMb());

    if (!validation.ok) {
      throw new AppError(validation.code, validation.message, 400);
    }

    if (!file) {
      throw new AppError("FILE_REQUIRED", "请选择 CSV 文件", 400);
    }

    const fileId = randomUUID();
    const target = buildUploadStorageTarget(workspace.id, fileId);
    const saved = await saveUploadedFile(file, target);

    const result = await prisma.$transaction(async (tx) => {
      const fileAsset = await tx.fileAsset.create({
        data: {
          id: fileId,
          workspaceId: workspace.id,
          userId: user.id,
          originalName: file.name,
          storedName: "original.csv",
          storagePath: target.relativePath,
          mimeType: file.type || "text/csv",
          sizeBytes: saved.sizeBytes,
          checksum: saved.checksum,
          status: "UPLOADED"
        }
      });

      const job = await tx.importJob.create({
        data: {
          workspaceId: workspace.id,
          fileId: fileAsset.id,
          type: "IMPORT_FILE",
          status: "PENDING"
        }
      });

      return {
        fileId: fileAsset.id,
        jobId: job.id
      };
    });

    return NextResponse.json(apiSuccess(result), { status: 201 });
  } catch (error) {
    return handleApiError(error, "上传失败，请稍后重试。");
  }
}
