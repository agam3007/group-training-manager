import { Router } from "express";
import { listDocs, query, upsertDoc, deleteDoc, getTenantId } from "../db";
import { requireRole } from "../auth/middleware";
import { logger } from "../utils/logger";

const router = Router();

// GET my profile + roles (union of grants)
router.get("/me", (req, res) => {
  const user = req.user!;
  res.json({
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    roles: user.roles,
  });
});

// GET all tenant users (owner only)
router.get("/users", requireRole("owner"), async (_req, res) => {
  const users = await listDocs("app_users");
  const roles = await listDocs("user_roles");
  res.json(
    users.map((u: any) => ({
      id: u.id,
      displayName: u.displayName,
      isActive: u.isActive,
      roles: roles.filter((r: any) => r.userId === u.id),
    }))
  );
});

// PUT replace a user's roles (owner only) — roles: [{role, scopeType?, scopeId?}]
router.put("/users/:id/roles", requireRole("owner"), async (req, res) => {
  const { id } = req.params;
  const tenantId = await getTenantId();

  const user = await query(`SELECT id FROM app_users WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
  if (!user.length) {
    return res.status(404).json({ message: "User not found" });
  }

  const newRoles: { role: string; scopeType?: string; scopeId?: string }[] = req.body.roles;
  if (!Array.isArray(newRoles)) {
    return res.status(400).json({ message: "roles must be an array" });
  }

  // replace all grants in one transaction
  const existing = await query<{ id: string }>(
    `SELECT id FROM user_roles WHERE user_id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );
  for (const row of existing) {
    await deleteDoc("user_roles", row.id);
  }
  for (const r of newRoles) {
    if (!r?.role) continue;
    await upsertDoc("user_roles", crypto.randomUUID(), {
      userId: id,
      role: r.role,
      scopeType: r.scopeType ?? null,
      scopeId: r.scopeId ?? null,
    });
  }

  logger.info(`Roles updated for user ${id}: ${newRoles.map((r) => r.role).join(", ")}`);
  res.json({ id, roles: newRoles });
});

export default router;