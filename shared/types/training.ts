export type TrainingType = "swim" | "run" | "bike";

export type SetType =
  | "warmup"
  | "main"       // הוסף (נדרש לפארסר)
  | "technique"  // הוסף (נדרש לפארסר)
  | "cooldown"
  | "drill"
  | "steady"
  | "interval2"
  | "interval3"
  | "rampup"
  | "rampdown";

// הרחבת היחידות כדי שיתמכו בכל מה שהפארסר מחלץ מהטקסט
export type Unit = "m" | "km" | "mi" | "min" | "s" | "sec" | "h" | "time" | "reps";

export interface EnduranceSet {
  id: string;
  setType: SetType;
  
  sets?: number; // 🎯 תוקן: נוסף כדי לתמוך במכפיל הראשי (למשל 5 *)
  reps?: number; // תומך במכפיל המשני (למשל 5 * 4 *)

  mode: "distance" | "time" | "reps" | "rest" | "text"; 
  distance?: number;
  duration?: number;
  unit?: Unit;     // מעודכן לתמוך בכל היחידות

  rest?: number;
  intensity?: string; 
  equipment?: string;
  stroke?: string;
  tags?: string[];
  movement?: string;
  notes?: string;
  
  _hasBreakdownLine?: boolean; // 🎯 מומלץ להוסיף: משמש את הפארסר מאחורי הקלעים לשבירת שורות
}

export interface StrengthExercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: string;
}

export type WorkoutStep = EnduranceSet;

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
  folderId?: string;
}

export type TrainingSnapshot = Pick<
  Training,
  "id" | "title" | "description" | "type" | "steps" | "notes" | "duration" | "creationDate"
>;

export type TrainingAssignment = {
  id: string;
  trainingId: string;
  trainingSnapshot?: TrainingSnapshot;
  athleteId?: string;
  groupId?: string;
  startTime: Date;
  endTime?: Date;
  notes?: string;
  status: "ATTENDED" | "MISSED" | "SICK" | "INJURED" | "PENDING" | "LATE";
  createdAt: Date;
  updatedAt: Date;
};