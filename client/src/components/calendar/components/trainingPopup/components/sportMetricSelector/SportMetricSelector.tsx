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

      {/* SPORT-SPECIFIC METRICS */}
      <div className="metric-options">
        {/* SWIM */}
        {sport === "swim" && (
          <>
            <div className="metric-group">
              <label>Pool Length</label>
              <select
                value={metrics.swimPoolSize || 25}
                onChange={(e) => handleMetricChange("swimPoolSize", parseInt(e.target.value))}
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="75">75</option>
                <option value="100">100</option>
              </select>
            </div>

            <div className="metric-group">
              <label>Unit</label>
              <select
                value={metrics.swimUnit || "m"}
                onChange={(e) => handleMetricChange("swimUnit", e.target.value)}
              >
                <option value="m">Meters (m)</option>
                <option value="km">Kilometers (km)</option>
                <option value="yard">Yards (yard)</option>
                <option value="mile">Miles (mile)</option>
              </select>
            </div>

            <div className="metric-group">
              <label>Format</label>
              <select
                value={metrics.runFormat || "distance"}
                onChange={(e) => handleMetricChange("runFormat", e.target.value)}
              >
                <option value="distance">Distance</option>
                <option value="time">Time</option>
              </select>
            </div>

            <div className="metric-group">
              <label>Intensity Type</label>
              <div className="checkbox-group">
                <label className="option-label">
                  <input
                    type="checkbox"
                    checked={metrics.usePace || false}
                    onChange={(e) => handleMetricChange("usePace", e.target.checked)}
                  />
                  Threshold Pace
                </label>
                <label className="option-label">
                  <input
                    type="checkbox"
                    checked={metrics.useHR || false}
                    onChange={(e) => handleMetricChange("useHR", e.target.checked)}
                  />
                  Heart Rate (HR)
                </label>
              </div>
            </div>

            {metrics.usePace && (
              <div className="metric-group">
                <label>Threshold Pace (sec/100m)</label>
                <input
                  type="number"
                  value={metrics.thresholdPace || 0}
                  onChange={(e) => handleMetricChange("thresholdPace", parseInt(e.target.value))}
                />
              </div>
            )}

            {metrics.useHR && (
              <div className="metric-group">
                <label>Threshold HR (bpm)</label>
                <input
                  type="number"
                  value={metrics.thresholdHR || 0}
                  onChange={(e) => handleMetricChange("thresholdHR", parseInt(e.target.value))}
                />
              </div>
            )}

            <div className="metric-group">
              <label>Target Type</label>
              <select
                value={metrics.targetRange || "range"}
                onChange={(e) => handleMetricChange("targetRange", e.target.value)}
              >
                <option value="range">Range</option>
                <option value="target">Target</option>
              </select>
            </div>
          </>
        )}

        {/* BIKE */}
        {sport === "bike" && (
          <>
            <div className="metric-group">
              <label>Unit</label>
              <select
                value={metrics.bikeUnit || "km"}
                onChange={(e) => handleMetricChange("bikeUnit", e.target.value)}
              >
                <option value="km">Kilometers (km)</option>
                <option value="mile">Miles (mile)</option>
              </select>
            </div>

            <div className="metric-group">
              <label>Format</label>
              <select
                value={metrics.runFormat || "distance"}
                onChange={(e) => handleMetricChange("runFormat", e.target.value)}
              >
                <option value="distance">Distance</option>
                <option value="time">Time</option>
              </select>
            </div>

            <div className="metric-group">
              <label>Intensity Type</label>
              <div className="checkbox-group">
                <label className="option-label">
                  <input
                    type="checkbox"
                    checked={metrics.usePower || false}
                    onChange={(e) => handleMetricChange("usePower", e.target.checked)}
                  />
                  Power (Watts)
                </label>
                <label className="option-label">
                  <input
                    type="checkbox"
                    checked={metrics.useHR || false}
                    onChange={(e) => handleMetricChange("useHR", e.target.checked)}
                  />
                  Heart Rate (HR)
                </label>
                <label className="option-label">
                  <input
                    type="checkbox"
                    checked={metrics.usePace || false}
                    onChange={(e) => handleMetricChange("usePace", e.target.checked)}
                  />
                  Pace
                </label>
              </div>
            </div>

            {metrics.usePower && (
              <div className="metric-group">
                <label>FTP (Watts)</label>
                <input
                  type="number"
                  value={metrics.thresholdPace || 0}
                  onChange={(e) => handleMetricChange("thresholdPace", parseInt(e.target.value))}
                  placeholder="Functional Threshold Power"
                />
              </div>
            )}

            {metrics.useHR && (
              <div className="metric-group">
                <label>Threshold HR (bpm)</label>
                <input
                  type="number"
                  value={metrics.thresholdHR || 0}
                  onChange={(e) => handleMetricChange("thresholdHR", parseInt(e.target.value))}
                />
              </div>
            )}

            <div className="metric-group">
              <label>Target Type</label>
              <select
                value={metrics.targetRange || "range"}
                onChange={(e) => handleMetricChange("targetRange", e.target.value)}
              >
                <option value="range">Range</option>
                <option value="target">Target</option>
              </select>
            </div>
          </>
        )}

        {/* RUN */}
        {sport === "run" && (
          <>
            <div className="metric-group">
              <label>Unit</label>
              <select
                value={metrics.runUnit || "km"}
                onChange={(e) => handleMetricChange("runUnit", e.target.value)}
              >
                <option value="km">Kilometers (km)</option>
                <option value="mile">Miles (mile)</option>
              </select>
            </div>

            <div className="metric-group">
              <label>Format</label>
              <select
                value={metrics.runFormat || "distance"}
                onChange={(e) => handleMetricChange("runFormat", e.target.value)}
              >
                <option value="distance">Distance</option>
                <option value="time">Time</option>
              </select>
            </div>

            <div className="metric-group">
              <label>Intensity Type</label>
              <div className="checkbox-group">
                <label className="option-label">
                  <input
                    type="checkbox"
                    checked={metrics.usePace || false}
                    onChange={(e) => handleMetricChange("usePace", e.target.checked)}
                  />
                  Pace
                </label>
                <label className="option-label">
                  <input
                    type="checkbox"
                    checked={metrics.useHR || false}
                    onChange={(e) => handleMetricChange("useHR", e.target.checked)}
                  />
                  Heart Rate (HR)
                </label>
              </div>
            </div>

            {metrics.usePace && (
              <div className="metric-group">
                <label>Threshold Pace (min/km)</label>
                <input
                  type="number"
                  step="0.1"
                  value={metrics.thresholdPace || 0}
                  onChange={(e) => handleMetricChange("thresholdPace", parseFloat(e.target.value))}
                />
              </div>
            )}

            {metrics.useHR && (
              <div className="metric-group">
                <label>Threshold HR (bpm)</label>
                <input
                  type="number"
                  value={metrics.thresholdHR || 0}
                  onChange={(e) => handleMetricChange("thresholdHR", parseInt(e.target.value))}
                />
              </div>
            )}

            <div className="metric-group">
              <label>Target Type</label>
              <select
                value={metrics.targetRange || "range"}
                onChange={(e) => handleMetricChange("targetRange", e.target.value)}
              >
                <option value="range">Range</option>
                <option value="target">Target</option>
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
