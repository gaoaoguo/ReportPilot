import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id
    }
  });

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function getDefaultWorkspaceForUser(userId: string) {
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

  return membership?.workspace ?? null;
}

export async function requireDefaultWorkspace(userId: string) {
  const workspace = await getDefaultWorkspaceForUser(userId);

  if (!workspace) {
    throw new Error("WORKSPACE_NOT_FOUND");
  }

  return workspace;
}

export async function requireWorkspaceMember(userId: string, workspaceId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId
      }
    },
    include: {
      workspace: true
    }
  });

  if (!membership) {
    throw new Error("FORBIDDEN");
  }

  return membership;
}
