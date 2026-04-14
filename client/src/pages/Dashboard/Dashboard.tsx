import { useState, useEffect } from "react";

import type { Group } from "../../../../shared/types/group";
import type { Athlete } from "../../../../shared/types/athlete";
import type { Training } from "../../../../shared/types/training";
import type { DayEvent } from "../../../../shared/types/dayEvent";
import type { AthleteTalk } from "../../types/athleteTalk";

import { getGroups } from "../../api/group";
import { getAthletes } from "../../api/athlete";
import {
  getEvents,
  addEvent,
  updateEvent,
  deleteEvent,
} from "../../api/events";

import "./Dashboard.css";

import TodayTimeline from "../../components/dashboard/TodayTimline";
import Alerts from "../../components/dashboard/Alerts";
import AthleteCheckins from "../../components/dashboard/AthleteCheckIns";
import Stats from "../../components/dashboard/Stats";

interface Props {
  setTrainings: React.Dispatch<React.SetStateAction<Training[]>>;
}

export default function Dashboard({ setTrainings }: Props) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [events, setEvents] = useState<DayEvent[]>([]);
  const [talks] = useState<AthleteTalk[]>([]);

  const alerts = [
    { id: "1", message: "Tal knee pain" },
    { id: "2", message: "Noa missed training" },
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const groupsData = await getGroups();
        const athletesData = await getAthletes();
        const eventsData = await getEvents();

        setGroups(groupsData);
        setAthletes(athletesData);
        setEvents(eventsData);

        // const trainings =
        //   groupsData.flatMap((group:Group)=>
        //     groupToTrainings(group)
        //   )

        // setTrainings(trainings)
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };

    loadData();
  }, []);

  const handleAddEvent = async (event: DayEvent) => {
    try {
      await addEvent(event);

      setEvents((prev) => [...prev, event]);
    } catch (err) {
      console.error("failed to add event", err);
    }
  };
  const handleDeleteEvent = async (id: string) => {
    await deleteEvent(id);

    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleUpdateEvent = async (event: DayEvent) => {
    await updateEvent(event);

    setEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
  };
  const handleToggleDone = async (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, done: !e.done } : e)),
    );
  };
  const trainingsToday = events.filter((e) => e.type === "training").length;

  const callsPending = athletes.length;

  return (
    <div className="dashboard-grid">
      <div>
        <TodayTimeline
          events={events}
          onAdd={handleAddEvent}
          onUpdate={handleUpdateEvent}
          onDelete={handleDeleteEvent}
          onToggleDone={handleToggleDone}
        />

        <Alerts alerts={alerts} />
      </div>

      <div>
        <AthleteCheckins athletes={athletes} talks={talks} />

        <Stats
          athletes={athletes.length}
          groups={groups.length}
          trainingsToday={trainingsToday}
          callsPending={callsPending}
        />
      </div>
    </div>
  );
}
