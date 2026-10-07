import type { TrainingType } from "@/shared/types";
import "./SportMetricSelector.css";

interface Props {
  sport: TrainingType;
  onSportChange?: (sport: TrainingType) => void;
  metrics?: {
    runFormat?: "time" | "distance";
    bikeMetric?: "time" | "distance" | "power" | "hr";
    swimPoolSize?: number;
    swimUnit?: "m" | "km" | "yard" | "mile";
    runUnit?: "km" | "mile";
    bikeUnit?: "km" | "mile";
    useHR?: boolean;
    usePace?: boolean;
    usePower?: boolean;
    thresholdPace?: number;
    thresholdHR?: number;
    targetRange?: "range" | "target";
  };
  onMetricsChange?: (metrics: any) => void;
}

export default function SportMetricSelector({ sport, onSportChange, metrics = {}, onMetricsChange }: Props) {
  const types = [
    { id: "swim" as TrainingType, icon: "🏊" },
    { id: "bike" as TrainingType, icon: "🚴" },
    { id: "run" as TrainingType, icon: "🏃" },
  ];

  const handleSportChange = (newSport: TrainingType) => {
    onSportChange?.(newSport);
  };

  const handleMetricChange = (key: string, value: any) => {
    const newMetrics = { ...metrics, [key]: value };
    onMetricsChange?.(newMetrics);
  };

  return (
    <div className="sport-metric-selector">
      {/* SPORT TYPE SELECTOR */}
      <div className="type-selector-integrated">
        <label className="selector-label">Sport Type</label>
        <div className="type-buttons">
          {types.map((t) => (
            <button
              key={t.id}
              className={`type-btn ${sport === t.id ? "active" : ""}`}
              onClick={() => handleSportChange(t.id)}
            >
              {t.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
