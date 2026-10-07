import { api } from "./api";
import type { PlanBlock, TrainingPlan } from "@/shared/types/periodization";

const PLAN_API = "/plans";
const BLOCK_API = "/blocks";

export async function getPlans() {
  const response = await api.get<TrainingPlan[]>(PLAN_API);
  return response.data;
}

export async function getPlanById(id: string) {
  const response = await api.get<TrainingPlan>(`${PLAN_API}/${id}`);
  return response.data;
}

export async function createPlan(plan: Omit<TrainingPlan, "id" | "createdAt" | "updatedAt">) {
  const response = await api.post<TrainingPlan>(PLAN_API, plan);
  return response.data;
}

export async function updatePlan(id: string, plan: Partial<TrainingPlan>) {
  const response = await api.put<TrainingPlan>(`${PLAN_API}/${id}`, plan);
  return response.data;
}

export async function deletePlan(id: string) {
  const response = await api.delete(`${PLAN_API}/${id}`);
  return response.data;
}

export async function getBlocks(planId?: string) {
  const query = planId ? `?planId=${encodeURIComponent(planId)}` : "";
  const response = await api.get<PlanBlock[]>(`${BLOCK_API}${query}`);
  return response.data;
}

export async function getBlockById(id: string) {
  const response = await api.get<PlanBlock>(`${BLOCK_API}/${id}`);
  return response.data;
}

export async function createBlock(block: Omit<PlanBlock, "id">) {
  const response = await api.post<PlanBlock>(BLOCK_API, block);
  return response.data;
}

export async function updateBlock(id: string, block: Partial<PlanBlock>) {
  const response = await api.put<PlanBlock>(`${BLOCK_API}/${id}`, block);
  return response.data;
}

export async function deleteBlock(id: string) {
  const response = await api.delete(`${BLOCK_API}/${id}`);
  return response.data;
}
