import "server-only";

import { SystemRole } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { DEMO_PERSONAS, type DemoPersonaKey } from "@/lib/auth-personas";
import { AuthenticationError, AuthorizationError, requireTenantRole, WorkspaceUnavailableError } from "@/lib/authz";
import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/runtime-mode";

export const requirePortalAccess = cache(async (tenantSlug: string, portal: DemoPersonaKey) => {
  const persona = DEMO_PERSONAS[portal];
  if (isDemoMode()) {
    if (tenantSlug !== persona.tenantSlug) notFound();
    const [tenant, actor] = await Promise.all([
      db.organisation.findUnique({ where: { slug: tenantSlug }, select: { id: true, name: true, slug: true, settings: true } }),
      db.person.findUnique({ where: { email: persona.email }, select: { id: true, email: true, firstName: true, lastName: true } }),
    ]);
    if (!tenant || !actor) notFound();
    return { actor, tenant };
  }

  try {
    const roles = portal === "admin" ? [SystemRole.COORDINATOR, SystemRole.INSTITUTION_ADMIN] : [persona.role];
    return await requireTenantRole(tenantSlug, roles);
  } catch (error) {
    if (error instanceof WorkspaceUnavailableError) notFound();
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      redirect("/auth/login?error=access");
    }
    throw error;
  }
});
