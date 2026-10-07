import { useEffect, useState, useRef } from "react";
import type { MacroEvent, MesoPhase } from "@/shared/types/periodization";
import "./Step3TimelineVisualizationModal.css";

interface Props {
  program: Partial<any>;
  events: MacroEvent[];
  loadingPattern: string;
  periodizationModel: string;
  onBack: () => void;
  onComplete: (phases: MesoPhase[]) => void;
}

const msDay = 1000 * 60 * 60 * 24;
// תאריך דמה שישמש כעוגן עבור תוכניות מבוססות שבועות (יום שני כלשהו בשנה)
const MOCK_BASE_DATE = new Date(2024, 0, 1); 

function formatDateObj(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generatePhases(
  startDate: string,
  endDate: string,
  events: MacroEvent[],
  model: string
): MesoPhase[] {
  const programStart = new Date(startDate);
  const programEnd = new Date(endDate);

  const aRaces = events
    .filter((e) => e.type === "A-Race")
    .map((e) => new Date(e.date))
    .sort((a, b) => a.getTime() - b.getTime());

  const targets = aRaces.length > 0 ? aRaces : [programEnd];

  let currentCycleStart = new Date(programStart);
  let allPhases: MesoPhase[] = [];
  let phaseIndex = 1;

  const phaseContainsCamp = (phaseStart: Date, phaseEnd: Date): boolean =>
    events.some((event) => {
      if (event.type !== "Training Camp") return false;
      const eventDate = new Date(event.date);
      return eventDate >= phaseStart && eventDate <= phaseEnd;
    });

  const createPhase = (
    name: string,
    start: Date,
    end: Date,
    vol: number,
    load: string,
    int: string
  ): MesoPhase | null => {
    const safeStart = new Date(Math.max(start.getTime(), programStart.getTime()));
    const safeEnd = new Date(Math.min(end.getTime(), programEnd.getTime()));
    
    if (safeStart >= safeEnd) return null;

    const overload = phaseContainsCamp(safeStart, safeEnd) ? " (Overload)" : "";

    return {
      id: String(phaseIndex++),
      phaseType: name as MesoPhase["phaseType"],
      startDate: formatDateObj(safeStart),
      endDate: formatDateObj(safeEnd),
      targetVolumeHours: vol,
      loadingPattern: `${load}${overload}`,
      intensityDistribution: int,
    };
  };

  for (let i = 0; i < targets.length; i++) {
    const targetDate = targets[i];
    if (currentCycleStart >= targetDate) continue; 

    const taperDays = 14;
    const peakDaysDefault = 21;

    const taperEnd = new Date(targetDate);
    const taperStart = new Date(taperEnd);
    taperStart.setDate(taperStart.getDate() - taperDays);

    const availableLeadDays = Math.max(
      0,
      Math.ceil((taperStart.getTime() - currentCycleStart.getTime()) / msDay)
    );

    let peakDays = peakDaysDefault;
    if (availableLeadDays < peakDaysDefault) {
      peakDays = Math.max(0, availableLeadDays);
    }

    const peakEnd = new Date(taperStart);
    const peakStart = new Date(peakEnd);
    peakStart.setDate(peakStart.getDate() - peakDays);

    const remainingDays = Math.max(
      0,
      Math.ceil((peakStart.getTime() - currentCycleStart.getTime()) / msDay)
    );

    const baseRatio = model === "Linear" ? 0.6 : model === "Block" ? 0.4 : 0.5;
    const baseDays = Math.round(remainingDays * baseRatio);

    const baseStart = new Date(currentCycleStart);
    const baseEnd = new Date(baseStart);
    baseEnd.setDate(baseEnd.getDate() + baseDays);

    const buildStart = new Date(baseEnd);
    const buildEnd = new Date(peakStart);

    const cyclePhases = [
      createPhase("Base", baseStart, baseEnd, 12, model === "Block" ? "2:1" : "2:1", model === "Linear" ? "80/20" : model === "Block" ? "85/15" : "75/25"),
      createPhase("Build", buildStart, buildEnd, 14, model === "Block" ? "3:1" : "3:1", model === "Linear" ? "70/30" : model === "Block" ? "65/35" : "65/35"),
      createPhase("Peak", peakStart, peakEnd, 16, model === "Block" ? "2:1" : model === "Undulating" ? "3:2" : "3:1", model === "Block" ? "45/55" : model === "Undulating" ? "55/45" : "60/40"),
      createPhase("Taper", taperStart, taperEnd, 8, "1:1", "50/50"),
    ].filter(Boolean) as MesoPhase[];

    allPhases.push(...cyclePhases);

    currentCycleStart = new Date(targetDate);
    currentCycleStart.setDate(currentCycleStart.getDate() + 1);
  }

  if (currentCycleStart < programEnd) {
    const remainingDays = Math.ceil((programEnd.getTime() - currentCycleStart.getTime()) / msDay);
    const baseDays = Math.round(remainingDays * 0.6);
    
    const baseStart = new Date(currentCycleStart);
    const baseEnd = new Date(baseStart);
    baseEnd.setDate(baseEnd.getDate() + baseDays);

    const buildStart = new Date(baseEnd);
    const buildEnd = new Date(programEnd);

    const postSeasonPhases = [
      createPhase("Base", baseStart, baseEnd, 10, "2:1", "80/20"),
      createPhase("Build", buildStart, buildEnd, 12, "3:1", "70/30"),
    ].filter(Boolean) as MesoPhase[];

    allPhases.push(...postSeasonPhases);
  }

  if (allPhases.length === 0) {
    const defaultPhase: MesoPhase = {
      id: "1",
      phaseType: "Base" as MesoPhase["phaseType"],
      startDate: formatDateObj(programStart),
      endDate: formatDateObj(programEnd),
      targetVolumeHours: 10,
      loadingPattern: "3:1",
      intensityDistribution: "80/20"
    };
    return [defaultPhase];
  }

  return allPhases;
}

function calculatePosition(date: string, start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const eventDate = new Date(date);
  const total = endDate.getTime() - startDate.getTime() || 1;
  const progress = Math.min(1, Math.max(0, (eventDate.getTime() - startDate.getTime()) / total));
  return progress * 100;
}

function calculateWidth(start: string, end: string, programStart: string, programEnd: string): number {
  const pStart = new Date(programStart);
  const pEnd = new Date(programEnd);
  const phStart = new Date(start);
  const phEnd = new Date(end);

  const totalDays = (pEnd.getTime() - pStart.getTime()) / msDay || 1;
  const phaseDays = (phEnd.getTime() - phStart.getTime()) / msDay;

  return Math.max(0.5, (phaseDays / totalDays) * 100);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function Step3TimelineVisualizationModal({
  program,
  events,
  loadingPattern,
  periodizationModel,
  onBack,
  onComplete,
}: Props) {

  // קביעת לוגיקת משך הזמן: תאריכים מול שבועות
  const isWeeks = program.durationType === "weeks";
  const baseDate = isWeeks ? MOCK_BASE_DATE : new Date(program.startDate);
  
  const pStartDateStr = formatDateObj(baseDate);
  const pEndDateStr = isWeeks 
    ? formatDateObj(new Date(baseDate.getTime() + ((program.weeks || 12) * 7 - 1) * msDay))
    : program.endDate;

  // פונקציות עזר להמרות בין תאריך לשבוע/יום (והפוך) - משמשות ל-UI כשבוחרים תבנית שבועות
  const dateToWeekDay = (dateStr: string) => {
    const d = new Date(dateStr);
    const diffDays = Math.round((d.getTime() - baseDate.getTime()) / msDay);
    const w = Math.floor(diffDays / 7) + 1;
    const day = (diffDays % 7) + 1;
    return { w, day };
  };

  const weekDayToDateStr = (w: number, day: number) => {
    const diffDays = ((w - 1) * 7 + (day - 1));
    return formatDateObj(new Date(baseDate.getTime() + diffDays * msDay));
  };

  const displayFormat = (dateStr: string) => {
    if (isWeeks) {
      const { w, day } = dateToWeekDay(dateStr);
      return `W${w} D${day}`;
    }
    return formatDate(dateStr);
  };

  // ממפה את האירועים לשלב התאריכים המדומים במידה ומדובר בתוכנית שבועות
  const normalizedEvents = events.map(e => {
    let nDate = e.date;
    let nEnd = e.endDate;
    if (isWeeks) {
      if (e.date && e.date.startsWith("Week")) {
        const m = e.date.match(/Week (\d+), Day (\d+)/);
        if (m) {
          const diffDays = ((parseInt(m[1]) - 1) * 7 + (parseInt(m[2]) - 1));
          nDate = formatDateObj(new Date(baseDate.getTime() + diffDays * msDay));
        }
      }
      if (e.endDate && e.endDate.startsWith("Week")) {
        const m = e.endDate.match(/Week (\d+), Day (\d+)/);
        if (m) {
          const diffDays = ((parseInt(m[1]) - 1) * 7 + (parseInt(m[2]) - 1));
          nEnd = formatDateObj(new Date(baseDate.getTime() + diffDays * msDay));
        }
      }
    }
    return { ...e, date: nDate, endDate: nEnd };
  });

  const [phases, setPhases] = useState<MesoPhase[]>(() =>
    generatePhases(pStartDateStr, pEndDateStr, normalizedEvents, periodizationModel)
  );
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(phases[0]?.id || "");
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    index: number;
    edge: 'left' | 'right';
    startX: number;
    initialPhases: MesoPhase[];
  } | null>(null);

  useEffect(() => {
    const initialPhases = generatePhases(pStartDateStr, pEndDateStr, normalizedEvents, periodizationModel);
    setPhases(initialPhases);
    setSelectedPhaseId(initialPhases[0]?.id || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pStartDateStr, pEndDateStr, periodizationModel]); 

  // לוגיקת גרירה על הגאנט
  useEffect(() => {
    if (!dragState) {
      document.body.style.userSelect = 'auto';
      return;
    }
    
    document.body.style.userSelect = 'none';

    const handleMove = (clientX: number) => {
      if (!timelineRef.current) return;
      const deltaX = clientX - dragState.startX;
      const timelineWidth = timelineRef.current.getBoundingClientRect().width;
      
      const pStart = new Date(pStartDateStr).getTime();
      const pEnd = new Date(pEndDateStr).getTime();
      const totalProgramMs = pEnd - pStart;
      
      const deltaMs = (deltaX / timelineWidth) * totalProgramMs;
      const deltaDays = Math.round(deltaMs / msDay);
      
      const newPhases = [...dragState.initialPhases.map(p => ({ ...p }))];
      const { index, edge } = dragState;
      
      const initialPhase = dragState.initialPhases[index];
      const originalDateStr = edge === 'right' ? initialPhase.endDate : initialPhase.startDate;
      const originalDate = new Date(originalDateStr);
      const newDate = new Date(originalDate.getTime() + deltaDays * msDay);

      if (edge === 'right') {
        if (index < newPhases.length - 1) {
          const minDate = new Date(newPhases[index].startDate);
          minDate.setDate(minDate.getDate() + 1);
          
          const maxDate = new Date(newPhases[index + 1].endDate);
          maxDate.setDate(maxDate.getDate() - 1);
          
          const clamped = newDate < minDate ? minDate : newDate > maxDate ? maxDate : newDate;
          newPhases[index].endDate = formatDateObj(clamped);
          newPhases[index + 1].startDate = formatDateObj(clamped);
        } else {
          const minDate = new Date(newPhases[index].startDate);
          minDate.setDate(minDate.getDate() + 1);
          const maxDate = new Date(pEndDateStr);
          const clamped = newDate < minDate ? minDate : newDate > maxDate ? maxDate : newDate;
          newPhases[index].endDate = formatDateObj(clamped);
        }
      } else {
        if (index > 0) {
          const minDate = new Date(newPhases[index - 1].startDate);
          minDate.setDate(minDate.getDate() + 1);
          
          const maxDate = new Date(newPhases[index].endDate);
          maxDate.setDate(maxDate.getDate() - 1);
          
          const clamped = newDate < minDate ? minDate : newDate > maxDate ? maxDate : newDate;
          newPhases[index - 1].endDate = formatDateObj(clamped);
          newPhases[index].startDate = formatDateObj(clamped);
        } else {
          const minDate = new Date(pStartDateStr);
          const maxDate = new Date(newPhases[index].endDate);
          maxDate.setDate(maxDate.getDate() - 1);
          const clamped = newDate < minDate ? minDate : newDate > maxDate ? maxDate : newDate;
          newPhases[index].startDate = formatDateObj(clamped);
        }
      }
      
      setPhases(newPhases);
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const handleMouseUp = () => setDragState(null);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
      document.body.style.userSelect = 'auto';
    };
  }, [dragState, pStartDateStr, pEndDateStr]);

  const handleDragStart = (clientX: number, index: number, edge: 'left' | 'right', phaseId: string) => {
    setSelectedPhaseId(phaseId);
    setDragState({
      index,
      edge,
      startX: clientX,
      initialPhases: JSON.parse(JSON.stringify(phases))
    });
  };

  const updatePhase = (id: string, field: keyof MesoPhase, value: string | number) => {
    setPhases((prev) =>
      prev.map((phase) => {
        if (phase.id !== id) return phase;

        const nextPhase = { ...phase, [field]: value };
        
        if (field === "startDate" && typeof value === "string") {
          if (new Date(value) < new Date(pStartDateStr)) nextPhase.startDate = pStartDateStr;
          if (new Date(value) > new Date(pEndDateStr)) nextPhase.startDate = pEndDateStr;
          
          if (new Date(nextPhase.startDate) > new Date(nextPhase.endDate)) {
            nextPhase.endDate = nextPhase.startDate;
          }
        }
        
        if (field === "endDate" && typeof value === "string") {
          if (new Date(value) > new Date(pEndDateStr)) nextPhase.endDate = pEndDateStr;
          if (new Date(value) < new Date(pStartDateStr)) nextPhase.endDate = pStartDateStr;

          if (new Date(nextPhase.endDate) < new Date(nextPhase.startDate)) {
            nextPhase.startDate = nextPhase.endDate;
          }
        }
        return nextPhase;
      })
    );
  };

  const movePhase = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === phases.length - 1) return;

    const newPhases = [...phases];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;

    const temp = newPhases[index];
    newPhases[index] = newPhases[targetIndex];
    newPhases[targetIndex] = temp;

    let currentDate = new Date(pStartDateStr);
    
    for (let i = 0; i < newPhases.length; i++) {
      const phase = newPhases[i];
      const start = new Date(phase.startDate).getTime();
      const end = new Date(phase.endDate).getTime();
      const durationDays = Math.round((end - start) / msDay);
      
      const newStart = new Date(currentDate);
      const newEnd = new Date(currentDate);
      newEnd.setDate(newEnd.getDate() + durationDays);

      newPhases[i] = {
        ...phase,
        startDate: formatDateObj(newStart),
        endDate: formatDateObj(newEnd),
      };

      currentDate = new Date(newEnd);
    }

    setPhases(newPhases);
  };

  const deletePhase = (id: string) => {
    setPhases((prev) => prev.filter((phase) => phase.id !== id));
    if (selectedPhaseId === id) {
      setSelectedPhaseId("");
    }
  };

  const addPhase = () => {
    const lastPhase = phases[phases.length - 1];
    
    const newStartDate = lastPhase 
      ? new Date(lastPhase.endDate) 
      : new Date(pStartDateStr);
      
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newEndDate.getDate() + 14);

    const newPhase: MesoPhase = {
      id: Date.now().toString(),
      phaseType: "Base" as MesoPhase["phaseType"],
      startDate: formatDateObj(newStartDate),
      endDate: formatDateObj(newEndDate),
      targetVolumeHours: 10,
      loadingPattern: "3:1",
      intensityDistribution: "80/20",
    };

    setPhases((prev) => {
      // אם אנחנו חורגים מסוף העונה נחתוך את זה לסוף העונה
      if (new Date(newPhase.endDate) > new Date(pEndDateStr)) {
        newPhase.endDate = pEndDateStr;
      }
      return [...prev, newPhase];
    });
    setSelectedPhaseId(newPhase.id);
  };

  const handleApprove = () => {
    onComplete(phases);
  };

  const phaseColors: Record<string, string> = {
    Base: "#dbeafe",
    Build: "#fed7aa",
    Peak: "#fecaca",
    Taper: "#c7d2fe",
    Transition: "#e2e8f0", 
  };

  return (
    <div className="step3-modal-backdrop">
      <div className="step3-modal-container">
        <div className="step3-modal-header">
          <h2>Step 3: Review Your Macrocycle</h2>
          <p>Visualize your entire program at a glance</p>
        </div>

        <div className="step3-modal-content">
          <div className="program-summary">
            <div className="summary-item">
              <span className="label">Program</span>
              <strong>{program.name}</strong>
            </div>
            <div className="summary-item">
              <span className="label">Duration</span>
              <strong>
                {isWeeks 
                  ? `${program.weeks} Weeks` 
                  : `${formatDate(program.startDate)} – ${formatDate(program.endDate)}`}
              </strong>
            </div>
            <div className="summary-item">
              <span className="label">Strategy</span>
              <strong>{periodizationModel} / {loadingPattern}</strong>
            </div>
          </div>

          <div className="timeline-section">
            <h3>Training Phases</h3>
            <p className="timeline-hint">Drag the edges of the blocks to adjust duration, or move them around below.</p>
            <div className="gantt-timeline">
              <div className="gantt-track" ref={timelineRef}>
                {phases.map((phase, i) => (
                  <div
                    key={phase.id}
                    className={`gantt-phase ${selectedPhaseId === phase.id ? "selected" : ""}`}
                    style={{
                      width: `${calculateWidth(
                        phase.startDate,
                        phase.endDate,
                        pStartDateStr,
                        pEndDateStr
                      )}%`,
                      backgroundColor: phaseColors[phase.phaseType] || "#e2e8f0",
                      borderLeftColor: phaseColors[phase.phaseType] || "#94a3b8",
                    }}
                    onClick={() => setSelectedPhaseId(phase.id)}
                  >
                    {/* כאן הוספתי תצוגה מקוצרת לתווית (W1-D1) רק אם זה שבועות */}
                    <span className="phase-label">
                      {phase.phaseType}
                    </span>
                    
                    <div 
                      className="phase-handle left-handle" 
                      onMouseDown={(e) => { e.stopPropagation(); handleDragStart(e.clientX, i, 'left', phase.id); }}
                      onTouchStart={(e) => { e.stopPropagation(); handleDragStart(e.touches[0].clientX, i, 'left', phase.id); }}
                    />
                    
                    <div 
                      className="phase-handle right-handle" 
                      onMouseDown={(e) => { e.stopPropagation(); handleDragStart(e.clientX, i, 'right', phase.id); }}
                      onTouchStart={(e) => { e.stopPropagation(); handleDragStart(e.touches[0].clientX, i, 'right', phase.id); }}
                    />
                  </div>
                ))}
              </div>

              <div className="events-overlay">
                {normalizedEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`event-marker ${event.type === "A-Race" ? "a-race-marker" : "camp-marker"}`}
                    style={{
                      left: `${calculatePosition(event.date, pStartDateStr, pEndDateStr)}%`,
                    }}
                    title={event.name}
                  >
                    <div className="event-marker-label">{event.name}</div>
                  </div>
                ))}
              </div>

              <div className="gantt-labels">
                <span>{isWeeks ? "Week 1" : formatDate(pStartDateStr)}</span>
                <span>Mid-Program</span>
                <span>{isWeeks ? `Week ${program.weeks}` : formatDate(pEndDateStr)}</span>
              </div>
            </div>
          </div>

          <div className="phases-grid">
            {phases.map((phase, index) => {
              const startWD = dateToWeekDay(phase.startDate);
              const endWD = dateToWeekDay(phase.endDate);

              return (
                <div
                  key={phase.id}
                  className={`phase-card ${selectedPhaseId === phase.id ? "phase-selected" : ""}`}
                  onClick={() => setSelectedPhaseId(phase.id)}
                >
                  <div className="phase-card-header" style={{ backgroundColor: phaseColors[phase.phaseType] || "#e2e8f0" }}>
                    <strong>{phase.phaseType}</strong>
                    
                    <div className="phase-actions">
                      <button 
                        className="action-icon-btn" 
                        onClick={(e) => { e.stopPropagation(); movePhase(index, 'left'); }}
                        disabled={index === 0}
                        title="Move Earlier"
                      >
                        ←
                      </button>
                      <button 
                        className="action-icon-btn" 
                        onClick={(e) => { e.stopPropagation(); movePhase(index, 'right'); }}
                        disabled={index === phases.length - 1}
                        title="Move Later"
                      >
                        →
                      </button>
                      <button 
                        className="action-icon-btn delete-btn" 
                        onClick={(e) => { e.stopPropagation(); deletePhase(phase.id); }}
                        title="Delete Phase"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  
                  <div className="phase-card-body">
                    <div className="phase-row">
                      <label>Phase Type</label>
                      <select
                        value={phase.phaseType}
                        onChange={(e) => updatePhase(phase.id, "phaseType", e.target.value)}
                      >
                        <option value="Base">Base</option>
                        <option value="Build">Build</option>
                        <option value="Peak">Peak</option>
                        <option value="Taper">Taper</option>
                        <option value="Transition">Transition</option>
                      </select>
                    </div>
                    
                    {/* דינמיות: תצוגת שבועות לעומת תצוגת תאריכים */}
                    <div className="phase-row">
                      <label>Start</label>
                      {isWeeks ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="number"
                            min={1}
                            max={program.weeks || 52}
                            value={startWD.w}
                            onChange={(e) => updatePhase(phase.id, "startDate", weekDayToDateStr(Number(e.target.value), startWD.day))}
                            style={{ width: '50%' }}
                          />
                          <select 
                            value={startWD.day}
                            onChange={(e) => updatePhase(phase.id, "startDate", weekDayToDateStr(startWD.w, Number(e.target.value)))}
                            style={{ width: '50%' }}
                          >
                            {[1,2,3,4,5,6,7].map(d => <option key={d} value={d}>Day {d}</option>)}
                          </select>
                        </div>
                      ) : (
                        <input
                          type="date"
                          min={pStartDateStr}
                          max={pEndDateStr}
                          value={phase.startDate}
                          onChange={(e) => updatePhase(phase.id, "startDate", e.target.value)}
                        />
                      )}
                    </div>
                    
                    <div className="phase-row">
                      <label>End</label>
                      {isWeeks ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="number"
                            min={startWD.w}
                            max={program.weeks || 52}
                            value={endWD.w}
                            onChange={(e) => updatePhase(phase.id, "endDate", weekDayToDateStr(Number(e.target.value), endWD.day))}
                            style={{ width: '50%' }}
                          />
                          <select 
                            value={endWD.day}
                            onChange={(e) => updatePhase(phase.id, "endDate", weekDayToDateStr(endWD.w, Number(e.target.value)))}
                            style={{ width: '50%' }}
                          >
                            {[1,2,3,4,5,6,7].map(d => <option key={d} value={d}>Day {d}</option>)}
                          </select>
                        </div>
                      ) : (
                        <input
                          type="date"
                          min={pStartDateStr}
                          max={pEndDateStr}
                          value={phase.endDate}
                          onChange={(e) => updatePhase(phase.id, "endDate", e.target.value)}
                        />
                      )}
                    </div>

                    <div className="phase-row">
                      <label>Volume</label>
                      <input
                        type="number"
                        min={0}
                        value={phase.targetVolumeHours}
                        onChange={(e) => updatePhase(phase.id, "targetVolumeHours", Number(e.target.value))}
                      />
                    </div>
                    <div className="phase-row">
                      <label>Loading</label>
                      <input
                        type="text"
                        value={phase.loadingPattern}
                        onChange={(e) => updatePhase(phase.id, "loadingPattern", e.target.value)}
                      />
                    </div>
                    <div className="phase-row">
                      <label>Intensity</label>
                      <input
                        type="text"
                        value={phase.intensityDistribution}
                        onChange={(e) => updatePhase(phase.id, "intensityDistribution", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            
            <button className="add-phase-btn" onClick={addPhase}>
              + Add Custom Phase
            </button>
          </div>

          {events.length > 0 && (
            <div className="events-summary">
              <h3>Key Events</h3>
              <div className="events-list">
                {events.map((event) => (
                  <div key={event.id} className="event-summary-item">
                    <span className={`event-type-pill ${event.type === "A-Race" ? "a-race" : "camp"}`}>
                      {event.type}
                    </span>
                    <span className="event-name">{event.name}</span>
                    <span className="event-date">
                      {/* משתמשים בפונקציית העזר כדי להציג את התאריך או השבוע המקורי */}
                      {isWeeks ? event.date : formatDate(event.date)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="step3-modal-footer">
          <button className="btn-secondary" onClick={onBack}>
            ← Back
          </button>
          <span className="step-indicator">Step 3 of 3</span>
          <button className="btn-primary btn-large" onClick={handleApprove}>
            ✓ Approve & Create Calendar
          </button>
        </div>
      </div>
    </div>
  );
}