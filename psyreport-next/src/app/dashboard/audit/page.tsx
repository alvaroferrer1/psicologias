import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { AuditLogClient } from "@/components/AuditLogClient";

export default async function AuditPage() {
  const user = await requireCurrentUser();
  const logs = await prisma.auditLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <AuditLogClient
      logs={logs.map((log) => ({
        id: log.id,
        createdAt: log.createdAt.toISOString(),
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId || "",
        metadata: log.metadata ? JSON.stringify(log.metadata) : "",
      }))}
    />
  );
}
