/**
 * Auth middleware (F0.2).
 *
 * Verifies the Supabase Auth JWT (RS256 via JWKS) on every request,
 * attaches the app user + roles (union of grants, USR-12) to req.user,
 * and bootstraps the very first user as the tenant owner.
 *
 * Verification depth in F0.2: signature (JWKS) + sub claim.
 * Issuer/audience checks tighten in F0.3 (documented in F0.2-card).
 */
import { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { query, upsertDoc, getTenantId } from "../db";
import { logger } from "../utils/logger";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_JWKS_URL = process.env.SUPABASE_JWKS_URL;

const JWKS = SUPABASE_JWKS_URL ? createRemoteJWKSet(new URL(SUPABASE_JWKS_URL)) : null;

export interface AppRole {
  role: string;
  scopeType?: string | null;
  scopeId?: string | null;
}

export interface AuthUser {
  id: string; // Supabase Auth user id
  tenantId: string;
  displayName: string | null;
  email: string | null;
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
  const tenantId = await getTenantId();

  const rows = await query(
    `SELECT id, display_name, is_active FROM app_users WHERE id = $1 AND tenant_id = $2`,
    [sub, tenantId]
  );

  let user = rows[0] as { id: string; display_name: string | null; is_active: boolean } | undefined;

  // Bootstrap: the very first authenticated user becomes the owner.
  if (!user) {
    const [{ count }] = await query<{ count: string }>(`SELECT count(*)::int AS count FROM app_users WHERE tenant_id = $1`, [tenantId]);
    if (Number(count) !== 0) {
      return null; // exists users, but this one is not linked — owner must invite (later feature)
    }
    const displayName = name ?? email?.split("@")[0] ?? "Owner";
    await upsertDoc("app_users", sub, { id: sub, displayName, isActive: true });
    await upsertDoc("user_roles", crypto.randomUUID(), {
      userId: sub,
      role: "owner",
      scopeType: null,
      scopeId: null,
    });
    logger.info(`Auth bootstrap: first user ${sub} became tenant owner`);
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
    roles: roleRows.map((r: any) => ({ role: r.role, scopeType: r.scope_type, scopeId: r.scope_id })),
  };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!JWKS) {
      // Misconfiguration: fail closed.
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
    if (!req.user?.roles.some((r) => r.role === role)) {
      res.status(403).json({ message: `Requires ${role} role` });
      return;
    }
    next();
  };
}