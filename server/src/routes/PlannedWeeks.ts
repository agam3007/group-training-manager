import { Router } from "express";
import type { PlannedWeek } from "@shared/types/periodization";
import { listDocs, getDoc, upsertDoc, deleteDoc } from "../db";
import { logger } from "../utils/logger";

const router = Router();

router.get("/", async (req, res) => {
  logger.info("GET /planned-weeks");
  const mesoBlockId = req.query.mesoBlockId as string | undefined;
  const weeks = await listDocs("planned_weeks");
  res.json(mesoBlockId ? weeks.filter((w: any) => w.mesoBlockId === mesoBlockId) : weeks);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`GET /planned-weeks/${id}`);

  const week = await getDoc("planned_weeks", id);

  if (!week) {
    return res.status(404).json({ message: "Planned week not found" });
  }
  res.json(week);
});

router.post("/", async (req, res) => {
  const newWeek: PlannedWeek = {
    id: Date.now().toString(),
    mesoBlockId: req.body.mesoBlockId,
    weekNumber: req.body.weekNumber,
    targetVolumeHours: req.body.targetVolumeHours,
    targetDistribution: req.body.targetDistribution,
    focus: req.body.focus || "General",
  };

  await upsertDoc("planned_weeks", newWeek.id, newWeek);

  logger.info(`Created planned week ${newWeek.id}`);
  res.status(201).json(newWeek);
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`PUT /planned-weeks/${id}`);

  const existing = await getDoc("planned_weeks", id);

  if (!existing) {
    return res.status(404).json({ message: "Planned week not found" });
  }

  const updated = { ...existing, ...req.body, id };
  await upsertDoc("planned_weeks", id, updated);

  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`DELETE /planned-weeks/${id}`);

  const deleted = await getDoc("planned_weeks", id);

  if (!deleted) {
    return res.status(404).json({ message: "Planned week not found" });
  }

  await deleteDoc("planned_weeks", id);

  res.json({ message: "Planned week deleted", plannedWeek: deleted });
});

export default router;