import "server-only";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const dispatchAction = "NEED_DISPATCHED_TO_SERVICE";

export function dispatchTarget(state: Prisma.JsonValue) {
  if (!state || typeof state !== "object" || Array.isArray(state) ||
      typeof state.targetId !== "string" || typeof state.targetType !== "string") return null;
  return { id: state.targetId, type: state.targetType, name: typeof state.targetName === "string" ? state.targetName : "" };
}

export async function findCurrentDispatch(requestId: string, client: Pick<Prisma.TransactionClient, "auditLog"> = db) {
  return client.auditLog.findFirst({
    where: { resourceType: "NeedRequest", resourceId: requestId, actionType: dispatchAction },
    select: { id: true, afterState: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}
