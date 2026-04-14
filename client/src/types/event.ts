export interface Event {
  id: string;
  title: string;
  description: string;
  type?: string;
  start: Date;
  end: Date;
  day?: number;
  groupId?: string;
  athleteId?: string;

  trainingId?: string;
  assignmentId?: string;
  scheduleRef?: any;
}
