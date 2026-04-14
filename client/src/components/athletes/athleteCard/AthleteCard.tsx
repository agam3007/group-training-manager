import type { Athlete } from "../../../../../shared/types/athlete";
import "./AthleteCard.css";

interface Props {
  athlete: Athlete;
  onClick: (athlete: Athlete) => void;
}

export default function AthleteCard({ athlete, onClick }: Props) {
  const initials = athlete.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="athlete-card" onClick={() => onClick(athlete)}>
      <div className="athlete-header">
        <div className="athlete-avatar">{initials}</div>

        <div>
          <h3>{athlete.name}</h3>

          <div className="athlete-level">{athlete.level}</div>
        </div>
      </div>

      {athlete.age && <div className="athlete-age">Age: {athlete.age}</div>}

    </div>
  );
}
