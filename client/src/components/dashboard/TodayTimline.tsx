import { useState } from "react";
import type { CalendarEvent } from "@/shared/types";
import AddEventModal from "./AddEventModal";
import "./TodayTimline.css";

interface Props {
  events: CalendarEvent[];

  onAdd: (event: CalendarEvent) => void;

  onUpdate: (event: CalendarEvent) => void;

  onDelete: (id: string) => void;

  onToggleDone: (id: string) => void;

  ghostedEvents?: CalendarEvent[];
}

export default function TodayTimelineSchedule({
  events,
  onAdd,
  onUpdate,
  onDelete,
  onToggleDone,
}: Props) {
  const [open, setOpen] = useState(false);

  const [editing, setEditing] = useState<CalendarEvent | null>(null);

  // Convert string dates to Date objects
  const normalizeEvents = (evts: CalendarEvent[]) => {
    return evts.map((e) => ({
      ...e,
      startTime: typeof e.startTime === 'string' ? new Date(e.startTime) : e.startTime,
      endTime: typeof e.endTime === 'string' ? new Date(e.endTime) : e.endTime,
    }));
  };

  const sorted = [...normalizeEvents(events)].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  const color = (type: string) => {
    if (type === "training") return "#22c55e";
    if (type === "task") return "#f59e0b";
    if (type === "call") return "#3b82f6";

    return "#94a3b8";
  };
  return (
    <div className="timeline-card">
      <div className="timeline-header">
        <h3>Today's Schedule</h3>

        <button className="add-btn" onClick={() => setOpen(true)}>
          +
        </button>
      </div>

      <div className="timeline">
        {sorted.map((e) => (
          <div key={e.id} className="timeline-item">
            <div className="timeline-time">{e.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>

            <div className="timeline-dot" />

            <div
              className={`timeline-event ${e.done ? "done" : ""}`}
              style={{
                borderLeft: `4px solid ${color(e.type)}`,
              }}
            >
              <div className="event-title">{e.title}</div>

              <div className="event-type">{e.type}</div>

              <div className="event-actions">
                <button onClick={() => onToggleDone(e.id)}>✓</button>

                <button onClick={() => setEditing(e)}>Edit</button>

                <button onClick={() => onDelete(e.id)}>🗑</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <AddEventModal
          onClose={() => setOpen(false)}
          onAdd={(event) => {
            onAdd(event);
            setOpen(false);
          }}
        />
      )}

      {editing && (
        <AddEventModal
          event={editing}
          onClose={() => setEditing(null)}
          onAdd={() => {}}
          onUpdate={(event) => {
            onUpdate(event);

            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
