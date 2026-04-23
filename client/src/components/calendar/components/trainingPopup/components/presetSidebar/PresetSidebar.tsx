import { useState } from "react";
import type { SetType } from "@/shared/types";
import "./PresetSidebar.css";

interface Preset {
  type: SetType;
  icon: string;
  label: string;
  description: string;
  color: string;
}

const PRESETS: Preset[] = [
  {
    type: "warmup",
    icon: "🔥",
    label: "Warmup",
    description: "Easy warm-up",
    color: "#FFD700",
  },
  {
    type: "steady",
    icon: "➡️",
    label: "רצף",
    description: "Steady continuous effort",
    color: "#6BCB77",
  },
  {
    type: "interval2",
    icon: "↔️",
    label: "2-Step Interval",
    description: "Work + rest repeated",
    color: "#FF8C42",
  },
  {
    type: "interval3",
    icon: "🔁",
    label: "3-Step Interval",
    description: "Work + float + rest",
    color: "#FF6B6B",
  },
  {
    type: "rampup",
    icon: "📈",
    label: "Ramp Up",
    description: "Increasing intensity",
    color: "#4D96FF",
  },
  {
    type: "rampdown",
    icon: "📉",
    label: "Ramp Down",
    description: "Decreasing intensity",
    color: "#4D96FF",
  },
  {
    type: "cooldown",
    icon: "❄️",
    label: "Cooldown",
    description: "Recovery",
    color: "#87CEEB",
  },
  {
    type: "drill",
    icon: "🎯",
    label: "Drill",
    description: "Technique work",
    color: "#9370DB",
  },
];

interface Props {
  onAdd: (type: SetType) => void;
  onDragStart?: () => void;
}

export default function PresetSidebar({ onAdd, onDragStart }: Props) {
  const [hoveredType, setHoveredType] = useState<SetType | null>(null);

  const handleDragStart = (type: SetType, e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("presetType", type);
    onDragStart?.();
  };

  return (
    <div className="preset-sidebar">
      <div className="sidebar-header">
        <h4>Presets</h4>
      </div>

      <div className="sidebar-content">
        {PRESETS.map((preset) => (
          <div
            key={preset.type}
            className={`preset-item ${hoveredType === preset.type ? "hovered" : ""}`}
            onMouseEnter={() => setHoveredType(preset.type)}
            onMouseLeave={() => setHoveredType(null)}
            draggable
            onDragStart={(e) => handleDragStart(preset.type, e)}
          >
            <div
              className="preset-icon"
              style={{ backgroundColor: preset.color }}
              title={preset.description}
            >
              {preset.icon}
            </div>
            <div className="preset-label">{preset.label}</div>
            <button
              className="preset-add-btn"
              onClick={() => onAdd(preset.type)}
              title={`Add ${preset.label}`}
            >
              +
            </button>
          </div>
        ))}
      </div>

      <div className="sidebar-hint">
        <p className="hint-text">Drag presets to the right panel or click + to add</p>
      </div>
    </div>
  );
}
