import { Router } from "express";
import { listDocs, query, upsertDoc, deleteDoc, getTenantId } from "../db";
import { requireRole, requirePlatformAdmin } from "../auth/middleware";
import { logger } from "../utils/logger";

const router = Router();

// GET my profile + roles (union of grants)
router.get("/me", (req, res) => {
  const user = req.user!;
  res.json({
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    isPlatformAdmin: user.isPlatformAdmin,
    tenantId: user.tenantId,
    roles: user.roles,
  });
});

// GET my accessible tenants — platform admin sees all; tenant user sees their own
router.get("/tenants", async (req, res) => {
  const user = req.user!;
  if (user.isPlatformAdmin) {
    const tenants = await query(
      `SELECT id, name, tenant_type, plan, timezone FROM tenants ORDER BY created_at`
    );
    return res.json(tenants);
  }
  // tenant user: just their tenant (or the active one)
  const tenantId = user.tenantId || (await getTenantId());
  const [tenant] = await query(
    `SELECT id, name, tenant_type, plan, timezone FROM tenants WHERE id = $1`,
    [tenantId]
  );
  return res.json(tenant ? [tenant] : []);
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

// =========================
// PLATFORM ADMIN (D30)
// =========================

// POST claim platform admin — any authenticated user, only if no platform admin exists
router.post("/platform/claim", async (req, res) => {
  const user = req.user!;
  const existing = await query(`SELECT id FROM app_users WHERE is_platform_admin = true`);
  if (existing.length) {
    return res.status(409).json({ message: "A platform admin already exists" });
  }

  // Promote: set is_platform_admin, clear tenant binding
  await query(
    `UPDATE app_users SET is_platform_admin = true, tenant_id = NULL, updated_at = now() WHERE id = $1`,
    [user.id]
  );
  logger.info(`Platform admin claimed by user ${user.id}`);
  res.json({ success: true, message: "Platform admin claimed" });
});

// GET all tenants (platform admin only)
router.get("/platform/tenants", requirePlatformAdmin, async (_req, res) => {
  const tenants = await query(
    `SELECT id, name, tenant_type, plan, timezone, created_at FROM tenants ORDER BY created_at`
  );
  const stats = await query(
    `SELECT tenant_id, count(*)::int AS athletes FROM athletes GROUP BY tenant_id`
  );
  const statsMap = new Map(stats.map((s: any) => [s.tenant_id, s.athletes]));

  res.json(
    tenants.map((t: any) => ({
      ...t,
      athleteCount: statsMap.get(t.id) ?? 0,
    }))
  );
});

// POST create a new tenant (platform admin only)
router.post("/platform/tenants", requirePlatformAdmin, async (req, res) => {
  const { name, tenantType } = req.body;
  if (!name) {
    return res.status(400).json({ message: "name is required" });
  }

  const [created] = await query(
    `INSERT INTO tenants (name, tenant_type) VALUES ($1, $2) RETURNING id, name, tenant_type, plan, created_at`,
    [name, tenantType === "practice" ? "practice" : "club"]
  );

  logger.info(`Tenant created: ${name} (${created.id})`);
  res.status(201).json(created);
});

// PUT update a tenant (platform admin only)
router.put("/platform/tenants/:id", requirePlatformAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, tenantType, plan, timezone } = req.body;

  const existing = await query(`SELECT id FROM tenants WHERE id = $1`, [id]);
  if (!existing.length) {
    return res.status(404).json({ message: "Tenant not found" });
  }

  const updates: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramIdx++}`);
    params.push(name);
  }
  if (tenantType !== undefined) {
    updates.push(`tenant_type = $${paramIdx++}`);
    params.push(tenantType === "practice" ? "practice" : "club");
  }
  if (plan !== undefined) {
    updates.push(`plan = $${paramIdx++}`);
    params.push(plan === "pro" ? "pro" : "free");
  }
  if (timezone !== undefined) {
    updates.push(`timezone = $${paramIdx++}`);
    params.push(timezone);
  }

  if (!updates.length) {
    return res.status(400).json({ message: "No fields to update" });
  }

  updates.push(`updated_at = now()`);
  params.push(id);

  const [updated] = await query(
    `UPDATE tenants SET ${updates.join(", ")} WHERE id = $${params.length} RETURNING id, name, tenant_type, plan, timezone, updated_at`,
    params
  );

  logger.info(`Tenant updated: ${id}`);
  res.json(updated);
});

// DELETE a tenant (platform admin only) — cascades to all data
router.delete("/platform/tenants/:id", requirePlatformAdmin, async (req, res) => {
  const { id } = req.params;

  const existing = await query(`SELECT id, name FROM tenants WHERE id = $1`, [id]);
  if (!existing.length) {
    return res.status(404).json({ message: "Tenant not found" });
  }

  await query(`DELETE FROM tenants WHERE id = $1`, [id]);
  logger.info(`Tenant deleted: ${existing[0].name} (${id})`);
  res.json({ message: "Tenant deleted", name: existing[0].name });
});

export default router;