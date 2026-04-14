import { env } from "@/env/env";
import type { TrainingAssignment } from "@/shared/types/training";

const API = `${env.apiUrl}/training-assignments`;

// ==========================
// GET (with filters)
// ==========================
export const getAssignments = async (params?: {
  athleteId?: string;
  groupId?: string;
  trainingId?: string;
}) => {
  const query = new URLSearchParams();

  if (params?.athleteId) query.append("athleteId", params.athleteId);
  if (params?.groupId) query.append("groupId", params.groupId);
  if (params?.trainingId) query.append("trainingId", params.trainingId);

  const res = await fetch(`${API}?${query.toString()}`);

  return res.json();
};

// ==========================
// GET by id
// ==========================
export const getAssignmentById = async (id: string) => {
  const res = await fetch(`${API}/${id}`);
  return res.json();
};

// ==========================
// CREATE
// ==========================
export const createAssignment = async (data: TrainingAssignment) => {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to create assignment");
  }

  return res.json();
};

// ==========================
// UPDATE
// ==========================
export const updateAssignment = async (
  id: string,
  data: Partial<TrainingAssignment>,
) => {
  const res = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to update assignment");
  }

  return res.json();
};

// ==========================
// DELETE
// ==========================
export const deleteAssignment = async (id: string) => {
  const res = await fetch(`${API}/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to delete assignment");
  }

  return res.json();
};
