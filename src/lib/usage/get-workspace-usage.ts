import { prisma } from "@/lib/prisma";
import { buildUsageSummary, getUsageLimits } from "./usage-limits";

export async function getWorkspaceUsage(workspaceId: string) {
  const limits = getUsageLimits();
  const [filesProcessed, rowsAggregate, reportsGenerated, tokenAggregate] = await Promise.all([
    prisma.fileAsset.count({
      where: {
        workspaceId,
        deletedAt: null
      }
    }),
    prisma.fileAsset.aggregate({
      where: {
        workspaceId,
        deletedAt: null
      },
      _sum: {
        rowCount: true
      }
    }),
    prisma.report.count({
      where: {
        workspaceId
      }
    }),
    prisma.aiCallLog.aggregate({
      where: {
        workspaceId
      },
      _sum: {
        totalTokens: true
      }
    })
  ]);

  return buildUsageSummary(
    {
      filesProcessed,
      rowsProcessed: rowsAggregate._sum.rowCount ?? 0,
      reportsGenerated,
      aiTokensUsed: tokenAggregate._sum.totalTokens ?? 0
    },
    limits
  );
}
