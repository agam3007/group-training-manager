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
// 📥 GET training by ID
// ==========================
router.get("/:id", (req, res) => {
  const { id } = req.params;
  logger.info(`GET /trainings/${id}`);

  const db = readDb();
  const training = db.trainings.find((t: Training) => t.id === id);

  if (!training) {
    return res.status(404).json({ message: "Training not found" });
  }

  res.json(training);
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

  const trainingSnapshot = {
    id: deleted.id,
    title: deleted.title,
    description: deleted.description,
    type: deleted.type,
    steps: deleted.steps || [],
    notes: deleted.notes || "",
    duration: deleted.duration,
    creationDate: deleted.creationDate,
  };

  // Convert linked assignments into one-time snapshots so they stay visible on calendar.
  db.trainingAssignments = (db.trainingAssignments || []).map((assignment: any) => {
    if (assignment.trainingId !== id) {
      return assignment;
    }

    return {
      ...assignment,
      trainingSnapshot,
    };
  });

  // Convert linked scheduled workouts to one-time snapshots for training plan calendar.
  db.scheduledWorkouts = (db.scheduledWorkouts || []).map((workout: any) => {
    if (workout.workoutLibraryId !== id) {
      return workout;
    }

    return {
      ...workout,
      workoutLibraryId: "",
      trainingSnapshot,
    };
  });

  db.trainings.splice(index, 1);

  writeDb(db);

  logger.info(`Deleted training ${id}`);

  res.json({ message: "Training deleted", training: deleted });
});

export default router;
