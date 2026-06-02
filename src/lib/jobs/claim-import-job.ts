import { prisma } from "@/lib/prisma";
import type { ClaimedImportJob } from "@/workers/job-runner";

export async function claimImportJob(workerId: string): Promise<ClaimedImportJob | null> {
  return prisma.$transaction(async (tx) => {
    const pendingJob = await tx.importJob.findFirst({
      where: {
        status: "PENDING",
        attempts: {
          lt: tx.importJob.fields.maxAttempts
        }
      },
      orderBy: {
        createdAt: "asc"
      },
      select: {
        id: true
      }
    });

    if (!pendingJob) {
      return null;
    }

    const now = new Date();
    const updated = await tx.importJob.updateMany({
      where: {
        id: pendingJob.id,
        status: "PENDING",
        lockedAt: null
      },
      data: {
        status: "PROCESSING",
        lockedAt: now,
        lockedBy: workerId,
        attempts: {
          increment: 1
        },
        startedAt: now,
        errorCode: null,
        errorMessage: null
      }
    });

    if (updated.count !== 1) {
      return null;
    }

    const claimedJob = await tx.importJob.findUniqueOrThrow({
      where: {
        id: pendingJob.id
      },
      select: {
        id: true,
        fileId: true,
        workspaceId: true,
        attempts: true,
        maxAttempts: true
      }
    });

    await tx.fileAsset.update({
      where: {
        id: claimedJob.fileId
      },
      data: {
        status: "PARSING",
        parseError: null
      }
    });

    return claimedJob;
  });
}
