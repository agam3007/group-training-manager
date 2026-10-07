import { Router } from "express";
import { readDb, writeDb } from "../utils/fileDb";
import { logger } from "../utils/logger";
import { Folder } from "@shared/types/folder";

const router = Router();

// ==========================
// 📥 GET all folders
// ==========================
router.get("/", (req, res) => {
  logger.info("GET /folders");
  const db = readDb();
  res.json(db.folders || []);
});

// ==========================
// 📥 GET folder by ID
// ==========================
router.get("/:id", (req, res) => {
  const { id } = req.params;
  logger.info(`GET /folders/${id}`);

  const db = readDb();
  const folder = (db.folders || []).find((f: Folder) => f.id === id);

  if (!folder) {
    return res.status(404).json({ message: "Folder not found" });
  }

  res.json(folder);
});

// ==========================
// ➕ CREATE folder
// ==========================
router.post("/", (req, res) => {
  const db = readDb();

  const newFolder: Folder = {
    id: Date.now().toString(),
    name: req.body.name,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (!db.folders) {
    db.folders = [];
  }

  db.folders.push(newFolder);

  writeDb(db);

  logger.info(`Created folder ${newFolder.id} with name "${newFolder.name}"`);

  res.status(201).json(newFolder);
});

// ==========================
// ✏️ UPDATE folder
// ==========================
router.put("/:id", (req, res) => {
  const db = readDb();
  const { id } = req.params;

  if (!db.folders) {
    db.folders = [];
  }

  const index = db.folders.findIndex((f: Folder) => f.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Folder not found" });
  }

  const updatedFolder: Folder = {
    ...db.folders[index],
    ...req.body,
    id,
    createdAt: db.folders[index].createdAt,
    updatedAt: new Date(),
  };

  db.folders[index] = updatedFolder;

  writeDb(db);

  logger.info(`Updated folder ${id}`);

  res.json(updatedFolder);
});

// ==========================
// 🗑 DELETE folder
// ==========================
router.delete("/:id", (req, res) => {
  const db = readDb();
  const { id } = req.params;

  if (!db.folders) {
    db.folders = [];
  }

  const index = db.folders.findIndex((f: Folder) => f.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Folder not found" });
  }

  const deleted = db.folders[index];

  // Also remove trainings from this folder
  if (db.trainings) {
    db.trainings.forEach((t: any) => {
      if (t.folderId === id) {
        delete t.folderId;
      }
    });
  }

  db.folders.splice(index, 1);

  writeDb(db);

  logger.info(`Deleted folder ${id}`);

  res.json({ message: "Folder deleted", folder: deleted });
});

export default router;
