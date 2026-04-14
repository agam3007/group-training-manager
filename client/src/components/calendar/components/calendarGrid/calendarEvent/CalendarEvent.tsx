import { useEffect, useRef } from "react";
import type { Event } from "@/types/event";
import "./CalendarEvent.css";
import type { Group } from "@/shared/types";
import { updateGroup } from "@/api/group";
import { useNavigate } from "react-router-dom";
import { calendarConfig } from "@/config/calendarConfig"

interface Props {
  event: Event;
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  setAssignments: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function CalendarEvent({
  event,
  setGroups,
  setAssignments,
}: Props) {
  const navigate = useNavigate();

  const draggingRef = useRef(false);
  const resizingRef = useRef(false);

  const startYRef = useRef<number | null>(null);
  const startXRef = useRef<number | null>(null);

  const baseScheduleRef = useRef<any>(null);
  const lastUpdateRef = useRef<any>(null);

  const PIXELS_PER_HOUR =
    document.querySelector(".hour-cell")?.getBoundingClientRect().height || 60;

  const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;
  const START_HOUR = calendarConfig.startHour;
  const SNAP = calendarConfig.snapMinutes;

  const top =
    (event.start.getHours() - START_HOUR) * PIXELS_PER_HOUR +
    event.start.getMinutes() * PIXELS_PER_MINUTE;
  const height =
    ((event.end.getTime() - event.start.getTime()) / (1000 * 60)) *
    PIXELS_PER_MINUTE;

  // =========================
  // PURE FUNCTION
  // =========================
  const computeUpdate = (base: any, deltaMinutes: number, dayDelta: number) => {
    const startDate = new Date(0, 0, 0, base.start.hour, base.start.min || 0);
    const endDate = new Date(0, 0, 0, base.end.hour, base.end.min || 0);

    if (draggingRef.current) {
      startDate.setMinutes(startDate.getMinutes() + deltaMinutes);
      endDate.setMinutes(endDate.getMinutes() + deltaMinutes);
    }

    if (resizingRef.current) {
      endDate.setMinutes(endDate.getMinutes() + deltaMinutes);
    }

    let newDay = base.day + dayDelta;
    newDay = Math.max(0, Math.min(6, newDay));

    return {
      day: newDay,
      start: {
        hour: startDate.getHours(),
        min: startDate.getMinutes(),
      },
      end: {
        hour: endDate.getHours(),
        min: endDate.getMinutes(),
      },
    };
  };

  // =========================
  // Mouse down
  // =========================
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();

    startYRef.current = e.clientY;
    startXRef.current = e.clientX;

    baseScheduleRef.current = {
      day: (event.start.getDay() + 6) % 7,
      start: {
        hour: event.start.getHours(),
        min: event.start.getMinutes(),
      },
      end: {
        hour: event.end.getHours(),
        min: event.end.getMinutes(),
      },
    };

    if ((e.target as HTMLElement).classList.contains("resize-handle")) {
      resizingRef.current = true;
    } else {
      draggingRef.current = true;
    }
  };

  // =========================
  // Global drag (FIXED)
  // =========================
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!draggingRef.current && !resizingRef.current) return;
      // if (event.type !== "group") return

      const startY = startYRef.current;
      const startX = startXRef.current;
      const base = baseScheduleRef.current;

      if (startY === null || startX === null || !base) return;

      const deltaY = e.clientY - startY;
      const deltaX = e.clientX - startX;

      const rawMinutes = deltaY / PIXELS_PER_MINUTE;
      const snappedMinutes = Math.round(rawMinutes / SNAP) * SNAP;

      const DAY_WIDTH =
        document.querySelector(".day-column")?.clientWidth || 150;

      let dayDelta = 0;
      if (deltaX > DAY_WIDTH / 2) dayDelta = 1;
      if (deltaX < -DAY_WIDTH / 2) dayDelta = -1;

      const updated = computeUpdate(base, snappedMinutes, dayDelta);

      lastUpdateRef.current = {
        groupId: event.groupId,
        scheduleIndex: event.scheduleRef,
        ...updated,
      };

      if (event.type === "group") {
        setGroups((prev) =>
          prev.map((g) => {
            if (g.id !== event.groupId) return g;

            const newSchedule = [...g.schedule];
            newSchedule[event.scheduleRef] = {
              ...newSchedule[event.scheduleRef],
              ...updated,
            };

            return { ...g, schedule: newSchedule };
          }),
        );
      } else {
        setAssignments((prev) =>
          prev.map((a) => {
            if (a.id !== event.assignmentId) return a;
            return { ...a, ...updated };
          }),
        );
      }
    };

    const handleUp = () => {
      const fallback = baseScheduleRef.current;

      const builtFallback = fallback || {
        day: (event.start.getDay() + 6) % 7,
        start: {
          hour: event.start.getHours(),
          min: event.start.getMinutes(),
        },
        end: {
          hour: event.end.getHours(),
          min: event.end.getMinutes(),
        },
      };

      const finalData = lastUpdateRef.current || {
        groupId: event.groupId,
        scheduleIndex: event.scheduleRef,
        ...builtFallback,
      };

      if (!finalData) return;

      draggingRef.current = false;
      resizingRef.current = false;

      // Persist the updated schedule by updating the whole group's schedule
      setGroups((prev) => {
        const idx = prev.findIndex((g) => g.id === finalData.groupId);
        if (idx === -1) return prev;

        const updatedGroup = { ...prev[idx] };
        const newSchedule = [...(updatedGroup.schedule || [])];

        // replace the schedule entry at scheduleIndex with the new values
        newSchedule[finalData.scheduleIndex] = {
          ...newSchedule[finalData.scheduleIndex],
          day: finalData.day,
          start: {
            hour: finalData.start.hour,
            min: finalData.start.min || 0,
          },
          end: {
            hour: finalData.end.hour,
            min: finalData.end.min || 0,
          },
        };

        updatedGroup.schedule = newSchedule;

        // fire update to server (don't block UI)
        updateGroup(finalData.groupId, { schedule: newSchedule }).catch(
          (err) => {
            console.error("❌ Failed saving group schedule", err);
          },
        );

        return prev.map((g, i) => (i === idx ? updatedGroup : g));
      });

      lastUpdateRef.current = null;

      startYRef.current = null;
      startXRef.current = null;
      baseScheduleRef.current = null;
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []); // ❗ חשוב – בלי dependencies

  // =========================
  // UI
  // =========================
  return (
    <div
      className={`training-event training-${event.type}`}
      style={{ top, height }}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => e.stopPropagation()}
      onClick={() => {
        event.type === "group" && navigate(`/schedule/group/${event.groupId}`);
      }}
    >
      <div className="training-title">{event.title}</div>

      <div className="training-description">{event.description}</div>

      <div className="resize-handle" />
    </div>
  );
}
