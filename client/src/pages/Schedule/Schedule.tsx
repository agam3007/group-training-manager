import { useEffect, useState } from "react";
import type { Training, TrainingAssignment } from "@/shared/types";
import { useParams } from "react-router-dom";
import { getAssignments } from "@/api/trainingAssignment";
import { getGroups } from "@/api/group";
import type { Group } from "@/shared/types";
import { Calendar } from "@/components/calendar";

interface Props {
  trainings: Training[];
  setTrainings: React.Dispatch<React.SetStateAction<Training[]>>;
}

export default function Schedule({ trainings, setTrainings }: Props) {
  const { groupId, athleteId } = useParams();

  const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);

  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    (async () => {
      try {
        if (groupId) {
          const res = await getAssignments({ groupId });
          setAssignments(res);
          return;
        }

        if (athleteId) {
          const res = await getAssignments({ athleteId });
          setAssignments(res);
          return;
        }

        // default: show group assignments only
        const res = await getGroups();
        setGroups(res);
      } catch (err) {
        console.error("Failed to load assignments", err);
        setAssignments([]);
      }
    })();
  }, [groupId, athleteId]);

  return (
    <Calendar
      trainings={trainings}
      setTrainings={setTrainings}
      assignments={assignments || []}
      setAssignments={setAssignments}
      groups={groups || []}
      setGroups={setGroups}
    />
  );
}
