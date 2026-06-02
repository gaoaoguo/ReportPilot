export type ClaimedImportJob = {
  id: string;
  fileId: string;
  workspaceId: string;
  attempts: number;
  maxAttempts: number;
};

export type ImportJobFailure = {
  code: string;
  message: string;
  final: boolean;
};

export type ImportJobRepository = {
  claimNext(workerId: string): Promise<ClaimedImportJob | null>;
  complete(jobId: string): Promise<void>;
  fail(job: ClaimedImportJob, failure: ImportJobFailure): Promise<void>;
};

export type ImportJobProcessor = (job: ClaimedImportJob) => Promise<void>;

export class JobProcessingError extends Error {
  code: string;
  final?: boolean;

  constructor({ code, message, final }: { code: string; message: string; final?: boolean }) {
    super(message);
    this.name = "JobProcessingError";
    this.code = code;
    this.final = final;
  }
}

export type RunNextImportJobResult =
  | {
      status: "idle";
    }
  | {
      status: "completed" | "retrying" | "failed";
      jobId: string;
    };

export async function runNextImportJob({
  workerId,
  repository,
  processor
}: {
  workerId: string;
  repository: ImportJobRepository;
  processor: ImportJobProcessor;
}): Promise<RunNextImportJobResult> {
  const job = await repository.claimNext(workerId);

  if (!job) {
    return {
      status: "idle"
    };
  }

  try {
    await processor(job);
    await repository.complete(job.id);

    return {
      status: "completed",
      jobId: job.id
    };
  } catch (error) {
    const processingError = error instanceof JobProcessingError ? error : null;
    const final = processingError?.final ?? job.attempts >= job.maxAttempts;

    await repository.fail(job, {
      code: processingError?.code ?? "IMPORT_JOB_FAILED",
      message: error instanceof Error ? error.message : "任务处理失败",
      final
    });

    return {
      status: final ? "failed" : "retrying",
      jobId: job.id
    };
  }
}
