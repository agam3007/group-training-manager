import express from "express";
import type { ProgramTemplate } from "@shared/types/periodization";
import { readDb, writeDb } from "../utils/fileDb";
import { logger } from "../utils/logger";

const router = express.Router();

router.get("/", (req, res) => {
  logger.info("GET /program-templates");
  const db = readDb();
  res.json(db.programTemplates || []);
});

router.get("/:id", (req, res) => {
  const { id } = req.params;
  logger.info(`GET /program-templates/${id}`);
  const db = readDb();
  const item = (db.programTemplates || []).find((p: ProgramTemplate) => p.id === id);
  if (!item) {
    return res.status(404).json({ message: "Program template not found" });
  }
  res.json(item);
});

router.post("/", (req, res) => {
  const db = readDb();
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
  db.programTemplates = db.programTemplates || [];
  db.programTemplates.push(newTemplate);
  writeDb(db);
  logger.info(`Created program template ${newTemplate.id}`);
  res.status(201).json(newTemplate);
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  logger.info(`PUT /program-templates/${id}`);
  const db = readDb();
  db.programTemplates = db.programTemplates || [];
  const index = db.programTemplates.findIndex((item: ProgramTemplate) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ message: "Program template not found" });
  }
  db.programTemplates[index] = { ...db.programTemplates[index], ...req.body, id };
  writeDb(db);
  res.json(db.programTemplates[index]);
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  logger.info(`DELETE /program-templates/${id}`);
  const db = readDb();
  db.programTemplates = db.programTemplates || [];
  const index = db.programTemplates.findIndex((item: ProgramTemplate) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ message: "Program template not found" });
  }
  const deleted = db.programTemplates.splice(index, 1)[0];
  writeDb(db);
  res.json({ message: "Program template deleted", programTemplate: deleted });
});

export default router;
