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
  Z1: "#90EE90", // Light green - Zone 1 (Active Recovery)
  Z2: "#FFD700", // Gold - Zone 2 (Endurance)
  Z3: "#FFA500", // Orange - Zone 3 (Tempo)
  Z4: "#FF6347", // Tomato - Zone 4 (Threshold)
  Z5: "#DC143C", // Crimson - Zone 5 (Anaerobic)
  "Easy": "#90EE90",
  "Threshold": "#FFA500",
  "Hard": "#DC143C",
};

const INTENSITY_MULTIPLIERS: Record<string, number> = {
  Z1: 0.8,
  Z2: 1.0,
  Z3: 1.2,
  Z4: 1.4,
  Z5: 1.6,
  "Easy": 0.8,
  "Threshold": 1.4,
  "Hard": 1.6,
};

export default function WorkoutVisualizer({ steps, sport, onDropPreset }: Props) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const visualBlocks = useMemo(() => {
    console.log("Generating visual blocks for steps:", steps); // Debugging log to verify input steps
    const blocks: any[] = [];

    steps.forEach((step: any) => {
      const reps = step.reps ?? 1;
      const sets = step.sets ?? 1;
      const totalReps = reps * sets; // Flatten sets/reps for visual blocks

      for (let i = 0; i < totalReps; i++) {
        let durationInSeconds = 60; // Default fallback

        // Normalize duration for width calculations
        if (step.mode === "time" && step.duration) {
           durationInSeconds = step.unit === "h" ? step.duration * 3600 
                             : step.unit === "s" ? step.duration 
                             : step.duration * 60; // Default to minutes
        } else if (step.mode === "distance" && step.distance) {
          const distanceMeters = step.unit === "km" ? step.distance * 1000 : step.distance;
          // Approximate time based on sport to give realistic width relative to time blocks
          if (sport === "run") durationInSeconds = distanceMeters * 0.3; // ~5:00 min/km pace
          else if (sport === "bike") durationInSeconds = distanceMeters * 0.12; // ~30 km/h pace
          else if (sport === "swim") durationInSeconds = distanceMeters * 0.9; // ~1:30 min/100m pace
          else durationInSeconds = distanceMeters * 0.5;
        }

        // Generate Tooltip Text
        const metricsText = step.mode === "time" 
            ? `${step.duration}${step.unit || "min"}` 
            : `${step.distance}${step.unit || "m"}`;
            
        const tooltipText = `${step.setType?.toUpperCase() || "BLOCK"}: ${metricsText} @ ${step.intensity || "Z2"}${step.stroke ? ` (${step.stroke})` : ""}${step.tags?.length > 0 ? ` [${step.tags.join(", ")}]` : ""}`;

        // 🔵 ACTIVE WORK BLOCK
        blocks.push({
          id: `${step.id}-work-${i}`,
          duration: durationInSeconds,
          intensity: step.intensity || "Z2",
          isRest: false,
          tooltip: tooltipText
        });

        // ⚪ REST BLOCK (Only between reps/sets, not after the very last one)
        if (step.rest && step.rest > 0 && i < totalReps - 1) {
          // If the notes explicitly say "stand", "stop", or "passive", render as a flat line
          const isCompleteRest = step.notes?.toLowerCase().includes("stand") || step.notes?.toLowerCase().includes("passive");
          
          blocks.push({
            id: `${step.id}-rest-${i}`,
            duration: step.rest, // Rest is already normalized to seconds by the parser
            isRest: true,
            isCompleteRest: isCompleteRest,
            intensity: "Z1", // Fallback color for active rest
            tooltip: `REST: ${step.rest}s${isCompleteRest ? " (Complete Rest)" : " (Active Recovery)"}`
          });
        }
      }
    });

    // Calculate percentages for flex-basis width
    const totalDuration = blocks.reduce((sum, b) => sum + b.duration, 0);
    return blocks.map((b) => ({
      ...b,
      percent: totalDuration > 0 ? (b.duration / totalDuration) * 100 : 0,
    }));
  }, [steps, sport]);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => setDragOverIndex(null);

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const presetType = e.dataTransfer.getData("presetType") as SetType;
    setDragOverIndex(null);
    if (presetType) onDropPreset?.(presetType, index);
  };
console.log("Visual Blocks:", visualBlocks); // Debugging log to verify block data and tooltips
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
            <p>Drag presets or add text above to visualize the workout</p>
          </div>
        ) : (
          <div className="blocks-container">
            {visualBlocks.map((block, blockIndex) => {
              
              // Base drop zone props to avoid repetition
              const dropZoneProps = (index: number) => ({
                onDragOver: (e: React.DragEvent) => handleDragOver(e, index),
                onDragLeave: handleDragLeave,
                onDrop: (e: React.DragEvent) => handleDrop(e, index)
              });

              // --- REST BLOCK RENDER ---
              if (block.isRest) {
                // Complete Rest -> Flat thin line. Active Rest -> Low grey block
                const height = block.isCompleteRest ? 2 : 20; 
                const bgColor = block.isCompleteRest ? "#9CA3AF" : "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)";
                
                return (
                  <div
                    key={block.id}
                    title={block.tooltip} // Native HTML Tooltip
                    className={`block-wrapper ${block.isCompleteRest ? "complete-rest" : "active-rest"}`}
                    style={{ flex: block.duration, flexBasis: 0 }}
                  >
                    <div className={`drop-zone drop-zone-start ${dragOverIndex === blockIndex ? "active" : ""}`} {...dropZoneProps(blockIndex)} />
                    
                    <div 
                      className="workout-block" 
                      style={{ 
                        height: `${height}px`, 
                        background: bgColor,
                        border: block.isCompleteRest ? "none" : "1px solid #d1d5db"
                      }} 
                    />
                    
                    <div className={`drop-zone drop-zone-end ${dragOverIndex === blockIndex + 1 ? "active" : ""}`} {...dropZoneProps(blockIndex + 1)} />
                  </div>
                );
              }

              // --- ACTIVE WORK BLOCK RENDER ---
              const multiplier = INTENSITY_MULTIPLIERS[block.intensity] || 1;
              const height = 30 + (multiplier * 30); // Base height + scaling
              const color = INTENSITY_COLORS[block.intensity] || "#999";

              return (
                <div
                  key={block.id}
                  title={block.tooltip} // Native HTML Tooltip
                  className="block-wrapper"
                  style={{ flex: block.duration, flexBasis: 0 }}
                >
                  <div className={`drop-zone drop-zone-start ${dragOverIndex === blockIndex ? "active" : ""}`} {...dropZoneProps(blockIndex)} />
                  
                  <div
                    className="workout-block"
                    style={{
                      height: `${height}px`,
                      backgroundColor: color,
                    }}
                  />
                  
                  <div className={`drop-zone drop-zone-end ${dragOverIndex === blockIndex + 1 ? "active" : ""}`} {...dropZoneProps(blockIndex + 1)} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}