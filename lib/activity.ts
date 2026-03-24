import { prisma } from "./prisma";

export async function logActivity(
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  details?: string
) {
  try {
    await prisma.activityLog.create({
      data: { userId, action, entity, entityId, details },
    });
  } catch {
    // Don't break the request if logging fails
  }
}
