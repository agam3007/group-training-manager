import { Router } from "express";
import type { TrainingAssignment } from "@shared/types/training";
import { listDocs, getDoc, upsertDoc, deleteDoc } from "../db";
import { logger } from "../utils/logger";

const router = Router();

// GET all (with filters)
router.get("/", async (req, res) => {
  logger.info(`GET /training-assignments ${JSON.stringify(req.query)}`);

  const { athleteId, groupId, trainingId } = req.query;

  let assignments = await listDocs("training_assignments");
  if (athleteId) {
    assignments = assignments.filter((a: any) => a.athleteId === athleteId);
  }
  if (groupId) {
    assignments = assignments.filter((a: any) => a.groupId === groupId);
  }
  if (trainingId) {
    assignments = assignments.filter((a: any) => a.trainingId === trainingId);
  }
  res.json(assignments);
});

// GET by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`GET /training-assignments/${id}`);

  const assignment = await getDoc("training_assignments", id);

  if (!assignment) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  res.json(assignment);
});

// CREATE assignment
router.post("/", async (req, res) => {
  const { trainingId, trainingSnapshot, athleteId, groupId, startTime, endTime, notes } = req.body;

  // Validation
  if (!trainingId || !startTime) {
    return res.status(400).json({ message: "trainingId and startTime are required" });
  }

  if (!athleteId && !groupId) {
    return res.status(400).json({ message: "Must assign to athlete or group" });
  }

  if (athleteId && groupId) {
    return res.status(400).json({ message: "Cannot assign to both athlete and group" });
  }

  const newAssignment: TrainingAssignment = {
    id: Date.now().toString(),
    trainingId,
    trainingSnapshot,
    athleteId: athleteId || null,
    groupId: groupId || null,
    startTime,
    endTime: endTime || null,
    notes: notes || "",
    createdAt: new Date(),
    updatedAt: new Date(),
    status: "PENDING",
  };

  await upsertDoc("training_assignments", newAssignment.id, newAssignment);

  logger.info(`Created assignment ${newAssignment.id}`);

  res.status(201).json(newAssignment);
});

// UPDATE assignment
router.put("/:id", async (req, res) => {
  const { id } = req.params;

  const existing = await getDoc("training_assignments", id);

  if (!existing) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  const updated = {
    ...existing,
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  // Optional validation again
  if (updated.athleteId && updated.groupId) {
    return res.status(400).json({ message: "Cannot assign to both athlete and group" });
  }

  await upsertDoc("training_assignments", id, updated);

  logger.info(`Updated assignment ${id}`);

  res.json(updated);
});

// DELETE assignment
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const removed = await getDoc("training_assignments", id);

  if (!removed) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  await deleteDoc("training_assignments", id);

  logger.info(`Deleted assignment ${id}`);

  res.json({ message: "Deleted", assignment: removed });
});

export default router;