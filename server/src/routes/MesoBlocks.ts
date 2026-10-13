import { Router } from "express";
import type { ProgramMesoBlock } from "@shared/types/periodization";
import { getTenantId, query, listDocs, getDoc, upsertDoc, deleteDoc } from "../db";
import { logger } from "../utils/logger";

const router = Router();

router.get("/", async (req, res) => {
  logger.info("GET /meso-blocks");
  const tenantId = await getTenantId();
  const programId = req.query.programId as string | undefined;
  const blocks = await listDocs("meso_blocks");
  res.json(programId ? blocks.filter((b: any) => b.programId === programId) : blocks);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`GET /meso-blocks/${id}`);

  const block = await getDoc("meso_blocks", id);

  if (!block) {
    return res.status(404).json({ message: "Meso block not found" });
  }
  res.json(block);
});

router.post("/", async (req, res) => {
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

  await upsertDoc("meso_blocks", newBlock.id, newBlock);

  logger.info(`Created meso block ${newBlock.id}`);
  res.status(201).json(newBlock);
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`PUT /meso-blocks/${id}`);

  const existing = await getDoc("meso_blocks", id);

  if (!existing) {
    return res.status(404).json({ message: "Meso block not found" });
  }

  const updated = { ...existing, ...req.body, id };
  await upsertDoc("meso_blocks", id, updated);

  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`DELETE /meso-blocks/${id}`);

  const deleted = await getDoc("meso_blocks", id);

  if (!deleted) {
    return res.status(404).json({ message: "Meso block not found" });
  }

  await deleteDoc("meso_blocks", id);

  res.json({ message: "Meso block deleted", block: deleted });
});

export default router;