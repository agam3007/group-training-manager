
import type { CalendarEvent } from "@/shared/types";
import "./LoadCalculator.css";
import { useState } from "react";

interface Props {
  events: CalendarEvent[];
  selectedGroupId?: string;
  athleteId?: string;
}

type LoadMetric = "time" | "tss" | "acwr" | "ext";

export default function LoadCalculator({ events, selectedGroupId, athleteId }: Props) {
  const [loadMetric, setLoadMetric] = useState<LoadMetric>("time");
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter events based on selection
  const relevantEvents = events.filter(event => {
    if (athleteId) {
      return event.athleteId === athleteId || event.type === "groupSchedule";
    }
    if (selectedGroupId) {
      return event.groupId === selectedGroupId;
    }
    return true;
  });

  // Calculate weekly events
  const weeklyEvents = relevantEvents.filter(event => {
    const eventDate = new Date(event.startTime);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return eventDate >= weekAgo;
  });

  // Calculate sports breakdown for this week
  const sportBreakdown = {
    run: weeklyEvents.filter(e => e.type === "run").length,
    bike: weeklyEvents.filter(e => e.type === "bike").length,
    swim: weeklyEvents.filter(e => e.type === "swim").length,
    gym: weeklyEvents.filter(e => e.type === "strength").length,
  };

  // Calculate load based on selected metric
  const calculateLoad = (): number => {
    switch (loadMetric) {
      case "time": {
        // Simple: 50 points per training
        return weeklyEvents.length * 50;
      }
      case "tss": {
        // Training Stress Score: 50-200 per training based on type
        return weeklyEvents.reduce((sum, event) => {
          let tssValue = 100;
          if (event.type === "run") tssValue = 150;
          if (event.type === "bike") tssValue = 180;
          if (event.type === "swim") tssValue = 120;
          if (event.type === "strength") tssValue = 110;
          return sum + tssValue;
        }, 0);
      }
      case "acwr": {
        // ACWR calculation
        const chronicEvents = relevantEvents.filter(event => {
          const eventDate = new Date(event.startTime);
          const fourWeeksAgo = new Date();
          fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
          return eventDate >= fourWeeksAgo;
        });
        const chronicLoad = chronicEvents.length * 50 / 4;
        const acuteLoad = weeklyEvents.length * 50;
        const ratio = chronicLoad > 0 ? acuteLoad / chronicLoad : 0;
        return parseFloat(ratio.toFixed(2));
      }
      case "ext":
      default: {
        // External load: duration-based
        return weeklyEvents.reduce((sum, event) => {
          const duration = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60);
          return sum + duration;
        }, 0);
      }
    }
  };

  const weeklyLoad = calculateLoad();
  const displayValue = typeof weeklyLoad === "number" && weeklyLoad % 1 !== 0 ? weeklyLoad.toFixed(2) : Math.round(weeklyLoad);
  const unit = loadMetric === "ext" ? "min" : loadMetric === "acwr" ? "" : "pts";

  return (
    <div className="load-calculator-inline">
      <div className="load-content">
        <span className="load-label">Week load:</span>
        <span className="load-value">{displayValue}{unit && ` ${unit}`}</span>

        <div className="dropdown-container">
          <button
            className="dropdown-trigger"
            onClick={() => setShowDropdown(!showDropdown)}
            title="Click to change load metric"
          >
            ▼
          </button>

          {showDropdown && (
            <div className="dropdown-menu">
              <button
                className={`dropdown-item ${loadMetric === "time" ? "active" : ""}`}
                onClick={() => {
                  setLoadMetric("time");
                  setShowDropdown(false);
                }}
              >
                Time
              </button>
              <button
                className={`dropdown-item ${loadMetric === "tss" ? "active" : ""}`}
                onClick={() => {
                  setLoadMetric("tss");
                  setShowDropdown(false);
                }}
              >
                TSS
              </button>
              <button
                className={`dropdown-item ${loadMetric === "acwr" ? "active" : ""}`}
                onClick={() => {
                  setLoadMetric("acwr");
                  setShowDropdown(false);
                }}
              >
                ACWR
              </button>
              <button
                className={`dropdown-item ${loadMetric === "ext" ? "active" : ""}`}
                onClick={() => {
                  setLoadMetric("ext");
                  setShowDropdown(false);
                }}
              >
                Ext
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="load-tooltip">
        <div className="tooltip-title">Sport Breakdown</div>
        <div className="tooltip-grid">
          <div className="tooltip-item">
            <span className="tooltip-sport">🏃 Run:</span>
            <span className="tooltip-count">{sportBreakdown.run}</span>
          </div>
          <div className="tooltip-item">
            <span className="tooltip-sport">🚴 Bike:</span>
            <span className="tooltip-count">{sportBreakdown.bike}</span>
          </div>
          <div className="tooltip-item">
            <span className="tooltip-sport">🏊 Swim:</span>
            <span className="tooltip-count">{sportBreakdown.swim}</span>
          </div>
          <div className="tooltip-item">
            <span className="tooltip-sport">💪 Gym:</span>
            <span className="tooltip-count">{sportBreakdown.gym}</span>
          </div>
        </div>
      </div>
    </div>
  );
}