import type { Training, WorkoutStep, SetType, EnduranceSet } from "@/shared/types";
import { useState, useMemo } from "react";

import {
  WorkoutVisualizer,
  WorkoutTextEditor,
  SportMetricSelector,
  PresetSidebar,
} from "./components";
import "./TrainingPopup.css";

interface Props {
  training: Training;
  onSave: (training: Training) => void;
  onClose: () => void;
  groupName?: string;
  onSaveOneTime?: (training: Training) => void;
  onSaveLibrary?: (training: Training) => void;
  isGroupSchedule?: boolean;
}

export default function TrainingPopup({ 
  training, 
  onSave, 
  onClose,
  onSaveOneTime,
  onSaveLibrary,
  isGroupSchedule
}: Props) {
  const [title, setTitle] = useState(training.title || "");
  const [description, setDescription] = useState(training.description || "");
  const [type, setType] = useState(training.type);
  const [steps, setSteps] = useState<WorkoutStep[]>(training.steps || []);
  const [notes, setNotes] = useState(training.notes || "");
  const [editingTitle, setEditingTitle] = useState(false);
  const [metrics, setMetrics] = useState({
    runFormat: "distance" as "time" | "distance",
    bikeMetric: "power" as "time" | "distance" | "power" | "hr",
    swimPoolSize: 25,
    useHR: false,
    usePace: false,
    usePower: false,
  });

  // ========================
  // 🎯 PRESET HANDLING
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

  // ========================
  // 🎯 PRESET HANDLING
  // ========================

  function getDefaultSet(presetType: SetType): EnduranceSet[] {
  const base = {
    intensity: "Z2",
    reps: 1,
  };

  switch (presetType) {
    case "warmup":
      return [
        { ...base, id: crypto.randomUUID(), setType: "warmup", mode: "time", duration: 10, intensity: "Z1" },
      ];

    case "cooldown":
      return [
        { ...base, id: crypto.randomUUID(), setType: "cooldown", mode: "time", duration: 8, intensity: "Z1" },
      ];

    case "steady": // רצף
      return [
        { ...base, id: crypto.randomUUID(), setType: "steady", mode: "time", duration: 20, intensity: "Z2" },
      ];

    case "interval2": // עבודה + מנוחה
      return [
        {
          ...base,
          id: crypto.randomUUID(),
          setType: "interval2",
          reps: 6,
          mode: "time",
          duration: 2,
          rest: 60,
          intensity: "Z4",
        },
      ];

    case "interval3": // עבודה + float + מנוחה
      return [
        {
          ...base,
          id: crypto.randomUUID(),
          setType: "interval3",
          reps: 5,
          mode: "time",
          duration: 3,
          rest: 30,
          intensity: "Z4",
        },
        {
          ...base,
          id: crypto.randomUUID(),
          setType: "steady",
          reps: 5,
          mode: "time",
          duration: 2,
          intensity: "Z2",
        },
      ];

    case "rampup":
      return [
        { ...base, id: crypto.randomUUID(), setType: "rampup", mode: "time", duration: 5, intensity: "Z2" },
        { ...base, id: crypto.randomUUID(), setType: "rampup", mode: "time", duration: 5, intensity: "Z3" },
        { ...base, id: crypto.randomUUID(), setType: "rampup", mode: "time", duration: 5, intensity: "Z4" },
      ];

    case "rampdown":
      return [
        { ...base, id: crypto.randomUUID(), setType: "rampdown", mode: "time", duration: 5, intensity: "Z4" },
        { ...base, id: crypto.randomUUID(), setType: "rampdown", mode: "time", duration: 5, intensity: "Z3" },
        { ...base, id: crypto.randomUUID(), setType: "rampdown", mode: "time", duration: 5, intensity: "Z2" },
      ];

    case "drill":
      return [
        { ...base, id: crypto.randomUUID(), setType: "drill", mode: "distance", distance: 200, unit: "m", intensity: "Z1" },
      ];

    default:
      return [];
  }
}

function addPreset(presetType: SetType) {
  const newSets = getDefaultSet(presetType);
  setSteps((prev) => [...prev, ...newSets]);
}

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const presetType = e.dataTransfer.getData("presetType") as SetType;
    if (presetType) {
      addPreset(presetType);
    }
  }

function insertPresetAt(type: SetType, index: number) {
  const newSets = getDefaultSet(type);

  setSteps((prev) => {
    const updated = [...prev];
    updated.splice(index, 0, ...newSets);
    return updated;
  });
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
    const updatedTraining: Training = {
      ...training,
      title,
      description,
      type,
      steps,
      notes,
      creationDate: training.creationDate,
      id: training.id,
    };
    
    if (isGroupSchedule && onSaveOneTime) {
      // Will be handled by the button click
      return;
    }
    
    onSave(updatedTraining);
    onClose();
  };

  // ========================
  // 🎨 UI
  // ========================

  return (
    <div className="popup" onClick={onClose}>
      <div className="training-popup" onClick={(e) => e.stopPropagation()}>
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

        {/* SPORT TYPE & METRICS */}
        <SportMetricSelector 
          sport={type} 
          onSportChange={setType}
          metrics={metrics} 
          onMetricsChange={setMetrics}
        />

        <div className="training-body">
          {/* LEFT SIDEBAR */}
          <PresetSidebar 
            onAdd={addPreset}
            onDragStart={() => {
              // Optional: handle drag start
            }}
          />

          {/* CENTER CONTENT */}
          <div className="training-center">
            {/* TOP: WORKOUT VISUALIZER */}
            <div className="right-top">
              <h4>Workout Visualization</h4>
       <WorkoutVisualizer 
  steps={steps} 
  sport={type}
  totalDuration={summary.totalDuration}
  onDropPreset={insertPresetAt}
/>
            </div>

            {/* BOTTOM: WORKOUT TEXT EDITOR */}
            <div 
              className="right-bottom"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <WorkoutTextEditor 
                steps={steps} 
                setSteps={setSteps} 
                sport={type}
              />
            </div>
          </div>

          {/* RIGHT STATS PANEL */}
          <div className="training-stats-panel">
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
              <span className="zones-title">Intensity Distribution</span>

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
        <div className="section">
          <label>Notes</label>
          <textarea
            className="input notes-textarea"
            placeholder="Add any additional notes for this workout..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

          </div>
        </div>
        
        {/* FOOTER */}
        <div className="training-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>

          {isGroupSchedule && onSaveOneTime && onSaveLibrary ? (
            <>
              <button 
                className="save-btn secondary" 
                onClick={() => {
                  const updatedTraining: Training = {
                    ...training,
                    title,
                    description,
                    type,
                    steps,
                    notes,
                    creationDate: training.creationDate,
                    id: training.id,
                  };
                  onSaveLibrary(updatedTraining);
                }}
              >
                Save to Library & Schedule
              </button>
              <button 
                className="save-btn" 
                onClick={() => {
                  const updatedTraining: Training = {
                    ...training,
                    title,
                    description,
                    type,
                    steps,
                    notes,
                    creationDate: training.creationDate,
                    id: training.id,
                  };
                  onSaveOneTime(updatedTraining);
                }}
              >
                Save & Schedule (One-time)
              </button>
            </>
          ) : (
            <button className="save-btn" onClick={save}>
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
