import { Router } from "express";
import { readDb, writeDb } from "../utils/fileDb";
import { logger } from "../utils/logger";
import { PlanBlock } from "@shared/types/periodization";

const router = Router();

router.get("/", (req, res) => {
  logger.info("GET /blocks");
  const db = readDb();
  const planId = req.query.planId as string | undefined;
  const blocks = db.blocks || [];
  res.json(planId ? blocks.filter((block: PlanBlock) => block.planId === planId) : blocks);
});

router.get("/:id", (req, res) => {
  const { id } = req.params;
  logger.info(`GET /blocks/${id}`);
  const db = readDb();
  const block = (db.blocks || []).find((item: PlanBlock) => item.id === id);
  if (!block) {
    return res.status(404).json({ message: "Block not found" });
  }
  res.json(block);
});

router.post("/", (req, res) => {
  const db = readDb();
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
  db.blocks = db.blocks || [];
  db.blocks.push(newBlock);
  writeDb(db);
  logger.info(`Created block ${newBlock.id}`);
  res.status(201).json(newBlock);
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  logger.info(`PUT /blocks/${id}`);
  const db = readDb();
  db.blocks = db.blocks || [];
  const index = db.blocks.findIndex((item: PlanBlock) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ message: "Block not found" });
  }
  const updatedBlock: PlanBlock = {
    ...db.blocks[index],
    ...req.body,
    id,
  };
  db.blocks[index] = updatedBlock;
  writeDb(db);
  res.json(updatedBlock);
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  logger.info(`DELETE /blocks/${id}`);
  const db = readDb();
  db.blocks = db.blocks || [];
  const index = db.blocks.findIndex((item: PlanBlock) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ message: "Block not found" });
  }
  const deleted = db.blocks.splice(index, 1)[0];
  writeDb(db);
  res.json({ message: "Block deleted", block: deleted });
});

export default router;
