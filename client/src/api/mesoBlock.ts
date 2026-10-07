import { api } from "./api";
import type { ProgramMesoBlock } from "@/shared/types/periodization";

const MESO_BLOCK_API = "/meso-blocks";

export async function getMesoBlocksByProgramId(programId: string) {
  const response = await api.get<ProgramMesoBlock[]>(`${MESO_BLOCK_API}?programId=${encodeURIComponent(programId)}`);
  return response.data;
}

export async function getMesoBlockById(id: string) {
  const response = await api.get<ProgramMesoBlock>(`${MESO_BLOCK_API}/${id}`);
  return response.data;
}

export async function createMesoBlock(block: Omit<ProgramMesoBlock, "id">) {
  const response = await api.post<ProgramMesoBlock>(MESO_BLOCK_API, block);
  return response.data;
}

export async function updateMesoBlock(id: string, block: Partial<ProgramMesoBlock>) {
  const response = await api.put<ProgramMesoBlock>(`${MESO_BLOCK_API}/${id}`, block);
  return response.data;
}

export async function deleteMesoBlock(id: string) {
  const response = await api.delete(`${MESO_BLOCK_API}/${id}`);
  return response.data;
}
