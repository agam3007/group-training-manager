export interface Athlete {

  id:string

  name:string

  level:string

  age?:number

  experience?:number

  phone?:string

  email?:string

  parentPhone?:string

  groups:string[]

  height?:number

  weight?:number

  restingHR?:number

  maxHR?:number

  zones?:{

    hr?:number[]

    pace?:number[]

    power?:number[]

  }

tests?:Test[]
  goals?:Goal[]

  injuries?:string

  medicalNotes?:string

  injured?:boolean

  injuryType?:string

  limitations?:string

  focus?:string

  notes?:string

}

export type Goal = {

  id:string

  title:string

  target?:string

  date?:string

  done?:boolean

}

export type PersonalBest = {

  id:string

  label:string

  value:string

  date?:string

}

export type Test = {
  id:string
  sport:"run"|"bike"|"swim"
  type:string // 5k / ftp / 400m
  value:number // תמיד בשניות או וואטים
  date:string
  zones:any
}