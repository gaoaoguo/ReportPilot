export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly userMessage: string,
    public readonly status = 400,
    public readonly details?: unknown
  ) {
    super(userMessage);
    this.name = "AppError";
  }
}
