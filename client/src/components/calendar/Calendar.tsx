import "./Calendar.css";

import {WeeklyHeader, DaySummeryRow, TimeColumn, CalendarGrid, Library, TrainingPopup, TrainingDetails, LoadCalculator, GroupSchedulePopup} from "./components";

import { useState, useEffect } from "react";
import type { Training, CalendarEvent } from "@/shared/types";
import {
  createTraining,
  deleteTraining,
  updateTraining,
} from "@/api/training";
import { getEventsByRange, createEventOverride, createEvent, updateEvent, deleteEvent } from "@/api/events";
import { createAssignment, getAssignments, updateAssignment } from "@/api/trainingAssignment";
import { getGroups } from "@/api/group";
import type { Group } from "@/shared/types";

interface Props {
  trainings: Training[];
  setTrainings: React.Dispatch<React.SetStateAction<Training[]>>;
  calendarEvents: CalendarEvent[];
  setCalendarEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  loading?: boolean;
  selectedGroupId?: string;
  setSelectedGroupId?: React.Dispatch<React.SetStateAction<string>>;
  athleteId?: string;
}

export default function Calendar({
  trainings,
  setTrainings,
  calendarEvents,
  setCalendarEvents,
  loading = false,
  selectedGroupId,
  setSelectedGroupId,
  athleteId,
}: Props) {
  const [viewing, setViewing] = useState<Training | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [editing, setEditing] = useState<Training | null>(null);
  const [editingFromCalendar, setEditingFromCalendar] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [schedulePopupEvent, setSchedulePopupEvent] = useState<CalendarEvent | null>(null);
  const [selectedTrainingEvent, setSelectedTrainingEvent] = useState<CalendarEvent | null>(null);
  const [selectedEventTraining, setSelectedEventTraining] = useState<Training | null>(null);
  const [emptyCellInfo, setEmptyCellInfo] = useState<{
    day: number;
    hour: number;
    minute: number;
    start: Date;
  } | null>(null);
  const [emptyCellMode, setEmptyCellMode] = useState<"choose" | "library" | "newWorkout" | "groupSchedule" | null>(null);
  const [emptyCellTrainingDraft, setEmptyCellTrainingDraft] = useState<Training | null>(null);
  const [emptyCellGroupId, setEmptyCellGroupId] = useState<string>(selectedGroupId || "");
  const [selectedGroupScheduleTrainingId, setSelectedGroupScheduleTrainingId] = useState<string>("");
  const [localTrainingBySourceId, setLocalTrainingBySourceId] = useState<Record<string, Training>>({});

  const getIcon = (type: string) => {
    switch (type) {
      case "swim":
        return "🏊";
      case "bike":
        return "🚴";
      case "run":
        return "🏃";
      case "strength":
        return "🏋️";
      default:
        return "📋";
    }
  };

  const groupedTrainings = trainings.reduce(
    (acc, t) => {
      if (!acc[t.type]) acc[t.type] = [];
      acc[t.type].push(t);
      return acc;
    },
    {} as Record<string, Training[]>,
  );

  // Load groups for filtering
  useEffect(() => {
    if (!athleteId) {
      (async () => {
        try {
          const groupsData = await getGroups();
          setGroups(groupsData);
        } catch (err) {
          console.error("Failed to load groups", err);
        }
      })();
    }
  }, [athleteId]);

  // Load training for selected event
  useEffect(() => {
    if (selectedTrainingEvent) {
      getTrainingForEvent(selectedTrainingEvent).then(setSelectedEventTraining);
    } else {
      setSelectedEventTraining(null);
    }
  }, [selectedTrainingEvent, trainings]);

  // Recalculate week range and fetch events when weekOffset changes
  useEffect(() => {
    (async () => {
      try {
        const today = new Date();
        const startOfWeek = new Date(today);
        const day = today.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        startOfWeek.setDate(today.getDate() + diff + weekOffset * 7);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const events = await getEventsByRange(startOfWeek, endOfWeek);
        setCalendarEvents(events);
      } catch (err) {
        console.error("Failed to load calendar events", err);
        setCalendarEvents([]);
      }
    })();
  }, [weekOffset, setCalendarEvents]);

  const today = new Date();
  const startOfWeek = new Date(today);
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  startOfWeek.setDate(today.getDate() + diff + weekOffset * 7);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const getCellDate = (day: number, hour: number, minute: number) => {
    const weekStart = calculateWeekStartDate(weekOffset);
    const date = new Date(weekStart);
    date.setDate(date.getDate() + day);
    date.setHours(hour, minute, 0, 0);
    return date;
  };

  const closeEmptyCellModal = () => {
    setEmptyCellInfo(null);
    setEmptyCellMode(null);
    setEmptyCellTrainingDraft(null);
  };

  const handleEmptyCellClick = (day: number, hour: number, minute: number) => {
    const start = getCellDate(day, hour, minute);
    setEmptyCellInfo({ day, hour, minute, start });
    setEmptyCellMode("choose");
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  const createEventAtCell = async (
    training: Training,
    startTime: Date,
    saveToLibrary = false,
    asGroupSchedule = false,
    groupId?: string,
  ) => {
    try {
      let trainingToUse = training;

      if (saveToLibrary && !trainings.find((t) => t.id === training.id)) {
        const createdTraining = await createTraining(training);
        setTrainings((prev) => [...prev, createdTraining]);
        trainingToUse = createdTraining;
      }

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + (training.duration ?? 60));

      const effectiveGroupId = groupId || selectedGroupId;
      const groupForTitle = groups.find((g) => g.id === effectiveGroupId);
      const sourceId = asGroupSchedule
        ? `groupSchedule-${effectiveGroupId || "auto"}-${startTime.getTime()}`
        : `training-${training.id}`;
      const effectiveTitle = asGroupSchedule
        ? `${groupForTitle?.name || selectedGroup?.name || "Group Schedule"} - ${training.title || "Workout"}`
        : training.title || "Workout";

      if (!asGroupSchedule) {
        setLocalTrainingBySourceId((prev) => ({
          ...prev,
          [sourceId]: trainingToUse,
        }));
      }

      await createEvent({
        title: effectiveTitle,
        type: asGroupSchedule ? "groupSchedule" : (training.type as any),
        startTime,
        endTime,
        athleteId: athleteId,
        groupId: effectiveGroupId || undefined,
        sourceId,
      });

      if (athleteId) {
        await createAssignment({
          id: crypto.randomUUID(),
          trainingId: trainingToUse.id,
          athleteId: athleteId,
          startTime,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const weekStart = calculateWeekStartDate(weekOffset);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const events = await getEventsByRange(weekStart, weekEnd);
      setCalendarEvents(events);
      closeEmptyCellModal();
    } catch (err) {
      console.error("Failed to create event from empty cell:", err);
    }
  };

  const handleLibrarySelect = async (training: Training) => {
    if (!emptyCellInfo) return;
    await createEventAtCell(training, emptyCellInfo.start, false, false);
  };

  const handleCreateWorkoutSaveOneTime = async (training: Training) => {
    if (!emptyCellInfo) return;
    await createEventAtCell(training, emptyCellInfo.start, false, false);
  };

  const handleCreateWorkoutSaveToLibrary = async (training: Training) => {
    if (!emptyCellInfo) return;
    await createEventAtCell(training, emptyCellInfo.start, true, false);
  };

  const buildEmptyTraining = (): Training => ({
    id: crypto.randomUUID(),
    title: "",
    description: "",
    type: "swim",
    equipment: [],
    steps: [],
    notes: "",
    creationDate: new Date(),
  });

  const openNewWorkoutFromEmptyCell = () => {
    setEmptyCellTrainingDraft(buildEmptyTraining());
    setEmptyCellMode("newWorkout");
  };

  const openGroupScheduleFromEmptyCell = () => {
    setEmptyCellGroupId(selectedGroupId || groups[0]?.id || "");
    setSelectedGroupScheduleTrainingId("");
    setEmptyCellMode("groupSchedule");
  };

  const handleCreateGroupScheduleOneTime = async (training: Training) => {
    if (!emptyCellInfo) return;
    await createEventAtCell(training, emptyCellInfo.start, false, true, emptyCellGroupId || undefined);
  };

  useEffect(() => {
    if (emptyCellMode === "groupSchedule" && groups.length && !emptyCellGroupId) {
      setEmptyCellGroupId(groups[0].id);
    }
  }, [emptyCellMode, groups, emptyCellGroupId]);

  const handleEventClick = (event: CalendarEvent) => {
    if (event.type === "groupSchedule") {
      setSchedulePopupEvent(event);
    } else if (["run", "bike", "swim", "strength", "training"].includes(event.type)) {
      setSelectedTrainingEvent(event);
    }
  };

  const handleTrainingSelected = async (
    trainingId: string,
    selectedTraining?: Training,
    modifiedStartTime?: Date,
    modifiedEndTime?: Date,
    saveToLibrary?: boolean,
  ) => {
    if (!schedulePopupEvent) return;

    try {
      // Extract group name from the event title (format: "Group Name - Session")
      const groupName = schedulePopupEvent.title.split(" - ")[0] || "Group";
      
      // Find the training or use the provided one
      const training = selectedTraining || trainings.find(t => t.id === trainingId);
      const displayTitle = training ? `${groupName} - ${training.title}` : `${groupName} - Custom Training`;
      
      // If this is a new training being saved to library, save it first
      if (saveToLibrary && selectedTraining && !trainings.find(t => t.id === trainingId)) {
        try {
          const createdTraining = await createTraining(selectedTraining);
          setTrainings((prev) => [...prev, createdTraining]);
        } catch (err) {
          console.error("Failed to save training to library", err);
          // Continue anyway and create the override with temporary training
        }
      }

      // Create an override for this specific date with group name - training name
      await createEventOverride({
        sourceId: schedulePopupEvent.sourceId!,
        originalStartTime: schedulePopupEvent.startTime,
        modifiedTitle: displayTitle,
        modifiedStartTime: modifiedStartTime || schedulePopupEvent.startTime,
        modifiedEndTime: modifiedEndTime || schedulePopupEvent.endTime,
      });

      // Refresh events
      const today = new Date();
      const startOfWeek = new Date(today);
      const day = today.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      startOfWeek.setDate(today.getDate() + diff + weekOffset * 7);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const events = await getEventsByRange(startOfWeek, endOfWeek);
      setCalendarEvents(events);
      
      setSchedulePopupEvent(null);
    } catch (error) {
      console.error("Failed to create event override:", error);
    }
  };

  const handleCancelOverride = async (event: CalendarEvent) => {
    // Check if this is a recurring group schedule (multiple events with same sourceId) or one-time
    const eventsWithSameSourceId = calendarEvents.filter(e => e.sourceId === event.sourceId);
    const isRecurring = eventsWithSameSourceId.length > 1;

    try {
      if (isRecurring) {
        // For recurring group schedules, create a cancellation override
        await createEventOverride({
          sourceId: event.sourceId!,
          originalStartTime: event.startTime,
          isCancelled: true,
        });
      } else {
        // For one-time group schedule events, delete the event
        await deleteEvent(event.id);
      }

      // Refresh events
      const today = new Date();
      const startOfWeek = new Date(today);
      const day = today.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      startOfWeek.setDate(today.getDate() + diff + weekOffset * 7);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const events = await getEventsByRange(startOfWeek, endOfWeek);
      setCalendarEvents(events);
    } catch (error) {
      console.error("Failed to cancel event:", error);
    }
  };

  const calculateWeekStartDate = (offset: number) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    startOfWeek.setDate(today.getDate() + diff + offset * 7);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  };

  const getTrainingForEvent = async (event: CalendarEvent): Promise<Training | null> => {
    if (event.sourceId?.startsWith("training-")) {
      const sourceTraining = trainings.find((t) => event.sourceId?.endsWith(t.id));
      if (sourceTraining) return sourceTraining;
      const localTraining = localTrainingBySourceId[event.sourceId];
      if (localTraining) return localTraining;
    }

    if (event.athleteId) {
      try {
        const assignments = await getAssignments({ athleteId: event.athleteId });
        const assignment = assignments.find((a: any) => 
          new Date(a.startTime).getTime() === event.startTime.getTime()
        );
        if (assignment) {
          return trainings.find(t => t.id === assignment.trainingId) || null;
        }
      } catch (error) {
        console.error("Failed to fetch assignment:", error);
      }
    }
    // Fallback: try to find by title
    return trainings.find(t => event.title.includes(t.title)) || null;
  };

  const handleTrainingDrop = async (
    training: Training,
    dayIndex: number,
    hour: number,
    minute: number,
    offset: number,
  ) => {
    try {
      const weekStart = calculateWeekStartDate(offset);
      const newEventDate = new Date(weekStart);
      newEventDate.setDate(weekStart.getDate() + dayIndex);
      newEventDate.setHours(hour, minute, 0, 0);

      const duration = training.duration ?? 60;
      const endTime = new Date(newEventDate);
      endTime.setMinutes(endTime.getMinutes() + duration);

      await createEvent({
        title: training.title,
        type: training.type as any,
        startTime: newEventDate,
        endTime: endTime,
        athleteId: athleteId,
        groupId: selectedGroupId || undefined,
      });

      // If athlete, create assignment
      if (athleteId) {
        await createAssignment({
          id: crypto.randomUUID(),
          trainingId: training.id,
          athleteId: athleteId,
          startTime: newEventDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Refresh events
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      const events = await getEventsByRange(weekStart, weekEnd);
      setCalendarEvents(events);
    } catch (error) {
      console.error("Failed to drop training:", error);
    }
  };

  const handleEventDrop = async (
    event: CalendarEvent,
    newDayIndex: number,
    newHour: number,
    newMinute: number,
    offset: number,
  ) => {
    try {
      const weekStart = calculateWeekStartDate(offset);
      
      // For group schedule events, create an override instead of updating
      if (event.type === "groupSchedule") {
        const newEventDate = new Date(weekStart);
        newEventDate.setDate(weekStart.getDate() + newDayIndex);
        newEventDate.setHours(newHour, newMinute, 0, 0);

        // Calculate the event duration and preserve it
        const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60); // duration in minutes
        const newEndTime = new Date(newEventDate);
        newEndTime.setMinutes(newEndTime.getMinutes() + duration);

        await createEventOverride({
          sourceId: event.sourceId!,
          originalStartTime: event.startTime,
          modifiedStartTime: newEventDate,
          modifiedEndTime: newEndTime,
          modifiedTitle: event.title,
        });
      } else {
        // For athlete trainings, update the event preserving duration
        const newEventDate = new Date(weekStart);
        newEventDate.setDate(weekStart.getDate() + newDayIndex);
        newEventDate.setHours(newHour, newMinute, 0, 0);

        // Preserve the original duration
        const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60); // duration in minutes
        const endTime = new Date(newEventDate);
        endTime.setMinutes(endTime.getMinutes() + duration);

        // Update event
        await updateEvent(event.id, {
          startTime: newEventDate,
          endTime: endTime,
        });

        // Find and update the assignment if this is an athlete training
        if (event.athleteId) {
          // We would need the assignment ID here, but we don't have it in CalendarEvent
          // The assignment would need to be updated separately if available
        }
      }

      // Refresh events
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      const events = await getEventsByRange(weekStart, weekEnd);
      setCalendarEvents(events);
    } catch (error) {
      console.error("Failed to drag event:", error);
    }
  };

  // Convert CalendarEvents to Event format for CalendarGrid
  const eventsForGrid: CalendarEvent[] = calendarEvents.map((ce) => ({
    id: ce.id,
    title: ce.title,
    description: "",
    type: ce.type,
    startTime: new Date(ce.startTime),
    endTime: new Date(ce.endTime),
    groupId: ce.groupId || "",
    athleteId: ce.athleteId || "",
    sourceId: ce.sourceId,
    createdAt: new Date()
  }));

  return (
    <div className="calendar">
      <Library
        trainings={trainings}
        onAdd={() => {
          const newTraining: Training = {
            id: crypto.randomUUID(),
            title: "",
            description: "",
            duration: 60,
            type: "swim",
            creationDate: new Date(),
            equipment: [],
            steps: [],
            notes: "",
          };

          setEditing(newTraining);
        }}
        onSelect={(t) => setViewing(t)}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <div className="calendar-nav">
          <button onClick={() => setWeekOffset((w) => w - 1)}>◀</button>

          <button onClick={() => setWeekOffset(0)}>Today</button>

          <button onClick={() => setWeekOffset((w) => w + 1)}>▶</button>

          <div className="week-range">
            {startOfWeek.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}

            {" - "}

            {endOfWeek.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </div>

          {/* Load Calculator */}
          <LoadCalculator
            events={calendarEvents}
            selectedGroupId={selectedGroupId}
            athleteId={athleteId}
          />

          {/* Group Filter (only show if not athlete view) */}
          {!athleteId && setSelectedGroupId && (
            <div className="group-filter">
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
              >
                <option value="">All Groups</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {loading && <span style={{ marginLeft: "auto", color: "#666" }}>Loading...</span>}
        </div>
        <WeeklyHeader weekOffset={weekOffset} />
        <DaySummeryRow />

        <div className="calendar-body">
          <TimeColumn />

          <CalendarGrid
            events={eventsForGrid}
            onEdit={setEditing}
            onEmptyCellClick={handleEmptyCellClick}
            onEventClick={handleEventClick}
            onTrainingDrop={handleTrainingDrop}
            onEventDrop={handleEventDrop}
            weekOffset={weekOffset}
          />
        </div>

        {editing && (
          <TrainingPopup
            training={editing}
            onClose={() => {
              setEditing(null);
              setEditingFromCalendar(false);
              setEditingEvent(null);
            }}
            onSave={async (updated) => {
              const exists = trainings.find((t) => t.id === updated.id);

              try {
                // Create new training
                if (!exists) {
                  const created = await createTraining(updated);
                  setTrainings((prev) => [...prev, created]);
                } else {
                  const updatedTraining = await updateTraining(
                    updated.id,
                    updated,
                  );
                  setTrainings((prev) =>
                    prev.map((t) =>
                      t.id === updated.id ? updatedTraining : t,
                    ),
                  );
                }

                setEditing(null);
                setEditingFromCalendar(false);
                setEditingEvent(null);
              } catch (err) {
                console.error("Failed to save training", err);
              }
            }}
            {...(editingFromCalendar && editingEvent ? {
              isGroupSchedule: true,
              onSaveOneTime: async (updated) => {
                try {
                  // Create a new training for one-time use
                  const newTraining = await createTraining({
                    ...updated,
                    id: crypto.randomUUID(),
                    title: `${updated.title} (Modified)`,
                    creationDate: new Date(),
                  });
                  setTrainings((prev) => [...prev, newTraining]);

                  // Update the assignment to point to the new training
                  if (editingEvent.athleteId) {
                    const assignments = await getAssignments({ athleteId: editingEvent.athleteId });
                    const assignment = assignments.find((a: any) => 
                      new Date(a.startTime).getTime() === editingEvent.startTime.getTime()
                    );
                    if (assignment) {
                      await updateAssignment(assignment.id, { trainingId: newTraining.id });
                    }
                  }

                  setEditing(null);
                  setEditingFromCalendar(false);
                  setEditingEvent(null);
                } catch (err) {
                  console.error("Failed to save one-time training", err);
                }
              },
              onSaveLibrary: async (updated) => {
                try {
                  // Update the existing training
                  const updatedTraining = await updateTraining(updated.id, updated);
                  setTrainings((prev) =>
                    prev.map((t) =>
                      t.id === updated.id ? updatedTraining : t,
                    ),
                  );

                  setEditing(null);
                  setEditingFromCalendar(false);
                  setEditingEvent(null);
                } catch (err) {
                  console.error("Failed to save to library", err);
                }
              }
            } : {})}
          />
        )}
      </div>
      {viewing && (
        <TrainingDetails
          training={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setEditing(viewing);
            setViewing(null);
          }}
          onDelete={async (id) => {
                            if (window.confirm("Delete this training?")) {
            try {
              await deleteTraining(id);

              setTrainings((prev) => prev.filter((t) => t.id !== id));

              setViewing(null);
            } catch (err) {
              console.error("Delete failed", err);
            }}
          }}
        />
      )}

      {/* Group Schedule Popup */}
      {schedulePopupEvent && (
        <GroupSchedulePopup
          isOpen={!!schedulePopupEvent}
          onClose={() => setSchedulePopupEvent(null)}
          event={schedulePopupEvent}
          trainings={trainings}
          onTrainingSelected={handleTrainingSelected}
          onCancel={handleCancelOverride}
          groupName={schedulePopupEvent.title.split(" - ")[0]}
        />
      )}

      {/* Training Details for Calendar Events */}
      {selectedTrainingEvent && selectedEventTraining && (
        <TrainingDetails
          training={selectedEventTraining}
          onClose={() => setSelectedTrainingEvent(null)}
          onEdit={() => {
            setEditing(selectedEventTraining);
            setEditingFromCalendar(true);
            setEditingEvent(selectedTrainingEvent);
            setSelectedTrainingEvent(null);
          }}
          onDelete={async (_id: string) => {
            if (window.confirm("Delete this training from calendar?")) {
              try {
                if (selectedTrainingEvent.type === "groupSchedule") {
                  // Check if recurring or one-time
                  const eventsWithSameSourceId = calendarEvents.filter(e => e.sourceId === selectedTrainingEvent.sourceId);
                  const isRecurring = eventsWithSameSourceId.length > 1;

                  if (isRecurring) {
                    // Create cancellation override
                    await createEventOverride({
                      sourceId: selectedTrainingEvent.sourceId!,
                      originalStartTime: selectedTrainingEvent.startTime,
                      isCancelled: true,
                    });
                  } else {
                    // Delete the one-time event
                    await deleteEvent(selectedTrainingEvent.id);
                  }
                } else {
                  // Delete the event
                  await deleteEvent(selectedTrainingEvent.id);
                }
                setSelectedTrainingEvent(null);
                // Refresh events
                const weekStart = calculateWeekStartDate(weekOffset);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 7);
                const events = await getEventsByRange(weekStart, weekEnd);
                setCalendarEvents(events);
              } catch (error) {
                console.error("Failed to remove training from calendar:", error);
              }
            }
          }}
          deleteButtonText={selectedTrainingEvent.type === "groupSchedule" ? "Cancel Session" : "Delete"}
        />
      )}

      {emptyCellInfo && emptyCellMode === "choose" && (
        <div className="popup-overlay" onClick={closeEmptyCellModal}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>New event</h3>
              <button className="close-btn" onClick={closeEmptyCellModal}>
                ×
              </button>
            </div>
            <div className="popup-body">
              <p>
                Create a new event for <strong>{emptyCellInfo.start.toLocaleString()}</strong>.
              </p>
              <div className="create-options">
                <button className="create-option-button" onClick={openNewWorkoutFromEmptyCell}>
                  <strong>New workout</strong>
                  <span>Create a new workout and schedule it for this slot.</span>
                </button>
                <button className="create-option-button" onClick={() => setEmptyCellMode("library")}>
                  <strong>Choose from library</strong>
                  <span>Select an existing workout from your library.</span>
                </button>
                <button className="create-option-button" onClick={openGroupScheduleFromEmptyCell}>
                  <strong>Group schedule override</strong>
                  <span>Create a one-time group schedule entry here.</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {emptyCellInfo && emptyCellMode === "library" && (
        <div className="popup-overlay" onClick={closeEmptyCellModal}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>Choose workout from library</h3>
              <button className="close-btn" onClick={closeEmptyCellModal}>
                ×
              </button>
            </div>
            <div className="popup-body">
              {Object.entries(groupedTrainings).map(([type, list]) => (
                <div key={type} className="training-group">
                  <div className="training-group-header">
                    {getIcon(type)} {type === "bike" ? "Cycling" : type === "strength" ? "Gym" : type.charAt(0).toUpperCase() + type.slice(1)} ({list.length})
                  </div>
                  <div className="training-group-items">
                    {list.map((training) => (
                      <div
                        key={training.id}
                        className="training-item"
                        onClick={() => handleLibrarySelect(training)}
                      >
                        <div>
                          <h5>{training.title || "Untitled"}</h5>
                          <p>{training.duration || 60} min</p>
                        </div>
                        <span>{getIcon(training.type)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {emptyCellInfo && emptyCellMode === "newWorkout" && emptyCellTrainingDraft && (
        <TrainingPopup
          training={emptyCellTrainingDraft}
          onClose={closeEmptyCellModal}
          onSave={() => {}}
          isGroupSchedule={true}
          onSaveOneTime={handleCreateWorkoutSaveOneTime}
          onSaveLibrary={handleCreateWorkoutSaveToLibrary}
        />
      )}

      {emptyCellInfo && emptyCellMode === "groupSchedule" && (
        <div className="popup-overlay" onClick={closeEmptyCellModal}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>Create group schedule override</h3>
              <button className="close-btn" onClick={closeEmptyCellModal}>
                ×
              </button>
            </div>
            <div className="popup-body">
              <div className="form-row">
                <label>
                  Group
                  <select
                    value={emptyCellGroupId}
                    onChange={(e) => setEmptyCellGroupId(e.target.value)}
                  >
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="training-list">
                {Object.entries(groupedTrainings).map(([type, list]) => (
                  <div key={type} className="training-group">
                    <div className="training-group-header">
                      {getIcon(type)} {type === "bike" ? "Cycling" : type === "strength" ? "Gym" : type.charAt(0).toUpperCase() + type.slice(1)} ({list.length})
                    </div>
                    <div className="training-group-items">
                      {list.map((training) => (
                        <div
                          key={training.id}
                          className={`training-item ${selectedGroupScheduleTrainingId === training.id ? "selected" : ""}`}
                          onClick={() => setSelectedGroupScheduleTrainingId(training.id)}
                        >
                          <div>
                            <h5>{training.title || "Untitled"}</h5>
                            <p>{training.duration || 60} min</p>
                          </div>
                          <span>{getIcon(training.type)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="popup-footer">
                <button className="cancel-btn" onClick={closeEmptyCellModal}>
                  Cancel
                </button>
                <button
                  className="submit-btn"
                  disabled={!selectedGroupScheduleTrainingId}
                  onClick={async () => {
                    const training = trainings.find((t) => t.id === selectedGroupScheduleTrainingId);
                    if (!training) return;
                    await handleCreateGroupScheduleOneTime(training);
                  }}
                >
                  Add override to group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
