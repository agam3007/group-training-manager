import type { Program } from "@/shared/types/periodization";
import "./ProgramCard.css";

interface Props {
  program: Program;
  onClick: (program: Program) => void;
}

export default function ProgramCard({ program, onClick }: Props) {
  return (
    <div className="program-card" onClick={() => onClick(program)}>
      <h3>{program.name}</h3>
      <div className="program-meta">
        <span>{program.assigneeType}: {program.assigneeName}</span>
        <span>{program.sport}</span>
        <span>{program.startDate} → {program.endDate}</span>
        <span>Level: {program.level}</span>
      </div>
      <div className="program-goal">{program.mainGoal}</div>
      <div className="program-progress-bar">
        <div className="progress" style={{ width: "60%" }} />
      </div>
    </div>
  );
}