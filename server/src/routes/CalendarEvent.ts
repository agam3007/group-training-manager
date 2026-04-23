import { Router } from "express";
import { readDb, writeDb } from "../utils/fileDb";
import { logger } from "../utils/logger";
import { CalendarEvent, TrainingAssignment, EventOverride, TrainingTime, Group, Training } from "@shared/types";

const router = Router();

// =========================
// UTILITY FUNCTIONS
// =========================

/**
 * Generate recurring calendar events for a group schedule
 * Group schedules repeat every week
 */
function generateGroupScheduleEvents(
  groupId: string,
  trainingTime: TrainingTime,
  startRange: Date,
  endRange: Date,
  trainingTitle: string
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const currentDate = new Date(startRange);

  // Start from the first occurrence of the specified day
  const dayOfWeek = trainingTime.day + 1; // 0 = Sunday, 1 = Monday, etc.
  const daysUntilTarget = (dayOfWeek - currentDate.getDay() + 7) % 7;
  currentDate.setDate(currentDate.getDate() + daysUntilTarget);

  // Generate weekly recurring events
  while (currentDate < endRange) {
    const eventStart = new Date(currentDate);
    eventStart.setHours(trainingTime.start.hour, trainingTime.start.min, 0, 0);

    const eventEnd = new Date(currentDate);
    eventEnd.setHours(trainingTime.end.hour, trainingTime.end.min, 0, 0);

    if (eventStart >= startRange && eventEnd <= endRange) {
      events.push({
        id: crypto.randomUUID(),
        type: "groupSchedule",
        title: trainingTitle,
        startTime: eventStart,
        endTime: eventEnd,
        groupId,
        sourceId: `groupSchedule-${groupId}-${eventStart.getTime()}`,
        createdAt: new Date(),
      });
    }

    // Move to next week
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return events;
}

/**
 * Apply event overrides to calendar events
 * Handles cancellations and modifications
 */
function applyEventOverrides(
  events: CalendarEvent[],
  overrides: EventOverride[]
): CalendarEvent[] {
  return events
    .map((event) => {
      const override = overrides.find((o) => {
        const originalStart = new Date(o.originalStartTime)

        return (
          o.sourceId === event.sourceId &&
          originalStart.getTime() === event.startTime.getTime()
        )
      })

      if (!override) {
        return event;
      }

      // If cancelled, mark as cancelled or filter out
      if (override.isCancelled) {
        return null;
      }

      // Apply modifications
      return {
        ...event,
        title: override.modifiedTitle || event.title,
        startTime: override.modifiedStartTime || event.startTime,
        endTime: override.modifiedEndTime || event.endTime,
      };
    })
    .filter((event) => event !== null) as CalendarEvent[];
}

/**
 * Merge training assignments (one-time) with group schedule events and overrides
 */
function mergeCalendarEvents(
  trainingAssignments: TrainingAssignment[],
  groups: Group[],
  overrides: EventOverride[],
  trainings: Training[],
  startRange: Date,
  endRange: Date
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const eventMap = new Map<string, CalendarEvent>();

  // Add training assignments (one-time events)
  trainingAssignments.forEach((assignment) => {
    const training = trainings.find((t) => t.id === assignment.trainingId);
    const key = `assignment-${assignment.id}`;

    eventMap.set(key, {
      id: crypto.randomUUID(),
      type: training?.type || "training",
      title: training?.title || "Training",
      startTime: new Date(assignment.startTime),
      endTime: assignment.endTime
        ? new Date(assignment.endTime)
        : new Date(new Date(assignment.startTime).getTime() + 60 * 60 * 1000), // default 1 hour
      athleteId: assignment.athleteId,
      groupId: assignment.groupId,
      sourceId: `training-${assignment.id}`,
      createdAt: new Date(assignment.createdAt),
    });
  });

  // Add group schedule events (recurring weekly)
  groups.forEach((group) => {
    group.schedule.forEach((trainingTime) => {
      const groupEvents = generateGroupScheduleEvents(
        group.id,
        trainingTime,
        startRange,
        endRange,
        `${group.name} - ${group.sport}`
      );

      groupEvents.forEach((event) => {
        eventMap.set(event.sourceId!, event);
      });
    });
  });

  // Apply overrides to group schedule events
  const eventsArray = Array.from(eventMap.values());
  const filteredEvents = applyEventOverrides(eventsArray, overrides);

  return filteredEvents;
}

// =========================
// GET all events
// =========================
router.get("/", (req, res) => {
  logger.info("GET /events");

  const db = readDb();

  res.json(db.events || []);
});

// =========================
// GET events by range (including merged events from schedules & overrides)
// =========================
router.get("/range", (req, res) => {
  const { start, end } = req.query;

  logger.info(`GET events range ${start} - ${end}`);

  if (!start || !end) {
    return res.status(400).json({
      message: "start and end query params are required",
    });
  }

  const startDate = new Date(start as string);
  const endDate = new Date(end as string);
console.log(end)
  const db = readDb();

  // Get all data needed
  const trainingAssignments = db.trainingAssignments || [];
  const groups = db.groups || [];
  const overrides = db.eventOverrides || [];
  const trainings = db.trainings || [];

  // Generate merged calendar events
  const mergedEvents = mergeCalendarEvents(
    trainingAssignments,
    groups,
    overrides,
    trainings,
    startDate,
    endDate
  );

  // Also include manually created events from the events table
  const manualEvents = (db.events || []).filter((e: CalendarEvent) => {
    const eventStart = new Date(e.startTime);
    const eventEnd = new Date(e.endTime);
    return eventStart < endDate && eventEnd > startDate;
  });

  // Combine and filter by date range
  const allEvents = [...mergedEvents, ...manualEvents].filter((e) => {
    const eventStart = new Date(e.startTime);
    const eventEnd = new Date(e.endTime);
    return eventStart < endDate && eventEnd > startDate;
  });

  res.json(allEvents);
});

// =========================
// GET events by group (merged)
// =========================
router.get("/group/:groupId", (req, res) => {
  const { groupId } = req.params;
  const { start, end } = req.query;

  logger.info(`GET events for group ${groupId} in range ${start} - ${end}`);

  if (!start || !end) {
    return res.status(400).json({
      message: "start and end query params are required",
    });
  }

  const startDate = new Date(start as string);
  const endDate = new Date(end as string);

  const db = readDb();

  // Get group-specific data
  const trainingAssignments = (db.trainingAssignments || []).filter(
    (a: TrainingAssignment) => a.groupId === groupId
  );
  const group = (db.groups || []).find((g: Group) => g.id === groupId);
  const overrides = db.eventOverrides || [];
  const trainings = db.trainings || [];

  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }

  const mergedEvents = mergeCalendarEvents(
    trainingAssignments,
    [group],
    overrides,
    trainings,
    startDate,
    endDate
  );
console.log(mergedEvents)
  // Include manually created group events
  const manualEvents = (db.events || []).filter(
    (e: CalendarEvent) => e.groupId === groupId
  );

  const allEvents = [...mergedEvents, ...manualEvents].filter((e) => {
    const eventStart = new Date(e.startTime);
    const eventEnd = new Date(e.endTime);
    return eventStart < endDate && eventEnd > startDate;
  });

  res.json(allEvents);
});

