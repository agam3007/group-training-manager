export type TrainingType =
  | "swim"
  | "run"
  | "bike"
  | "strength"

export type SetType =
  | "warmup"
  | "main"
  | "cooldown"

export type Unit =
  | "m"
  | "km"
  | "time"

export interface EnduranceSet{

  id:string

  setType:SetType

  reps:number

  distance:number

  unit:Unit

  rest?:number

  intensityValue?:string

  equipment?:string

  notes?:string

}

export interface StrengthExercise{

  id:string

  name:string

  blocks:{
    sets:number
    reps:number
    weight?:string
  }[]

}

export type WorkoutStep =
  | EnduranceSet
  | StrengthExercise

export interface Training{
    date: ReactNode

  id:string

  title:string

  groupId:string

  description:string

  type:TrainingType

  steps:WorkoutStep[]

  equipment?:string[]

  notes?:string

   day:number

  startHour:number
  startMinute:number

}
