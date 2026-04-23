import "./CalendarEvent.css";
import { useNavigate } from "react-router-dom";
import { calendarConfig } from "@/config/calendarConfig"
import type { CalendarEvent } from "@/shared/types";
import { useState } from "react";

interface Props {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
  columnPosition?: number;
  totalColumns?: number;
}

export default function Event({
  event,
  onClick,
  columnPosition = 0,
  totalColumns = 1,
}: Props) {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);

  const PIXELS_PER_HOUR =
    document.querySelector(".hour-cell")?.getBoundingClientRect().height || 60;

  const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;
  const START_HOUR = calendarConfig.startHour;

  const top =
    (event.startTime.getHours() - START_HOUR) * PIXELS_PER_HOUR +
    event.startTime.getMinutes() * PIXELS_PER_MINUTE;
  const height =
    ((event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60)) *
    PIXELS_PER_MINUTE;

  // 🎯 Calculate width and left position based on column
  const padding = 6; // Same as CSS left/right
  const columnWidth = (100 - padding * 2) / totalColumns;
  const left = padding + columnPosition * columnWidth;
  const width = columnWidth - 2; // Small gap between columns

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer!.effectAllowed = "move";
    e.dataTransfer!.setData("dragType", "event");
    e.dataTransfer!.setData("event", JSON.stringify(event));
    setIsDragging(true);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // =========================
  // UI
  // =========================
  return (
    <div
      className={`training-event training-${event.type} ${isDragging ? "dragging" : ""}`}
      style={{ 
        top, 
        height,
        left: `${left}%`,
        width: `${width}%`,
      }}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDoubleClick={(e) => e.stopPropagation()}
      onClick={() => {
        if (onClick) {
          onClick(event);
        } else if (event.type === "groupSchedule" && event.groupId) {
          navigate(`/schedule/group/${event.groupId}`);
        }
      }}
    >
      <div className="training-title">{event.title}</div>

    </div>
  );
}
