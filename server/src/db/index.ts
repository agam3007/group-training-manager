/**
 * Postgres data layer (F0.1) — replaces utils/fileDb.
 *
 * Design: hybrid doc tables (see db/schema.sql) — relational columns for
 * relations/filtering + a `data` jsonb column holding the full entity
 * document, field-for-field identical to the legacy database.json shape.
 *
 * All helpers are tenant-scoped: every read/write filters by tenant_id.
 * Until F0.2 (auth), all requests operate on the default tenant.
 */
import "dotenv/config";
import { Pool, PoolClient } from "pg";
import { logger } from "../utils/logger";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

pool.on("error", (err) => logger.error(`pg pool error: ${err.message}`));

// Table whitelist — internal constants only; never user input.
export const TABLES = new Set([
  "groups", "athletes", "athlete_groups", "trainings", "folders",
  "programs", "program_templates", "meso_blocks", "planned_weeks",
  "scheduled_workouts", "plans", "blocks", "training_assignments",
  "events", "event_overrides", "attendances", "notes",
]);

export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ---------- default tenant (single tenant until F0.2 auth) ----------

let tenantIdCache: string | null = null;

export async function getTenantId(): Promise<string> {
  if (tenantIdCache) return tenantIdCache;
  const rows = await query<{ id: string }>(`SELECT id FROM tenants ORDER BY created_at LIMIT 1`);
  if (rows.length) {
    tenantIdCache = rows[0].id;
    return tenantIdCache;
  }
  const [created] = await query<{ id: string }>(
    `INSERT INTO tenants (name) VALUES ($1) RETURNING id`,
    ["Default Club"]
  );
  tenantIdCache = created.id;
  return tenantIdCache;
}

// ---------- mapping helpers ----------

function ts(v: any): string | null {
  if (v === undefined || v === null || v === "") return null;
  if (v instanceof Date) return v.toISOString();
  return String(v); // ISO strings pass through
}

function nowOr(v: any): string {
  return ts(v) ?? new Date().toISOString();
}

/** Extracted relational columns per table, derived from the doc. */
const EXTRA: Record<string, (d: any) => Record<string, any>> = {
  athlete_groups: (d) => ({ athlete_id: d.athleteId ?? null, group_id: d.groupId ?? null }),
  groups: (d) => ({ name: d.name ?? null }),
  athletes: (d) => ({ name: d.name ?? null }),
  folders: (d) => ({ name: d.name ?? null }),
  trainings: (d) => ({ folder_id: d.folderId ?? null }),
  programs: (d) => ({ name: d.name ?? null }),
  program_templates: (d) => ({ name: d.name ?? null }),
  meso_blocks: (d) => ({ program_id: d.programId ?? null }),
  planned_weeks: (d) => ({ meso_block_id: d.mesoBlockId ?? null }),
  scheduled_workouts: (d) => ({ program_id: d.programId ?? null }),
  plans: (d) => ({ program_id: d.programId ?? null }),
  blocks: (d) => ({ plan_id: d.planId ?? null }),
  training_assignments: (d) => ({
    athlete_id: d.athleteId ?? null,
    group_id: d.groupId ?? null,
    training_id: d.trainingId ?? null,
    start_time: ts(d.startTime),
    end_time: ts(d.endTime),
  }),
  events: (d) => ({
    type: d.type ?? null,
    athlete_id: d.athleteId ?? null,
    group_id: d.groupId ?? null,
    source_id: d.sourceId ?? null,
    start_time: ts(d.startTime),
    end_time: ts(d.endTime),
  }),
  event_overrides: (d) => ({
    source_id: d.sourceId ?? null,
    original_start_time: ts(d.originalStartTime),
  }),
  attendances: (d) => ({
    event_id: d.eventId,
    athlete_id: d.athleteId,
    status: d.status,
    is_verified: d.isVerified ?? true,
  }),
  notes: (d) => ({
    target_type: d.targetType ?? null,
    target_id: d.targetId ?? null,
    athlete_id: d.athleteId ?? null,
    group_id: d.groupId ?? null,
  }),
};

/** Special mapping for tables without a `data` jsonb column. */
const ROW_TO_DOC: Record<string, { cols: string; map: (r: any) => any }> = {
  athlete_groups: {
    cols: "id, athlete_id, group_id",
    map: (r) => ({ id: r.id, athleteId: r.athlete_id, groupId: r.group_id }),
  },
};

