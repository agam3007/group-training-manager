import { Router } from "express";
import { readDb, writeDb } from "../utils/fileDb";
import { logger } from "../utils/logger";
import { Training } from "@shared/types/training";

const router = Router();

// ==========================
// 📥 GET all trainings
// ==========================
router.get("/", (req, res) => {
  logger.info("GET /trainings");

  const db = readDb();
  res.json(db.trainings);
});

// ==========================
// ➕ CREATE training
// ==========================
router.post("/", (req, res) => {
  const db = readDb();

  const newTraining: Training = {
    id: Date.now().toString(),
    type: req.body.type,
    title: req.body.title,
    description: req.body.description,
    equipment: req.body.equipment || [],
    steps: req.body.steps || [],
    notes: req.body.notes || "",
    creationDate: new Date()
  };

  db.trainings.push(newTraining);

  writeDb(db);

  logger.info(
    `Created training ${newTraining.id} for date ${newTraining.creationDate}`,
  );

  res.status(201).json(newTraining);
});

// ==========================
// ✏️ UPDATE training
// ==========================
router.put("/:id", (req, res) => {
  const db = readDb();
  const { id } = req.params;

  const index = db.trainings.findIndex((t: Training) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Training not found" });
  }

  const updatedTraining: Training = {
    ...db.trainings[index],
    ...req.body,
    id, // שומר שלא ישתנה
  };

  db.trainings[index] = updatedTraining;

  writeDb(db);

  logger.info(`Updated training ${id}`);

  res.json(updatedTraining);
});

// ==========================
// 🗑 DELETE training
// ==========================
router.delete("/:id", (req, res) => {
  const db = readDb();
  const { id } = req.params;

  const index = db.trainings.findIndex((t: Training) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Training not found" });
  }

  const deleted = db.trainings[index];

  db.trainings.splice(index, 1);

  writeDb(db);

  logger.info(`Deleted training ${id}`);

  res.json({ message: "Training deleted", training: deleted });
});

export default router;
