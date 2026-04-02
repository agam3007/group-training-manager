export interface Athlete {

  id: string
  name: string
  level: string

  age?: number
  experience?: number

  phone?: string
  email?: string
  parentPhone?: string

  height?: number
  weight?: number

  restingHR?: number
  maxHR?: number

  zones?: {
    hr?: number[]
    pace?: number[]
    power?: number[]
  }

  tests?: Test[]
  goals?: Goal[]

  injuries?: string
  medicalNotes?: string
  injured?: boolean
  injuryType?: string
  limitations?: string
  focus?: string
  notes?: string
}

export type Goal = {
  id: string
  title: string
  type: "general" | "race"
  raceName?: string
  location?: string
  target?: string
  date: string
  createdAt: string
    plan?: {
  pacing?:string
  nutritionPre?:string
  nutritionDuring?:string
  hydration?:string
  gear?:string
  schedule?:string
  notes?:string
}

review?: {
  actualPacing?:string
  actualNutrition?:string
  whatWorked?:string
  whatNot?:string
  notes?:string
}
  done?: boolean
}

export type Test = {
  id: string
  sport: "run" | "bike" | "swim"
  type: string
  value: number
  date: string
  zones: any
}