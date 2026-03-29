export interface Group {
  id: string;
  name: string;
  type?: 'swimming' | 'running' | 'triathlon';
  athletes: string[]
  schedule: { day:number; hour:number }[]
}