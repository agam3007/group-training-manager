/**
 * Dashboard Merging Service
 * Handles combining CalendarEvents with EventOverrides and calculating athlete risk status
 */

import type { CalendarEvent, EventOverride, AthleteCheckInStatus, AthleteRiskLevel, TodayTimeline, DashboardStats } from "@shared/types";
import { readDb } from "../utils/fileDb";
import { get } from "node:http";
import { getRedListAthletes } from "./attendanceService";

/**
 * Merges calendar events with their overrides for a specific date
 * Priority: EventOverride > CalendarEvent (overrides take precedence)
 */
export function mergeEventsWithOverrides(
  events: CalendarEvent[],
  overrides: EventOverride[],
  targetDate: Date
): (CalendarEvent & { isOverridden?: boolean })[] {
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);

  // Filter events for the target date
  const todayEvents = events.filter((e) => {
    const eventStart = new Date(e.startTime);
    return eventStart >= dayStart && eventStart < dayEnd;
  });
  // Merge events with overrides
  const mergedEvents = todayEvents.map((event) => {
    const override = overrides.find((o) => o.sourceId === event.sourceId && shouldApplyOverride(o, event.startTime));

    if (!override) return event;

    // If cancelled, filter out
    if (override.isCancelled) return null;

    // Apply override modifications
    return {
      ...event,
      title: override.modifiedTitle || event.title,
      startTime: override.modifiedStartTime || event.startTime,
      endTime: override.modifiedEndTime || event.endTime,
      isOverridden: true,
    };
  });

  return mergedEvents.filter((e) => e !== null) as (CalendarEvent & { isOverridden?: boolean })[];
}

/**
 * Determines if an override applies to a specific event instance
 */
function shouldApplyOverride(override: EventOverride, eventStartTime: Date): boolean {
  const overrideDate = new Date(override.originalStartTime);
  overrideDate.setHours(0, 0, 0, 0);
  const eventDate = new Date(eventStartTime);
  eventDate.setHours(0, 0, 0, 0);

  return overrideDate.getTime() === eventDate.getTime();
}

/**
 * Checks athlete risk status based on:
 * - Recent injuries (last 24h)
 * - Missed sessions (2+ consecutive)
 * - No contact (7+ days)
 */
// export async function checkAthleteRiskStatus(
//   athleteId: string,
//   athleteName: string,
//   whatsappNumber?: string,
//   email?: string
// ): Promise<AthleteCheckInStatus> {
//   const now = new Date();
//   const reasons: AthleteCheckInStatus["reasons"] = {};
//   let riskLevel: AthleteRiskLevel = "safe";

//   // Check for recent injury (last 24h)
//   const injuryNotes = db.getInjuryNotesByAthlete(athleteId, 24);
//   if (injuryNotes.length > 0) {
//     const recentInjury = injuryNotes[0];
//     reasons.recentInjury = {
//       description: recentInjury.text,
//       reportedAt: new Date(recentInjury.createdAt),
//     };
//     riskLevel = "danger";
//   }

//   // Check for missed sessions (2+ consecutive)
//   const missedSessions = await countMissedSessions(athleteId);
//   if (missedSessions >= 2) {
//     const events = db.getCalendarEvents();
//     const athleteEvents = events.filter((e) => e.athleteId === athleteId);
//     const lastSession = athleteEvents.sort(
//       (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
//     )[0];

//     reasons.missedSessions = {
//       count: missedSessions,
//       lastSessionDate: lastSession ? new Date(lastSession.startTime) : undefined,
//     };
//     riskLevel = riskLevel === "danger" ? "danger" : "warning";
//   }

//   // Check for no contact (7+ days)
//   const lastContact = db.getLastContact(athleteId);
//   const daysSinceContact = lastContact
//     ? Math.floor((now.getTime() - new Date(lastContact.timestamp).getTime()) / (1000 * 60 * 60 * 24))
//     : 999;

//   if (daysSinceContact >= 7) {
//     reasons.noContact = {
//       daysSinceContact,
//       lastContactDate: lastContact ? new Date(lastContact.timestamp) : undefined,
//     };
//     riskLevel = riskLevel === "danger" ? "danger" : "warning";
//   }

//   return {
//     athleteId,
//     athleteName,
//     risk: riskLevel,
//     reasons,
//     whatsappNumber,
//     email,
//     lastCheckedAt: now,
//   };
// }

/**
 * Counts consecutive missed sessions by checking for events without completion/check-in
 * This is a simplified version - you'd need a "completion" status in CalendarEvent
 */
// async function countMissedSessions(athleteId: string): Promise<number> {
//   const events = db.getCalendarEvents();
//   const athleteEvents = events.filter((e) => e.athleteId === athleteId);

//   const pastEvents = athleteEvents
//     .filter((e) => new Date(e.startTime) < new Date() && e.type === "training")
//     .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

//   let missedCount = 0;
//   for (const event of pastEvents) {
//     // Check if event has completion/check-in record
//     if (!event.completed) {
//       missedCount++;
//     } else {
//       break; // Stop counting at first completed session
//     }
//   }

//   return missedCount;
// }

/**
 * Gets unified dashboard data for a specific date
 */
export async function getUnifiedDashboard(date: Date): Promise<TodayTimeline> {
  // Fetch event data from database
  const db = readDb();
  const events = db.events || [];
  const overrides = db.eventOverrides || [];
  const athletes = db.athletes || [];
  const groups = db.groups || [];
  const trainings = db.trainings || [];

  // Merge calendar events with overrides for the specified date
  let mergedEvents = mergeEventsWithOverrides(events, overrides, date);

  // Add group schedule events for the specified date
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  // Generate group training events for this date
  groups.forEach((group: any) => {
    if (group.schedule && Array.isArray(group.schedule)) {
      group.schedule.forEach((trainingTime: any) => {
        // Check if this training day matches the target date
        const targetDay = date.getDay();
        const trainingDay = trainingTime.day + 1; // 0=Sunday in JS, but API might use different convention

        if (trainingDay === targetDay || trainingDay - 1 === targetDay) {
          const eventStart = new Date(date);
          eventStart.setHours(trainingTime.start.hour, trainingTime.start.min, 0, 0);

          const eventEnd = new Date(date);
          eventEnd.setHours(trainingTime.end.hour, trainingTime.end.min, 0, 0);

          const training = trainings.find((t: any) => t.id === trainingTime.trainingId);

          mergedEvents.push({
            id: `group-${group.id}-${date.getTime()}`,
            type: "groupSchedule",
            title: `${group.name} - Training`,
            startTime: eventStart,
            endTime: eventEnd,
            groupId: group.id,
            sourceId: `groupSchedule-${group.id}-${date.getTime()}`,
            createdAt: new Date(),
          } as any);
        }
      });
    }
  });

  // Return merged events with stats
  return {
    date,
    events: mergedEvents,
    stats: {
      totalAthletes: athletes.length,
      totalGroups: groups.length,
      trainingsToday: mergedEvents.length,
      pendingTasks: mergedEvents.filter((e) => e.type === "task" && !e.done).length,
      atRiskAthletes: getRedListAthletes().length,
    },
    atRiskAthletes: getRedListAthletes(),
  };
}
