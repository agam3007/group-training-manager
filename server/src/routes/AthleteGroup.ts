import { Router } from "express";
import { readDb, writeDb } from "../utils/fileDb";
import { logger } from "../utils/logger";
import { Athlete } from "@shared/types/athlete";

const router = Router();

// ==========================
// GET relations (filter)
// ==========================
router.get("/", (req, res) => {
  const db = readDb();

  logger.info(`GET /athlete-groups with query ${JSON.stringify(req.query)}`);

  const { athleteId, groupId } = req.query;

  let relations = db.athleteGroups || [];

  if (athleteId) {
    relations = relations.filter((r: any) => r.athleteId === athleteId);
  }

  if (groupId) {
    relations = relations.filter((r: any) => r.groupId === groupId);
  }

  res.json(relations);
});

// ==========================
// GET athletes by group (JOIN)
// ==========================
router.get("/group/:groupId", (req, res) => {
  const db = readDb();

  const { groupId } = req.params;

  logger.info(`GET athletes for group ${groupId}`);

  const relations = db.athleteGroups || [];

  const athleteIds = relations
    .filter((r: any) => r.groupId === groupId)
    .map((r: any) => r.athleteId);

  const athletes = db.athletes.filter((a: Athlete) =>
    athleteIds.includes(a.id),
  );

  res.json(athletes);
});

// ==========================
// CREATE relation
// ==========================
router.post("/", (req, res) => {
  const db = readDb();

  const { athleteId, groupId } = req.body;

  if (!athleteId || !groupId) {
    return res.status(400).json({
      message: "athleteId and groupId are required",
    });
  }

  db.athleteGroups = db.athleteGroups || [];

  // ❗ prevent duplicates
  const exists = db.athleteGroups.find(
    (r: any) => r.athleteId === athleteId && r.groupId === groupId,
  );

  if (exists) {
    return res.status(409).json({
      message: "Relation already exists",
    });
  }

  const newRelation = {
    id: Date.now().toString(),
    athleteId,
    groupId,
  };

  db.athleteGroups.push(newRelation);

  writeDb(db);

  logger.info(`Athlete ${athleteId} added to group ${groupId}`);

  res.status(201).json(newRelation);
});

// ==========================
// DELETE relation
// ==========================
router.delete("/:id", (req, res) => {
  const db = readDb();

  const { id } = req.params;

  db.athleteGroups = db.athleteGroups || [];

  const index = db.athleteGroups.findIndex((r: any) => r.id === id);

  if (index === -1) {
    return res.status(404).json({
      message: "Relation not found",
    });
  }

  const removed = db.athleteGroups.splice(index, 1)[0];

  writeDb(db);

  logger.info(`Relation deleted: ${removed.id}`);

  res.json({
    message: "Deleted",
    relation: removed,
  });
});

export default router;
