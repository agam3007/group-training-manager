import type { EnduranceSet, TrainingType, SetType, Unit } from "@/shared/types";

export interface ParsedWorkout {
  blocks: EnduranceSet[];
  errors: string[];
}

// 🎯 הגדרנו במפורש שהערכים כאן הם מטיפוס SetType
const BLOCK_ALIASES: Record<string, SetType> = {
  wu: "warmup", warmup: "warmup",
  cd: "cooldown", cooldown: "cooldown",
  d: "drill", drill: "drill",
  main: "main", "main set": "main", set: "main",
  technique: "technique", "pre set": "technique", prep: "technique", tech: "technique"
};

const EQUIPMENT_TAGS = [
  "paddles", "pullbuoy", "fins", "snorkel", 
  "band", "kickboard", "shoes", "belt", "parachute"
];

const STROKE_ALIASES: Record<string, string> = {
  freestyle: "FR", free: "FR", fr: "FR",
  backstroke: "BK", back: "BK", bk: "BK",
  breaststroke: "BR", breast: "BR", br: "BR",
  butterfly: "FLY", fly: "FLY", fl: "FLY",
  medley: "IM", im: "IM", mix: "MIX"
};

const MOVEMENT_ALIASES: Record<string, string> = {
  run: "Run", running: "Run",
  walk: "Walk", walking: "Walk",
  jog: "Jog", jogging: "Jog"
};

// --- פונקציות עזר להמרת מידות (נרמול) ---
function normalizeMinutes(val: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u === "s" || u === "sec") return val / 60;
  if (u === "h") return val * 60;
  return val;
}

function normalizeMeters(val: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u === "km") return val * 1000;
  if (u === "mi") return val * 1609.34;
  return val;
}

function unnormalizeMeters(val: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u === "km") return val / 1000;
  if (u === "mi") return val / 1609.34;
  return val;
}

export function parseWorkoutText(text: string, sport: TrainingType): ParsedWorkout {
  const blocks: EnduranceSet[] = [];
  const errors: string[] = [];
  
  // 🎯 הוגדר כ-SetType
  let currentBlockType: SetType = "warmup";

  if (!text.trim()) return { blocks, errors };

  const lines = text.split(/\n/).map((line) => line.trim());
  let currentGroupBlock: EnduranceSet | null = null;

  lines.forEach((line, idx) => {
    if (!line) {
      currentGroupBlock = null;
      return;
    }

    try {
      const headerMatch = line.toLowerCase().replace(/[:\-]/g, "").trim();
      if (BLOCK_ALIASES[headerMatch]) {
        currentBlockType = BLOCK_ALIASES[headerMatch];
        currentGroupBlock = null; 
        return;
      }

      const block = parseWorkoutLine(line, sport, currentBlockType);
      
      if (block) {
        const isLoneMultiplier = block.mode === "text" && !block.notes && ((block.reps && block.reps > 1) || (block.sets && block.sets > 1));

        if (isLoneMultiplier) {
          currentGroupBlock = block;
          blocks.push(block);
          return;
        }

        if (currentGroupBlock) {
          if (block.mode === "distance" && block.distance) {
            if (currentGroupBlock.mode !== "distance" && currentGroupBlock.mode !== "time") {
              currentGroupBlock.mode = "distance";
              currentGroupBlock.distance = 0;
              currentGroupBlock.unit = block.unit;
            }
            if (currentGroupBlock.mode === "distance") {
              const addedMeters = normalizeMeters(block.distance, block.unit || "m");
              const currentMeters = normalizeMeters(currentGroupBlock.distance || 0, currentGroupBlock.unit || "m");
              currentGroupBlock.distance = unnormalizeMeters(currentMeters + addedMeters, currentGroupBlock.unit || "m");
            }
          }

          if (block.mode === "time" && block.duration) {
            if (currentGroupBlock.mode !== "time" && currentGroupBlock.mode !== "distance") {
              currentGroupBlock.mode = "time";
              currentGroupBlock.duration = 0;
              currentGroupBlock.unit = "min";
            }
            if (currentGroupBlock.mode === "time") {
              const addedMins = normalizeMinutes(block.duration, block.unit || "min");
              currentGroupBlock.duration = (currentGroupBlock.duration || 0) + addedMins;
            }
          }

          currentGroupBlock.notes = currentGroupBlock.notes ? `${currentGroupBlock.notes}\n${line}` : line;
          currentGroupBlock._hasBreakdownLine = true;
          return; 
        }

        const prevBlock = blocks[blocks.length - 1];
        if (prevBlock && block.reps === 1 && prevBlock.mode === block.mode) {
          const isMatch = block.mode === "distance" 
            ? prevBlock.distance === block.distance 
            : prevBlock.duration === block.duration;

          if (isMatch) {
            prevBlock.notes = prevBlock.notes ? `${prevBlock.notes}\n${block.notes}` : block.notes;
            if (block.stroke && !prevBlock.stroke) prevBlock.stroke = block.stroke;
            if (block.movement && !prevBlock.movement) prevBlock.movement = block.movement;
            if (block.tags && block.tags.length > 0) prevBlock.tags = [...new Set([...(prevBlock.tags || []), ...block.tags])];
            prevBlock._hasBreakdownLine = true; 
            return; 
          }
        }
        
        blocks.push(block);
      }
    } catch (error) {
      if (error instanceof Error) errors.push(`Line ${idx + 1}: ${error.message}`);
    }
  });

  return { blocks, errors };
}

