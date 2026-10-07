import type { Program } from "@/shared/types/periodization";
import "./ProgramCard.css";

interface Props {
  program: Program;
  onClick: (program: Program) => void;
}

export default function ProgramCard({ program, onClick }: Props) {
  return (
    <div className="program-card" onClick={() => onClick(program)}>
      <div className="program-card-header">
        <h3>{program.name}</h3>
        <span className="program-level">{program.level}</span>
      </div>
      <div className="program-detail-row">
        <span className="program-chip">{program.sport}</span>
        <span>{program.assigneeType}: {program.assigneeName}</span>
      </div>
      <div className="program-date-row">
        <span>{program.startDate}</span>
        <span>→</span>
        <span>{program.endDate}</span>
      </div>
      <div className="program-goal">{program.mainGoal}</div>
      <div className="program-progress-bar">
        <div className="progress" style={{ width: "58%" }} />
      </div>
    </div>
  );
}
