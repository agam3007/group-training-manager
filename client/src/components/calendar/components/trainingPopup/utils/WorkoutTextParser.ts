/**
 * Parses workout text to generate WorkoutStep objects
 * Format examples:
 * - "10*100m Z3 R:30" - 10 reps of 100m at Z3 with 30s rest
 * - "3*5min Z2 R:2min" - 3 reps of 5 minutes at Z2 with 2 minutes rest
 * - "200m Z1" - Single 200m at Z1
 * - "5*8/200m Z4 R:60" - 5 reps of 8 x 200m at Z4 with 60s rest between
 */

import type { EnduranceSet, TrainingType } from "@/shared/types";

export interface ParsedWorkout {
  blocks: EnduranceSet[];
  errors: string[];
}

export function parseWorkoutText(
  text: string,
  sport: TrainingType
): ParsedWorkout {
  const blocks: EnduranceSet[] = [];
  const errors: string[] = [];

  if (!text.trim()) {
    return { blocks, errors };
  }

  // Split by newlines or common delimiters
  const lines = text
    .split(/[,\n;|]/g)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  lines.forEach((line, idx) => {
    try {
      const block = parseWorkoutLine(line, sport, idx);
      if (block) {
        blocks.push(block);
      }
    } catch (error) {
      if (error instanceof Error) {
        errors.push(`Line ${idx + 1}: ${error.message}`);
      }
    }
  });

  return { blocks, errors };
}

function parseWorkoutLine(line: string, sport: TrainingType, index: number): EnduranceSet | null {
  // Pattern: reps*distance/time unit intensity rest
  // Examples: "10*100m Z3 R:30", "5min Z2", "200m Z1", "3*5min Z2 R:2min"

  const lineUpper = line.toUpperCase();

  // Extract components
  const intensityMatch = lineUpper.match(/(Z[1-5]|EASY|THRESHOLD|HARD)/);
  const intensity = intensityMatch ? intensityMatch[0] : "Z2";

  const restMatch = lineUpper.match(/R:(\d+(?:\.\d+)?)(MIN|S|SEC)?/i);
  let restSeconds = 0;
  if (restMatch) {
    const value = parseFloat(restMatch[1]);
    const unit = (restMatch[2] || "s").toUpperCase();
    restSeconds = unit === "MIN" || unit === "M" ? value * 60 : value;
  }

  // Remove intensity and rest from line for easier parsing
  let workLine = line
    .replace(/Z[1-5]/gi, "")
    .replace(/EASY|THRESHOLD|HARD/gi, "")
    .replace(/R:[\d.]*(?:MIN|S|SEC)?/gi, "")
    .trim();
  // Try to parse distance/time format
  // Formats: "10*100m", "5*5min", "200m", "10min", "3*600/400m"
  
  const distancePattern = /^(?:(\d+)\*)?(\d+)(?:[xX/](\d+))?(min|km|m|s|sec|h)?$/i;
  const match = workLine.match(distancePattern);
  if (!match) {
    throw new Error(`Could not parse: "${line}"`);
  }
console.log({ match })
  const [, repsStr, value1Str, value2Str, unit, restOfLine] = match;

  const reps = repsStr ? parseInt(repsStr, 10) : 1;
  const value1 = parseInt(value1Str, 10);
  const value2 = value2Str ? parseInt(value2Str, 10) : null;
  // Determine if it's time or distance
  const timeKeywords = ["min", "second", "s", "hour", "h"];
  const distanceKeywords = ["m", "km", "mi", "mile"];

  let isTime = false;
  let parsedUnit = unit ? unit.toLowerCase() : "";

  if (parsedUnit) {
  if (timeKeywords.includes(parsedUnit)) {
    isTime = true;
  } else if (distanceKeywords.includes(parsedUnit)) {
    isTime = false;
  } else {
    throw new Error(`Unknown unit "${parsedUnit}"`);
  }
}

  const set: EnduranceSet = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    setType: "warmup", // Default, can be changed later
    reps,
    intensity,
    rest: restSeconds,
    mode: isTime ? "time" : "distance",
  };

  if (isTime) {
    set.mode = "time";
    set.duration = value1;
  } else {
    set.mode = "distance";
    set.distance = value1;

    // Determine unit based on sport
    if (parsedUnit.includes("km")) {
      set.unit = "km";
    } else if (sport === "swim") {
      set.unit = "m";
    } else {
      set.unit = parsedUnit.includes("km") ? "km" : "m";
    }
  }

  return set;
}

export function workoutStepsToText(steps: EnduranceSet[]): string {
  return steps
    .map((step) => {
      const s = step as any;
      let text = "";

      if (s.reps && s.reps > 1) {
        text += `${s.reps}*`;
      }

      if (s.mode === "distance") {
        text += `${s.distance}${s.unit || "m"}`;
      } else if (s.mode === "time") {
        text += `${s.duration}min`;
      } else {
        text += `${s.reps}reps`;
      }

      if (s.intensity) {
        text += ` ${s.intensity}`;
      }

      if (s.rest && s.rest > 0) {
        text += ` R:${s.rest}s`;
      }

      return text;
    })
    .join("\n");
}
