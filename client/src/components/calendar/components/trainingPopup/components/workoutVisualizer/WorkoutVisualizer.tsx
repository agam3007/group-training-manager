import { useMemo, useState } from "react";
import type { SetType, WorkoutStep } from "@/shared/types";
import "./WorkoutVisualizer.css";

interface Props {
  steps: WorkoutStep[];
  sport: "swim" | "run" | "bike" | "strength";
  totalDuration?: number;
  onStepClick?: (step: WorkoutStep) => void;
  onDropPreset?: (presetType: SetType, index: number) => void;
}

const INTENSITY_COLORS: Record<string, string> = {
  Z1: "#90EE90", // Light green - Zone 1
  Z2: "#FFD700", // Gold - Zone 2
  Z3: "#FFA500", // Orange - Zone 3
  Z4: "#FF6347", // Tomato - Zone 4
  Z5: "#DC143C", // Crimson - Zone 5
  "Easy": "#90EE90",
  "Threshold": "#FFA500",
  "Hard": "#FF6347",
};

const INTENSITY_MULTIPLIERS: Record<string, number> = {
  Z1: 0.8,
  Z2: 1.0,
  Z3: 1.2,
  Z4: 1.4,
  Z5: 1.6,
  "Easy": 0.8,
  "Threshold": 1.2,
  "Hard": 1.6,
};

export default function WorkoutVisualizer({ steps, sport, onStepClick, totalDuration, onDropPreset }: Props) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const visualBlocks = useMemo(() => {
    const blocks: any[] = [];

    steps.forEach((step) => {
      const s = step as any;
      const reps = s.reps ?? 1;

      for (let i = 0; i < reps; i++) {
        let duration = 1;

        if (s.mode === "distance") {
          const distance = s.distance ?? 0;
          if (sport === "run") duration = distance * 5;
          else if (sport === "bike") duration = distance * 2;
          else if (sport === "swim") duration = distance * 2;
          else duration = 5;
        }

        if (s.mode === "time") {
          duration = s.duration ?? 60;
        }

        // 🔵 BLOCK
        blocks.push({
          id: `${s.id}-${i}`,
          duration,
          intensity: s.intensity || "Z2",
          label:
            s.mode === "time"
              ? `${Math.round(duration)}m`
              : `${s.distance}${s.unit || ""}`,
          isRest: false,
        });

        // ⚪ REST (רק בין חזרות)
        if (s.rest && i < reps - 1) {
          blocks.push({
            id: `${s.id}-rest-${i}`,
            duration: s.rest / 60,
            isRest: true,
          });
        }
      }
    });

    const total = blocks.reduce((sum, b) => sum + b.duration, 0);
    return blocks.map((b) => ({
      ...b,
      percent: (b.duration / total) * 100,
    }));
  }, [steps, sport]);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const presetType = e.dataTransfer.getData("presetType") as SetType;
    setDragOverIndex(null);
    
    if (presetType) {
      onDropPreset?.(presetType, index);
    }
  };

  return (
    <div className="workout-visualizer">
      <div className="visualizer-container">
        {visualBlocks.length === 0 ? (
          <div 
            className="empty-state"
            onDragOver={(e) => handleDragOver(e, 0)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 0)}
          >
            <p>Drag presets from the left sidebar or add steps to visualize your workout</p>
          </div>
        ) : (
          <div className="blocks-container">
            {visualBlocks.map((block, blockIndex) => {
              if (block.rest) {
                return (
                  <div
                    key={block.id}
                    className="rest-block-wrapper"
                    style={{
                      flex: block.duration,
                      flexBasis: 0,
                    }}
                  >
                    {/* DROP ZONE OVERLAY - START */}
                    <div
                      className={`drop-zone drop-zone-start ${dragOverIndex === blockIndex ? "active" : ""}`}
                      onDragOver={(e) => handleDragOver(e, blockIndex)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, blockIndex)}
                    />
                    
                    <div className="rest-block" />
                    
                    {/* DROP ZONE OVERLAY - END */}
                    <div
                      className={`drop-zone drop-zone-end ${dragOverIndex === blockIndex + 1 ? "active" : ""}`}
                      onDragOver={(e) => handleDragOver(e, blockIndex + 1)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, blockIndex + 1)}
                    />
                  </div>
                );
              }

              const multiplier = INTENSITY_MULTIPLIERS[block.intensity] || 1;
              const height = 30 + multiplier * 20;
              const color = INTENSITY_COLORS[block.intensity] || "#999";

              return (
                <div
                  key={block.id}
                  className="block-wrapper"
                  style={{
                    flex: block.duration,
                    flexBasis: 0,
                  }}
                >
                  {/* DROP ZONE OVERLAY - START */}
                  <div
                    className={`drop-zone drop-zone-start ${dragOverIndex === blockIndex ? "active" : ""}`}
                    onDragOver={(e) => handleDragOver(e, blockIndex)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, blockIndex)}
                  />
                  
                  <div
                    className="workout-block"
                    style={{
                      height: `${height}px`,
                      backgroundColor: color,
                    }}
                  />
                  
                  {/* DROP ZONE OVERLAY - END */}
                  <div
                    className={`drop-zone drop-zone-end ${dragOverIndex === blockIndex + 1 ? "active" : ""}`}
                    onDragOver={(e) => handleDragOver(e, blockIndex + 1)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, blockIndex + 1)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
