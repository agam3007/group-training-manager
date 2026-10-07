export type NoteCategory = "Technical" | "Injury" | "Next-Session-Focus" | "General" | "Athlete" | "Group" | "Check-In" | "Other";

export type NoteTargetType = "ATHLETE" | "GROUP" | "ATTENDANCE" | "EVENT";

export interface Note {
  id: string;
  title: string;
  description: string;
  category: NoteCategory;
  
  // Polymorphic target - can link to any entity type
  targetType: NoteTargetType;
  targetId: string;
  
  // Legacy fields - kept for backwards compatibility
  athleteId?: string;
  groupId?: string;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Flag to show this note in calendar workout-picker popup
  flagForWorkoutSelection?: boolean;
}

