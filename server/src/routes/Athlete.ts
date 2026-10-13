import { Router } from "express";
import { listDocs, getDoc, upsertDoc, deleteDoc } from "../db";
import { logger } from "../utils/logger";

const router = Router();

// GET all athletes
router.get("/", async (_req, res) => {
  logger.info("GET /athletes");
  res.json(await listDocs("athletes"));
});

// GET athlete by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`GET athlete ${id}`);

  const athlete = await getDoc("athletes", id);

  if (!athlete) {
    logger.info(`Athlete ${id} not found`);
    return res.status(404).json({ message: "Athlete not found" });
  }

  res.json(athlete);
});

// GET athletes by group (legacy filter on athlete.groups — the join table is the truth for membership)
router.get("/group/:groupId", async (req, res) => {
  const { groupId } = req.params;

  logger.info(`GET athletes for group ${groupId}`);

  const athletes = await listDocs("athletes");
  res.json(athletes.filter((a: any) => Array.isArray(a.groups) && a.groups.includes(groupId)));
});

// CREATE athlete
router.post("/", async (req, res) => {
  const newAthlete = {
    id: Date.now().toString(),
    name: req.body.name,
    level: req.body.level,
    age: req.body.age,
    phone: req.body.phone,
    parentPhone: req.body.parentPhone,
    notes: req.body.notes,
    tests: [],
    goals: [],
    zones: {},
  };

  await upsertDoc("athletes", newAthlete.id, newAthlete);

  logger.info(`Athlete created: ${newAthlete.name}`);

  res.status(201).json(newAthlete);
});

// UPDATE athlete
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`UPDATE athlete ${id}`);

  const existing = await getDoc("athletes", id);

  if (!existing) {
    return res.status(404).json({ message: "Athlete not found" });
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

// DELETE athlete
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`DELETE athlete ${id}`);

  await deleteDoc("athletes", id);

  res.json({ message: "Athlete deleted" });
});

export default router;