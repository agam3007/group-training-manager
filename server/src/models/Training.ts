export interface Training {
  id: string;
  date: string;
  type: 'swimming' | 'running' | 'cycling';
  content: string;
  groupId?: string;
  athleteId?: string;
}