/**
 * Auth middleware (F0.2 + D30 platform admin).
 *
 * Verifies the Supabase Auth JWT (RS256 via JWKS) on every request,
 * attaches the app user + roles (union of grants, USR-12) to req.user.
 *
 * Two user types:
 *  - Tenant user: bound to a tenant (tenant_id), operates within it.
 *  - Platform admin: NOT bound to a tenant; can operate on ANY tenant
 *    by setting the X-Tenant-Id header (D30). Defaults to the first tenant.
 *
 * Bootstrap: the first authenticated user becomes tenant owner;
 * `POST /auth/platform/claim` promotes them to platform admin.
 */
import { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { query, upsertDoc, getTenantId } from "../db";
import { logger } from "../utils/logger";

const SUPABASE_JWKS_URL = process.env.SUPABASE_JWKS_URL;

const JWKS = SUPABASE_JWKS_URL ? createRemoteJWKSet(new URL(SUPABASE_JWKS_URL)) : null;

export interface AppRole {
  role: string;
  scopeType?: string | null;
  scopeId?: string | null;
}

export interface AuthUser {
  id: string;
  tenantId: string | null; // null = platform admin without a fixed tenant
  displayName: string | null;
  email: string | null;
  isPlatformAdmin: boolean;
  roles: AppRole[]; // union of grants — USR-12
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

async function loadOrCreateUser(sub: string, email: string | null, name: string | null): Promise<AuthUser | null> {
  // Check platform admin first (no tenant_id)
  const platformRows = await query(
    `SELECT id, display_name, is_active FROM app_users WHERE id = $1 AND is_platform_admin = true`,
    [sub]
  );
  const platformAdmin = platformRows[0];
  if (platformAdmin && platformAdmin.is_active) {
    return {
      id: sub,
      tenantId: null,
      displayName: platformAdmin.display_name,
      email,
      isPlatformAdmin: true,
      roles: [{ role: "owner", scopeType: null, scopeId: null }], // implicit owner everywhere
    };
  }

  // Tenant user
  const tenantId = await getTenantId();
  const rows = await query(
    `SELECT id, display_name, is_active FROM app_users WHERE id = $1 AND tenant_id = $2`,
    [sub, tenantId]
  );

  let user = rows[0] as { id: string; display_name: string | null; is_active: boolean } | undefined;

  // Bootstrap: the very first authenticated user becomes the owner + platform admin.
  if (!user) {
    const [{ count }] = await query<{ count: string }>(`SELECT count(*)::int AS count FROM app_users`);
    if (Number(count) !== 0) {
      return null; // exists users, but this one is not linked — owner must invite (later feature)
    }
    const displayName = name ?? email?.split("@")[0] ?? "Owner";
    // Create as platform admin: tenant_id = null, is_platform_admin = true
    await query(
      `INSERT INTO app_users (id, tenant_id, display_name, is_active, is_platform_admin)
       VALUES ($1, NULL, $2, true, true)
       ON CONFLICT (id) DO UPDATE SET is_platform_admin = true, tenant_id = NULL`,
      [sub, displayName]
    );
    // Still give them the owner role on the default tenant so they can operate within it
    const defaultTenant = await getTenantId();
    await upsertDoc("user_roles", crypto.randomUUID(), {
      userId: sub,
      role: "owner",
      scopeType: null,
      scopeId: null,
    });
    logger.info(`Auth bootstrap: first user ${sub} became platform admin + tenant owner`);
    // Re-read to get the full row
    const refreshed = await query(
      `SELECT id, display_name, is_active, is_platform_admin, tenant_id FROM app_users WHERE id = $1`,
      [sub]
    );
    const row = refreshed[0];
    if (row?.is_platform_admin) {
      return {
        id: sub,
        tenantId: null,
        displayName: row.display_name,
        email,
        isPlatformAdmin: true,
        roles: [{ role: "owner", scopeType: null, scopeId: null }],
      };
    }
    user = { id: sub, display_name: displayName, is_active: true };
  }

  if (!user.is_active) return null;

  const roleRows = await query(
    `SELECT role, scope_type, scope_id FROM user_roles WHERE user_id = $1 AND tenant_id = $2`,
    [sub, tenantId]
  );

  return {
    id: user.id,
    tenantId,
    displayName: user.display_name,
    email,
    isPlatformAdmin: false,
    roles: roleRows.map((r: any) => ({ role: r.role, scopeType: r.scope_type, scopeId: r.scope_id })),
  };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!JWKS) {
      res.status(500).json({ message: "Auth is not configured" });
      return;
    }

    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({ message: "Missing access token" });
      return;
    }

    const token = header.slice("Bearer ".length);
    const { payload } = await jwtVerify(token, JWKS);

    const sub = payload.sub as string | undefined;
    if (!sub) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    const user = await loadOrCreateUser(sub, (payload.email as string) ?? null, null);
    if (!user) {
      res.status(403).json({ message: "User is not linked to this tenant" });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    logger.info(`Auth rejected: ${err instanceof Error ? err.message : err}`);
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

/** Role gate — the user must hold at least one grant with this role. */
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Platform admin passes all role gates
    if (req.user?.isPlatformAdmin) {
      next();
      return;
    }
    if (!req.user?.roles.some((r) => r.role === role)) {
      res.status(403).json({ message: `Requires ${role} role` });
      return;
    }
    next();
  };
}

/** Platform admin gate (D30) */
export function requirePlatformAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.isPlatformAdmin) {
    res.status(403).json({ message: "Requires platform admin" });
    return;
  }
  next();
}