// =========================
// GET events by athlete (merged)
// =========================
router.get("/athlete/:athleteId", (req, res) => {
  const { athleteId } = req.params;
  const { start, end } = req.query;

  logger.info(`GET events for athlete ${athleteId} in range ${start} - ${end}`);

  if (!start || !end) {
    return res.status(400).json({
      message: "start and end query params are required",
    });
  }

  const startDate = new Date(start as string);
  const endDate = new Date(end as string);

  const db = readDb();

  // Get athlete-specific data
  const trainingAssignments = (db.trainingAssignments || []).filter(
    (a: TrainingAssignment) => a.athleteId === athleteId
  );
  const overrides = db.eventOverrides || [];
  const trainings = db.trainings || [];

  const mergedEvents = mergeCalendarEvents(
    trainingAssignments,
    [],
    overrides,
    trainings,
    startDate,
    endDate
  );

  // Include manually created athlete events
  const manualEvents = (db.events || []).filter(
    (e: CalendarEvent) => e.athleteId === athleteId
  );

  const allEvents = [...mergedEvents, ...manualEvents].filter((e) => {
    const eventStart = new Date(e.startTime);
    const eventEnd = new Date(e.endTime);
    return eventStart < endDate && eventEnd > startDate;
  });

  res.json(allEvents);
});

