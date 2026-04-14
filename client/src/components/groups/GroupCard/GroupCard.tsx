import { useEffect } from "react";
import { getAthlete } from "../../../api/athlete";
import { getAthleteGroupsByGroupId } from "../../../api/athleteGroup";
import type { Group } from "@/shared/types";
import "./GroupCard.css";

interface Props {
  group: Group;
  onClick: (group: Group) => void;
}

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function GroupCard({ group, onClick }: Props) {
  useEffect(() => {
    load();
  }, []);
  let athleteCount = 0;
  const load = async () => {
    const relations = await getAthleteGroupsByGroupId(group.id);

    // 🔥 מביאים אתלטים לפי קשרים
    const athletesData = await Promise.all(
      relations.map((r: any) => getAthlete(r.athleteId)),
    );
    athleteCount = athletesData.length;
  };
  return (
    <div className="group-card" onClick={() => onClick(group)}>
      <h3>{group.name}</h3>

      <div className="group-schedule">
        {group.schedule.map((s, i) => (
          <span key={i}>
            {days[s.day]} {s.start.hour}:
            {s.start.min.toString().padStart(2, "0")}{" "}
            {s.end &&
              `- ${s.end.hour}:${s.end.min.toString().padStart(2, "0")}`}
          </span>
        ))}
      </div>

      <div className="group-participants">{athleteCount} athletes</div>
    </div>
  );
}
