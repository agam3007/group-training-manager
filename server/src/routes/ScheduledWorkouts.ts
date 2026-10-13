import { Router } from "express";
import type { ScheduledWorkout } from "@shared/types/periodization";
import { listDocs, getDoc, upsertDoc, deleteDoc } from "../db";
import { logger } from "../utils/logger";

const router = Router();

router.get("/", async (req, res) => {
  logger.info("GET /scheduled-workouts");
  const programId = req.query.programId as string | undefined;
  const plannedWeekId = req.query.plannedWeekId as string | undefined;
  let workouts = await listDocs("scheduled_workouts");
  if (programId) {
    workouts = workouts.filter((w: any) => w.programId === programId);
  }
  if (plannedWeekId) {
    workouts = workouts.filter((w: any) => w.plannedWeekId === plannedWeekId);
  }
  res.json(workouts);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`GET /scheduled-workouts/${id}`);

  const workout = await getDoc("scheduled_workouts", id);

  if (!workout) {
    return res.status(404).json({ message: "Scheduled workout not found" });
  }
  res.json(workout);
});

router.post("/", async (req, res) => {
  const newWorkout: ScheduledWorkout = {
    id: Date.now().toString(),
    programId: req.body.programId,
    plannedWeekId: req.body.plannedWeekId,
    workoutLibraryId: req.body.workoutLibraryId,
    trainingSnapshot: req.body.trainingSnapshot,
    weekNumber: req.body.weekNumber,
    dayOfWeek: req.body.dayOfWeek,
    date: req.body.date,
    status: req.body.status || "Planned",
    actualDuration: req.body.actualDuration,
    athleteNotes: req.body.athleteNotes,
  };

  await upsertDoc("scheduled_workouts", newWorkout.id, newWorkout);

  logger.info(`Created scheduled workout ${newWorkout.id}`);
  res.status(201).json(newWorkout);
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`PUT /scheduled-workouts/${id}`);

  const existing = await getDoc("scheduled_workouts", id);

  if (!existing) {
    return res.status(404).json({ message: "Scheduled workout not found" });
  }

  const updated = { ...existing, ...req.body, id };
  await upsertDoc("scheduled_workouts", id, updated);

  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`DELETE /scheduled-workouts/${id}`);

  const deleted = await getDoc("scheduled_workouts", id);

  if (!deleted) {
    return res.status(404).json({ message: "Scheduled workout not found" });
  }

  await deleteDoc("scheduled_workouts", id);

  res.json({ message: "Scheduled workout deleted", scheduledWorkout: deleted });
});

export default router;