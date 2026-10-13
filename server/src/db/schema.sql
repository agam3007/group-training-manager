-- ============================================================
-- GTM Schema v1 (F0.1) — Postgres
-- Design: hybrid doc tables (ARC-2) — relational columns for
-- relations, filtering and range queries + `data` jsonb holding
-- the full entity document (field-for-field identical to the
-- legacy database.json shape, including camelCase keys).
-- Idempotent: safe to re-run. Domain tables are truncated and
-- re-populated by scripts/migrate.ts (source of truth: the JSON).
-- ============================================================

-- ---------- TENANTS (single default tenant until F0.2 auth) ----------
CREATE TABLE IF NOT EXISTS tenants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  tenant_type text NOT NULL DEFAULT 'club' CHECK (tenant_type IN ('club', 'practice')),  -- D23
  plan        text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),              -- D19
  timezone    text NOT NULL DEFAULT 'Asia/Jerusalem',                                     -- ARC-9
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------- FOLDERS ----------
CREATE TABLE IF NOT EXISTS folders (
  id         text PRIMARY KEY,
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name       text,
  data       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_folders_tenant ON folders(tenant_id);

-- ---------- TRAININGS (workout library) ----------
CREATE TABLE IF NOT EXISTS trainings (
  id         text PRIMARY KEY,
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  folder_id  text REFERENCES folders(id) ON DELETE SET NULL,
  data       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trainings_tenant ON trainings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trainings_folder ON trainings(folder_id);

-- ---------- GROUPS ----------
CREATE TABLE IF NOT EXISTS groups (
  id         text PRIMARY KEY,
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name       text,
  data       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_groups_tenant ON groups(tenant_id);

-- ---------- ATHLETES ----------
CREATE TABLE IF NOT EXISTS athletes (
  id         text PRIMARY KEY,
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name       text,
  data       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_athletes_tenant ON athletes(tenant_id);

-- ---------- ATHLETE_GROUPS (join table — the membership truth) ----------
CREATE TABLE IF NOT EXISTS athlete_groups (
  id         text PRIMARY KEY,
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  athlete_id text NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  group_id   text NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_athlete_group ON athlete_groups(athlete_id, group_id);
CREATE INDEX IF NOT EXISTS idx_athlete_groups_tenant ON athlete_groups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_athlete_groups_group ON athlete_groups(group_id);

-- ---------- PROGRAMS (periodization root) ----------
CREATE TABLE IF NOT EXISTS programs (
  id         text PRIMARY KEY,
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name       text,
  data       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_programs_tenant ON programs(tenant_id);

CREATE TABLE IF NOT EXISTS program_templates (
  id         text PRIMARY KEY,
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name       text,
  data       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_program_templates_tenant ON program_templates(tenant_id);

CREATE TABLE IF NOT EXISTS meso_blocks (
  id         text PRIMARY KEY,
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  program_id text NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  data       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_meso_blocks_tenant ON meso_blocks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meso_blocks_program ON meso_blocks(program_id);

CREATE TABLE IF NOT EXISTS planned_weeks (
  id            text PRIMARY KEY,
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  meso_block_id text NOT NULL REFERENCES meso_blocks(id) ON DELETE CASCADE,
  data          jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_planned_weeks_tenant ON planned_weeks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_planned_weeks_block ON planned_weeks(meso_block_id);

CREATE TABLE IF NOT EXISTS scheduled_workouts (
  id         text PRIMARY KEY,
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  program_id text REFERENCES programs(id) ON DELETE CASCADE,
  data       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_tenant ON scheduled_workouts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_program ON scheduled_workouts(program_id);

-- ---------- LEGACY PLANS / BLOCKS (kept for existing routes; retired in F1.8) ----------
CREATE TABLE IF NOT EXISTS plans (
  id         text PRIMARY KEY,
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  program_id text REFERENCES programs(id) ON DELETE CASCADE,
  data       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_plans_tenant ON plans(tenant_id);

CREATE TABLE IF NOT EXISTS blocks (
  id         text PRIMARY KEY,
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id    text REFERENCES plans(id) ON DELETE CASCADE,
  data       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_blocks_tenant ON blocks(tenant_id);

-- ---------- TRAINING ASSIGNMENTS ----------
-- No FK on training_id/athlete_id/group_id: rows keep working via snapshot
-- after the referenced entity is deleted (documented AS-IS behavior).
CREATE TABLE IF NOT EXISTS training_assignments (
  id         text PRIMARY KEY,
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  athlete_id text,
  group_id   text,
  training_id text,
  start_time timestamptz,
  end_time   timestamptz,
  data       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_training_assignments_tenant ON training_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_training_assignments_athlete ON training_assignments(athlete_id);
CREATE INDEX IF NOT EXISTS idx_training_assignments_group ON training_assignments(group_id);
CREATE INDEX IF NOT EXISTS idx_training_assignments_training ON training_assignments(training_id);
CREATE INDEX IF NOT EXISTS idx_training_assignments_start ON training_assignments(start_time);

-- ---------- MANUAL EVENTS ----------
-- source_id groups synthesized instances of a recurring source.
CREATE TABLE IF NOT EXISTS events (
  id         text PRIMARY KEY,
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type       text,
  athlete_id text,
  group_id   text,
  source_id  text,
  start_time timestamptz,
  end_time   timestamptz,
  data       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_tenant ON events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_group ON events(group_id);
CREATE INDEX IF NOT EXISTS idx_events_athlete ON events(athlete_id);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_source ON events(source_id);

-- ---------- EVENT OVERRIDES ----------
-- original_start_time identifies the specific occurrence of a source.
CREATE TABLE IF NOT EXISTS event_overrides (
  id                  text PRIMARY KEY,
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_id           text NOT NULL,
  original_start_time timestamptz NOT NULL,
  data                jsonb NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_event_overrides_tenant ON event_overrides(tenant_id);
CREATE INDEX IF NOT EXISTS idx_event_overrides_source ON event_overrides(source_id);

-- ---------- ATTENDANCES ----------
-- event_id may reference synthesized (virtual) occurrence ids — no FK (stable ids arrive in F1.2).
CREATE TABLE IF NOT EXISTS attendances (
  id         text PRIMARY KEY,
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_id   text NOT NULL,
  athlete_id text NOT NULL,
  status     text NOT NULL CHECK (status IN ('ATTENDED', 'MISSED')),
  is_verified boolean NOT NULL DEFAULT true,
  data       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_attendances_tenant ON attendances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendances_event ON attendances(event_id);
CREATE INDEX IF NOT EXISTS idx_attendances_athlete ON attendances(athlete_id);
CREATE INDEX IF NOT EXISTS idx_attendances_created ON attendances(created_at);

-- ---------- APP USERS (F0.2 auth) ----------
-- id = the Supabase Auth user id (uuid, "sub" claim of the JWT).
-- Roles per USR-12: a user may hold several grants; permission = union.
CREATE TABLE IF NOT EXISTS app_users (
  id                uuid PRIMARY KEY,
  tenant_id         uuid REFERENCES tenants(id) ON DELETE CASCADE, -- null = platform admin (D30)
  display_name      text,
  is_active         boolean NOT NULL DEFAULT true,
  is_platform_admin boolean NOT NULL DEFAULT false,                -- D30: operates above all tenants
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_app_users_tenant ON app_users(tenant_id);

CREATE TABLE IF NOT EXISTS user_roles (
  id         text PRIMARY KEY,
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  role       text NOT NULL,           -- owner | coach | instructor | athlete | guardian | professional | branch_manager | operations
  scope_type text,                    -- null | 'group' | 'branch' | 'athlete'
  scope_id   text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant ON user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);

-- ---------- NOTES (polymorphic) ----------
CREATE TABLE IF NOT EXISTS notes (
  id          text PRIMARY KEY,
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  target_type text,
  target_id   text,
  athlete_id  text,
  group_id    text,
  data        jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notes_tenant ON notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notes_target ON notes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_notes_athlete ON notes(athlete_id);
CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at DESC);