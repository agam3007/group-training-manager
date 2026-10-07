import { useState } from "react";
import type { Note } from "@/shared/types";
import "./QuickInsightWidget.css";

interface Props {
  onSaveNote: (note: Omit<Note, "id" | "createdAt">) => Promise<void>;
}

type NoteCategory = "Technical" | "Injury" | "Next-Session-Focus" | "General";

export default function QuickInsightWidget({ onSaveNote }: Props) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState<NoteCategory>("General");
  const [athleteId, setAthleteId] = useState("");
  const [flagForWorkout, setFlagForWorkout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !athleteId.trim()) return;

    setIsSubmitting(true);
    try {
      await onSaveNote({
        athleteId,
        groupId: "",
        category,
        text,
        flagForWorkoutSelection: flagForWorkout,
      });
      setText("");
      setCategory("General");
      setAthleteId("");
      setFlagForWorkout(false);
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="quick-insight-widget">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="athlete">Athlete ID</label>
          <input
            id="athlete"
            type="text"
            value={athleteId}
            onChange={(e) => setAthleteId(e.target.value)}
            placeholder="Select athlete"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as NoteCategory)}
            disabled={isSubmitting}
          >
            <option value="Technical">Technical</option>
            <option value="Injury">Injury</option>
            <option value="Next-Session-Focus">Next Session Focus</option>
            <option value="General">General</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="text">Note</label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a quick note..."
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group checkbox">
          <input
            id="flag-workout"
            type="checkbox"
            checked={flagForWorkout}
            onChange={(e) => setFlagForWorkout(e.target.checked)}
            disabled={isSubmitting}
          />
          <label htmlFor="flag-workout">Flag for workout selection</label>
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Note"}
        </button>
      </form>
    </div>
  );
}
