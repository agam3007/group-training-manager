import {CalendarEvent} from "./calendarEvent";
import type { Training, TrainingAssignment } from "@/shared/types";
import type { Event } from "@/types/event";
import type { Group } from "@/shared/types";
import {
  createAssignment,
  updateAssignment,
} from "@/api/trainingAssignment";
import { useParams } from "react-router-dom";
import "./CalendarGrid.css";

interface Props {
  events: Event[];
  // setTrainings: React.Dispatch<React.SetStateAction<Training[]>>
  onEdit: (training: Training) => void;
  onEmptyCellClick: (day: number, hour: number) => void;
  weekOffset: number;
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  setAssignments: React.Dispatch<React.SetStateAction<any[]>>;
}

const hours = Array.from({ length: 16 }, (_, i) => i + 6);
const days = new Array(7).fill(null);

const cellHeight =
  document.querySelector(".hour-cell")?.getBoundingClientRect().height || 60;

const PIXELS_PER_MINUTE = cellHeight / 60;
const START_HOUR = 5;

function CurrentTimeLine() {
  const now = new Date();

  const hour = now.getHours();
  const minute = now.getMinutes();

  if (hour < START_HOUR) return null;

  const top = (hour - START_HOUR) * cellHeight + minute * PIXELS_PER_MINUTE;
  return <div className="current-time-line" style={{ top }} />;
}

export default function CalendarGrid({
  events,
  onEmptyCellClick,
  weekOffset,
  setGroups,
  setAssignments,
}: Props) {
  const { groupId, athleteId } = useParams();

  const handleDrop = async (e: React.DragEvent, newDay: number) => {
    console.log("🔥 DROP EVENT:", { newDay, data: e.dataTransfer, events });
    e.preventDefault();

    const id = e.dataTransfer.getData("id");
    const trainingData = e.dataTransfer.getData("training");

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;

    const minutesFromTop = y / PIXELS_PER_MINUTE;
    const hour = Math.floor(minutesFromTop / 60) + START_HOUR;
    const minute = Math.round((minutesFromTop % 60) / 15) * 15;

    // 🟢 build start of week
    const today = new Date();
    const currentDay = (today.getDay() + 6) % 7;

    const startOfWeek = new Date(today);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(today.getDate() - currentDay + weekOffset * 7);

    // 🟢 build exact day
    const start = new Date(startOfWeek);
    start.setDate(startOfWeek.getDate() + newDay);

    // 🟢 set snapped time
    start.setHours(hour, minute, 0, 0);

    // 🟢 end
    const end = new Date(start.getTime() + 60 * 60000);

    // =========================
    // 🟢 UPDATE EXISTING EVENT
    // =========================
    if (id) {
      const event = events.find((ev) => ev.id === id);

      if (event?.type === "group") {
        setGroups((prev) =>
          prev.map((g) => {
            if (g.id !== event.groupId) return g;

            const newSchedule = [...g.schedule];
            const s = newSchedule[event.scheduleRef];

            newSchedule[event.scheduleRef] = {
              ...s,
              day: newDay,
              start: { hour, min: minute },
              end: {
                hour: hour + 1,
                min: minute,
              },
            };

            return {
              ...g,
              schedule: newSchedule,
            };
          }),
        );
      }

      // 🔥 UPDATE assignment
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                startTime: start,
                endTime: end,
              }
            : a,
        ),
      );
      await updateAssignment(id, { startTime: start, endTime: end });

      return;
    }

    // =========================
    // 🔵 CREATE NEW ASSIGNMENT
    // =========================
    if (trainingData) {
      const training = JSON.parse(trainingData);

      const newAssignment = {
        id: crypto.randomUUID(),

        trainingId: training.id,

        groupId: groupId || undefined,
        athleteId: athleteId || undefined,

        startTime: start,
        endTime: end,

        createdAt: new Date(),
        updatedAt: new Date(),
      } as TrainingAssignment;

      console.log("🔥 CREATE NEW ASSIGNMENT:", newAssignment);

      setAssignments((prev) => [...prev, newAssignment]);

      // 🔥 אם יש API:
      await createAssignment(newAssignment);
    }
  };

  return (
    <>
      {days.map((_, dayIndex) => {
        const today = new Date();

        const todayIndex = (today.getDay() + 6) % 7;
        console.log(events);

        const isToday = weekOffset === 0 && dayIndex === todayIndex;
        return (
          <div
            key={dayIndex}
            className={`day-column ${isToday ? "today-column" : ""}`}
            data-day={dayIndex}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, dayIndex)}
          >
            {isToday && <CurrentTimeLine />}

            {hours.map((hour) => (
              <div
                key={hour}
                className="hour-cell"
                onClick={() => onEmptyCellClick(dayIndex, hour)}
              />
            ))}
            {events
              .filter((e) => {
                const day = (e.start.getDay() + 6) % 7;
                return day === dayIndex;
              })
              .map((event) => {
                return (
                  <div
                    key={event.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("id", event.id)}
                  >
                    <CalendarEvent
                      event={event || {}}
                      setGroups={setGroups}
                      setAssignments={setAssignments}
                      // onClick={() => {}}
                    />
                  </div>
                );
              })}
          </div>
        );
      })}
    </>
  );
}