// 🎯 שינוי החתימה ל-SetType
function parseWorkoutLine(line: string, sport: TrainingType, currentBlockType: SetType): EnduranceSet | null {
  let workStr = line;
  
  // 🎯 מוגדר כ-Partial כדי שנוכל לבנות את האובייקט בהדרגה ללא שגיאות TS
  const set: Partial<EnduranceSet> = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    setType: currentBlockType,
    reps: 1,
    tags: [],
    notes: ""
  };

  const repsRegex = /^(\d+)\s*[xX*]\s*(?:(\d+)\s*[xX*]\s*)?/;
  const repsMatch = workStr.match(repsRegex);
  if (repsMatch) {
    const val1 = parseInt(repsMatch[1], 10);
    const val2 = repsMatch[2] ? parseInt(repsMatch[2], 10) : null;
    
    if (val2) { set.sets = val1; set.reps = val2; } 
    else { set.reps = val1; }
    workStr = workStr.replace(repsRegex, "");
  }

  const rawNote = workStr.trim();
  const hasParentheses = /[()]/.test(rawNote); 

  const restRegex = /\b(?:R:|REST\s*)(\d+(?:\.\d+)?)\s*(MIN|M|S|SEC)?\b/gi;
  const restMatches = [...workStr.matchAll(restRegex)];
  if (restMatches.length > 0) {
    const lastRest = restMatches[restMatches.length - 1];
    const val = parseFloat(lastRest[1]);
    const unit = (lastRest[2] || "s").toLowerCase();
    set.rest = unit.startsWith("m") ? val * 60 : val;
    workStr = workStr.replace(restRegex, "");
  }

  const intensityRegex = /\b(Z[1-5]|EASY|THRESHOLD|HARD|ALLOUT|MAX|FAST|SPRINT|SLOW)\b/gi;
  const intensityMatches = workStr.match(intensityRegex);
  if (intensityMatches) {
    set.intensity = intensityMatches[0].toUpperCase();
    workStr = workStr.replace(intensityRegex, "");
  }

  const strokeKeys = Object.keys(STROKE_ALIASES).join("|");
  const strokeRegex = new RegExp(`\\b(${strokeKeys})\\b`, "gi");
  const strokeMatch = workStr.match(strokeRegex);
  if (strokeMatch) {
    set.stroke = STROKE_ALIASES[strokeMatch[0].toLowerCase()];
    workStr = workStr.replace(strokeRegex, "");
  }

  const movementKeys = Object.keys(MOVEMENT_ALIASES).join("|");
  const movementRegex = new RegExp(`\\b(${movementKeys})\\b`, "gi");
  const movementMatch = workStr.match(movementRegex);
  if (movementMatch) {
    set.movement = MOVEMENT_ALIASES[movementMatch[0].toLowerCase()];
    workStr = workStr.replace(movementRegex, "");
  }

  EQUIPMENT_TAGS.forEach(tag => {
    const tagRegex = new RegExp(`\\b${tag}s?\\b`, "gi");
    if (tagRegex.test(workStr)) {
      set.tags!.push(tag); // ה-! מציין ל-TS שהמערך הוגדר למעלה
      workStr = workStr.replace(tagRegex, "");
    }
  });

  const metricRegex = /(\d+:\d+(?:\.\d+)?|\d+(?:\.\d+)?)(?:\s*(m|km|mi|min|s|sec|h)\b)?/gi;
  const metricMatches = [...workStr.matchAll(metricRegex)];
  const isComposite = metricMatches.length > 1;

  if (isComposite || hasParentheses) {
    let totalDistMeters = 0;
    let totalTimeMins = 0;
    
    // 🎯 הגדרת משתני יחידות מטיפוס Unit
    let distUnit: Unit = "m";
    let timeUnit: Unit = "min";
    
    const distMetrics: {val: number, norm: number, unit: Unit}[] = [];
    const timeMetrics: {val: number, norm: number, unit: Unit}[] = [];

    metricMatches.forEach(m => {
      const valStr = m[1];
      let v = 0;
      if (valStr.includes(':')) {
        const [mins, secs] = valStr.split(':');
        v = parseInt(mins, 10) + (parseFloat(secs) / 60);
      } else {
        v = parseFloat(valStr);
      }

      // 🎯 השלכה (Casting) לטיפוס Unit
      let u = (m[2] || "").toLowerCase() as Unit;
      if (!u) u = (valStr.includes(':') ? "min" : "m") as Unit;

      if (["min", "s", "sec", "h"].includes(u)) {
        timeMetrics.push({val: v, norm: normalizeMinutes(v, u), unit: u});
      } else {
        distMetrics.push({val: v, norm: normalizeMeters(v, u), unit: u});
      }
    });

    if (distMetrics.length > 1) {
      const firstDistNorm = distMetrics[0].norm; 
      const sumRestDistNorm = distMetrics.slice(1).reduce((acc, curr) => acc + curr.norm, 0); 
      if (Math.abs(firstDistNorm - sumRestDistNorm) < 0.001) {
        totalDistMeters = firstDistNorm;
      } else {
        totalDistMeters = firstDistNorm + sumRestDistNorm;
      }
      distUnit = distMetrics[0].unit;
    } else if (distMetrics.length === 1) {
      totalDistMeters = distMetrics[0].norm;
      distUnit = distMetrics[0].unit;
    }

    if (timeMetrics.length > 1) {
      const firstTimeNorm = timeMetrics[0].norm;
      const sumRestTimeNorm = timeMetrics.slice(1).reduce((acc, curr) => acc + curr.norm, 0);
      if (Math.abs(firstTimeNorm - sumRestTimeNorm) < 0.001) {
        totalTimeMins = firstTimeNorm;
      } else {
        totalTimeMins = firstTimeNorm + sumRestTimeNorm;
      }
      timeUnit = "min"; 
    } else if (timeMetrics.length === 1) {
      totalTimeMins = timeMetrics[0].val;
      timeUnit = timeMetrics[0].unit;
    }

    if (totalDistMeters > 0) { 
      set.mode = "distance"; 
      set.distance = unnormalizeMeters(totalDistMeters, distUnit); 
      set.unit = distUnit; 
    } else if (timeMetrics.length > 1 && totalTimeMins > 0) { 
      set.mode = "time"; 
      set.duration = totalTimeMins; 
      set.unit = "min"; 
    } else if (timeMetrics.length === 1 && totalTimeMins > 0) {
      set.mode = "time"; 
      set.duration = totalTimeMins; 
      set.unit = timeUnit;
    } else { 
      set.mode = "text"; 
    }

    set.notes = rawNote;
    
    if (hasParentheses) {
      delete set.movement;
      delete set.stroke;
    }
    
  } else if (metricMatches.length === 1) {
    const m = metricMatches[0];
    const valStr = m[1];
    let v = 0;
    
    if (valStr.includes(':')) {
      const [mins, secs] = valStr.split(':');
      v = parseInt(mins, 10) + (parseFloat(secs) / 60);
    } else {
      v = parseFloat(valStr);
    }

    // 🎯 השלכה (Casting) לטיפוס Unit
    let u = (m[2] || "").toLowerCase() as Unit;
    if (!u) u = (valStr.includes(':') ? "min" : "m") as Unit;

    const isT = ["min", "s", "sec", "h"].includes(u);
    
    set.mode = isT ? "time" : "distance";
    if (isT) { set.duration = v; set.unit = u; }
    else { set.distance = v; set.unit = u; }
    
    workStr = workStr.replace(m[0], ""); 
    const leftover = workStr.replace(/^[,\-\s*()]+|[,\-\s()]+$/g, "").trim();
    if (leftover) set.notes = leftover;
  } else {
    set.mode = "text";
    const leftover = workStr.replace(/^[,\-\s*()]+|[,\-\s()]+$/g, "").trim();
    if (leftover) set.notes = leftover;
  }
  
  // 🎯 הפיכת ה-Partial לאובייקט מושלם לפני החזרה
  return set as EnduranceSet;
}

