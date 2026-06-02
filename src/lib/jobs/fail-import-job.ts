import { prisma } from "@/lib/prisma";
import type { ClaimedImportJob, ImportJobFailure } from "@/workers/job-runner";

export async function failImportJob(job: ClaimedImportJob, failure: ImportJobFailure) {
  const nextStatus = failure.final ? "FAILED" : "PENDING";
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.importJob.update({
      where: {
        id: job.id
      },
      data: {
        status: nextStatus,
        lockedAt: null,
        lockedBy: null,
        errorCode: failure.code,
        errorMessage: failure.message,
        finishedAt: failure.final ? now : null
      }
    });

    await tx.fileAsset.update({
      where: {
        id: job.fileId
      },
      data: {
        status: failure.final ? "FAILED" : "UPLOADED",
        parseError: failure.message
      }
    });
  });
}
