import { NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      apiSuccess({
        status: "ok",
        db: "connected"
      })
    );
  } catch {
    return NextResponse.json(
      apiError("DATABASE_UNAVAILABLE", "数据库暂时不可用，请检查 MySQL 连接配置。"),
      { status: 503 }
    );
  }
}
