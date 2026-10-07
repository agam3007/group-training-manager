import { env } from "@/env/env";
import type { TodayTimeline } from "@/shared/types";

const API = `${env.apiUrl}/dashboard`;

// ==========================
// GET dashboard data for today
// ==========================
export async function getDashboardToday(): Promise<TodayTimeline> {
  const res = await fetch(`${API}/today`);
  if (!res.ok) throw new Error("Failed to fetch dashboard data for today");
  return res.json();
}

// ==========================
// GET dashboard data for specific date
// ==========================
export async function getDashboardByDate(date: Date): Promise<TodayTimeline> {
  const dateString = date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
  const res = await fetch(`${API}/${dateString}`);
  if (!res.ok) throw new Error(`Failed to fetch dashboard data for ${dateString}`);
  return res.json();
}
