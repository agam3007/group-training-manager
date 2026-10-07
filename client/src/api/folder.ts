import { env } from "@/env/env";
import type { Folder } from "@/shared/types";
const API = `${env.apiUrl}/folders`;

// ==========================
// 📥 GET all folders
// ==========================
export async function getFolders(): Promise<Folder[]> {
  const response = await fetch(`${API}`);
  if (!response.ok) {
    throw new Error("Failed to fetch folders");
  }
  return response.json();
}

// ==========================
// 📥 GET folder by ID
// ==========================
export async function getFolderById(id: string): Promise<Folder> {
  const response = await fetch(`${API}/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch folder ${id}`);
  }
  return response.json();
}

// ==========================
// ➕ CREATE folder
// ==========================
export async function createFolder(name: string): Promise<Folder> {
  const response = await fetch(`${API}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error("Failed to create folder");
  }

  return response.json();
}

// ==========================
// ✏️ UPDATE folder
// ==========================
export async function updateFolder(
  id: string,
  data: Partial<Folder>,
): Promise<Folder> {
  const response = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update folder ${id}`);
  }

  return response.json();
}

// ==========================
// 🗑 DELETE folder
// ==========================
export async function deleteFolder(id: string): Promise<void> {
  const response = await fetch(`${API}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete folder ${id}`);
  }
}
