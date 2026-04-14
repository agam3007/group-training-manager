import type { Goal } from "./athlete";

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

export type Note = {
  id: string;
  title: string;
  content: string;
  date: string;
};

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
