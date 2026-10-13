import { Router } from "express";
import type { PlanBlock } from "@shared/types/periodization";
import { listDocs, getDoc, upsertDoc, deleteDoc } from "../db";
import { logger } from "../utils/logger";

const router = Router();

router.get("/", async (req, res) => {
  logger.info("GET /blocks");
  const planId = req.query.planId as string | undefined;
  const blocks = await listDocs("blocks");
  res.json(planId ? blocks.filter((b: any) => b.planId === planId) : blocks);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`GET /blocks/${id}`);

  const block = await getDoc("blocks", id);

  if (!block) {
    return res.status(404).json({ message: "Block not found" });
  }
  res.json(block);
});

router.post("/", async (req, res) => {
  const newBlock: PlanBlock = {
    id: Date.now().toString(),
    planId: req.body.planId,
    name: req.body.name,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    loadingPattern: req.body.loadingPattern,
    startVolume: req.body.startVolume,
    weeklyVolumes: req.body.weeklyVolumes || [],
    intensityDistribution: req.body.intensityDistribution,
    weeklyStats: req.body.weeklyStats || [],
  };

  await upsertDoc("blocks", newBlock.id, newBlock);

  logger.info(`Created block ${newBlock.id}`);
  res.status(201).json(newBlock);
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`PUT /blocks/${id}`);

  const existing = await getDoc("blocks", id);

  if (!existing) {
    return res.status(404).json({ message: "Block not found" });
  }

  const updated = { ...existing, ...req.body, id };
  await upsertDoc("blocks", id, updated);

  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`DELETE /blocks/${id}`);

  const deleted = await getDoc("blocks", id);

  if (!deleted) {
    return res.status(404).json({ message: "Block not found" });
  }

  await deleteDoc("blocks", id);

  res.json({ message: "Block deleted", block: deleted });
});

export default router;