function table(name: string): string {
  if (!TABLES.has(name)) throw new Error(`Unknown table: ${name}`);
  return name;
}

// ---------- document CRUD ----------

/** All docs of a table, shape-identical to the legacy JSON collection. */
export async function listDocs(tname: string): Promise<any[]> {
  const t = table(tname);
  const tenantId = await getTenantId();
  const special = ROW_TO_DOC[t];
  if (special) {
    const rows = await query(`SELECT ${special.cols} FROM ${t} WHERE tenant_id = $1`, [tenantId]);
    return rows.map(special.map);
  }
  const rows = await query<{ id: string; data: any }>(
    `SELECT id, data FROM ${t} WHERE tenant_id = $1`,
    [tenantId]
  );
  return rows.map((r) => ({ ...r.data, id: r.id }));
}

/** Single doc by id, or null. */
export async function getDoc(tname: string, id: string): Promise<any | null> {
  const t = table(tname);
  const tenantId = await getTenantId();
  const special = ROW_TO_DOC[t];
  if (special) {
    const rows = await query(
      `SELECT ${special.cols} FROM ${t} WHERE tenant_id = $1 AND id = $2`,
      [tenantId, id]
    );
    return rows.length ? special.map(rows[0]) : null;
  }
  const rows = await query<{ id: string; data: any }>(
    `SELECT id, data FROM ${t} WHERE tenant_id = $1 AND id = $2`,
    [tenantId, id]
  );
  return rows.length ? { ...rows[0].data, id: rows[0].id } : null;
}

export interface UpsertOpts {
  /** Override the derived extracted columns for this write. */
  extra?: Record<string, any>;
  /** Run inside an existing transaction. */
  client?: PoolClient;
}

/**
 * Insert or update a doc. Preserves the doc's original createdAt when
 * present; updated_at is always set to now().
 */
export async function upsertDoc(
  tname: string,
  id: string,
  doc: any,
  opts?: UpsertOpts
): Promise<void> {
  const t = table(tname);
  const tenantId = await getTenantId();
  const special = ROW_TO_DOC[t];
  const extra = { ...(EXTRA[t]?.(doc) ?? {}), ...(opts?.extra ?? {}) } as Record<string, any>;
  const keys = Object.keys(extra);
  const q = opts?.client ? opts.client.query.bind(opts.client) : pool.query.bind(pool);

  if (special) {
    // tables without a data column (athlete_groups)
    const cols = ["id", "tenant_id", ...keys];
    const params = [id, tenantId, ...keys.map((k) => extra[k])];
    const ph = params.map((_, i) => `$${i + 1}`).join(", ");
    const sql =
      `INSERT INTO ${t} (${cols.join(", ")}) VALUES (${ph}) ` +
      (keys.length
        ? `ON CONFLICT (id) DO UPDATE SET ${keys.map((k) => `${k} = EXCLUDED.${k}`).join(", ")} WHERE ${t}.tenant_id = $2`
        : "");
    await q(sql, params);
    return;
  }

  const created = nowOr(doc.createdAt);
  const cols = ["id", "tenant_id", ...keys, "data", "created_at", "updated_at"];
  const params = [id, tenantId, ...keys.map((k) => extra[k]), JSON.stringify(doc), created];
  const ph = params.map((_, i) => `$${i + 1}`).join(", ");
  const sets = [
    ...keys.map((k) => `${k} = EXCLUDED.${k}`),
    "data = EXCLUDED.data",
    "updated_at = now()",
  ].join(", ");
  const sql =
    `INSERT INTO ${t} (${cols.join(", ")}) VALUES (${ph}, now()) ` +
    `ON CONFLICT (id) DO UPDATE SET ${sets} WHERE ${t}.tenant_id = $2`;
  await q(sql, params);
}

/** Delete a doc by id. */
export async function deleteDoc(tname: string, id: string, opts?: { client?: PoolClient }): Promise<void> {
  const t = table(tname);
  const tenantId = await getTenantId();
  const q = opts?.client ? opts.client.query.bind(opts.client) : pool.query.bind(pool);
  await q(`DELETE FROM ${t} WHERE tenant_id = $1 AND id = $2`, [tenantId, id]);
}

export { pool };