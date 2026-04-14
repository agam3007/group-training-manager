import { env } from "@/env/env";

const API = `${env.apiUrl}/trainings`;

// ==========================
// 📥 GET ALL
// ==========================
export async function getTrainings() {
  const res = await fetch(API);

  if (!res.ok) {
    throw new Error("Failed to fetch trainings");
  }

  return res.json();
}

// ==========================
// 👥 BY GROUP
// ==========================
export async function getTrainingsByGroup(groupId: string) {
  const res = await fetch(`${API}/group/${groupId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch group trainings");
  }

  return res.json();
}

// ==========================
// 🧍 BY ATHLETE
// ==========================
export async function getTrainingsByAthlete(athleteId: string) {
  const res = await fetch(`${API}/athlete/${athleteId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch athlete trainings");
  }

  return res.json();
}

// ==========================
// ➕ CREATE
// ==========================
export async function createTraining(training: any) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(training),
  });

  if (!res.ok) {
    throw new Error("Failed to create training");
  }

  return res.json();
}

// ==========================
// ✏️ UPDATE
// ==========================
export async function updateTraining(id: string, training: any) {
  const res = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(training),
  });

  if (!res.ok) {
    throw new Error("Failed to update training");
  }

  return res.json();
}

// ==========================
// 🗑 DELETE
// ==========================
export async function deleteTraining(id: string) {
  const res = await fetch(`${API}/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete training");
  }

  return res.json();
}
