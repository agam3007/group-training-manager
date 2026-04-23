import type { WorkoutStep, EnduranceSet } from "@/shared/types";
import {EnduranceSetCard} from "./enduranceSetCard";

interface Props {
  steps: WorkoutStep[];
  setSteps: React.Dispatch<React.SetStateAction<WorkoutStep[]>>;
  sport: "swim" | "run" | "bike" | "strength";
}

export default function WorkoutBuilder({ steps, setSteps, sport }: Props) {
  function getDefaultSet(type: any): EnduranceSet {
    if (sport === "swim") {
      return {
        id: crypto.randomUUID(),
        setType: type,
        reps: 1,
        distance: 100,
        unit: "m",
        mode: "distance",
      };
    }

    if (sport === "run" || sport === "bike") {
      return {
        id: crypto.randomUUID(),
        setType: type,
        reps: 1,
        distance: 1,
        unit: "km",
        mode: "distance",
      };
    }

    if (sport === "strength") {
      return {
        id: crypto.randomUUID(),
        setType: type,
        reps: 1,
        mode: "reps",
        unit: "reps",
      };
    }

    return {
      id: crypto.randomUUID(),
      setType: type,
      reps: 1,
      distance: 0,
      unit: "m",
      mode: "distance",
    };
  }

  function addSet(type: "warmup" | "main" | "cooldown" | "drill") {
    setSteps((prev) => [...prev, getDefaultSet(type)]);
  }

  function update(id: string, data: any) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  }

  function remove(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  function duplicate(step: WorkoutStep) {
    const copy = {
      ...step,

      id: crypto.randomUUID(),
    };

    setSteps((prev) => [...prev, copy]);
  }

  return (
    <div className="builder">
      <div className="builder-actions top">
        <button onClick={() => addSet("warmup")}>+ Warmup</button>

        <button onClick={() => addSet("main")}>+ Main</button>

        <button onClick={() => addSet("cooldown")}>+ Cooldown</button>

        <button onClick={() => addSet("drill")}>+ Drill</button>
      </div>
      {steps.map((step) => (
  <EnduranceSetCard
    key={step.id}
    set={step as EnduranceSet}
    update={update}
    remove={remove}
    duplicate={() => duplicate(step)}
  />
))}
    </div>
  );
}
