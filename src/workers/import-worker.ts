import { randomUUID } from "node:crypto";
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
  void job;
  throw new Error("CSV 解析将在 Phase 6 接入");
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
