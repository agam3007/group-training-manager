import express from "express";
import type { PlannedWeek } from "@shared/types/periodization";
import { readDb, writeDb } from "../utils/fileDb";
import { logger } from "../utils/logger";

const router = express.Router();

router.get("/", (req, res) => {
  logger.info("GET /planned-weeks");
  const db = readDb();
  const mesoBlockId = req.query.mesoBlockId as string | undefined;
  const weeks = db.plannedWeeks || [];
  res.json(mesoBlockId ? weeks.filter((week: PlannedWeek) => week.mesoBlockId === mesoBlockId) : weeks);
});

router.get("/:id", (req, res) => {
  const { id } = req.params;
  logger.info(`GET /planned-weeks/${id}`);
  const db = readDb();
  const week = (db.plannedWeeks || []).find((item: PlannedWeek) => item.id === id);
  if (!week) {
    return res.status(404).json({ message: "Planned week not found" });
  }
  res.json(week);
});

router.post("/", (req, res) => {
  const db = readDb();
  const newWeek: PlannedWeek = {
    id: Date.now().toString(),
    mesoBlockId: req.body.mesoBlockId,
    weekNumber: req.body.weekNumber,
    targetVolumeHours: req.body.targetVolumeHours,
    targetDistribution: req.body.targetDistribution,
    focus: req.body.focus || "General",
  };
  db.plannedWeeks = db.plannedWeeks || [];
  db.plannedWeeks.push(newWeek);
  writeDb(db);
  logger.info(`Created planned week ${newWeek.id}`);
  res.status(201).json(newWeek);
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  logger.info(`PUT /planned-weeks/${id}`);
  const db = readDb();
  db.plannedWeeks = db.plannedWeeks || [];
  const index = db.plannedWeeks.findIndex((item: PlannedWeek) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ message: "Planned week not found" });
  }
  db.plannedWeeks[index] = { ...db.plannedWeeks[index], ...req.body, id };
  writeDb(db);
  res.json(db.plannedWeeks[index]);
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  logger.info(`DELETE /planned-weeks/${id}`);
  const db = readDb();
  db.plannedWeeks = db.plannedWeeks || [];
  const index = db.plannedWeeks.findIndex((item: PlannedWeek) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ message: "Planned week not found" });
  }
  const deleted = db.plannedWeeks.splice(index, 1)[0];
  writeDb(db);
  res.json({ message: "Planned week deleted", plannedWeek: deleted });
});

export default router;
