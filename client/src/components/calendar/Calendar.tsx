import "./Calendar.css";

import {WeeklyHeader, DaySummeryRow, TimeColumn, CalendarGrid, Library, TrainingPopup, TrainingDetails} from "./components";

import { useState } from "react";
import type { Training, TrainingAssignment } from "@/shared/types/training";
import {
  createTraining,
  deleteTraining,
  updateTraining,
} from "@/api/training";
import type { Event } from "@/types/event";
import type { Group, TrainingTime } from "@/shared/types";

interface Props {
  trainings: Training[];
  setTrainings: React.Dispatch<React.SetStateAction<Training[]>>;
  assignments?: TrainingAssignment[];
  setAssignments: React.Dispatch<React.SetStateAction<TrainingAssignment[]>>;
  groups?: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
}

function buildDateFromSchedule(s: any, weekOffset: number) {
  const today = new Date();

  const day = (today.getDay() + 6) % 7;

  const startOfWeek = new Date(today);
  startOfWeek.setHours(0, 0, 0, 0); // 🔥 חשוב
  startOfWeek.setDate(today.getDate() - day + weekOffset * 7);

  const date = new Date(startOfWeek);
  date.setDate(startOfWeek.getDate() + Number(s.day));

  date.setHours(s.start.hour, s.start.min || 0, 0, 0);
  return date;
}

function buildEndDateFromSchedule(s: any, weekOffset: number) {
  const start = buildDateFromSchedule(s, weekOffset);

  return new Date(start.getTime() + (s.duration || 60) * 60000);
}

export default function Calendar({
  trainings,
  setTrainings,
  assignments,
  setAssignments,
  groups,
  setGroups,
}: Props) {
  const [viewing, setViewing] = useState<Training | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const [editing, setEditing] = useState<Training | null>(null);

  const [selectedCell, setSelectedCell] = useState<{
    day: number;
    hour: number;
  } | null>(null);

  const today = new Date();

  const startOfWeek = new Date(today);

  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  startOfWeek.setDate(today.getDate() + diff + weekOffset * 7);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const handleEmptyCellClick = (day: number, hour: number) => {
    const newTraining: Training = {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      type: "swim",
      equipment: [],
      steps: [],
      notes: "",
      creationDate: new Date(),
    };

    setSelectedCell({ day, hour });
    setEditing(newTraining);
  };

  return (
    <div className="calendar">
      <Library
        trainings={trainings}
        onAdd={() => {
          const newTraining: Training = {
            id: crypto.randomUUID(),
            title: "",
            description: "",
            duration: 60,
            type: "swim",
            creationDate: new Date(),
            equipment: [],
            steps: [],
            notes: "",
          };

          setEditing(newTraining);
        }}
        onSelect={(t) => setViewing(t)}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <div className="calendar-nav">
          <button onClick={() => setWeekOffset((w) => w - 1)}>◀</button>

          <button onClick={() => setWeekOffset(0)}>Today</button>

          <button onClick={() => setWeekOffset((w) => w + 1)}>▶</button>

          <div className="week-range">
            {startOfWeek.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}

            {" - "}

            {endOfWeek.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
        <WeeklyHeader weekOffset={weekOffset} />
        <DaySummeryRow />

        <div className="calendar-body">
          <TimeColumn />

          <CalendarGrid
            events={
              // If we have assignments, convert them to event-like trainings
              assignments && assignments.length > 0
                ? assignments.map((a) => {
                    const t = trainings.find((tt) => tt.id === a.trainingId);
                    return {
                      id: a.id,
                      title: t?.title || "",
                      description: t?.description || "",
                      type: t?.type || "swim",
                      start: new Date(a.startTime),
                      end: new Date(
                        a.endTime ||
                          new Date(
                            a.startTime.getTime() +
                              (t?.duration || 60) * 60 * 1000,
                          ),
                      ),
                      groupId: a.groupId || "",
                      trainingId: a.trainingId || "",
                    } as Event;
                  })
                : groups && groups.length > 0
                  ? (groups.flatMap((g) =>
                      (g.schedule || []).map((s: TrainingTime, i) => {
                        const start = buildDateFromSchedule(s, weekOffset);
                        const end = buildEndDateFromSchedule(s, weekOffset);

                        return {
                          id: `${g.id}-${s.day}-${s.start.hour}-${s.start.min}`,
                          title: g.name,
                          description: "",
                          type: "group",

                          start,
                          end,

                          groupId: g.id,
                          scheduleRef: i,
                        };
                      }),
                    ) as Event[])
                  : []
            }
            setAssignments={setAssignments}
            setGroups={setGroups}
            onEdit={setEditing}
            onEmptyCellClick={handleEmptyCellClick}
            weekOffset={weekOffset}
          />
        </div>

        {editing && (
          <TrainingPopup
            training={editing}
            onClose={() => setEditing(null)}
            onSave={async (updated) => {
              const exists = trainings.find((t) => t.id === updated.id);

              try {
                // 🆕 יצירה חדשה
                if (!exists) {
                  const created = await createTraining(updated);

                  setTrainings((prev) => [...prev, created]);
                } else {
                  const updatedTraining = await updateTraining(
                    updated.id,
                    updated,
                  );
                  setTrainings((prev) =>
                    prev.map((t) =>
                      t.id === updated.id ? updatedTraining : t,
                    ),
                  );
                }

                setEditing(null);
              } catch (err) {
                console.error("Failed to save training", err);
              }
            }}
          />
        )}
      </div>
      {viewing && (
        <TrainingDetails
          training={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setEditing(viewing);
            setViewing(null);
          }}
          onDelete={async (id) => {
            try {
              await deleteTraining(id);

              setTrainings((prev) => prev.filter((t) => t.id !== id));

              setViewing(null);
            } catch (err) {
              console.error("Delete failed", err);
            }
          }}
        />
      )}
    </div>
  );
}
