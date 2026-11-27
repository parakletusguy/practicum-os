import type { Prisma } from "@prisma/client";

export function fieldDirectorFromSettings(settings: Prisma.JsonValue | undefined) {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
  const { fieldDirector } = settings;
  if (!fieldDirector || typeof fieldDirector !== "object" || Array.isArray(fieldDirector)) return null;
  const { personId, name } = fieldDirector;
  if (typeof personId !== "string" || !personId.trim() || typeof name !== "string" || !name.trim()) return null;
  return { personId, name };
}
