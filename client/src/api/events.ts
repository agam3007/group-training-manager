import { env } from "@/env/env";
import type { CalendarEvent, EventOverride } from "@/shared/types";

const API = `${env.apiUrl}/events`;

// ==========================
// GET all calendar events
// ==========================
export async function getAllEvents(): Promise<CalendarEvent[]> {
  const res = await fetch(`${API}`);
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

// ==========================
// GET events by date range (all events)
// ==========================
export async function getEventsByRange(
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  });

  const res = await fetch(`${API}/range?${params}`);
  if (!res.ok) throw new Error("Failed to fetch events by range");
  return res.json();
}

// ==========================
// GET events for a group
// ==========================
export async function getGroupEvents(
  groupId: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  });

  const res = await fetch(`${API}/group/${groupId}?${params}`);
  if (!res.ok) throw new Error("Failed to fetch group events");
  return res.json();
}

// ==========================
// GET events for an athlete
// ==========================
export async function getAthleteEvents(
  athleteId: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  });

  const res = await fetch(`${API}/athlete/${athleteId}?${params}`);
  if (!res.ok) throw new Error("Failed to fetch athlete events");
  return res.json();
}

// ==========================
// CREATE manual event
// ==========================
export async function createEvent(event: Omit<CalendarEvent, "id" | "createdAt">): Promise<CalendarEvent> {
  const res = await fetch(`${API}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error("Failed to create event");
  return res.json();
}

// ==========================
// CREATE event override
// ==========================
export async function createEventOverride(
  override: Omit<EventOverride, "id" | "createdAt">
): Promise<EventOverride> {
  const res = await fetch(`${API}/override`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(override),
  });
  if (!res.ok) throw new Error("Failed to create event override");
  return res.json();
}

// ==========================
// UPDATE event
// ==========================
export async function updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
  const res = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update event");
  return res.json();
}

// ==========================
// DELETE event
// ==========================
export async function deleteEvent(id: string): Promise<void> {
  const res = await fetch(`${API}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete event");
}

// ==========================
// DELETE event override
// ==========================
export async function deleteEventOverride(id: string): Promise<void> {
  const res = await fetch(`${API}/override/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete event override");
}
