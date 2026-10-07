import { api } from "./api";
import type { ScheduledWorkout } from "@/shared/types/periodization";

const SCHEDULED_WORKOUT_API = "/scheduled-workouts";

interface ScheduledWorkoutQuery {
  programId?: string;
  plannedWeekId?: string;
}

export async function getScheduledWorkouts(query: ScheduledWorkoutQuery = {}) {
  const params = new URLSearchParams();
  if (query.programId) params.set("programId", query.programId);
  if (query.plannedWeekId) params.set("plannedWeekId", query.plannedWeekId);
  const queryString = params.toString() ? `?${params.toString()}` : "";
  const response = await api.get<ScheduledWorkout[]>(`${SCHEDULED_WORKOUT_API}${queryString}`);
  return response.data;
}

export async function getScheduledWorkoutById(id: string) {
  const response = await api.get<ScheduledWorkout>(`${SCHEDULED_WORKOUT_API}/${id}`);
  return response.data;
}

export async function createScheduledWorkout(workout: Omit<ScheduledWorkout, "id">) {
  const response = await api.post<ScheduledWorkout>(SCHEDULED_WORKOUT_API, workout);
  return response.data;
}

export async function updateScheduledWorkout(id: string, workout: Partial<ScheduledWorkout>) {
  const response = await api.put<ScheduledWorkout>(`${SCHEDULED_WORKOUT_API}/${id}`, workout);
  return response.data;
}

export async function deleteScheduledWorkout(id: string) {
  const response = await api.delete(`${SCHEDULED_WORKOUT_API}/${id}`);
  return response.data;
}
