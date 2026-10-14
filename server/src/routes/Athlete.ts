import { Router } from "express";
import { listDocs, getDoc, upsertDoc, deleteDoc } from "../db";
import { validate } from "../validation/middleware";
import { athleteCreateSchema, athleteUpdateSchema } from "../validation/schemas";
import { logger } from "../utils/logger";

const router = Router();

// GET all athletes
router.get("/", async (_req, res) => {
  logger.info("GET /athletes");
  res.json(await listDocs("athletes"));
});

// GET athlete by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params as { id: string };
  logger.info(`GET athlete ${id}`);

  const athlete = await getDoc("athletes", id);

  if (!athlete) {
    logger.info(`Athlete ${id} not found`);
    return res.status(404).json({
      message: "Athlete not found",
      error: { code: "NOT_FOUND" },
    });
  }

  res.json(athlete);
});

// GET athletes by group
router.get("/group/:groupId", async (req, res) => {
  const { groupId } = req.params;
  logger.info(`GET athletes for group ${groupId}`);

  const athletes = await listDocs("athletes");
  res.json(athletes.filter((a: any) => Array.isArray(a.groups) && a.groups.includes(groupId)));
});

// CREATE athlete — F0.3: validation + accepts ALL documented fields (fix 4.17)
router.post("/", validate(athleteCreateSchema), async (req, res) => {
  const b = req.body;

  const newAthlete = {
    id: Date.now().toString(),
    name: b.name,
    level: b.level,
    age: b.age,
    phone: b.phone,
    email: b.email,
    parentPhone: b.parentPhone,
    notes: b.notes,
    groups: b.groups || [],
    height: b.height,
    weight: b.weight,
    restingHR: b.restingHR,
    maxHR: b.maxHR,
    experience: b.experience,
    tests: [],
    goals: [],
    zones: {},
  };

  await upsertDoc("athletes", newAthlete.id, newAthlete);

  logger.info(`Athlete created: ${newAthlete.name}`);

  res.status(201).json(newAthlete);
});

// UPDATE athlete
router.put("/:id", validate(athleteUpdateSchema), async (req, res) => {
  const { id } = req.params as { id: string };
  logger.info(`UPDATE athlete ${id}`);

  const existing = await getDoc("athletes", id);

  if (!existing) {
    return res.status(404).json({
      message: "Athlete not found",
      error: { code: "NOT_FOUND" },
    });
  }

  const updatedAthlete = {
    ...existing,
    ...req.body,
    goals: req.body.goals ?? existing.goals,
    tests: req.body.tests ?? existing.tests,
    zones: req.body.zones ?? existing.zones,
  };

  await upsertDoc("athletes", id, updatedAthlete);

  res.json(updatedAthlete);
});

// DELETE athlete — F0.3: 404 when not found (fix 4.15)
router.delete("/:id", async (req, res) => {
  const { id } = req.params as { id: string };
  logger.info(`DELETE athlete ${id}`);

  const existing = await getDoc("athletes", id);

  if (!existing) {
    return res.status(404).json({
      message: "Athlete not found",
      error: { code: "NOT_FOUND" },
    });
  }

  await deleteDoc("athletes", id);

  res.json({ message: "Athlete deleted", athlete: existing });
});

export default router;