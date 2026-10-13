import { Router } from "express";
import { getTenantId, query, upsertDoc, deleteDoc, getDoc } from "../db";
import { logger } from "../utils/logger";

const router = Router();

// GET relations (filter by athleteId / groupId)
router.get("/", async (req, res) => {
  const tenantId = await getTenantId();
  const { athleteId, groupId } = req.query;

  logger.info(`GET /athlete-groups with query ${JSON.stringify(req.query)}`);

  let rows = await query(
    `SELECT id, athlete_id, group_id FROM athlete_groups WHERE tenant_id = $1`,
    [tenantId]
  );
  const relations = rows.map((r: any) => ({ id: r.id, athleteId: r.athlete_id, groupId: r.group_id }));

  if (athleteId) {
    res.json(relations.filter((r: any) => r.athleteId === athleteId));
    return;
  }
  if (groupId) {
    res.json(relations.filter((r: any) => r.groupId === groupId));
    return;
  }
  res.json(relations);
});

// GET athletes by group (JOIN)
router.get("/group/:groupId", async (req, res) => {
  const tenantId = await getTenantId();
  const { groupId } = req.params;

  logger.info(`GET athletes for group ${groupId}`);

  const rows = await query(
    `SELECT a.id, a.data FROM athletes a
     JOIN athlete_groups ag ON ag.athlete_id = a.id
     WHERE ag.tenant_id = $1 AND ag.group_id = $2`,
    [tenantId, groupId]
  );

  res.json(rows.map((r: any) => ({ ...r.data, id: r.id })));
});

// CREATE relation
router.post("/", async (req, res) => {
  const { athleteId, groupId } = req.body;

  if (!athleteId || !groupId) {
    return res.status(400).json({ message: "athleteId and groupId are required" });
  }

  const exists = await query(
    `SELECT id FROM athlete_groups WHERE tenant_id = $1 AND athlete_id = $2 AND group_id = $3`,
    [await getTenantId(), athleteId, groupId]
  );

  if (exists.length) {
    return res.status(409).json({ message: "Relation already exists" });
  }

  const newRelation = { id: Date.now().toString(), athleteId, groupId };

  await upsertDoc("athlete_groups", newRelation.id, newRelation);

  logger.info(`Athlete ${athleteId} added to group ${groupId}`);

  res.status(201).json(newRelation);
});

// DELETE relation
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const removed = await getDoc("athlete_groups", id);

  if (!removed) {
    return res.status(404).json({ message: "Relation not found" });
  }

  await deleteDoc("athlete_groups", id);

  logger.info(`Relation deleted: ${id}`);

  res.json({ message: "Deleted", relation: removed });
});

export default router;