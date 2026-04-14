import { useState } from "react";
import "./AddGoalModal.css";

type Props = {
  onClose: () => void;
  onAdd: (goal: any) => void;
};

export default function AddGoalModal({ onClose, onAdd }: Props) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"general" | "race">("general");

  const [raceName, setRaceName] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [target, setTarget] = useState("");

  const handleAdd = () => {
    const goal = {
      id: Date.now().toString(),
      title,
      type,
      raceName: type === "race" ? raceName : null,
      location: type === "race" ? location : null,
      date: type === "race" ? date : null,
      target,
      createdAt: new Date().toISOString(),
      done: false,
    };

    onAdd(goal);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Add Goal</h3>

        {/* TYPE */}
        <select value={type} onChange={(e) => setType(e.target.value as any)}>
          <option value="general">General</option>
          <option value="race">Race</option>
        </select>

        {/* TITLE */}
        <input
          placeholder="Goal title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* RACE FIELDS */}
        {type === "race" && (
          <>
            <input
              placeholder="Race name"
              value={raceName}
              onChange={(e) => setRaceName(e.target.value)}
            />

            <input
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </>
        )}

        {/* TARGET */}
        <input
          placeholder="Target (e.g. 45:00 / podium / finish)"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />

        {/* ACTIONS */}
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleAdd}>Add</button>
        </div>
      </div>
    </div>
  );
}
