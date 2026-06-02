import { prisma } from "@/lib/prisma";

export async function completeImportJob(jobId: string) {
  await prisma.$transaction(async (tx) => {
    const job = await tx.importJob.update({
      where: {
        id: jobId
      },
      data: {
        status: "COMPLETED",
        progress: 100,
        lockedAt: null,
        lockedBy: null,
        finishedAt: new Date(),
        errorCode: null,
        errorMessage: null
      },
      select: {
        fileId: true
      }
    });

    await tx.fileAsset.update({
      where: {
        id: job.fileId
      },
      data: {
        status: "PARSED",
        parseError: null
      }
    });
  });
}
