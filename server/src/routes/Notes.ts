import { Router } from "express";
import { logger } from "../utils/logger";
import {
  getNotesByTarget,
  getRecentNotesByTarget,
  getNotesByTargetAndCategory,
  createNote,
  updateNote,
  deleteNote,
  getNoteById,
  getAllNotes,
} from "../services/notesService";
import type { NoteTargetType } from "@shared/types/note";

const router = Router();

// =========================
// Get notes by target (polymorphic)
// =========================
router.get("/target/:targetType/:targetId", (req, res) => {
  try {
    const { targetType, targetId } = req.params;

    // Validate targetType
    const validTypes = ["ATHLETE", "GROUP", "ATTENDANCE", "EVENT"];
    if (!validTypes.includes(targetType)) {
      return res.status(400).json({ error: "Invalid target type" });
    }

    logger.info(`Getting notes for ${targetType}:${targetId}`);
    const notes = getNotesByTarget(targetType as NoteTargetType, targetId);
    res.json(notes);
  } catch (err) {
    logger.error("Failed to get target notes:" + err);
    res.status(500).json({ error: "Failed to get notes" });
  }
});

// =========================
// Get recent notes for target
// =========================
router.get("/target/:targetType/:targetId/recent", (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const { limit = "5" } = req.query;

    const validTypes = ["ATHLETE", "GROUP", "ATTENDANCE", "EVENT"];
    if (!validTypes.includes(targetType)) {
      return res.status(400).json({ error: "Invalid target type" });
    }

    logger.info(`Getting recent notes for ${targetType}:${targetId}`);
    const notes = getRecentNotesByTarget(
      targetType as NoteTargetType,
      targetId,
      parseInt(limit as string)
    );
    res.json(notes);
  } catch (err) {
    logger.error("Failed to get recent notes:" + err);
    res.status(500).json({ error: "Failed to get recent notes" });
  }
});

// =========================
// Get notes by target and category
// =========================
router.get("/target/:targetType/:targetId/category/:category", (req, res) => {
  try {
    const { targetType, targetId, category } = req.params;

    const validTypes = ["ATHLETE", "GROUP", "ATTENDANCE", "EVENT"];
    if (!validTypes.includes(targetType)) {
      return res.status(400).json({ error: "Invalid target type" });
    }

    logger.info(`Getting ${category} notes for ${targetType}:${targetId}`);
    const notes = getNotesByTargetAndCategory(
      targetType as NoteTargetType,
      targetId,
      category
    );
    res.json(notes);
  } catch (err) {
    logger.error("Failed to get category notes:" + err);
    res.status(500).json({ error: "Failed to get notes" });
  }
});

// =========================
// Create a new note
// =========================
router.post("/", (req, res) => {
  try {
    const { title, description, category, targetType, targetId, flagForWorkoutSelection } =
      req.body;

    if (!title || !description || !category || !targetType || !targetId) {
      return res.status(400).json({
        error: "title, description, category, targetType, and targetId are required",
      });
    }

    const validTypes = ["ATHLETE", "GROUP", "ATTENDANCE", "EVENT"];
    if (!validTypes.includes(targetType)) {
      return res.status(400).json({ error: "Invalid target type" });
    }

    logger.info(`Creating note for ${targetType}:${targetId}`);
    const note = createNote({
      title,
      description,
      category,
      targetType: targetType as NoteTargetType,
      targetId,
      flagForWorkoutSelection,
    });

    res.status(201).json(note);
  } catch (err) {
    logger.error("Failed to create note:" + err);
    res.status(500).json({ error: "Failed to create note" });
  }
});

// =========================
// Update a note
// =========================
router.put("/:noteId", (req, res) => {
  try {
    const { noteId } = req.params;
    const updates = req.body;

    logger.info(`Updating note ${noteId}`);
    const updated = updateNote(noteId, updates);

    if (!updated) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json(updated);
  } catch (err) {
    logger.error("Failed to update note:" + err);
    res.status(500).json({ error: "Failed to update note" });
  }
});

// =========================
// Delete a note
// =========================
router.delete("/:noteId", (req, res) => {
  try {
    const { noteId } = req.params;

    logger.info(`Deleting note ${noteId}`);
    const deleted = deleteNote(noteId);

    if (!deleted) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json({ success: true, message: "Note deleted" });
  } catch (err) {
    logger.error("Failed to delete note:" + err);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

// =========================
// Get a single note by ID
// =========================
router.get("/:noteId", (req, res) => {
  try {
    const { noteId } = req.params;
    const note = getNoteById(noteId);

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json(note);
  } catch (err) {
    logger.error("Failed to get note:" + err);
    res.status(500).json({ error: "Failed to get note" });
  }
});

// =========================
// Get all notes (admin)
// =========================
router.get("/", (req, res) => {
  try {
    logger.info("Getting all notes");
    const notes = getAllNotes();
    res.json(notes);
  } catch (err) {
    logger.error("Failed to get all notes:" + err);
    res.status(500).json({ error: "Failed to get notes" });
  }
});

export default router;

