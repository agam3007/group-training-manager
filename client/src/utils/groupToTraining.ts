import type { Group } from "../types/group"
import type { Training } from "../types/training"

export function groupToTrainings(group: Group): Training[] {

  return group.schedule.map(time => ({

    id: crypto.randomUUID(),

    title: group.name,

    description: "",

    sets: [],

    day: time.day,

    startHour: time.hour,

    startMinute: 0,

    duration: 60,

    type: "run",

  }))

}