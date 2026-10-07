import { api } from "./api";
import type { Program } from "@/shared/types/periodization";

const PROGRAM_API = "/programs";

export async function getPrograms() {
  const response = await api.get<Program[]>(PROGRAM_API);
  return response.data;
}

export async function getProgramById(id: string) {
  const response = await api.get<Program>(`${PROGRAM_API}/${id}`);
  return response.data;
}

export async function createProgram(program: Omit<Program, "id" | "createdAt">) {
  const response = await api.post<Program>(PROGRAM_API, program);
  return response.data;
}

export async function updateProgram(id: string, program: Partial<Program>) {
  const response = await api.put<Program>(`${PROGRAM_API}/${id}`, program);
  return response.data;
}

export async function deleteProgram(id: string) {
  const response = await api.delete(`${PROGRAM_API}/${id}`);
  return response.data;
}
