import { Router } from "express";
import type { ProgramTemplate } from "@shared/types/periodization";
import { listDocs, getDoc, upsertDoc, deleteDoc } from "../db";
import { logger } from "../utils/logger";

const router = Router();

router.get("/", async (_req, res) => {
  logger.info("GET /program-templates");
  res.json(await listDocs("program_templates"));
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`GET /program-templates/${id}`);

  const item = await getDoc("program_templates", id);

  if (!item) {
    return res.status(404).json({ message: "Program template not found" });
  }
  res.json(item);
});

router.post("/", async (req, res) => {
  const newTemplate: ProgramTemplate = {
    id: Date.now().toString(),
    name: req.body.name,
    sport: req.body.sport,
    durationType: req.body.durationType,
    startDate: req.body.startDate,
    weeksLength: req.body.weeksLength,
    assigneeType: req.body.assigneeType,
    assigneeName: req.body.assigneeName,
    mainGoal: req.body.mainGoal,
    level: req.body.level,
    createdAt: new Date().toISOString(),
    macroEvents: req.body.macroEvents || [],
  };

  await upsertDoc("program_templates", newTemplate.id, newTemplate);

  logger.info(`Created program template ${newTemplate.id}`);
  res.status(201).json(newTemplate);
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`PUT /program-templates/${id}`);

  const existing = await getDoc("program_templates", id);

  if (!existing) {
    return res.status(404).json({ message: "Program template not found" });
  }

  const updated = { ...existing, ...req.body, id };
  await upsertDoc("program_templates", id, updated);

  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`DELETE /program-templates/${id}`);

  const deleted = await getDoc("program_templates", id);

  if (!deleted) {
    return res.status(404).json({ message: "Program template not found" });
  }

  await deleteDoc("program_templates", id);

  res.json({ message: "Program template deleted", programTemplate: deleted });
});

export default router;