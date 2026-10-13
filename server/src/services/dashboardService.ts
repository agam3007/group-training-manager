/**
 * Dashboard Merging Service (F0.1 — Postgres)
 * Handles combining CalendarEvents with EventOverrides and calculating athlete risk status
 */

import type { CalendarEvent, EventOverride, AthleteCheckInStatus, TodayTimeline, DashboardStats } from "@shared/types";
import { listDocs } from "../db";
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
 * Gets unified dashboard data for a specific date
 */
export async function getUnifiedDashboard(date: Date): Promise<TodayTimeline> {
  // Fetch data from Postgres
  const events = await listDocs("events");
  const overrides = await listDocs("event_overrides");
  const athletes = await listDocs("athletes");
  const groups = await listDocs("groups");
  const trainings = await listDocs("trainings");

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
  const atRisk = await getRedListAthletes();
  return {
    date,
    events: mergedEvents,
    stats: {
      totalAthletes: athletes.length,
      totalGroups: groups.length,
      trainingsToday: mergedEvents.length,
      pendingTasks: mergedEvents.filter((e) => e.type === "task" && !e.done).length,
      atRiskAthletes: atRisk.length,
    },
    atRiskAthletes: atRisk,
  };
}