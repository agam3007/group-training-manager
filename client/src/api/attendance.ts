import { env } from "@/env/env";
import type { Attendance, AttendanceRecord, AthleteCompliance } from "@/shared/types";
import type { Note } from "@/shared/types/note";

const API = `${env.apiUrl}/attendance`;
const NOTES_API = `${env.apiUrl}/notes`;

// ==========================
// Record bulk attendance for an event
// ==========================
export async function recordBulkAttendance(
  eventId: string,
  records: (AttendanceRecord & { athleteId: string })[]
): Promise<Attendance[]> {
  const res = await fetch(`${API}/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId, records }),
  });

  if (!res.ok) throw new Error("Failed to record bulk attendance");
  return res.json();
}

// ==========================
// Get athlete compliance
// ==========================
export async function getAthleteCompliance(
  athleteId: string,
  days: number = 7
): Promise<AthleteCompliance> {
  const res = await fetch(`${API}/athlete/${athleteId}/compliance?days=${days}`);
  if (!res.ok) throw new Error("Failed to fetch compliance data");
  return res.json();
}

// ==========================
// Get red list athletes
// ==========================
export async function getRedListAthletes(): Promise<AthleteCompliance[]> {
  const res = await fetch(`${API}/red-list`);
  if (!res.ok) throw new Error("Failed to fetch red list");
  return res.json();
}

// ==========================
// Get attendance for event
// ==========================
export async function getEventAttendance(eventId: string): Promise<Attendance[]> {
  const res = await fetch(`${API}/event/${eventId}`);
  if (!res.ok) throw new Error("Failed to fetch event attendance");
  return res.json();
}

// ==========================
// Get athlete's attendance in event
// ==========================
export async function getAthleteEventAttendance(
  eventId: string,
  athleteId: string
): Promise<Attendance | null> {
  const res = await fetch(`${API}/event/${eventId}/athlete/${athleteId}`);
  if (!res.ok) throw new Error("Failed to fetch athlete attendance");
  return res.json();
}

// ==========================
// Resolve athlete check-in
// ==========================
export async function resolveCheckIn(
  athleteId: string,
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API}/resolve-check-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ athleteId }),
  });

  if (!res.ok) throw new Error("Failed to resolve check-in");
  return res.json();
}
