import { Router } from "express";
import { logger } from "../utils/logger";
import { recordBulkAttendance, getAthleteCompliance, getRedListAthletes, getEventAttendance, getAthleteEventAttendance } from "../services/attendanceService";
import { readDb, writeDb } from "../utils/fileDb";
import { createNote } from "../services/notesService";
import type { AttendanceRecord } from "@shared/types";

const router = Router();

// =========================
// Record bulk attendance for an event
// =========================
router.post("/bulk", (req, res) => {
  try {
    const { eventId, records } = req.body;

    if (!eventId || !Array.isArray(records)) {
      return res.status(400).json({ error: "eventId and records array are required" });
    }

    logger.info(`Recording bulk attendance for event ${eventId}`);
    const attendances = recordBulkAttendance(eventId, records);
    res.json(attendances);
  } catch (err) {
    logger.error("Failed to record bulk attendance:" + err);
    res.status(500).json({ error: "Failed to record attendance" });
  }
});

// =========================
// Get athlete compliance over period
// =========================
router.get("/athlete/:athleteId/compliance", (req, res) => {
  try {
    const { athleteId } = req.params;
    const { days = "7" } = req.query;

    logger.info(`Getting compliance for athlete ${athleteId} over ${days} days`);
    const compliance = getAthleteCompliance(athleteId, parseInt(days as string));
    res.json(compliance);
  } catch (err) {
    logger.error("Failed to get compliance:" + err);
    res.status(500).json({ error: "Failed to get compliance data" });
  }
});

// =========================
// Get red list athletes (poor attendance or injured)
// =========================
router.get("/red-list", (req, res) => {
  try {
    logger.info("Getting red list athletes");
    const redList = getRedListAthletes();
    res.json(redList);
  } catch (err) {
    logger.error("Failed to get red list:" + err);
    res.status(500).json({ error: "Failed to get red list" });
  }
});

// =========================
// Get attendance for a specific event
// =========================
router.get("/event/:eventId", (req, res) => {
  try {
    const { eventId } = req.params;
    logger.info(`Getting attendance for event ${eventId}`);
    const attendances = getEventAttendance(eventId);
    res.json(attendances);
  } catch (err) {
    logger.error("Failed to get event attendance:" + err);
    res.status(500).json({ error: "Failed to get event attendance" });
  }
});

// =========================
// Get attendance for specific athlete in event
// =========================
router.get("/event/:eventId/athlete/:athleteId", (req, res) => {
  try {
    const { eventId, athleteId } = req.params;
    logger.info(`Getting attendance for athlete ${athleteId} in event ${eventId}`);
    const attendance = getAthleteEventAttendance(eventId, athleteId);
    res.json(attendance);
  } catch (err) {
    logger.error("Failed to get athlete event attendance:" + err);
    res.status(500).json({ error: "Failed to get attendance record" });
  }
});

// =========================
// Resolve athlete check-in (Red List)
// =========================
router.post("/resolve-check-in", (req, res) => {
  try {
    const { athleteId } = req.body;

    if (!athleteId) {
      return res.status(400).json({ error: "athleteId is required" });
    }

    logger.info(`Resolving check-in for athlete ${athleteId}`);

    // Update athlete's lastCheckIn
    const db = readDb();
    const athleteIndex = db.athletes.findIndex((a: any) => a.id === athleteId);
    
    if (athleteIndex === -1) {
      return res.status(404).json({ error: "Athlete not found" });
    }

    const now = new Date();
    db.athletes[athleteIndex].lastCheckIn = now;
    writeDb(db);

    // Create a note for this check-in

    logger.info(`Check-in resolved for athlete ${athleteId}`);
    res.json({ 
      success: true, 
      message: "Check-in resolved",
      athlete: db.athletes[athleteIndex],
    });
  } catch (err) {
    logger.error("Failed to resolve check-in:" + err);
    res.status(500).json({ error: "Failed to resolve check-in" });
  }
});

export default router;
