import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { buildDefaultWorkspaceName, buildWorkspaceSlug } from "@/lib/auth-utils";
import { apiError, apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators/register";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const parsed = registerSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "请求参数不正确"), {
        status: 400
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: parsed.data.email
      }
    });

    if (existingUser) {
      return NextResponse.json(apiError("EMAIL_ALREADY_EXISTS", "该邮箱已注册，请直接登录。"), {
        status: 409
      });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: parsed.data.email,
          name: parsed.data.name,
          passwordHash
        }
      });

      const workspace = await tx.workspace.create({
        data: {
          ownerId: createdUser.id,
          name: buildDefaultWorkspaceName(parsed.data.name),
          slug: buildWorkspaceSlug(createdUser.id)
        }
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: createdUser.id,
          role: "OWNER"
        }
      });

      return createdUser;
    });

    return NextResponse.json(
      apiSuccess({
        userId: user.id
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("register failed", error);

    return NextResponse.json(apiError("UNKNOWN_ERROR", "注册失败，请稍后重试。"), {
      status: 500
    });
  }
}
