export interface CalendarEvent {
  id: string

  type: "run" | "bike" | "swim" | "strength" | "training" | "task" | "checkin" | "call" | "groupSchedule"

  title: string

  startTime: Date
  endTime: Date

  athleteId?: string
  groupId?: string

  sourceId?: string

  createdAt: Date
}

export interface EventOverride {
  id: string; // מזהה החריגה
  sourceId: string; // ה-ID של הלו"ז המקורי (למשל ה-GroupSchedule ID)
  
  // המפתח המזהה: באיזה תאריך ושעה המופע המקורי היה אמור לקרות?
  originalStartTime: Date; 

  // האם האירוע בוטל?
  isCancelled?: boolean;

  // שדות לדריסה (אופציונליים)
  modifiedTitle?: string;
  modifiedStartTime?: Date;
  modifiedEndTime?: Date;
  modifiedLocation?: string;

  createdAt: Date;
}