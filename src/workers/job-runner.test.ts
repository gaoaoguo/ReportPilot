import { describe, expect, test, vi } from "vitest";
import { runNextImportJob } from "./job-runner";

const job = {
  id: "job-1",
  fileId: "file-1",
  workspaceId: "workspace-1",
  attempts: 1,
  maxAttempts: 3
};

describe("runNextImportJob", () => {
  test("returns idle when no pending job can be claimed", async () => {
    const repository = {
      claimNext: vi.fn().mockResolvedValue(null),
      complete: vi.fn(),
      fail: vi.fn()
    };

    await expect(
      runNextImportJob({
        workerId: "worker-1",
        repository,
        processor: vi.fn()
      })
    ).resolves.toEqual({ status: "idle" });

    expect(repository.complete).not.toHaveBeenCalled();
    expect(repository.fail).not.toHaveBeenCalled();
  });

  test("marks claimed job completed after successful processing", async () => {
    const repository = {
      claimNext: vi.fn().mockResolvedValue(job),
      complete: vi.fn(),
      fail: vi.fn()
    };
    const processor = vi.fn().mockResolvedValue(undefined);

    await expect(
      runNextImportJob({
        workerId: "worker-1",
        repository,
        processor
      })
    ).resolves.toEqual({ status: "completed", jobId: "job-1" });

    expect(processor).toHaveBeenCalledWith(job);
    expect(repository.complete).toHaveBeenCalledWith("job-1");
  });

  test("releases job for retry when failure has attempts remaining", async () => {
    const repository = {
      claimNext: vi.fn().mockResolvedValue(job),
      complete: vi.fn(),
      fail: vi.fn()
    };

    await expect(
      runNextImportJob({
        workerId: "worker-1",
        repository,
        processor: vi.fn().mockRejectedValue(new Error("parse failed"))
      })
    ).resolves.toEqual({ status: "retrying", jobId: "job-1" });

    expect(repository.fail).toHaveBeenCalledWith(job, {
      code: "IMPORT_JOB_FAILED",
      message: "parse failed",
      final: false
    });
  });

  test("marks job failed when max attempts is reached", async () => {
    const finalAttemptJob = {
      ...job,
      attempts: 3,
      maxAttempts: 3
    };
    const repository = {
      claimNext: vi.fn().mockResolvedValue(finalAttemptJob),
      complete: vi.fn(),
      fail: vi.fn()
    };

    await expect(
      runNextImportJob({
        workerId: "worker-1",
        repository,
        processor: vi.fn().mockRejectedValue(new Error("parse failed"))
      })
    ).resolves.toEqual({ status: "failed", jobId: "job-1" });

    expect(repository.fail).toHaveBeenCalledWith(finalAttemptJob, {
      code: "IMPORT_JOB_FAILED",
      message: "parse failed",
      final: true
    });
  });
});
