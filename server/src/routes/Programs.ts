import express from "express";
import type { Program } from "@shared/types/periodization";
import { listDocs, getDoc, upsertDoc, deleteDoc } from "../db";

const router = express.Router();

// GET all programs
router.get("/", async (_req, res) => {
  try {
    const programs = await listDocs("programs");
    res.json(programs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch programs" });
  }
});

// GET a single program by ID
router.get("/:id", async (req, res) => {
  try {
    const program = await getDoc("programs", req.params.id);
    if (!program) {
      res.status(404).json({ error: "Program not found" });
      return;
    }
    res.json(program);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch program" });
  }
});

// POST create a new program
router.post("/", async (req, res) => {
  try {
    const newProgram: Program = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
    };
    await upsertDoc("programs", newProgram.id, newProgram);
    res.status(201).json(newProgram);
  } catch (error) {
    res.status(500).json({ error: "Failed to create program" });
  }
});

// PUT update a program
router.put("/:id", async (req, res) => {
  try {
    const existing = await getDoc("programs", req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Program not found" });
      return;
    }
    const updated = { ...existing, ...req.body };
    await upsertDoc("programs", req.params.id, updated);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update program" });
  }
});

// DELETE a program (meso blocks / planned weeks / scheduled workouts cascade via FK)
router.delete("/:id", async (req, res) => {
  try {
    const existing = await getDoc("programs", req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Program not found" });
      return;
    }
    await deleteDoc("programs", req.params.id);
    res.json({ message: "Program deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete program" });
  }
});

export default router;