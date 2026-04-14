import { Router } from "express";
import { readDb, writeDb } from "../utils/fileDb";
import { logger } from "../utils/logger";
import { TrainingAssignment } from "@shared/types/training";

const router = Router();

// ==========================
// GET all (with filters)
// ==========================
router.get("/", (req, res) => {
  const db = readDb();
  logger.info(`GET /training-assignments ${JSON.stringify(req.query)}`);

  const { athleteId, groupId, trainingId } = req.query;

  let assignments = db.trainingAssignments || [];
  if (athleteId) {
    assignments = assignments.filter((a: TrainingAssignment) => a.athleteId === athleteId);
  }

  if (groupId) {
    assignments = assignments.filter((a: TrainingAssignment) => a.groupId === groupId);
  }

  if (trainingId) {
    assignments = assignments.filter((a: TrainingAssignment) => a.trainingId === trainingId);
  }
  res.json(assignments);
});

// ==========================
// GET by id
// ==========================
router.get("/:id", (req, res) => {
  const db = readDb();
  logger.info(`GET /training-assignments/${req.params.id}`);
  const { id } = req.params;

  const assignment = (db.trainingAssignments || []).find(
    (a: TrainingAssignment) => a.groupId === id,
  );
  logger.info(
    `Found assignment: ${JSON.stringify(db.trainingAssignments || [])}`,
  );
  if (!assignment) {
    return res.status(404).json({
      message: "Assignment not found",
    });
  }

  res.json(assignment);
});

// ==========================
// CREATE assignment
// ==========================
router.post("/", (req, res) => {
  const db = readDb();

  const { trainingId, athleteId, groupId, startTime, endTime, notes } =
    req.body;

  // Validation
  if (!trainingId || !startTime) {
    return res.status(400).json({
      message: "trainingId and startTime are required",
    });
  }

  if (!athleteId && !groupId) {
    return res.status(400).json({
      message: "Must assign to athlete or group",
    });
  }

  if (athleteId && groupId) {
    return res.status(400).json({
      message: "Cannot assign to both athlete and group",
    });
  }

  db.trainingAssignments = db.trainingAssignments || [];

  const newAssignment: TrainingAssignment = {
    id: Date.now().toString(),
    trainingId,
    athleteId: athleteId || null,
    groupId: groupId || null,
    startTime,
    endTime: endTime || null,
    notes: notes || "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  db.trainingAssignments.push(newAssignment);

  writeDb(db);

  logger.info(`Created assignment ${newAssignment.id}`);

  res.status(201).json(newAssignment);
});

// ==========================
// UPDATE assignment
// ==========================
router.put("/:id", (req, res) => {
  const db = readDb();

  const { id } = req.params;

  db.trainingAssignments = db.trainingAssignments || [];

  const index = db.trainingAssignments.findIndex((a: TrainingAssignment) => a.id === id);

  if (index === -1) {
    return res.status(404).json({
      message: "Assignment not found",
    });
  }

  const existing = db.trainingAssignments[index];

  const updated = {
    ...existing,
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  // Optional validation again
  if (updated.athleteId && updated.groupId) {
    return res.status(400).json({
      message: "Cannot assign to both athlete and group",
    });
  }

  db.trainingAssignments[index] = updated;

  writeDb(db);

  logger.info(`Updated assignment ${id}`);

  res.json(updated);
});

// ==========================
// DELETE assignment
// ==========================
router.delete("/:id", (req, res) => {
  const db = readDb();

  const { id } = req.params;

  db.trainingAssignments = db.trainingAssignments || [];

  const index = db.trainingAssignments.findIndex((a: TrainingAssignment) => a.id === id);

  if (index === -1) {
    return res.status(404).json({
      message: "Assignment not found",
    });
  }

  const removed = db.trainingAssignments.splice(index, 1)[0];

  writeDb(db);

  logger.info(`Deleted assignment ${id}`);

  res.json({
    message: "Deleted",
    assignment: removed,
  });
});

export default router;
