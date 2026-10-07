import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Program } from "@/shared/types/periodization";
import "./TrainingPlan.css";
import ProgramCard from "@/components/trainingPlan/programCard";
// ProgramCalendarView is opened on its own page at /training-plans/calendar
import ProgramSetupWizard from "../../components/programs/programSetupWizard/ProgramSetupWizard";
import { getPrograms } from "@/api/program";
import { PageHeader } from "@/components/shared";

export default function TrainingPlan() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [search, setSearch] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    async function loadPrograms() {
      try {
        const programs = await getPrograms();
        setPrograms(programs);
      } catch (error) {
        console.error("Failed to load programs", error);
      }
    }

    loadPrograms();
  }, []);

  // Filtered programs
  const filtered = programs.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.assigneeName.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateProgram = (program: Program) => {
    setPrograms((prev) => [...prev, program]);
    setShowWizard(false);
    // navigate to calendar page for the new program
    navigate('/training-plans/calendar', { state: { programId: program.id } });
  };

  return (
    <div className="training-plan-dashboard">
       <PageHeader
              search={search}
              setSearch={setSearch}
              onAdd={() => setShowWizard(true)}
            />

      <div className="cards-grid">
        {filtered.map((p) => (
          <ProgramCard key={p.id} program={p} onClick={() => navigate('/training-plans/calendar', { state: { programId: p.id } })} />
        ))}
      </div>

      {showWizard && (
        <ProgramSetupWizard
          onClose={() => setShowWizard(false)}
          onComplete={handleCreateProgram}
        />
      )}
    </div>
  );
}