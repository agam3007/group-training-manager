export interface DayEvent {
  id: string;

  type: "training" | "task" | "call";

  time: string;

  title: string;

  date: string;

  athleteId?: string;

  groupId?: string;

  done?: boolean;
}
