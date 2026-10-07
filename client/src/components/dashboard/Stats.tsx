import "./Stats.css";

interface Props {
  athletes: number;
  groups: number;
  trainingsToday: number;
  callsPending: number;
}

export default function Stats({
  athletes,
  groups,
  trainingsToday,
  callsPending,
}: Props) {
  return (
    <div className="stats-container">
      <div className="stat-item">
        <span className="stat-label">Athletes:</span>
        <span className="stat-value">{athletes}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Groups:</span>
        <span className="stat-value">{groups}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Trainings Today:</span>
        <span className="stat-value">{trainingsToday}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Calls Pending:</span>
        <span className="stat-value">{callsPending}</span>
      </div>
    </div>
  );
}
