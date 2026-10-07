import { api } from "./api";
import type { PlannedWeek } from "@/shared/types/periodization";

const PLANNED_WEEK_API = "/planned-weeks";

export async function getPlannedWeeks(mesoBlockId: string) {
  const response = await api.get<PlannedWeek[]>(`${PLANNED_WEEK_API}?mesoBlockId=${encodeURIComponent(mesoBlockId)}`);
  return response.data;
}

export async function getPlannedWeekById(id: string) {
  const response = await api.get<PlannedWeek>(`${PLANNED_WEEK_API}/${id}`);
  return response.data;
}

export async function createPlannedWeek(week: Omit<PlannedWeek, "id">) {
  const response = await api.post<PlannedWeek>(PLANNED_WEEK_API, week);
  return response.data;
}

export async function updatePlannedWeek(id: string, week: Partial<PlannedWeek>) {
  const response = await api.put<PlannedWeek>(`${PLANNED_WEEK_API}/${id}`, week);
  return response.data;
}

export async function deletePlannedWeek(id: string) {
  const response = await api.delete(`${PLANNED_WEEK_API}/${id}`);
  return response.data;
}
