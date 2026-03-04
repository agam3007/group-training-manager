import { Group } from '../models/Group';
import { Athlete } from '../models/Athlete';
import { Training } from '../models/Training';

export const db = {
  groups: [] as Group[],
  athletes: [] as Athlete[],
  trainings: [] as Training[]
};