import type { FileStatus, JobStatus, ReportStatus } from "@prisma/client";

export const fileStatusLabels: Record<FileStatus, string> = {
  UPLOADED: "已上传",
  PARSING: "解析中",
  PARSED: "已解析",
  FAILED: "失败",
  DELETED: "已删除"
};

export const jobStatusLabels: Record<JobStatus, string> = {
  PENDING: "等待处理",
  PROCESSING: "处理中",
  COMPLETED: "已完成",
  FAILED: "失败",
  CANCELED: "已取消"
};

export const reportStatusLabels: Record<ReportStatus, string> = {
  DRAFT: "生成中",
  READY: "已完成",
  FAILED: "失败"
};