export function workoutStepsToText(steps: EnduranceSet[]): string {
  let text = "";
  let currentBlockType: string = "";

  steps.forEach((step: EnduranceSet) => {
    if (step.setType && step.setType !== currentBlockType) {
      text += `\n${step.setType.toUpperCase()}:\n`;
      currentBlockType = step.setType;
    }

    let line = "";

    if (step.sets && step.sets > 1) line += `${step.sets} * `;
    if (step.reps && step.reps > 1) line += `${step.reps} * `;

    // 🎯 השינוי החדש: נסתיר את הזמן רק אם זה בלוק של הכפלה (כמו * 4) שיש לו פירוט
    const isGroupMultiplier = (step.sets && step.sets > 1) || (step.reps && step.reps > 1);
    
    if (!step._hasBreakdownLine || !isGroupMultiplier) {
      if (step.mode === "distance" && step.distance) {
        line += `${step.distance}${step.unit || "m"}`;
      } else if (step.mode === "time" && step.duration) {
        if (step.unit === "min" && step.duration % 1 !== 0) {
          const mins = Math.floor(step.duration);
          const secs = Math.round((step.duration - mins) * 60);
          line += `${mins}:${secs.toString().padStart(2, '0')}min`;
        } else {
          line += `${step.duration}${step.unit || "min"}`;
        }
      }
    }

    if (step.stroke) line += ` ${step.stroke}`;
    if (step.movement) line += ` ${step.movement}`;
    if (step.intensity) line += ` ${step.intensity}`;
    if (step.rest && step.rest > 0) line += ` R:${step.rest}s`;
    if (step.tags && step.tags.length > 0) line += ` ${step.tags.join(" ")}`;
    
    if (step.notes) {
      if (step._hasBreakdownLine || /^\d+:\d+(?:\.\d+)?|\d+(?:\.\d+)?\s*(m|km|min|sec|s)/i.test(step.notes)) {
        line += `\n${step.notes}`;
      } else {
        let cleanedNote = step.notes;
        
        if (!cleanedNote.startsWith('(')) {
          if (step.movement) {
            cleanedNote = cleanedNote.replace(new RegExp(`\\b(${Object.keys(MOVEMENT_ALIASES).join('|')})\\b`, 'gi'), '');
          }
          if (step.stroke) {
            cleanedNote = cleanedNote.replace(new RegExp(`\\b(${Object.keys(STROKE_ALIASES).join('|')})\\b`, 'gi'), '');
          }
        }
        
        cleanedNote = cleanedNote.trim();
        if (cleanedNote) {
            line += ` ${cleanedNote}`;
        }
      }
    }

    text += `${line.trim()}\n`;
  });

  return text.trim();
}