export interface TrainingTime {
  day: number
  hour: number
}

export interface Group {

  id: string

  name: string

  athletes: string[]
  
  schedule: TrainingTime[]

}