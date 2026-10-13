/**
 * F0.1 backup: dumps all tables to a timestamped local JSON file.
 *
 * Usage: npm run backup
 * Output: server/backups/backup-<timestamp>.json  (gitignored — data is private)
 * Schedule daily (Windows): see docs/DEV.md — register a Task Scheduler entry
 * running `npm run backup` in the server directory.
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { Pool } from "pg";

const BACKUP_DIR = path.join(__dirname, "../backups");

const TABLE_TO_COLLECTION: Record<string, string> = {
  groups: "groups",
  athletes: "athletes",
  athlete_groups: "athleteGroups",
  trainings: "trainings",
  folders: "folders",
  programs: "programs",
  program_templates: "programTemplates",
  meso_blocks: "mesoBlocks",
  planned_weeks: "plannedWeeks",
  scheduled_workouts: "scheduledWorkouts",
  plans: "plans",
  blocks: "blocks",
  training_assignments: "trainingAssignments",
  events: "events",
  event_overrides: "eventOverrides",
  attendances: "attendances",
  notes: "notes",
};

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const tenantRows = await pool.query(`SELECT * FROM tenants ORDER BY created_at`);
    const backup: Record<string, any> = { _meta: { exportedAt: new Date().toISOString(), tenants: tenantRows.rows } };
    let total = 0;

    for (const [table, collection] of Object.entries(TABLE_TO_COLLECTION)) {
      const isJoin = table === "athlete_groups";
      const rows = isJoin
        ? await pool.query(`SELECT id, athlete_id, group_id, created_at FROM ${table} ORDER BY created_at`)
        : await pool.query(`SELECT id, data, created_at, updated_at FROM ${table} ORDER BY created_at`);
      backup[collection] = rows.rows.map((r: any) =>
        isJoin
          ? { id: r.id, athleteId: r.athlete_id, groupId: r.group_id, createdAt: r.created_at }
          : { ...r.data, id: r.id, createdAt: r.created_at, updatedAt: r.updated_at }
      );
      total += rows.rows.length;
    }

    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const file = path.join(BACKUP_DIR, `backup-${stamp}.json`);
    fs.writeFileSync(file, JSON.stringify(backup, null, 2));
    console.log(`Backup OK: ${total} rows -> ${file}`);
  } catch (err) {
    console.error("Backup failed:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();