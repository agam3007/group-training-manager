import express from "express";
import type { ProgramMesoBlock } from "@shared/types/periodization";
import { readDb, writeDb } from "../utils/fileDb";
import { logger } from "../utils/logger";

const router = express.Router();

router.get("/", (req, res) => {
  logger.info("GET /meso-blocks");
  const db = readDb();
  const programId = req.query.programId as string | undefined;
  const blocks = db.mesoBlocks || [];
  res.json(programId ? blocks.filter((block: ProgramMesoBlock) => block.programId === programId) : blocks);
});

router.get("/:id", (req, res) => {
  const { id } = req.params;
  logger.info(`GET /meso-blocks/${id}`);
  const db = readDb();
  const block = (db.mesoBlocks || []).find((item: ProgramMesoBlock) => item.id === id);
  if (!block) {
    return res.status(404).json({ message: "Meso block not found" });
  }
  res.json(block);
});

router.post("/", (req, res) => {
  const db = readDb();
  const newBlock: ProgramMesoBlock = {
    id: Date.now().toString(),
    programId: req.body.programId,
    name: req.body.name,
    order: req.body.order,
    startWeekNumber: req.body.startWeekNumber,
    durationWeeks: req.body.durationWeeks,
    loadingPattern: req.body.loadingPattern,
    intensityDistribution: req.body.intensityDistribution,
  };
  db.mesoBlocks = db.mesoBlocks || [];
  db.mesoBlocks.push(newBlock);
  writeDb(db);
  logger.info(`Created meso block ${newBlock.id}`);
  res.status(201).json(newBlock);
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  logger.info(`PUT /meso-blocks/${id}`);
  const db = readDb();
  db.mesoBlocks = db.mesoBlocks || [];
  const index = db.mesoBlocks.findIndex((item: ProgramMesoBlock) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ message: "Meso block not found" });
  }
  db.mesoBlocks[index] = { ...db.mesoBlocks[index], ...req.body, id };
  writeDb(db);
  res.json(db.mesoBlocks[index]);
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  logger.info(`DELETE /meso-blocks/${id}`);
  const db = readDb();
  db.mesoBlocks = db.mesoBlocks || [];
  const index = db.mesoBlocks.findIndex((item: ProgramMesoBlock) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ message: "Meso block not found" });
  }
  const deleted = db.mesoBlocks.splice(index, 1)[0];
  writeDb(db);
  res.json({ message: "Meso block deleted", block: deleted });
});

export default router;
