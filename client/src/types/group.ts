export interface TrainingTime {
  day: number
  hour: number
}

export type Note = {
  id: string
  title: string
  content: string
  date: string
}

export type Goal = {
  id: string
  title: string
  location?: string
  date?: string
}

export interface Group {

  id: string

  name: string

  coach: string

  description?: string

  level: string

  sport: string

  goals?: Goal[]

  maxAthletes?: number

  color?: string

  notes?: Note[] // 🔥 זה מה שהיה חסר

  schedule: TrainingTime[]

}