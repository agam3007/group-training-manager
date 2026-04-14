import { useState, useEffect } from "react";
import type { DayEvent } from "../../../../shared/types/dayEvent";
import "./AddEventModal.css";

interface Props {
  onAdd: (event: DayEvent) => void;

  onUpdate?: (event: DayEvent) => void;

  onClose: () => void;

  event?: DayEvent;
}

export default function AddEventModal({
  onAdd,
  onUpdate,
  onClose,
  event,
}: Props) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState<"task" | "call" | "training">("task");

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setTime(event.time);
      setType(event.type);
    }
  }, [event]);

  const submit = () => {
    if (!title || !time) return;

    const newEvent: DayEvent = {
      id: event?.id || Date.now().toString(),

      title,

      time,

      type,

      date: event?.date || new Date().toISOString().slice(0, 10),

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
