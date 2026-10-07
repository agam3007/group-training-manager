import { api } from "./api";
import type { ProgramTemplate } from "@/shared/types/periodization";

const PROGRAM_TEMPLATE_API = "/program-templates";

export async function createProgramTemplate(template: Omit<ProgramTemplate, "id">) {
  const response = await api.post<ProgramTemplate>(PROGRAM_TEMPLATE_API, template);
  return response.data;
}

export async function getProgramTemplates() {
  const response = await api.get<ProgramTemplate[]>(PROGRAM_TEMPLATE_API);
  return response.data;
}

export async function getProgramTemplateById(id: string) {
  const response = await api.get<ProgramTemplate>(`${PROGRAM_TEMPLATE_API}/${id}`);
  return response.data;
}

export async function updateProgramTemplate(id: string, template: Partial<ProgramTemplate>) {
  const response = await api.put<ProgramTemplate>(`${PROGRAM_TEMPLATE_API}/${id}`, template);
  return response.data;
}

export async function deleteProgramTemplate(id: string) {
  const response = await api.delete(`${PROGRAM_TEMPLATE_API}/${id}`);
  return response.data;
}
