import type { Goal } from "./athlete";
import type { Note } from "./note";

export interface TrainingTime {
  day: number;
  start: {
    hour: number;
    min: number;
  };
  end: {
    hour: number;
    min: number;
  };
}

export interface Group {
  id: string;

  name: string;

  coach: string;

  description?: string;

  level: string;

  sport: string;

  goals?: Goal[];

  maxAthletes?: number;

  color?: string;

  notes?: Note[];

  schedule: TrainingTime[];
}
