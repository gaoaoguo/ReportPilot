import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { AppError } from "@/lib/errors";

export function handleApiError(error: unknown, fallbackMessage = "请求失败，请稍后重试。") {
  if (error instanceof AppError) {
    return NextResponse.json(apiError(error.code, error.userMessage), {
      status: error.status
    });
  }

  console.error(error);

  return NextResponse.json(apiError("UNKNOWN_ERROR", fallbackMessage), {
    status: 500
  });
}
