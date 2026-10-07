import express from "express";
import type { ScheduledWorkout } from "@shared/types/periodization";
import { readDb, writeDb } from "../utils/fileDb";
import { logger } from "../utils/logger";

const router = express.Router();

router.get("/", (req, res) => {
  logger.info("GET /scheduled-workouts");
  const db = readDb();
  const programId = req.query.programId as string | undefined;
  const plannedWeekId = req.query.plannedWeekId as string | undefined;
  let workouts = db.scheduledWorkouts || [];
  if (programId) {
    workouts = workouts.filter((workout: ScheduledWorkout) => workout.programId === programId);
  }
  if (plannedWeekId) {
    workouts = workouts.filter((workout: ScheduledWorkout) => workout.plannedWeekId === plannedWeekId);
  }
  res.json(workouts);
});

router.get("/:id", (req, res) => {
  const { id } = req.params;
  logger.info(`GET /scheduled-workouts/${id}`);
  const db = readDb();
  const workout = (db.scheduledWorkouts || []).find((item: ScheduledWorkout) => item.id === id);
  if (!workout) {
    return res.status(404).json({ message: "Scheduled workout not found" });
  }
  res.json(workout);
});

router.post("/", (req, res) => {
  const db = readDb();
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
  db.scheduledWorkouts = db.scheduledWorkouts || [];
  db.scheduledWorkouts.push(newWorkout);
  writeDb(db);
  logger.info(`Created scheduled workout ${newWorkout.id}`);
  res.status(201).json(newWorkout);
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  logger.info(`PUT /scheduled-workouts/${id}`);
  const db = readDb();
  db.scheduledWorkouts = db.scheduledWorkouts || [];
  const index = db.scheduledWorkouts.findIndex((item: ScheduledWorkout) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ message: "Scheduled workout not found" });
  }
  db.scheduledWorkouts[index] = { ...db.scheduledWorkouts[index], ...req.body, id };
  writeDb(db);
  res.json(db.scheduledWorkouts[index]);
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  logger.info(`DELETE /scheduled-workouts/${id}`);
  const db = readDb();
  db.scheduledWorkouts = db.scheduledWorkouts || [];
  const index = db.scheduledWorkouts.findIndex((item: ScheduledWorkout) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ message: "Scheduled workout not found" });
  }
  const deleted = db.scheduledWorkouts.splice(index, 1)[0];
  writeDb(db);
  res.json({ message: "Scheduled workout deleted", scheduledWorkout: deleted });
});

export default router;
