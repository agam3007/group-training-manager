export interface Group {
  id: string;
  name: string;
  type?: 'swimming' | 'running' | 'triathlon';
  schedule: { day:number; hour:number }[]
}