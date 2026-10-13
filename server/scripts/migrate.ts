/**
 * F0.1 migration: database.json -> Postgres.
 *
 * Usage: npm run migrate
 * - Applies schema.sql (idempotent)
 * - Ensures the default tenant
 * - Cleans known data issues (documented in docs/features/F0.1-card.md):
 *     * numeric fields stored as strings -> int/null
 *     * group.athletes / athlete.groups mixing names and ids -> ids only (report)
 *     * schedule[].day stored as string -> int
 * - Truncates domain tables and re-inserts everything (re-runnable)
 * - Verifies row counts and prints a report
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { Pool } from "pg";

const DB_PATH = path.join(__dirname, "../src/db/database.json");
const SCHEMA_PATH = path.join(__dirname, "../src/db/schema.sql");

type Report = {
  numericFixed: number;
  dayFixed: number;
  danglingRefsFixed: number;
  relationsDropped: number;
  groupNamesDropped: string[];
  athleteGroupNamesDropped: string[];
  counts: Record<string, { source: number; db: number }>;
};

const NUMERIC_FIELDS = ["age", "height", "weight", "restingHR", "maxHR", "experience"];

function toNumberOrNull(v: any): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

  const source = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
  const report: Report = {
    numericFixed: 0,
    dayFixed: 0,
    danglingRefsFixed: 0,
    relationsDropped: 0,
    groupNamesDropped: [],
    athleteGroupNamesDropped: [],
    counts: {},
  };

  try {
    // 1. schema (idempotent, multi-statement)
    await pool.query(schema);
    console.log("[1/5] schema applied");

    // 2. default tenant
    let tenantId: string | undefined = (await pool.query(`SELECT id FROM tenants ORDER BY created_at LIMIT 1`)).rows[0]?.id;
    if (!tenantId) {
      tenantId = (await pool.query(`INSERT INTO tenants (name) VALUES ($1) RETURNING id`, ["Default Club"])).rows[0].id;
      console.log("[2/5] created default tenant");
    } else {
      console.log("[2/5] default tenant found");
    }

    // 3. clean data
    const athletes: any[] = source.athletes ?? [];
    const groups: any[] = source.groups ?? [];
    const athleteById = new Map<string, any>(athletes.map((a) => [a.id, a]));
    const athleteIdsByName = new Map<string, string[]>();
    for (const a of athletes) {
      if (a.name) athleteIdsByName.set(a.name, [...(athleteIdsByName.get(a.name) ?? []), a.id]);
    }
    const isAthleteId = (x: any) => athleteById.has(x);

    for (const a of athletes) {
      for (const f of NUMERIC_FIELDS) {
        if (a[f] !== undefined && typeof a[f] !== "number") {
          a[f] = toNumberOrNull(a[f]);
          report.numericFixed++;
        }
      }
      // athlete.groups: resolve names -> ids, drop unresolvable
      if (Array.isArray(a.groups)) {
        a.groups = a.groups.filter((g: any) => {
          if (isAthleteId(g)) return true;
          const ids = athleteIdsByName.get(String(g));
          if (ids?.length) return true; // handled below by replacement
          report.athleteGroupNamesDropped.push(`${g} (athlete ${a.name})`);
          return false;
        }).map((g: any) => {
          if (isAthleteId(g)) return g;
          const ids = athleteIdsByName.get(String(g));
          return ids?.[0] ?? g;
        });
      }
    }

    for (const g of groups) {
      // group.athletes: resolve names -> ids, drop unresolvable (report)
      if (Array.isArray(g.athletes)) {
        g.athletes = g.athletes.filter((x: any) => {
          if (isAthleteId(x)) return true;
          if (athleteIdsByName.has(String(x))) return true;
          report.groupNamesDropped.push(`${JSON.stringify(x)} (group ${g.name})`);
          return false;
        }).map((x: any) => {
          if (isAthleteId(x)) return x;
          return athleteIdsByName.get(String(x))![0];
        });
        g.athletes = [...new Set(g.athletes as string[])];
      }
      // schedule day string -> int
      if (Array.isArray(g.schedule)) {
        for (const s of g.schedule) {
          if (s?.day !== undefined && typeof s.day !== "number") {
            const d = Number(s.day);
            s.day = Number.isFinite(d) ? d : null;
            report.dayFixed++;
          }
        }
      }
    }
    // 3b. dangling FK references -> null (the old file DB tolerated orphans; the new schema does not)
    const idsOf = (arr: any[]) => new Set((arr ?? []).map((x: any) => x.id));
    const folderIds = idsOf(source.folders);
    const programIds = idsOf(source.programs);
    const mesoBlockIds = idsOf(source.mesoBlocks);
    const planIds = idsOf(source.plans ?? []);
    const groupIds = idsOf(source.groups);

    const deref = (row: any, field: string, set: Set<any>) => {
      if (row[field] && !set.has(row[field])) {
        row[field] = null;
        report.danglingRefsFixed++;
      }
    };
    // children with NOT NULL FK -> drop rows whose parent is gone (garbage from AS-IS bug 3.7)
    const dropDangling = (arr: any[], field: string, set: Set<any>) => {
      const before = arr.length;
      const kept = arr.filter((r: any) => !r[field] || set.has(r[field]));
      arr.length = 0;
      arr.push(...kept);
      const dropped = before - kept.length;
      report.relationsDropped += dropped;
      return dropped;
    };

    for (const t of source.trainings ?? []) deref(t, "folderId", folderIds);
    dropDangling(source.mesoBlocks ?? [], "programId", programIds); // mutates in place
    const mesoBlockIdsAfterDrop = idsOf(source.mesoBlocks);
    dropDangling(source.plannedWeeks ?? [], "mesoBlockId", mesoBlockIdsAfterDrop);
    for (const w of source.scheduledWorkouts ?? []) deref(w, "programId", programIds);
    for (const p of source.plans ?? []) deref(p, "programId", programIds);
    for (const b of source.blocks ?? []) deref(b, "planId", planIds);

    // 3c. athlete_groups relations pointing at deleted athletes/groups -> drop (report)
    const beforeRelations = (source.athleteGroups ?? []).length;
    source.athleteGroups = (source.athleteGroups ?? []).filter(
      (r: any) => athleteById.has(r.athleteId) && groupIds.has(r.groupId)
    );
    report.relationsDropped = beforeRelations - source.athleteGroups.length;

    console.log(
      `[3/5] cleaned: numericFixed=${report.numericFixed}, dayFixed=${report.dayFixed}, ` +
      `danglingRefsFixed=${report.danglingRefsFixed}, relationsDropped=${report.relationsDropped}, ` +
      `groupNamesDropped=${report.groupNamesDropped.length}, athleteGroupNamesDropped=${report.athleteGroupNamesDropped.length}`
    );
    if (report.groupNamesDropped.length) console.log("      dropped from group.athletes:", report.groupNamesDropped.join(", "));
    if (report.athleteGroupNamesDropped.length) console.log("      dropped from athlete.groups:", report.athleteGroupNamesDropped.join(", "));

    // 4. truncate + insert
    const domainTables = [
      "groups", "athletes", "athlete_groups", "trainings", "folders",
      "programs", "program_templates", "meso_blocks", "planned_weeks",
      "scheduled_workouts", "plans", "blocks", "training_assignments",
      "events", "event_overrides", "attendances", "notes",
    ];
    await pool.query(`TRUNCATE ${domainTables.join(", ")} RESTART IDENTITY CASCADE`);
    console.log("[4/5] tables truncated — inserting…");

    // Insertion order respects FK dependencies:
    // folders before trainings; programs before meso_blocks/scheduled_workouts/plans;
    // meso_blocks before planned_weeks; plans before blocks.
    const collectionToTable: Record<string, string> = {
      groups: "groups",
      athletes: "athletes",
      athleteGroups: "athlete_groups",
      folders: "folders",
      trainings: "trainings",
      programs: "programs",
      mesoBlocks: "meso_blocks",
      plannedWeeks: "planned_weeks",
      scheduledWorkouts: "scheduled_workouts",
      plans: "plans",
      blocks: "blocks",
      programTemplates: "program_templates",
      trainingAssignments: "training_assignments",
      events: "events",
      eventOverrides: "event_overrides",
      attendances: "attendances",
      notes: "notes",
    };

    const extra: Record<string, (d: any) => Record<string, any>> = {
      groups: (d) => ({ name: d.name ?? null }),
      athletes: (d) => ({ name: d.name ?? null }),
      folders: (d) => ({ name: d.name ?? null }),
      programs: (d) => ({ name: d.name ?? null }),
      program_templates: (d) => ({ name: d.name ?? null }),
      trainings: (d) => ({ folder_id: d.folderId ?? null }),
      meso_blocks: (d) => ({ program_id: d.programId ?? null }),
      planned_weeks: (d) => ({ meso_block_id: d.mesoBlockId ?? null }),
      scheduled_workouts: (d) => ({ program_id: d.programId ?? null }),
      plans: (d) => ({ program_id: d.programId ?? null }),
      blocks: (d) => ({ plan_id: d.planId ?? null }),
      athlete_groups: (d) => ({ athlete_id: d.athleteId, group_id: d.groupId }),
      training_assignments: (d) => ({
        athlete_id: d.athleteId ?? null,
        group_id: d.groupId ?? null,
        training_id: d.trainingId ?? null,
        start_time: d.startTime ?? null,
        end_time: d.endTime ?? null,
      }),
      events: (d) => ({
        type: d.type ?? null,
        athlete_id: d.athleteId ?? null,
        group_id: d.groupId ?? null,
        source_id: d.sourceId ?? null,
        start_time: d.startTime ?? null,
        end_time: d.endTime ?? null,
      }),
      event_overrides: (d) => ({ source_id: d.sourceId ?? null, original_start_time: d.originalStartTime ?? null }),
      attendances: (d) => ({ event_id: d.eventId, athlete_id: d.athleteId, status: d.status, is_verified: d.isVerified ?? true }),
      notes: (d) => ({
        target_type: d.targetType ?? null,
        target_id: d.targetId ?? null,
        athlete_id: d.athleteId ?? null,
        group_id: d.groupId ?? null,
      }),
    };

    const createdOf = (v: any) => {
      if (v === undefined || v === null || v === "") return new Date().toISOString();
      if (typeof v === "string") return v;
      if (v instanceof Date) return v.toISOString();
      return new Date().toISOString();
    };

    for (const [collName, tableName] of Object.entries(collectionToTable)) {
      const rows: any[] = source[collName] ?? [];
      const hasData = tableName !== "athlete_groups";
      let inserted = 0;
      for (const row of rows) {
        if (!row?.id) continue;
        const cols = hasData ? ["id", "tenant_id", "data", "created_at"] : ["id", "tenant_id", "created_at"];
        const params: any[] = hasData
          ? [row.id, tenantId, JSON.stringify(row), createdOf(row.createdAt)]
          : [row.id, tenantId, createdOf(row.createdAt)];
        if (extra[tableName]) {
          const e = extra[tableName](row);
          for (const [k, v] of Object.entries(e)) {
            cols.push(k);
            params.push(v);
          }
        }
        const placeholders = params.map((_, i) => `$${i + 1}`);
        if (hasData) {
          cols.push("updated_at");
          placeholders.push("now()");
        }
        const phFull = placeholders.join(", ");
        await pool.query(
          `INSERT INTO ${tableName} (${cols.join(", ")}) VALUES (${phFull})`,
          params
        );
        inserted++;
      }
      report.counts[tableName] = { source: rows.length, db: inserted };
    }

    // 5. verify
    let ok = true;
    for (const [t, c] of Object.entries(report.counts)) {
      const dbCount = (await pool.query(`SELECT count(*)::int AS n FROM ${t} WHERE tenant_id = $1`, [tenantId])).rows[0].n;
      c.db = dbCount;
      if (dbCount !== c.source) ok = false;
    }
    console.log("[5/5] row counts:");
    for (const [t, c] of Object.entries(report.counts)) {
      console.log(`      ${t.padEnd(22)} source=${String(c.source).padStart(4)}  db=${String(c.db).padStart(4)}  ${c.source === c.db ? "OK" : "MISMATCH"}`);
    }
    console.log(ok ? "\nMigration completed successfully." : "\nMigration completed WITH COUNT MISMATCHES — review above.");
    process.exitCode = ok ? 0 : 1;
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();