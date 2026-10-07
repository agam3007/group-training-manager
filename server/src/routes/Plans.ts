import { Router } from "express";
import { readDb, writeDb } from "../utils/fileDb";
import { logger } from "../utils/logger";
import { TrainingPlan } from "@shared/types/periodization";

const router = Router();

router.get("/", (req, res) => {
  logger.info("GET /plans");
  const db = readDb();
  res.json(db.plans || []);
});

router.get("/:id", (req, res) => {
  const { id } = req.params;
  logger.info(`GET /plans/${id}`);
  const db = readDb();
  const plan = (db.plans || []).find((item: TrainingPlan) => item.id === id);
  if (!plan) {
    return res.status(404).json({ message: "Plan not found" });
  }
  res.json(plan);
});

router.post("/", (req, res) => {
  const db = readDb();
  const newPlan: TrainingPlan = {
    id: Date.now().toString(),
    programId: req.body.programId,
    name: req.body.name,
    description: req.body.description || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    blocks: req.body.blocks || [],
  };
  db.plans = db.plans || [];
  db.plans.push(newPlan);
  writeDb(db);
  logger.info(`Created plan ${newPlan.id}`);
  res.status(201).json(newPlan);
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  logger.info(`PUT /plans/${id}`);
  const db = readDb();
  db.plans = db.plans || [];
  const index = db.plans.findIndex((item: TrainingPlan) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ message: "Plan not found" });
  }
  const updatedPlan: TrainingPlan = {
    ...db.plans[index],
    ...req.body,
    id,
    updatedAt: new Date().toISOString(),
  };
  db.plans[index] = updatedPlan;
  writeDb(db);
  res.json(updatedPlan);
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  logger.info(`DELETE /plans/${id}`);
  const db = readDb();
  db.plans = db.plans || [];
  const index = db.plans.findIndex((item: TrainingPlan) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ message: "Plan not found" });
  }
  const deleted = db.plans.splice(index, 1)[0];
  writeDb(db);
  res.json({ message: "Plan deleted", plan: deleted });
});

export default router;
