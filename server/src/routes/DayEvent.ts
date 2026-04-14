import { Router } from "express";
import { readDb, writeDb } from "../utils/fileDb";
import { logger } from "../utils/logger";
import { DayEvent } from "../models/DayEvent";

const router = Router();

// GET all events
router.get("/", (req, res) => {
  logger.info("GET /events");

  const db = readDb();

  res.json(db.events || []);
});

// GET events by date
router.get("/date/:date", (req, res) => {
  const { date } = req.params;

  logger.info(`GET events for date ${date}`);

  const db = readDb();

  const events = (db.events || []).filter((e: DayEvent) => e.date === date);

  res.json(events);
});

// CREATE event
router.post("/", (req, res) => {
  const db = readDb();

  const newEvent: DayEvent = {
    id: Date.now().toString(),

    title: req.body.title,

    time: req.body.time,

    type: req.body.type,

    date: req.body.date,
  };

  if (!db.events) {
    db.events = [];
  }

  db.events.push(newEvent);

  writeDb(db);

  logger.info(`Event created: ${newEvent.title}`);

  res.status(201).json(newEvent);
});

// UPDATE event
router.put("/:id", (req, res) => {
  const { id } = req.params;

  logger.info(`UPDATE event ${id}`);

  const db = readDb();

  const index = db.events.findIndex((e: DayEvent) => e.id === id);

  if (index === -1) {
    return res.status(404).json({
      message: "Event not found",
    });
  }

  const updatedEvent: DayEvent = {
    ...db.events[index],

    ...req.body,
  };

  db.events[index] = updatedEvent;

  writeDb(db);

  res.json(updatedEvent);
});

// DELETE event
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  logger.info(`DELETE event ${id}`);

  const db = readDb();

  db.events = db.events.filter((e: DayEvent) => e.id !== id);

  writeDb(db);

  res.json({ message: "Event deleted" });
});

export default router;
