// types/periodization.ts

import type { TrainingSnapshot } from "./training";

export type SportType = "Triathlon" | "Swimming" | "Running" | "Cycling";

export interface Program {
  id: string;
  name: string;
  assigneeType: "Group" | "Individual";
  assigneeName: string;
  sport: SportType;
  startDate: string; // ISO
  endDate: string;   // ISO
  // Duration can be defined by explicit dates or by number of weeks
  durationType?: "dates" | "weeks";
  weeks?: number;
  mainGoal: string;
  level: "Beginner" | "Intermediate" | "Elite";
  createdAt: string;
  macroEvents?: MacroEvent[];
}

export interface MacroEvent {
  id: string;
  type: "A-Race" | "B-Race" | "Training Camp" | "C-Race" | "Test";
  name: string;
  date: string; // ISO
  endDate?: string; // ISO
  location?: string;
  notes?: string;
}

export interface MesoIntensityDistribution {
  Z1_Z2: number;
  Z3: number;
  Z4_Z5: number;
}

export interface ZoneDistribution {
  Z1: number;
  Z2: number;
  Z3: number;
  Z4: number;
  Z5: number;
}

export interface WeeklyStats {
  weekStart: string; // ISO
  weekEnd: string;   // ISO
  targetVolume: number;
  actualVolume: number;
  targetDistribution: ZoneDistribution;
  actualDistribution: ZoneDistribution;
}

export interface MesoBlock {
  id: string;
  name: string;
  startDate: string; // ISO
  endDate: string;   // ISO
  loadingPattern: "3:1" | "2:1" | "Custom";
  startVolume: number;
  weeklyVolumes: number[];
  intensityDistribution: MesoIntensityDistribution;
  weeklyStats?: WeeklyStats[];
}

export interface MesoPhase {
  id: string;
  phaseType: "Base" | "Build" | "Peak" | "Taper";
  startDate: string;
  endDate: string;
  targetVolumeHours: number;
  loadingPattern: string; // e.g. "3:1"
  intensityDistribution: string; // e.g. "80/20"
}

export interface WeeklyTarget {
  id: string;
  weekStart: string; // ISO
  weekEnd: string;   // ISO
  targetVolumeHours: number;
  focus: string; // e.g. "Endurance", "Speed"
  notes?: string;
}

export interface PlanBlock extends MesoBlock {
  planId?: string;
}

export interface TrainingPlan {
  id: string;
  programId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  blocks: PlanBlock[];
}

// New architecture types for program templates and schedule data
export interface ProgramTemplate {
  id: string;
  name: string;
  sport: SportType;
  durationType: "dates" | "weeks";
  startDate?: string; // required only if durationType === 'dates'
  weeksLength?: number; // required only if durationType === 'weeks'
  assigneeType?: "Group" | "Individual";
  assigneeName?: string;
  mainGoal?: string;
  level?: "Beginner" | "Intermediate" | "Elite";
  createdAt: string;
  macroEvents?: MacroEvent[];
}

export interface ProgramMesoBlock {
  id: string;
  programId: string;
  name: string;
  order: number;
  startWeekNumber: number;
  durationWeeks: number;
  loadingPattern: "3:1" | "2:1" | "Custom";
  intensityDistribution: MesoIntensityDistribution;
}

export interface PlannedWeek {
  id: string;
  mesoBlockId: string;
  weekNumber: number;
  targetVolumeHours: number;
  targetDistribution: ZoneDistribution;
  focus: string;
}

export interface ScheduledWorkout {
  id: string;
  programId: string;
  plannedWeekId: string;
  workoutLibraryId: string;
  trainingSnapshot?: TrainingSnapshot;
  weekNumber: number;
  dayOfWeek: number; // 1-7
  date?: string;
  status: "Planned" | "Completed" | "Missed" | "Skipped";
  actualDuration?: number;
  athleteNotes?: string;
}