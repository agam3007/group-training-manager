import { Router } from "express";
import { listDocs, getDoc, upsertDoc, deleteDoc, withTransaction, getTenantId } from "../db";
import { logger } from "../utils/logger";

const router = Router();

// GET all folders
router.get("/", async (_req, res) => {
  logger.info("GET /folders");
  res.json(await listDocs("folders"));
});

// GET folder by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`GET /folders/${id}`);

  const folder = await getDoc("folders", id);

  if (!folder) {
    return res.status(404).json({ message: "Folder not found" });
  }

  res.json(folder);
});

// CREATE folder
router.post("/", async (req, res) => {
  const newFolder = {
    id: Date.now().toString(),
    name: req.body.name,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await upsertDoc("folders", newFolder.id, newFolder);

  logger.info(`Created folder ${newFolder.id} with name "${newFolder.name}"`);

  res.status(201).json(newFolder);
});

// UPDATE folder
router.put("/:id", async (req, res) => {
  const { id } = req.params;

  const existing = await getDoc("folders", id);

  if (!existing) {
    return res.status(404).json({ message: "Folder not found" });
  }

  const updatedFolder = { ...existing, ...req.body, id, updatedAt: new Date() };

  await upsertDoc("folders", id, updatedFolder);

  logger.info(`Updated folder ${id}`);

  res.json(updatedFolder);
});

// DELETE folder — also removes the folder reference from trainings (data + column, FK handles the column)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const deleted = await getDoc("folders", id);

  if (!deleted) {
    return res.status(404).json({ message: "Folder not found" });
  }

  const tenantId = await getTenantId();
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE trainings SET data = data - 'folderId', folder_id = NULL, updated_at = now() WHERE folder_id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    await client.query(`DELETE FROM folders WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
  });

  logger.info(`Deleted folder ${id}`);

  res.json({ message: "Folder deleted", folder: deleted });
});

export default router;