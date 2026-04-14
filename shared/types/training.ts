export type TrainingType = "swim" | "run" | "bike";

export type SetType = "warmup" | "main" | "cooldown" | "drill";

export type Unit = "m" | "km" | "time" | "reps";

export interface EnduranceSet {
  id: string;

  setType: SetType;

  reps: number;

  mode: "distance" | "time" | "reps"; 
  distance?: number;

  duration?: number;

  unit: Unit;

  rest?: number;

  intensity?: string; 

  equipment?: string;

  notes?: string;
}

export interface StrengthExercise {
  id: string;

  name: string;

    sets: number;
    reps: number;
    weight?: string;
  
}

export type WorkoutStep = EnduranceSet | StrengthExercise;

export interface Training {
  creationDate: Date;

  id: string;

  title: string;

  description: string;

  type: TrainingType;

  steps: WorkoutStep[];

  equipment?: string[];

  notes?: string;

  duration?: number;
}

export type TrainingAssignment = {
  id: string;

  trainingId: string;

  athleteId?: string;
  groupId?: string;

  startTime: Date;
  endTime?: Date;

  notes?: string;

  createdAt: Date;
  updatedAt: Date;
};
