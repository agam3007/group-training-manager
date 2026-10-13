import { Router } from "express";
import { listDocs, getDoc, upsertDoc, deleteDoc, withTransaction } from "../db";
import { logger } from "../utils/logger";

const router = Router();

// GET all trainings
router.get("/", async (_req, res) => {
  logger.info("GET /trainings");
  res.json(await listDocs("trainings"));
});

// GET training by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`GET /trainings/${id}`);

  const training = await getDoc("trainings", id);

  if (!training) {
    return res.status(404).json({ message: "Training not found" });
  }

  res.json(training);
});

// CREATE training
router.post("/", async (req, res) => {
  const newTraining = {
    id: Date.now().toString(),
    type: req.body.type,
    title: req.body.title,
    description: req.body.description,
    equipment: req.body.equipment || [],
    steps: req.body.steps || [],
    notes: req.body.notes || "",
    creationDate: new Date(),
  };

  await upsertDoc("trainings", newTraining.id, newTraining);

  logger.info(`Created training ${newTraining.id} for date ${newTraining.creationDate}`);

  res.status(201).json(newTraining);
});

// UPDATE training
router.put("/:id", async (req, res) => {
  const { id } = req.params;

  const existing = await getDoc("trainings", id);

  if (!existing) {
    return res.status(404).json({ message: "Training not found" });
  }

  const updatedTraining = { ...existing, ...req.body, id };

  await upsertDoc("trainings", id, updatedTraining);

  logger.info(`Updated training ${id}`);

  res.json(updatedTraining);
});

// DELETE training — linked assignments/scheduled workouts become one-time snapshots (transaction)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const deleted = await getDoc("trainings", id);

  if (!deleted) {
    return res.status(404).json({ message: "Training not found" });
  }

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

  await withTransaction(async (client) => {
    // Convert linked assignments into one-time snapshots so they stay visible on calendar.
    await client.query(
      `UPDATE training_assignments SET data = data || $2::jsonb, updated_at = now() WHERE training_id = $1`,
      [id, JSON.stringify({ trainingSnapshot })]
    );
    // Convert linked scheduled workouts to one-time snapshots for training plan calendar.
    await client.query(
      `UPDATE scheduled_workouts SET data = data || $2::jsonb, updated_at = now() WHERE data->>'workoutLibraryId' = $1`,
      [id, JSON.stringify({ workoutLibraryId: "", trainingSnapshot })]
    );
    await client.query(`DELETE FROM trainings WHERE id = $1`, [id]);
  });

  logger.info(`Deleted training ${id}`);

  res.json({ message: "Training deleted", training: deleted });
});

export default router;