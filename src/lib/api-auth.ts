import { auth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function requireApiUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new AppError("UNAUTHORIZED", "请先登录", 401);
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id
    }
  });

  if (!user) {
    throw new AppError("UNAUTHORIZED", "请先登录", 401);
  }

  return user;
}

export async function requireApiDefaultWorkspace(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId
    },
    include: {
      workspace: true
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  if (!membership) {
    throw new AppError("WORKSPACE_NOT_FOUND", "没有可用工作区", 403);
  }

  return membership.workspace;
}

export async function requireApiWorkspaceMember(userId: string, workspaceId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId
      }
    }
  });

  if (!membership) {
    throw new AppError("FORBIDDEN", "没有访问权限", 403);
  }

  return membership;
}
