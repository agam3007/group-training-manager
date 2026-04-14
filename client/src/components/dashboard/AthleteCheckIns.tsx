import type { Athlete } from "../../../../shared/types/athlete";
import type { AthleteTalk } from "../../types/athleteTalk";

interface Props {
  athletes: Athlete[];

  talks: AthleteTalk[];
}

export default function AthleteCheckins({ athletes, talks }: Props) {
  const now = new Date();

  const needsTalk = athletes.filter((a) => {
    const athleteTalks = talks
      .filter((t) => t.athleteId === a.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (athleteTalks.length === 0) return true;

    const last = new Date(athleteTalks[0].date);

    const days = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);

    return days > 14;
  });

  return (
    <div className="dashboard-card">
      <h3>Athlete Check-ins</h3>

      {needsTalk.map((a) => (
        <div key={a.id}>{a.name}</div>
      ))}
    </div>
  );
}
