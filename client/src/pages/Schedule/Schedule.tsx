import { useEffect, useState } from "react";
import type { Training, CalendarEvent } from "@/shared/types";
import { useParams } from "react-router-dom";
import { getTrainings } from "@/api/training";
import { getEventsByRange } from "@/api/events";
import { Calendar } from "@/components/calendar";

interface Props {
  trainings: Training[];
  setTrainings: React.Dispatch<React.SetStateAction<Training[]>>;
}

export default function Schedule({ trainings, setTrainings }: Props) {
  const { athleteId } = useParams();

  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Fetch all trainings for the library
  useEffect(() => {
    (async () => {
      try {
        const allTrainings = await getTrainings();
        setTrainings(allTrainings);
      } catch (err) {
        console.error("Failed to load trainings", err);
      }
    })();
  }, [setTrainings]);

  // Fetch all calendar events (always show all events now)
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // Calculate week range for fetching events
        const today = new Date();
        const startOfWeek = new Date(today);
        const day = today.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        startOfWeek.setDate(today.getDate() + diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Always fetch all events
        const events = await getEventsByRange(startOfWeek, endOfWeek);

        setAllEvents(events);
      } catch (err) {
        console.error("Failed to load calendar events", err);
        setAllEvents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filter events based on selected group
  useEffect(() => {
    if (athleteId) {
      // For athlete view, show events assigned to this athlete or their groups
      const athleteEvents = allEvents.filter(event =>
        event.athleteId === athleteId || event.type === "groupSchedule"
      );
      setFilteredEvents(athleteEvents);
    } else if (selectedGroupId) {
      // For group filter, show only events for this group
      const groupEvents = allEvents.filter(event =>
        event.groupId === selectedGroupId
      );
      setFilteredEvents(groupEvents);
    } else {
      // Show all events
      setFilteredEvents(allEvents);
    }
  }, [allEvents, selectedGroupId, athleteId]);

  return (
    <Calendar
      trainings={trainings}
      setTrainings={setTrainings}
      calendarEvents={filteredEvents}
      setCalendarEvents={setAllEvents}
      loading={loading}
      selectedGroupId={selectedGroupId}
      setSelectedGroupId={setSelectedGroupId}
      athleteId={athleteId}
    />
  );
}
