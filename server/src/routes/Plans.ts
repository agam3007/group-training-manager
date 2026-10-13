import { Router } from "express";
import type { TrainingPlan } from "@shared/types/periodization";
import { listDocs, getDoc, upsertDoc, deleteDoc } from "../db";
import { logger } from "../utils/logger";

const router = Router();

router.get("/", async (_req, res) => {
  logger.info("GET /plans");
  res.json(await listDocs("plans"));
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`GET /plans/${id}`);

  const plan = await getDoc("plans", id);

  if (!plan) {
    return res.status(404).json({ message: "Plan not found" });
  }
  res.json(plan);
});

router.post("/", async (req, res) => {
  const newPlan: TrainingPlan = {
    id: Date.now().toString(),
    programId: req.body.programId,
    name: req.body.name,
    description: req.body.description || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    blocks: req.body.blocks || [],
  };

  await upsertDoc("plans", newPlan.id, newPlan);

  logger.info(`Created plan ${newPlan.id}`);
  res.status(201).json(newPlan);
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`PUT /plans/${id}`);

  const existing = await getDoc("plans", id);

  if (!existing) {
    return res.status(404).json({ message: "Plan not found" });
  }

  const updated = { ...existing, ...req.body, id, updatedAt: new Date().toISOString() };
  await upsertDoc("plans", id, updated);

  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`DELETE /plans/${id}`);

  const deleted = await getDoc("plans", id);

  if (!deleted) {
    return res.status(404).json({ message: "Plan not found" });
  }

  await deleteDoc("plans", id);

  res.json({ message: "Plan deleted", plan: deleted });
});

export default router;