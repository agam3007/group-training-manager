import { Router } from "express";
import { readDb, writeDb } from "../utils/fileDb";
import { logger } from "../utils/logger";
import { Athlete } from "@shared/types/athlete";

const router = Router();

// GET all athletes
router.get("/", (req, res) => {
  logger.info("GET /athletes");

  const db = readDb();

  res.json(db.athletes);
});

// GET athlete by ID
router.get("/:id", (req, res) => {
  logger.info(`GET athlete ${req.params.id}`);
  const { id } = req.params;

  const db = readDb();

  const athlete = db.athletes.find((a: Athlete) => a.id === id);

  if (!athlete) {
    logger.info(`Athlete ${id} not found`);
    return res.status(404).json({
      message: "Athlete not found",
    });
  }

  res.json(athlete);
});

// CREATE athlete
router.post("/", (req, res) => {
  const db = readDb();

  const newAthlete: Athlete = {
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

  db.athletes.push(newAthlete);

  writeDb(db);

  logger.info(`Athlete created: ${newAthlete.name}`);

  res.status(201).json(newAthlete);
});

// UPDATE athlete
router.put("/:id", (req, res) => {
  const { id } = req.params;

  logger.info(`UPDATE athlete ${id}`);

  const db = readDb();

  const index = db.athletes.findIndex((a: Athlete) => a.id === id);

  if (index === -1) {
    return res.status(404).json({
      message: "Athlete not found",
    });
  }

  const updatedAthlete: Athlete = {
    ...db.athletes[index],
    ...req.body,

    goals: req.body.goals ?? db.athletes[index].goals,
    tests: req.body.tests ?? db.athletes[index].tests,
    zones: req.body.zones ?? db.athletes[index].zones,
  };

  db.athletes[index] = updatedAthlete;

  writeDb(db);

  res.json(updatedAthlete);
});

// DELETE athlete
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  logger.info(`DELETE athlete ${id}`);

  const db = readDb();

  db.athletes = db.athletes.filter((a: Athlete) => a.id !== id);

  writeDb(db);

  res.json({ message: "Athlete deleted" });
});

export default router;
