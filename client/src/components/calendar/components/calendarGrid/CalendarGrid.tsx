import {Event} from "./calendarEvent";
import type { CalendarEvent, Training } from "@/shared/types";
import "./CalendarGrid.css";
import React from "react";

interface Props {
  events: CalendarEvent[];
  onEdit: (training: Training) => void;
  onEmptyCellClick: (day: number, hour: number, minute: number) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onTrainingDrop?: (training: Training, day: number, hour: number, minute: number, weekOffset: number) => void;
  onEventDrop?: (event: CalendarEvent, day: number, hour: number, minute: number, weekOffset: number) => void;
  weekOffset: number;
}

const hours = Array.from({ length: 16 }, (_, i) => i + 6);
const days = new Array(7).fill(null);

const cellHeight =
  document.querySelector(".hour-cell")?.getBoundingClientRect().height || 60;

const PIXELS_PER_MINUTE = cellHeight / 60;
const START_HOUR = 5;

function CurrentTimeLine() {
  const now = new Date();

  const hour = now.getHours();
  const minute = now.getMinutes();

  if (hour < START_HOUR) return null;

  const top = (hour - START_HOUR) * cellHeight + minute * PIXELS_PER_MINUTE;
  return <div className="current-time-line" style={{ top }} />;
}

// 🎯 COLLISION DETECTION - Calculate overlapping events and assign column positions
function calculateEventPositions(dayEvents: CalendarEvent[]) {
  // For each event, find all events that overlap with it
  const eventColumns: Record<string, { column: number; totalColumns: number }> = {};

  dayEvents.forEach((event, index) => {
    if (eventColumns[event.id]) return; // Already calculated

    // Find all events that overlap with this event
    const overlappingEvents = dayEvents.filter((otherEvent) => {
      // Check if events overlap
      return !(event.endTime <= otherEvent.startTime || event.startTime >= otherEvent.endTime);
    });

    // Assign column positions to overlapping events
    overlappingEvents.forEach((overlappingEvent, columnIndex) => {
      eventColumns[overlappingEvent.id] = {
        column: columnIndex,
        totalColumns: overlappingEvents.length,
      };
    });
  });

  return eventColumns;
}

export default function CalendarGrid({
  events,
  onEmptyCellClick,
  onEventClick,
  onTrainingDrop,
  onEventDrop,
  weekOffset,
}: Props) {
  const [dragOverCell, setDragOverCell] = React.useState<{ day: number; hour: number; minute: number } | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleHourCellDragEnter = (e: React.DragEvent, dayIndex: number, hour: number, minute: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCell({ day: dayIndex, hour, minute });
  };

  const handleHourCellDragLeave = (e: React.DragEvent, dayIndex: number, hour: number, minute: number) => {
    e.preventDefault();
    if (
      dragOverCell?.day === dayIndex &&
      dragOverCell?.hour === hour &&
      dragOverCell?.minute === minute
    ) {
      setDragOverCell(null);
    }
  };

  const handleHourCellDrop = (
    e: React.DragEvent,
    dayIndex: number,
    hour: number,
    minute: number,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCell(null);

    const dragType = e.dataTransfer.getData("dragType");

    if (dragType === "training") {
      const trainingData = e.dataTransfer.getData("training");
      if (trainingData && onTrainingDrop) {
        const training = JSON.parse(trainingData);
        onTrainingDrop(training, dayIndex, hour, minute, weekOffset);
      }
      return;
    }

    if (dragType === "event") {
      const eventData = e.dataTransfer.getData("event");
      if (eventData && onEventDrop) {
        const parsedEvent = JSON.parse(eventData);
        const event: CalendarEvent = {
          ...parsedEvent,
          startTime: new Date(parsedEvent.startTime),
          endTime: new Date(parsedEvent.endTime),
        };
        onEventDrop(event, dayIndex, hour, minute, weekOffset);
      }
    }
  };

  return (
    <>
      {days.map((_, dayIndex) => {
        const today = new Date();

        const todayIndex = (today.getDay() + 6) % 7;

        const isToday = weekOffset === 0 && dayIndex === todayIndex;
        return (
          <div
            key={dayIndex}
            className={`day-column ${isToday ? "today-column" : ""}`}
            data-day={dayIndex}
            onDragOver={handleDragOver}
          >
            {isToday && <CurrentTimeLine />}

            {hours.map((hour) => (
              <div key={hour} className="hour-cell">
                {[0, 15, 30, 45].map((minute) => (
                  <div
                    key={minute}
                    className={`half-hour-cell ${
                      dragOverCell?.day === dayIndex &&
                      dragOverCell?.hour === hour &&
                      dragOverCell?.minute === minute
                        ? "drag-over"
                        : ""
                    }`}
                    data-day={dayIndex}
                    data-hour={hour}
                    data-minute={minute}
                    onClick={() => onEmptyCellClick(dayIndex, hour, minute)}
                    onDragEnter={(e) => handleHourCellDragEnter(e, dayIndex, hour, minute)}
                    onDragLeave={(e) => handleHourCellDragLeave(e, dayIndex, hour, minute)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleHourCellDrop(e, dayIndex, hour, minute)}
                  />
                ))}
              </div>
            ))}
            {events
              .filter((e) => {
                const day = (e.startTime.getDay() + 6) % 7;
                return day === dayIndex;
              })
              .map((event) => {
                const dayEvents = events.filter((e) => {
                  const day = (e.startTime.getDay() + 6) % 7;
                  return day === dayIndex;
                });

                const eventPositions = calculateEventPositions(dayEvents);
                const position = eventPositions[event.id] || { column: 0, totalColumns: 1 };

                return (
                  <Event
                    key={event.id}
                    event={event || {}}
                    onClick={onEventClick}
                    columnPosition={position.column}
                    totalColumns={position.totalColumns}
                  />
                );
              })}
          </div>
        );
      })}
    </>
  );
}
