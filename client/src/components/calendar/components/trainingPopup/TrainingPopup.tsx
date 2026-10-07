import type { Training, WorkoutStep, SetType, EnduranceSet } from "@/shared/types";
import { useState, useMemo } from "react";

import {
  WorkoutVisualizer,
  WorkoutTextEditor,
  SportMetricSelector,
} from "./components";
import "./TrainingPopup.css";

type PopupMode = "normal" | "libraryNew" | "libraryEdit" | "calendarSchedule";

interface Props {
  training: Training;
  onSave: (training: Training) => void;
  onClose: () => void;
  groupName?: string;
  onSaveOneTime?: (training: Training) => void;
  onSaveLibrary?: (training: Training) => void;
  isGroupSchedule?: boolean;
  mode?: PopupMode;
  onSaveAsNew?: (training: Training) => void;
  onUpdateExisting?: (training: Training) => void;
  onDeleteTraining?: (training: Training) => void | Promise<void>;
}

export default function TrainingPopup({ 
  training, 
  onSave, 
  onClose,
  onSaveOneTime,
  onSaveLibrary,
  isGroupSchedule,
  mode = "normal",
  onSaveAsNew,
  onUpdateExisting,
  onDeleteTraining,
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
  // 🎯 CALCULATION LOGIC
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
        const dist = s.unit === "km" ? distance * reps : (distance * reps) / 1000;
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
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  // ========================
  // 🎯 PRESET HANDLING
  // ========================

  function getDefaultSet(presetType: SetType): EnduranceSet[] {
    const base = { intensity: "Z2", reps: 1 };

    switch (presetType) {
      case "warmup":
        return [{ ...base, id: crypto.randomUUID(), setType: "warmup", mode: "time", duration: 10, intensity: "Z1" }];
      case "cooldown":
        return [{ ...base, id: crypto.randomUUID(), setType: "cooldown", mode: "time", duration: 8, intensity: "Z1" }];
      case "steady":
        return [{ ...base, id: crypto.randomUUID(), setType: "steady", mode: "time", duration: 20, intensity: "Z2" }];
      case "interval2":
        return [{ ...base, id: crypto.randomUUID(), setType: "interval2", reps: 6, mode: "time", duration: 2, rest: 60, intensity: "Z4" }];
      case "interval3":
        return [
          { ...base, id: crypto.randomUUID(), setType: "interval3", reps: 5, mode: "time", duration: 3, rest: 30, intensity: "Z4" },
          { ...base, id: crypto.randomUUID(), setType: "steady", reps: 5, mode: "time", duration: 2, intensity: "Z2" }
        ];
      case "rampup":
        return [
          { ...base, id: crypto.randomUUID(), setType: "rampup", mode: "time", duration: 5, intensity: "Z2" },
          { ...base, id: crypto.randomUUID(), setType: "rampup", mode: "time", duration: 5, intensity: "Z3" },
          { ...base, id: crypto.randomUUID(), setType: "rampup", mode: "time", duration: 5, intensity: "Z4" }
        ];
      case "rampdown":
        return [
          { ...base, id: crypto.randomUUID(), setType: "rampdown", mode: "time", duration: 5, intensity: "Z4" },
          { ...base, id: crypto.randomUUID(), setType: "rampdown", mode: "time", duration: 5, intensity: "Z3" },
          { ...base, id: crypto.randomUUID(), setType: "rampdown", mode: "time", duration: 5, intensity: "Z2" }
        ];
      case "drill":
        return [{ ...base, id: crypto.randomUUID(), setType: "drill", mode: "distance", distance: 200, unit: "m", intensity: "Z1" }];
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
  // 💾 SAVE ACTION
  // ========================

  const buildUpdatedTraining = (): Training => ({
    ...training,
    title,
    description,
    type,
    steps,
    notes,
    creationDate: training.creationDate,
    id: training.id,
  });

  const save = () => {
    if (isGroupSchedule && onSaveOneTime) return;
    
    onSave(buildUpdatedTraining());
    onClose();
  };

  return (
    <div className="popup" onClick={onClose}>
      <div className="training-popup" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="training-header">
          <div className="training-title-edit">
            {!editingTitle ? (
              <h2 onClick={() => setEditingTitle(true)} className="training-title-text">
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
                  if (e.key === "Enter") setEditingTitle(false);
                }}
              />
            )}
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* SPORT TYPE & METRICS */}
        <SportMetricSelector 
          sport={type} 
          onSportChange={setType}
          metrics={metrics} 
          onMetricsChange={setMetrics}
        />

        {/* WORKOUT INTERFACE WORKSPACE */}
        <div className="training-workspace">
          
          {/* TWO-COLUMN LAYOUT (Text Editor Left / Stats Right) */}
          <div className="training-body" style={{ display: "flex", gap: "20px" }}>
            
            {/* LEFT: TEXT EDITOR PANEL */}
            <div className="training-left" style={{ flex: 1 }} onDragOver={handleDragOver} onDrop={handleDrop}>
              <WorkoutTextEditor 
                steps={steps} 
                setSteps={setSteps} 
                sport={type}
              />
            </div>

            {/* RIGHT: REAL-TIME DATA STATS PANEL */}
            <div className="training-stats-panel" style={{ width: "320px", display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* PRIMARY HIGH-LEVEL STATS */}
              <div className="stats" style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <b>{summary.totalDistance > 0 ? `${summary.totalDistance.toFixed(2)} km` : "-"}</b>
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

              {/* INTENSITY ZONE BREAKDOWNS */}
              <div className="zones-section">
                <span className="zones-title">Intensity Distribution</span>
                {Object.entries(summary.zonePercentages).map(([zone, percent]) => (
                  <div key={zone} className="zone-row">
                    <div className="zone-label">{zone}</div>
                    <div className="zone-bar">
                      <div className="zone-fill" style={{ width: `${percent}%` }} />
                    </div>
                    <div className="zone-percent">{percent.toFixed(1)}%</div>
                  </div>
                ))}
              </div>

              {/* COACH EXTRA CONTEXT NOTES */}
              <div className="section">
                <label>Description</label>
                <textarea
                  className="input notes-textarea"
                  placeholder="Add a short workout description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
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

          {/* BOTTOM: DATA VISUALIZATION GRAPHICS ACCORDION */}
          <div className="training-visualization" style={{ marginTop: "20px", width: "100%" }}>
            <WorkoutVisualizer 
              steps={steps} 
              sport={type}
              totalDuration={summary.totalDuration}
              onDropPreset={insertPresetAt}
            />
          </div>

        </div>
        
        {/* FOOTER ACTIONS */}
        <div className="training-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>

          {mode === "libraryNew" ? (
            <button className="save-btn" onClick={() => onSave(buildUpdatedTraining())}>
              Save to Library
            </button>
          ) : mode === "libraryEdit" ? (
            <>
              {onDeleteTraining && (
                <button
                  className="save-btn danger"
                  onClick={() => onDeleteTraining(buildUpdatedTraining())}
                >
                  Delete From Library
                </button>
              )}
              <button 
                className="save-btn secondary" 
                onClick={() => onSaveAsNew?.(buildUpdatedTraining())}
              >
                Save as New Training
              </button>
              <button 
                className="save-btn" 
                onClick={() => onUpdateExisting?.(buildUpdatedTraining())}
              >
                Update Existing
              </button>
            </>
          ) : mode === "calendarSchedule" ? (
            <>
              {onDeleteTraining && (
                <button
                  className="save-btn danger"
                  onClick={() => onDeleteTraining(buildUpdatedTraining())}
                >
                  Remove From Calendar
                </button>
              )}
              <button 
                className="save-btn secondary" 
                onClick={() => onSaveLibrary?.(buildUpdatedTraining())}
              >
                Schedule & Save to Library
              </button>
              <button 
                className="save-btn" 
                onClick={() => onSaveOneTime?.(buildUpdatedTraining())}
              >
                Schedule One-time
              </button>
            </>
          ) : isGroupSchedule && onSaveOneTime && onSaveLibrary ? (
            <>
              <button 
                className="save-btn secondary" 
                onClick={() => onSaveLibrary(buildUpdatedTraining())}
              >
                Save to Library & Schedule
              </button>
              <button 
                className="save-btn" 
                onClick={() => onSaveOneTime(buildUpdatedTraining())}
              >
                Save & Schedule (One-time)
              </button>
            </>
          ) : (
            <>
              {onDeleteTraining && (
                <button
                  className="save-btn danger"
                  onClick={() => onDeleteTraining(buildUpdatedTraining())}
                >
                  Delete From Library
                </button>
              )}
              <button className="save-btn" onClick={save}>Add</button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}