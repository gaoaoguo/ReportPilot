import { randomUUID } from "node:crypto";
import { analyzeCsvFile } from "@/lib/csv/analyze-csv-file";
import { claimImportJob } from "@/lib/jobs/claim-import-job";
import { completeImportJob } from "@/lib/jobs/complete-import-job";
import { failImportJob } from "@/lib/jobs/fail-import-job";
import { prisma } from "@/lib/prisma";
import { runNextImportJob, type ClaimedImportJob, type ImportJobRepository } from "@/workers/job-runner";

const pollIntervalMs = Number(process.env.IMPORT_WORKER_POLL_INTERVAL_MS ?? "3000");

export const importJobRepository: ImportJobRepository = {
  claimNext: claimImportJob,
  complete: completeImportJob,
  fail: failImportJob
};

export async function processImportJob(job: ClaimedImportJob) {
  const file = await prisma.fileAsset.findFirst({
    where: {
      id: job.fileId,
      workspaceId: job.workspaceId,
      deletedAt: null
    }
  });

  if (!file) {
    throw new Error("文件不存在或无权访问");
  }

  const analysis = await analyzeCsvFile(file.storagePath);

  await prisma.fileAsset.update({
    where: {
      id: file.id
    },
    data: {
      previewJson: analysis.previewJson,
      rowCount: analysis.rowCount,
      columnCount: analysis.columnCount,
      columnProfileJson: analysis.columnProfileJson,
      dataQualityJson: analysis.dataQualityJson,
      parseError: null
    }
  });
}

export async function runImportWorkerOnce(workerId: string) {
  return runNextImportJob({
    workerId,
    repository: importJobRepository,
    processor: processImportJob
  });
}

async function startImportWorker() {
  const workerId = `import-worker-${randomUUID()}`;

  console.log(`[${workerId}] started`);

  for (;;) {
    const result = await runImportWorkerOnce(workerId);

    if (result.status !== "idle") {
      console.log(`[${workerId}] ${result.status}: ${result.jobId}`);
    }

    await sleep(pollIntervalMs);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

if (process.argv[1]?.endsWith("import-worker.ts")) {
  startImportWorker()
    .catch((error) => {
      console.error("import worker stopped", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
