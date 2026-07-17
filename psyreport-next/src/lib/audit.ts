import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function logAudit({
  userId,
  action,
  entityType,
  entityId,
  metadata,
}: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId: entityId || null,
        metadata: metadata || undefined,
      },
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}
