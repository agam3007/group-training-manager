import express from "express";
import type { Program } from "@shared/types/periodization";
import { readDb, writeDb } from "../utils/fileDb";

const router = express.Router();

// GET all programs
router.get("/", (req, res) => {
  try {
    const programs = readDb().programs || [];
    res.json(programs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch programs" });
  }
});

// GET a single program by ID
router.get("/:id", (req, res) => {
  try {
    const programs = readDb().programs || [];
    const program = programs.find((p: Program) => p.id === req.params.id);
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
router.post("/", (req, res) => {
  try {
    const newProgram: Program = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
    };
    const db = readDb();
    db.programs = db.programs || [];
    db.programs.push(newProgram);
    writeDb(db);
    res.status(201).json(newProgram);
  } catch (error) {
    res.status(500).json({ error: "Failed to create program" });
  }
});

// PUT update a program
router.put("/:id", (req, res) => {
  try {
    const db = readDb();
    db.programs = db.programs || [];
    const index = db.programs.findIndex((p: Program) => p.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: "Program not found" });
      return;
    }
    db.programs[index] = { ...db.programs[index], ...req.body };
    writeDb(db);
    res.json(db.programs[index]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update program" });
  }
});

// DELETE a program
router.delete("/:id", (req, res) => {
  try {
    const db = readDb();
    db.programs = db.programs || [];
    const index = db.programs.findIndex((p: Program) => p.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: "Program not found" });
      return;
    }
    db.programs.splice(index, 1);
    writeDb(db);
    res.json({ message: "Program deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete program" });
  }
});

export default router;
