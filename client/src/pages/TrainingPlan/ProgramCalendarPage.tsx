import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ProgramCalendarView from "./ProgramCalendarView";
import { getPrograms } from "@/api/program";
import type { Program } from "@/shared/types/periodization";

export default function ProgramCalendarPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const programId = (location.state as { programId?: string } | null)?.programId;
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProgram() {
      try {
        const programs = await getPrograms();
        const selectedProgram = programId
          ? programs.find((prog) => prog.id === programId)
          : programs[0];

        if (selectedProgram) {
          setProgram(selectedProgram);
        } else if (programs.length > 0) {
          setProgram(programs[0]);
        } else {
          setError("No programs found");
        }
      } catch (err) {
        setError("Failed to load program");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProgram();
  }, []);

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading program...</div>;
  }

  if (error || !program) {
    return <div style={{ padding: "20px", color: "red" }}>{error || "No program available"}</div>;
  }

  return (
    <div>
      <ProgramCalendarView program={program} onClose={() => navigate('/training-plans')} />
    </div>
  );
}
