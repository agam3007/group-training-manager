/**
 * Attendance Service
 * Handles attendance recording, compliance tracking, and red list generation
 */

import { readDb, writeDb } from "../utils/fileDb";
import type { Attendance, AttendanceStatus, AttendanceRecord, AthleteCompliance, AthleteCheckInStatus } from "@shared/types";

/**
 * Record bulk attendance for an event (entire group at once)
 * Creates/updates Attendance records for multiple athletes
 */
export function recordBulkAttendance(
  eventId: string,
  records: (AttendanceRecord & { athleteId: string })[]
): Attendance[] {
  const db = readDb();
  const attendances = db.attendances || [];
  const now = new Date();

  const createdAttendances: Attendance[] = [];

  records.forEach((record) => {
    // Check if attendance record already exists for this event+athlete
    const existingIndex = attendances.findIndex(
      (a: Attendance) => a.eventId === eventId && a.athleteId === record.athleteId
    );

    const attendance: Attendance = {
      id: existingIndex >= 0 ? attendances[existingIndex].id : crypto.randomUUID(),
      eventId,
      athleteId: record.athleteId,
      status: record.status,
      note: record.note || "",
      isVerified: record.isVerified || true, // Coach-verified by default
      createdAt: existingIndex >= 0 ? attendances[existingIndex].createdAt : now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      attendances[existingIndex] = attendance;
    } else {
      attendances.push(attendance);
    }

    createdAttendances.push(attendance);
  });

  // Write back to database
  db.attendances = attendances;
  writeDb(db);

  return createdAttendances;
}

/**
 * Get athlete compliance percentage and stats over a given period
 */
export function getAthleteCompliance(
  athleteId: string,
  days: number = 7
): AthleteCompliance {
  const db = readDb();
  const attendances = (db.attendances || []) as Attendance[];
  const athletes = db.athletes || [];
  const athlete = athletes.find((a: any) => a.id === athleteId);

  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  // Filter attendances for this athlete in the time range
  const relevantAttendances = attendances.filter((a: Attendance) => {
    const createdAt = new Date(a.createdAt);
    return a.athleteId === athleteId && createdAt >= startDate && createdAt <= now;
  });

  // Count by status
  const statusCounts = {
    attended: 0,
    missed: 0,
    sick: 0,
    injured: 0,
  };

  relevantAttendances.forEach((a: Attendance) => {
    switch (a.status) {
      case "ATTENDED":
        statusCounts.attended++;
        break;
      case "MISSED":
        statusCounts.missed++;
        break;
    }
  });

  const sessionsAssigned = relevantAttendances.length;
  const sessionsAttended = statusCounts.attended;
  const compliancePercentage = sessionsAssigned > 0 ? (sessionsAttended / sessionsAssigned) * 100 : 0;

  return {
    athleteId,
    athleteName: athlete?.name || "Unknown",
    sessionsAssigned,
    sessionsAttended,
    compliancePercentage: Math.round(compliancePercentage * 100) / 100,
    lastSevenDays: statusCounts,
  };
}

/**
 * Check if athlete has consecutive missed sessions
 */
function hasMissedTwoSessionsSinceCheckIn(
  attendances: Attendance[],
  athleteId: string,
  lastCheckIn?: Date | null
): boolean {
  const athleteAttendances = attendances
    .filter((a) => a.athleteId === athleteId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

  let consecutiveMisses = 0;

  for (const attendance of athleteAttendances) {
    const attendanceDate = new Date(attendance.createdAt);

    // Stop checking once we reach attendances BEFORE last check-in
    if (lastCheckIn && attendanceDate <= lastCheckIn) {
      break;
    }

    if (attendance.status === "MISSED") {
      consecutiveMisses++;

      if (consecutiveMisses >= 2) {
        return true;
      }
    } else {
      consecutiveMisses = 0;
    }
  }

  return false;
}

/**
 * Get "Red List" - athletes with poor attendance or health issues
 * Returns athletes who:
 * - Have more than 2 MISSED sessions in the last 7 days
 * - Are marked as INJURED and haven't been checked in for 3+ days
 * - Haven't been checked in (lastCheckIn) for more than 7 days
 * - Have 2+ consecutive misses, were checked (lastCheckIn set), but then missed another
 */
export function getRedListAthletes(): AthleteCheckInStatus[] {
  const db = readDb();
  const athletes = db.athletes || [];
  const attendances = (db.attendances || []) as Attendance[];
  const redList: AthleteCheckInStatus[] = [];
  const now = new Date();

  athletes.forEach((athlete: any) => {
    const compliance = getAthleteCompliance(athlete.id, 7);
    const reasons: AthleteCheckInStatus["reasons"] = {};
    let shouldAddToList = false;
    let risk: "safe" | "warning" | "danger" = "warning";

    // Check 1: No check-in for more than 7 days
 const lastCheckIn = athlete.lastCheckIn
  ? new Date(athlete.lastCheckIn)
  : null;

const daysSinceCheckIn = lastCheckIn
  ? Math.floor(
      (now.getTime() - lastCheckIn.getTime()) /
        (1000 * 60 * 60 * 24)
    )
  : 999;

  if (daysSinceCheckIn >= 7) {
  reasons.noContact = {
    daysSinceContact: daysSinceCheckIn,
    lastContactDate: lastCheckIn || undefined,
  };

  shouldAddToList = true;
  risk = "warning";
}

const missedTwoSessions = hasMissedTwoSessionsSinceCheckIn(
  attendances,
  athlete.id,
  lastCheckIn
);

if (missedTwoSessions) {
  reasons.missedSessions = {
    count: 2,
  };

  shouldAddToList = true;
  risk = "danger";
}

if (athlete.injured && daysSinceCheckIn >= 3) {
  reasons.recentInjury = {
    description: `Injured athlete - no follow-up for ${daysSinceCheckIn} days`,
    reportedAt: now,
  };

  shouldAddToList = true;
  risk = "danger";
}
   if (shouldAddToList) {
      redList.push({
        athleteId: athlete.id,
        athleteName: athlete.name,
        risk,
        reasons,
        whatsappNumber: athlete.phone,
        email: athlete.email,
        lastCheckedAt: now,
      });
    }
  });

  return redList.sort((a, b) => {
    const riskOrder = { danger: 0, warning: 1, safe: 2 };
    return riskOrder[a.risk] - riskOrder[b.risk];
  });
}

/**
 * Get attendance records for a specific event
 */
export function getEventAttendance(eventId: string): Attendance[] {
  const db = readDb();
  const attendances = (db.attendances || []) as Attendance[];
  return attendances.filter((a: Attendance) => a.eventId === eventId);
}

/**
 * Get attendance record for athlete in a specific event
 */
export function getAthleteEventAttendance(eventId: string, athleteId: string): Attendance | null {
  const db = readDb();
  const attendances = (db.attendances || []) as Attendance[];
  return (
    attendances.find((a: Attendance) => a.eventId === eventId && a.athleteId === athleteId) || null
  );
}
