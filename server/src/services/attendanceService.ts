/**
 * Attendance Service (F0.1 — Postgres)
 * Handles attendance recording, compliance tracking, and red list generation
 */

import { getTenantId, query, listDocs, upsertDoc, withTransaction } from "../db";
import type { Attendance, AttendanceStatus, AttendanceRecord, AthleteCompliance, AthleteCheckInStatus } from "@shared/types";

/**
 * Record bulk attendance for an event (entire group at once)
 * Creates/updates Attendance records for multiple athletes
 */
export async function recordBulkAttendance(
  eventId: string,
  records: (AttendanceRecord & { athleteId: string })[]
): Promise<Attendance[]> {
  const tenantId = await getTenantId();

  const existingRows = await query<{ id: string; data: any }>(
    `SELECT id, data FROM attendances WHERE tenant_id = $1 AND event_id = $2`,
    [tenantId, eventId]
  );

  const createdAttendances: Attendance[] = [];

  await withTransaction(async (client) => {
    for (const record of records) {
      const existing = existingRows.find((r) => r.data.athleteId === record.athleteId);
      const now = new Date();

      const attendance: Attendance = {
        id: existing ? existing.id : crypto.randomUUID(),
        eventId,
        athleteId: record.athleteId,
        status: record.status,
        note: record.note || "",
        isVerified: record.isVerified || true, // preserved as-is (AS-IS bug 4.19; fixed in F1.6)
        createdAt: existing ? existing.data.createdAt : now,
        updatedAt: now,
      };

      await upsertDoc("attendances", attendance.id, attendance, { client });

      createdAttendances.push(attendance);
    }
  });

  return createdAttendances;
}

/**
 * Get athlete compliance percentage and stats over a given period
 */
export async function getAthleteCompliance(
  athleteId: string,
  days: number = 7
): Promise<AthleteCompliance> {
  const tenantId = await getTenantId();

  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  const rows = await query<{ data: any }>(
    `SELECT data FROM attendances
     WHERE tenant_id = $1 AND athlete_id = $2 AND created_at >= $3 AND created_at <= $4`,
    [tenantId, athleteId, startDate.toISOString(), now.toISOString()]
  );
  const relevantAttendances: Attendance[] = rows.map((r) => r.data);

  const statusCounts = {
    attended: 0,
    missed: 0,
    sick: 0,
    injured: 0,
  };

  relevantAttendances.forEach((a) => {
    switch (a.status) {
      case "ATTENDED":
        statusCounts.attended++;
        break;
      case "MISSED":
        statusCounts.missed++;
        break;
    }
  });

  const athletes = await listDocs("athletes");
  const athlete = athletes.find((a: any) => a.id === athleteId);

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
 * - Haven't been checked in (lastCheckIn set) for more than 7 days
 * - Have 2+ consecutive misses, were checked (lastCheckIn set), but then missed another
 */
export async function getRedListAthletes(): Promise<AthleteCheckInStatus[]> {
  const athletes = await listDocs("athletes");
  const attendances = await listDocs("attendances") as Attendance[];

  const redList: AthleteCheckInStatus[] = [];
  const now = new Date();

  for (const athlete of athletes) {
    const compliance = await getAthleteCompliance(athlete.id, 7);
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
  }

  return redList.sort((a, b) => {
    const riskOrder = { danger: 0, warning: 1, safe: 2 };
    return riskOrder[a.risk] - riskOrder[b.risk];
  });
}

/**
 * Get attendance records for a specific event
 */
export async function getEventAttendance(eventId: string): Promise<Attendance[]> {
  const tenantId = await getTenantId();
  const rows = await query<{ data: any }>(
    `SELECT data FROM attendances WHERE tenant_id = $1 AND event_id = $2`,
    [tenantId, eventId]
  );
  return rows.map((r) => r.data);
}

/**
 * Get attendance record for athlete in a specific event
 */
export async function getAthleteEventAttendance(eventId: string, athleteId: string): Promise<Attendance | null> {
  const tenantId = await getTenantId();
  const rows = await query<{ data: any }>(
    `SELECT data FROM attendances WHERE tenant_id = $1 AND event_id = $2 AND athlete_id = $3`,
    [tenantId, eventId, athleteId]
  );
  return rows.length ? rows[0].data : null;
}