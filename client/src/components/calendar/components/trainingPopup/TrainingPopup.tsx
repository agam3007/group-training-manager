import type { Training, WorkoutStep } from "@/shared/types";
import { useState, useMemo } from "react";

import {WorkoutBuilder} from "./workoutBuilder";
import {TrainingTypeSelector} from "./trainingTypeSelector";
import "./TrainingPopup.css";

interface Props {
  training: Training;
  onSave: (training: Training) => void;
  onClose: () => void;
}

export default function TrainingPopup({ training, onSave, onClose }: Props) {
  const [title, setTitle] = useState(training.title || "");
  const [description, setDescription] = useState(training.description || "");
  const [type, setType] = useState(training.type);
  const [steps, setSteps] = useState<WorkoutStep[]>(training.steps || []);
  const [equipment, setEquipment] = useState<string[]>(
    training.equipment || [],
  );
  const [notes, setNotes] = useState(training.notes || "");
  const [editingTitle, setEditingTitle] = useState(false);

  // ========================
  // 🔢 CALCULATIONS
  // ========================

  function calculateSummary(steps: WorkoutStep[]) {
    let totalDistance = 0;
    let totalDuration = 0;

    const zones: Record<string, number> = {};

    steps.forEach((step) => {
      if (!("mode" in step)) return;

      const s = step as any;
      const reps = s.reps ?? 1;

      if (s.mode === "distance") {
        const distance = s.distance ?? 0;

        const dist =
          s.unit === "km" ? distance * reps : (distance * reps) / 1000;

        totalDistance += dist;

        if (s.duration) {
          totalDuration += s.duration * reps;
        }

        if (s.intensity) {
          zones[s.intensity] = (zones[s.intensity] ?? 0) + dist;
        }
      }

      if (s.mode === "time") {
        const time = (s.duration ?? 0) * reps;
        totalDuration += time;

        if (s.intensity) {
          zones[s.intensity] = (zones[s.intensity] ?? 0) + time;
        }
      }
    });

    return { totalDistance, totalDuration, zones };
  }

  function getZonePercentages(zones: Record<string, number>, total: number) {
    const result: Record<string, number> = {};

    if (!zones) return result;

    Object.keys(zones).forEach((zone) => {
      result[zone] = total > 0 ? (zones[zone] / total) * 100 : 0;
    });

    return result;
  }

  function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s
        .toString()
        .padStart(2, "0")}`;
    }

    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const summary = useMemo(() => {
    const data = calculateSummary(steps);

    const isDistanceBased = data.totalDistance > 0;
    const total = isDistanceBased ? data.totalDistance : data.totalDuration;

    const zonePercentages = getZonePercentages(data.zones, total);

    return {
      ...data,
      isDistanceBased,
      zonePercentages,
    };
  }, [steps]);

  // ========================
  // 💾 SAVE
  // ========================

  const save = () => {
    onSave({
      ...training,
      title,
      description,
      type,
      steps,
      equipment,
      notes,
    });

    onClose();
  };

  // ========================
  // 🎨 UI
  // ========================

  return (
    <div className="popup">
      <div className="training-popup">
        {/* HEADER */}
        <div className="training-header">
          <div className="training-title-edit">
            {!editingTitle ? (
              <h2
                onClick={() => setEditingTitle(true)}
                className="training-title-text"
              >
                {title || "New Training"}
              </h2>
            ) : (
              <input
                autoFocus
                className="training-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setEditingTitle(false);
                  }
                }}
              />
            )}
          </div>

          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* TYPE */}
        <TrainingTypeSelector value={type} onChange={setType} />

        {/* GOAL */}
        <div className="section">
          <label>what the workout goal?</label>
          <input
            className="input"
            placeholder="write here..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* BODY */}
        <div className="training-body">
          {/* LEFT */}
          <div className="training-left">
            <div className="workout-header">
              <span>Workout Details</span>
            </div>

            <WorkoutBuilder steps={steps} setSteps={setSteps} sport={type} />
          </div>

          {/* RIGHT */}
          <div className="training-right">
            {/* STATS */}
            <div className="stats">
              <div>
                <b>
                  {summary.totalDistance > 0
                    ? `${summary.totalDistance.toFixed(2)} km`
                    : "-"}
                </b>
                <span>Distance</span>
              </div>

              <div>
                <b>{formatTime(summary.totalDuration)}</b>
                <span>Time</span>
              </div>

              <div>
                <b>{Object.keys(summary.zonePercentages).length}</b>
                <span>Zones</span>
              </div>
            </div>

            {/* ZONES */}
            <div className="zones-section">
              <span>Intensity Distribution</span>

              {Object.entries(summary.zonePercentages).map(
                ([zone, percent]) => (
                  <div key={zone} className="zone-row">
                    <div className="zone-label">{zone}</div>

                    <div className="zone-bar">
                      <div
                        className="zone-fill"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="zone-percent">{percent.toFixed(1)}%</div>
                  </div>
                ),
              )}
            </div>

            {/* NOTES */}
            <div className="notes-header">
              <span>Notes</span>
            </div>

            <textarea
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="training-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>

          <button className="save-btn" onClick={save}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
