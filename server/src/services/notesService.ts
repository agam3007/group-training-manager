/**
 * Notes Service
 * Handles polymorphic note operations for all entity types
 */

import { readDb, writeDb } from "../utils/fileDb";
import type { Note, NoteTargetType } from "@shared/types/note";

/**
 * Get all notes for a specific target (ATHLETE, GROUP, ATTENDANCE, or EVENT)
 */
export function getNotesByTarget(targetType: NoteTargetType, targetId: string): Note[] {
  const db = readDb();
  const notes = db.notes || [];
  
  return notes
    .filter((note: any) => {
      // Check new polymorphic system
      if (note.targetType === targetType && note.targetId === targetId) {
        return true;
      }
      
      // Backwards compatibility - old system
      if (targetType === "ATHLETE" && note.athleteId === targetId) {
        return true;
      }
      if (targetType === "GROUP" && note.groupId === targetId) {
        return true;
      }
      
      return false;
    })
    .sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Newest first
    });
}

/**
 * Get recent notes for a target (limited)
 */
export function getRecentNotesByTarget(
  targetType: NoteTargetType,
  targetId: string,
  limit: number = 5
): Note[] {
  return getNotesByTarget(targetType, targetId).slice(0, limit);
}

/**
 * Get notes filtered by category for a specific target
 */
export function getNotesByTargetAndCategory(
  targetType: NoteTargetType,
  targetId: string,
  category: string
): Note[] {
  return getNotesByTarget(targetType, targetId).filter(
    (note: any) => note.category === category
  );
}

/**
 * Create a new polymorphic note
 */
export function createNote(noteData: {
  title: string;
  description: string;
  category: string;
  targetType: NoteTargetType;
  targetId: string;
  flagForWorkoutSelection?: boolean;
}): Note {
  const db = readDb();
  
  if (!db.notes) {
    db.notes = [];
  }

  const now = new Date();
  const newNote: Note = {
    id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: noteData.title,
    description: noteData.description,
    category: noteData.category as any,
    targetType: noteData.targetType,
    targetId: noteData.targetId,
    createdAt: now,
    updatedAt: now,
    flagForWorkoutSelection: noteData.flagForWorkoutSelection || false,
  };

  db.notes.push(newNote);
  writeDb(db);

  return newNote;
}

/**
 * Update an existing note
 */
export function updateNote(noteId: string, updates: Partial<Note>): Note | null {
  const db = readDb();
  const notes = db.notes || [];
  
  const index = notes.findIndex((n: any) => n.id === noteId);
  if (index === -1) return null;

  const updated: Note = {
    ...notes[index],
    ...updates,
    updatedAt: new Date(),
  };

  notes[index] = updated;
  db.notes = notes;
  writeDb(db);

  return updated;
}

/**
 * Delete a note
 */
export function deleteNote(noteId: string): boolean {
  const db = readDb();
  const notes = db.notes || [];
  
  const index = notes.findIndex((n: any) => n.id === noteId);
  if (index === -1) return false;

  notes.splice(index, 1);
  db.notes = notes;
  writeDb(db);

  return true;
}

/**
 * Get a single note by ID
 */
export function getNoteById(noteId: string): Note | null {
  const db = readDb();
  const notes = db.notes || [];
  const note = notes.find((n: any) => n.id === noteId);
  return note || null;
}

/**
 * Get all notes (for admin purposes)
 */
export function getAllNotes(): Note[] {
  const db = readDb();
  return (db.notes || []).sort((a: any, b: any) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });
}