// =========================
// CREATE manual event
// =========================
router.post("/", (req, res) => {
  const db = readDb();

  const newEvent: CalendarEvent = {
    id: crypto.randomUUID(),
    title: req.body.title,
    type: req.body.type,
    startTime: new Date(req.body.startTime),
    endTime: new Date(req.body.endTime),
    athleteId: req.body.athleteId || undefined,
    groupId: req.body.groupId || undefined,
    sourceId: req.body.sourceId || undefined,
    createdAt: new Date(),
  };

  if (!db.events) {
    db.events = [];
  }

  db.events.push(newEvent);

  writeDb(db);

  logger.info(`Event created: ${newEvent.title}`);

  res.status(201).json(newEvent);
});

// =========================
// CREATE event override
// =========================
router.post("/override", (req, res) => {
  const db = readDb();

  const { sourceId, originalStartTime, isCancelled, modifiedTitle, modifiedStartTime, modifiedEndTime, modifiedLocation } = req.body;

  // Validation
  if (!sourceId || !originalStartTime) {
    return res.status(400).json({
      message: "sourceId and originalStartTime are required",
    });
  }

  db.eventOverrides = db.eventOverrides || [];

  const existingOverride = db.eventOverrides.find(
    (override: EventOverride) => override.sourceId === sourceId
  );

  if (existingOverride) {
    existingOverride.isCancelled = isCancelled || false;
    existingOverride.modifiedTitle = modifiedTitle;
    existingOverride.modifiedStartTime = modifiedStartTime ? new Date(modifiedStartTime) : undefined;
    existingOverride.modifiedEndTime = modifiedEndTime ? new Date(modifiedEndTime) : undefined;
    existingOverride.modifiedLocation = modifiedLocation;

    writeDb(db);

    logger.info(`Event override updated for source: ${sourceId}`);
    return res.status(200).json(existingOverride);
  }

  const newOverride: EventOverride = {
    id: crypto.randomUUID(),
    sourceId,
    originalStartTime: new Date(originalStartTime),
    isCancelled: isCancelled || false,
    modifiedTitle,
    modifiedStartTime: modifiedStartTime ? new Date(modifiedStartTime) : undefined,
    modifiedEndTime: modifiedEndTime ? new Date(modifiedEndTime) : undefined,
    modifiedLocation,
    createdAt: new Date(),
  };

  db.eventOverrides.push(newOverride);

  writeDb(db);

  logger.info(`Event override created for source: ${sourceId}`);

  res.status(201).json(newOverride);
});

// =========================
// UPDATE event
// =========================
router.put("/:id", (req, res) => {
  const { id } = req.params;

  logger.info(`UPDATE event ${id}`);

  const db = readDb();

  const index = db.events.findIndex((e: CalendarEvent) => e.id === id);

  if (index === -1) {
    return res.status(404).json({
      message: "Event not found",
    });
  }

  const updatedEvent: CalendarEvent = {
    ...db.events[index],
    ...req.body,
    startTime: req.body.startTime ? new Date(req.body.startTime) : db.events[index].startTime,
    endTime: req.body.endTime ? new Date(req.body.endTime) : db.events[index].endTime,
  };

  db.events[index] = updatedEvent;

  writeDb(db);

  res.json(updatedEvent);
});

// =========================
// DELETE event
// =========================
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  logger.info(`DELETE event ${id}`);

  const db = readDb();

  db.events = (db.events || []).filter((e: CalendarEvent) => e.id !== id);

  writeDb(db);

  res.json({ message: "Event deleted" });
});

// =========================
// DELETE event override
// =========================
router.delete("/override/:id", (req, res) => {
  const { id } = req.params;

  logger.info(`DELETE event override ${id}`);

  const db = readDb();

  db.eventOverrides = (db.eventOverrides || []).filter((o: EventOverride) => o.id !== id);

  writeDb(db);

  res.json({ message: "Event override deleted" });
});

export default router;