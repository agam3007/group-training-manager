import { Router } from "express";
import { listDocs, getDoc, upsertDoc, deleteDoc } from "../db";
import { logger } from "../utils/logger";

const router = Router();

// GET group by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const group = await getDoc("groups", id);

  if (!group) {
    logger.error(`Group not found: ${id}`);
    return res.status(404).json({ message: "Group not found" });
  }

  logger.info(`GET /groups/${id}`);
  res.json(group);
});

// GET all groups
router.get("/", async (_req, res) => {
  logger.info("GET /groups");
  res.json(await listDocs("groups"));
});

// CREATE group
router.post("/", async (req, res) => {
  const newGroup = {
    id: Date.now().toString(),
    name: req.body.name,
    coach: req.body.coach,
    level: req.body.level,
    sport: req.body.sport,
    schedule: req.body.schedule || [],
  };

  await upsertDoc("groups", newGroup.id, newGroup);

  logger.info(`Group created: ${newGroup.name}`);

  res.status(201).json(newGroup);
});

// UPDATE group
router.put("/:id", async (req, res) => {
  const { id } = req.params;

  const existing = await getDoc("groups", id);

  if (!existing) {
    logger.error(`Group not found: ${id}`);
    return res.status(404).json({ message: "Group not found" });
  }

  const updatedGroup = { ...existing, ...req.body, id };

  await upsertDoc("groups", id, updatedGroup);

  logger.info(`Group updated: ${updatedGroup.name}`);

  res.json(updatedGroup);
});

// DELETE group (memberships cascade via FK)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const existing = await getDoc("groups", id);

  if (!existing) {
    logger.error(`Group not found for delete: ${id}`);
    return res.status(404).json({ message: "Group not found" });
  }

  await deleteDoc("groups", id);

  logger.info(`Group deleted: ${existing.name}`);

  res.json({ message: "Group deleted", group: existing });
});

export default router;