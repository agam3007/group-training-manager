import { useState, useEffect, useCallback } from "react";
import type { AttendanceRecord, TodayTimeline } from "@/shared/types";
import type { CalendarEvent } from "@/shared/types/calendarEvent";
import type { Athlete } from "@/shared/types";
import { getDashboardToday } from "@/api/dashboard";
import { createEvent, deleteEvent, updateEvent } from "@/api/events";
import { getGroup } from "@/api/group";
import { createAssignment, updateAssignment } from "@/api/trainingAssignment";

import "./Dashboard.css";

import TodayTimelineSchedule from "../../components/dashboard/TodayTimline";
import Stats from "../../components/dashboard/Stats";
import AthleteCheckins from "../../components/dashboard/AthleteCheckIns";
import QuickInsightWidget from "../../components/dashboard/QuickInsightWidget";
import AdminTodoList from "../../components/dashboard/AdminTodoList";
import AttendancePopup from "../../components/dashboard/AttendancePopup";
import { getAthleteGroupsByGroupId } from "@/api/athleteGroup";
import { getAthlete } from "@/api/athlete";
import { recordBulkAttendance } from "@/api/attendance";

interface Props {
  setTrainings: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function Dashboard({ setTrainings }: Props) {
  const [dashboardData, setDashboardData] = useState<TodayTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [attendanceEvent, setAttendanceEvent] = useState<CalendarEvent | null>(null);
  const [groupAthletes, setGroupAthletes] = useState<Athlete[]>([]);

  // Load unified dashboard data
  const loadDashboard = useCallback(async () => {
    try {
      const data = await getDashboardToday();
      setDashboardData(data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, refreshTrigger]);

  const handleAddEvent = async (event: CalendarEvent) => {
    try {
      const { id, createdAt, ...eventData } = event;
      const createdEvent = await createEvent(eventData);
      
      // If it's a group schedule event with a groupId, create training assignments for all athletes
      if (event.type === "groupSchedule" && event.groupId) {
        try {
          const athletes = await getAthleteGroupsByGroupId(event.groupId);
          
          // Create training assignment for each athlete
          for (const athlete of athletes) {
            await createAssignment({
              id: `${athlete.id}-${createdEvent.id}`,
              updatedAt: new Date(),
              athleteId: athlete.id,
              groupId: event.groupId,
              trainingId: "",
              startTime: event.startTime,
              endTime: event.endTime,
              status: "PENDING",
              createdAt: new Date(),
              notes: `Training assignment - ${event.title}`,
            });
          }
        } catch (err) {
          console.error("Failed to create training assignments:", err);
        }
      }
      
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to add event:", err);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteEvent(id);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  };

  const handleUpdateEvent = async (event: CalendarEvent) => {
    try {
      await updateEvent(event.id, event);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to update event:", err);
    }
  };

  const handleToggleDone = async (id: string) => {
    const event = dashboardData?.events.find((e) => e.id === id);
    if (!event) return;

    // If it's a group schedule event, open attendance popup
    if (event.type === "groupSchedule" && event.groupId) {
      try {
        let athletes = await getAthleteGroupsByGroupId(event.groupId);
        athletes = await Promise.all(
  athletes.map(async (athleteGroup: { athleteId: string }) => {
    const athlete = await getAthlete(athleteGroup.athleteId);

    return {
      ...athlete,
      name: athlete.name || "Unknown Athlete",
    };
  })
);
        setGroupAthletes(athletes);
        setAttendanceEvent(event);
      } catch (err) {
        console.error("Failed to load group athletes:", err);
      }
    } else {
      // For other events, just toggle done status
      await handleUpdateEvent({ ...event, done: !event.done });
    }
  };

const handleAttendanceClose = async (records: (AttendanceRecord & { athleteId: string })[]) => {
  if (!attendanceEvent) return;

  try {
    // 1. שליחת כל רשומות הנוכחות בבת אחת לשרת
    await recordBulkAttendance(attendanceEvent.id, records);

    // 2. עדכון האירוע בלוח כ"בוצע"
    await handleUpdateEvent({ ...attendanceEvent, done: true });

    // 3. ניקוי הסטייט ורענון הדאשבורד
    setAttendanceEvent(null);
    setRefreshTrigger((prev) => prev + 1);
    
    // כאן ה-Red List בדאשבורד יתעדכן אוטומטית כי הוא מושך נתונים מטבלת ה-Attendance
  } catch (err) {
    console.error("Failed to save attendance:", err);
    // כדאי להוסיף כאן Toast alert למשתמש
  }
};

  const handleContactAthlete = async (athleteId: string) => {
    try {
      await fetch("/api/contact-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athleteId, timestamp: new Date() }),
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to log contact:", err);
    }
  };

  const handleSaveNote = async (note: any) => {
    try {
      await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(note),
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to save note:", err);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  if (!dashboardData) {
    return <div className="dashboard-error">Failed to load dashboard data</div>;
  }

  // Filter events based on selection (ghosting logic)
  const filteredEvents = dashboardData.events.filter((event) => {
    if (selectedGroupId && event.groupId !== selectedGroupId) {
      return false;
    }
    if (selectedAthleteId && event.athleteId !== selectedAthleteId) {
      return false;
    }
    return true;
  });

  // Determine visible/ghosted events
  const visibleEvents = selectedGroupId || selectedAthleteId ? filteredEvents : dashboardData.events;
  const ghostedEvents = selectedGroupId || selectedAthleteId ? dashboardData.events.filter((e) => !filteredEvents.includes(e)) : [];
  return (
    <div className="dashboard-container">
      {/* TOP STATS BAR */}
      <div className="dashboard-stats-bar">
        <Stats
          athletes={dashboardData.stats.totalAthletes}
          groups={dashboardData.stats.totalGroups}
          trainingsToday={dashboardData.stats.trainingsToday}
          callsPending={dashboardData.stats.atRiskAthletes}
        />
      </div>

      {/* MAIN CONTENT */}
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <TodayTimelineSchedule
            events={visibleEvents}
            ghostedEvents={ghostedEvents}
            onAdd={handleAddEvent}
            onUpdate={handleUpdateEvent}
            onDelete={handleDeleteEvent}
            onToggleDone={handleToggleDone}
          />

          {/* <QuickInsightWidget onSaveNote={handleSaveNote} /> */}
        </div>

        {/* SIDEBAR - RIGHT COLUMN */}
        <aside className="dashboard-sidebar">
          <AthleteCheckins athletes={dashboardData.atRiskAthletes} />
          {/* <AdminTodoList /> */}
        </aside>
      </div>

      {/* ATTENDANCE POPUP */}
      {attendanceEvent && (
        <AttendancePopup
          groupId={attendanceEvent.groupId || ""}
          athletes={groupAthletes}
          eventDate={new Date(attendanceEvent.startTime)}
          onClose={handleAttendanceClose}
        />
      )}
    </div>
  );
}
