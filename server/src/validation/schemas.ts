/**
 * F0.3 — Zod validation schemas.
 * Every POST/PUT body is validated against these before reaching the route.
 * `coerce: true` on numbers accepts "22" and converts to 22.
 */
import { z } from "zod";

// ---------- helpers ----------

const isoDate = z.string().refine((v) => !isNaN(new Date(v).getTime()), {
  message: "Must be a valid ISO date string",
});

const coercedNumber = z.coerce.number();

// ---------- Athlete ----------

export const athleteCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  level: z.string().optional(),
  age: coercedNumber.optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  parentPhone: z.string().optional(),
  notes: z.string().optional(),
  groups: z.array(z.string()).optional(),
  height: coercedNumber.optional(),
  weight: coercedNumber.optional(),
  restingHR: coercedNumber.optional(),
  maxHR: coercedNumber.optional(),
  experience: coercedNumber.optional(),
});

export const athleteUpdateSchema = athleteCreateSchema.partial().extend({
  goals: z.array(z.any()).optional(),
  tests: z.array(z.any()).optional(),
  zones: z.record(z.string(), z.any()).optional(),
  injuries: z.string().optional(),
  medicalNotes: z.string().optional(),
  injured: z.boolean().optional(),
  injuryType: z.string().optional(),
  limitations: z.string().optional(),
  focus: z.string().optional(),
});

// ---------- Group ----------

const scheduleSlotSchema = z.object({
  day: coercedNumber.min(0).max(6),
  start: z.object({ hour: coercedNumber.min(0).max(23), min: coercedNumber.min(0).max(59) }),
  end: z.object({ hour: coercedNumber.min(0).max(23), min: coercedNumber.min(0).max(59) }),
});

export const groupCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  coach: z.string().optional(),
  description: z.string().optional(),
  level: z.string().optional(),
  sport: z.string().optional(),
  maxAthletes: coercedNumber.optional(),
  color: z.string().optional(),
  schedule: z.array(scheduleSlotSchema).optional(),
  athletes: z.array(z.string()).optional(),
});

export const groupUpdateSchema = groupCreateSchema.partial().extend({
  goals: z.array(z.any()).optional(),
  notes: z.array(z.any()).optional(),
});

// ---------- Training ----------

export const trainingCreateSchema = z.object({
  type: z.enum(["swim", "run", "bike"]),
  title: z.string().optional(),
  description: z.string().optional(),
  equipment: z.array(z.string()).optional(),
  steps: z.array(z.any()).optional(),
  notes: z.string().optional(),
  duration: coercedNumber.optional(),
  folderId: z.string().optional(),
});

export const trainingUpdateSchema = trainingCreateSchema.partial();

// ---------- Calendar Event ----------

export const eventCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["run", "bike", "swim", "strength", "training", "task", "checkin", "call", "groupSchedule"]),
  startTime: isoDate,
  endTime: isoDate,
  athleteId: z.string().optional(),
  groupId: z.string().optional(),
  sourceId: z.string().optional(),
  done: z.boolean().optional(),
});

export const eventUpdateSchema = eventCreateSchema.partial();

// ---------- Event Override ----------

export const eventOverrideSchema = z.object({
  sourceId: z.string().min(1, "sourceId is required"),
  originalStartTime: isoDate,
  isCancelled: z.boolean().optional(),
  modifiedTitle: z.string().optional(),
  modifiedStartTime: isoDate.optional(),
  modifiedEndTime: isoDate.optional(),
  modifiedLocation: z.string().optional(),
});

// ---------- Training Assignment ----------

export const assignmentCreateSchema = z.object({
  trainingId: z.string().min(1, "trainingId is required"),
  trainingSnapshot: z.any().optional(),
  athleteId: z.string().optional(),
  groupId: z.string().optional(),
  startTime: isoDate,
  endTime: isoDate.optional(),
  notes: z.string().optional(),
});

export const assignmentUpdateSchema = assignmentCreateSchema.partial().extend({
  status: z.enum(["ATTENDED", "MISSED", "SICK", "INJURED", "PENDING", "LATE"]).optional(),
});