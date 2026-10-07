export type AthleteRiskLevel = "safe" | "warning" | "danger";

export interface AthleteCheckInStatus {
  athleteId: string;
  athleteName: string;
  risk: AthleteRiskLevel;
  
  reasons: {
    recentInjury?: {
      description: string;
      reportedAt: Date;
    };
    missedSessions?: {
      count: number;
      lastSessionDate?: Date;
    };
    noContact?: {
      daysSinceContact: number;
      lastContactDate?: Date;
    };
  };
  
  whatsappNumber?: string;
  email?: string;
  lastCheckedAt: Date;
}

export interface DashboardStats {
  totalAthletes: number;
  totalGroups: number;
  trainingsToday: number;
  pendingTasks: number;
  atRiskAthletes: number;
}

export interface TodayTimeline {
  date: Date;
  events: (CalendarEvent & { isOverridden?: boolean })[];
  stats: DashboardStats;
  atRiskAthletes: AthleteCheckInStatus[];
}

import type { CalendarEvent } from "./calendarEvent";
