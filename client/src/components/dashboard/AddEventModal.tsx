import { useState, useEffect } from "react";
import type { CalendarEvent } from "@/shared/types/calendarEvent";
import "./AddEventModal.css";

interface Props {
  onAdd: (event: CalendarEvent) => void;

  onUpdate?: (event: CalendarEvent) => void;

  onClose: () => void;

  event?: CalendarEvent;
}

export default function AddEventModal({
  onAdd,
  onUpdate,
  onClose,
  event,
}: Props) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState<CalendarEvent["type"]>("task");

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setTime(event.startTime.toISOString().slice(0, 10));
      setType(event.type);
    }
  }, [event]);

  const submit = () => {
    if (!title || !time) return;

    // Parse time input (HH:MM format)
    const [hours, minutes] = time.split(':').map(Number);
    
    // Create dates for today
    const today = new Date();
    const startTime = new Date(today);
    startTime.setHours(hours, minutes, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 1); // Add 1 hour

    const newEvent: CalendarEvent = {
      id: event?.id || Date.now().toString(),
      title,
      startTime,
      endTime,
      type,
      createdAt: new Date(), // Always set to current time
      done: event?.done || false,
    };

    if (event) {
      onUpdate?.(newEvent);
    } else {
      onAdd(newEvent);
    }

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{event ? "Edit Event" : "Add Event"}</h3>

        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />

        <select value={type} onChange={(e) => setType(e.target.value as any)}>
          <option value="task">Task</option>

          <option value="call">Call</option>

          <option value="training">Training</option>
        </select>

        <div className="modal-buttons">
          <button onClick={submit}>Save</button>

          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
