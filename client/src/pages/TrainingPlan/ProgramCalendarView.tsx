import { useEffect, useMemo, useState } from "react";
import type { PlanBlock, Program, ProgramMesoBlock, ScheduledWorkout, WeeklyStats } from "@/shared/types/periodization";
import type { Training } from "@/shared/types";
import { Library, TrainingPopup } from "@/components/calendar/components";
import { createTraining, deleteTraining, getTrainings, updateTraining } from "@/api/training";
import { getPlans, deletePlan } from "@/api/plan";
import { deleteProgram } from "@/api/program";
import { getMesoBlocksByProgramId } from "@/api/mesoBlock";
import { getPlannedWeeks, updatePlannedWeek } from "@/api/plannedWeek";
import { createScheduledWorkout, deleteScheduledWorkout, getScheduledWorkouts, updateScheduledWorkout } from "@/api/scheduledWorkout";
import { createAssignment, deleteAssignment, getAssignments } from "@/api/trainingAssignment";
import { getAthletes } from "@/api/athlete";
import { getGroups } from "@/api/group";
import { getAthleteGroupsByGroupId } from "@/api/athleteGroup";
import type { Athlete } from "@/shared/types";
import type { Group } from "@/shared/types/group";
import "./ProgramCalendarView.css";

interface Props {
  program: Program;
  onClose: () => void;
}

type CalendarEntry = Training & {
  isPlaceholder?: boolean;
  isEvent?: boolean; 
  plannedDurationMins?: number;
  plannedZoneDistribution?: Record<string, number>;
  plannedSport?: string;
  color?: string;
};

type BlockWeek = WeeklyStats & {
  plannedWeekId?: string;
  weekNumber?: number;
  focus?: string;
};

type BlockWithWeeks = ProgramMesoBlock & {
  weeklyStats: BlockWeek[];
};

type RenderableBlock = BlockWithWeeks | PlanBlock;

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const jsDayByPlanDay: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 0,
};

const weekdayOptions = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
];

type ApplyTargetType = "athlete" | "group";

type ApplyProgramState = {
  open: boolean;
  targetType: ApplyTargetType;
  targetId: string;
  startDate: string;
  defaultHour: number;
  defaultMinute: number;
  dayMap: Record<number, number>;
};

const PROGRAM_ASSIGNMENT_MARKER_PREFIX = "PROGRAM_APPLY:";

type WeekWithBlock = {
  week: BlockWeek;
  blockId: string;
  blockName: string;
  blockColor: string;
  globalWeekIndex: number;
  loadingPattern?: string;
  weekIndexInBlock: number;
};

const blockColors: Record<string, string> = {
  "block-1": "#3b82f6", // blue
  "block-2": "#f59e0b", // amber
};

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

const msDay = 1000 * 60 * 60 * 24;
// Anchor date for week-based programs (a Monday)
const MOCK_BASE_DATE = (() => {
  const currentYear = new Date().getUTCFullYear();
  const jan1 = new Date(Date.UTC(currentYear, 0, 1));
  const dayOfWeek = jan1.getUTCDay() - 1; // 0 = Sunday, 1 = Monday
  
  // חישוב המרחק ליום שני הראשון של השנה
  const offsetToMonday = dayOfWeek === 1 ? 0 : dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  
  return new Date(Date.UTC(currentYear, 0, 1 + offsetToMonday));
})();

function generateWeekDates(weekStart: string, isWeeks = false): { date: Date; dateStr: string; day: number }[] {
  // זיהוי מחרוזת שבוע גם אם isWeeks הוא false בטעות, ותיקון ה-Regex (ללא חובת פסיק)
  if (typeof weekStart === "string" && weekStart.startsWith("Week")) {
    const m = weekStart.match(/Week\s*(\d+)/);
    const weekNum = m ? parseInt(m[1], 10) : 1;
    const startDate = new Date(MOCK_BASE_DATE.getTime() + (weekNum - 1) * 7 * msDay);
    const dates: { date: Date; dateStr: string; day: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setUTCDate(d.getUTCDate() + i);
      dates.push({ date: d, dateStr: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`, day: d.getUTCDate() });
    }
    return dates;
  }

  // טיפול בתאריכים אמיתיים
  const inputDate = new Date(weekStart.includes("T") ? weekStart : weekStart + "T00:00:00Z");
  
  // הגנה: אם מסיבה כלשהי התאריך עדיין לא חוקי, נחזיר תאריכים ריקים במקום NaN
  if (isNaN(inputDate.getTime())) {
    return Array.from({ length: 7 }).map(() => ({
      date: new Date(), dateStr: "N/A", day: 0
    }));
  }

  const dayOfWeek = inputDate.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startDate = new Date(inputDate);
  startDate.setUTCDate(startDate.getUTCDate() - diffToMonday);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setUTCDate(d.getUTCDate() + i);
    dates.push({ date: d, dateStr: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`, day: d.getUTCDate() });
  }
  return dates;
}

function getWeekNumberFromWeekStart(week: BlockWeek) {
  if (week.weekNumber) return week.weekNumber;
  const m = week.weekStart.match(/Week\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : 1;
}

function getPlannedWeekId(week: BlockWeek) {
  return week.plannedWeekId ?? "";
}

function flattenBlocksToWeeks(blocks: RenderableBlock[]): WeekWithBlock[] {
  const allWeeks: WeekWithBlock[] = [];
  let globalIndex = 0;

  blocks.forEach((block) => {
    block.weeklyStats?.forEach((week, weekIndexInBlock) => {
      allWeeks.push({
        week,
        blockId: block.id,
        blockName: block.name,
        blockColor: blockColors[block.id] || "#6b7280",
        globalWeekIndex: globalIndex++,
        loadingPattern: (block as any).loadingPattern,
        weekIndexInBlock,
      });
    });
  });

  return allWeeks;
}

function getManualWeekFormat(focus?: string): "Base" | "Build" | "Peak" | "Taper" | "Deload" | null {
  if (!focus) return null;
  const normalized = focus.trim().toLowerCase();

  if (normalized === "base") return "Base";
  if (normalized === "build") return "Build";
  if (normalized === "peak") return "Peak";
  if (normalized === "taper") return "Taper";
  if (normalized === "deload") return "Deload";

  return null;
}

function isAutoDeloadWeek(loadingPattern: string | undefined, weekIndexInBlock: number): boolean {
  const normalized = (loadingPattern || "").trim();
  const weekNumberInBlock = weekIndexInBlock + 1;

  if (normalized === "2:1") {
    return weekNumberInBlock % 3 === 0;
  }

  if (normalized === "3:1") {
    return weekNumberInBlock % 4 === 0;
  }

  return false;
}

function getIsDeloadWeek(weekData: WeekWithBlock): boolean {
  const manualFormat = getManualWeekFormat(weekData.week.focus);
  if (manualFormat) {
    return manualFormat === "Deload";
  }

  return isAutoDeloadWeek(weekData.loadingPattern, weekData.weekIndexInBlock);
}

function getWeekFormatForSettings(weekData: WeekWithBlock): "Auto" | "Base" | "Build" | "Peak" | "Taper" | "Deload" {
  const manualFormat = getManualWeekFormat(weekData.week.focus);
  if (manualFormat) {
    return manualFormat;
  }

  return "Auto";
}

function buildDailyPlanFromScheduledWorkouts(
  scheduledWorkouts: ScheduledWorkout[],
  blocks: RenderableBlock[],
  program: Program | null,
  trainingLibrary: Training[],
  oneTimeTrainingByWorkoutId: Record<string, Training> = {}
) {
  const plan: Record<string, CalendarEntry[]> = {};
  const allWeeks = flattenBlocksToWeeks(blocks);

  scheduledWorkouts.forEach((workout) => {
    const training = workout.workoutLibraryId
      ? trainingLibrary.find((item) => item.id === workout.workoutLibraryId)
      : oneTimeTrainingByWorkoutId[workout.id] || workout.trainingSnapshot;

    const entry: CalendarEntry = {
      id: workout.id,
      creationDate: new Date(),
      title: training?.title || (workout.workoutLibraryId ? "Scheduled Workout" : "Planned Workout"),
      description: training?.description || "",
      type: training?.type || "run",
      steps: training?.steps || [],
      notes: training?.notes || "",
      isPlaceholder: !workout.workoutLibraryId && !training,
      plannedDurationMins: training ? undefined : undefined,
      plannedZoneDistribution: training ? undefined : undefined,
      plannedSport: training?.type || "run",
      color: workout.workoutLibraryId || training ? undefined : "#60a5fa",
    };

    let dayKey = "";

    if (program?.durationType === "weeks") {
      dayKey = `${workout.weekNumber - 1}-${workout.dayOfWeek - 1}`;
    } else if (workout.date) {
      const targetDate = new Date(workout.date + "T00:00:00Z");
      for (const weekData of allWeeks) {
        const weekDates = generateWeekDates(weekData.week.weekStart, false);
        const matchDayIndex = weekDates.findIndex(
          (d) =>
            d.date.getUTCFullYear() === targetDate.getUTCFullYear() &&
            d.date.getUTCMonth() === targetDate.getUTCMonth() &&
            d.date.getUTCDate() === targetDate.getUTCDate()
        );
        if (matchDayIndex !== -1) {
          dayKey = `${weekData.globalWeekIndex}-${matchDayIndex}`;
          break;
        }
      }
    }

    if (!dayKey) return;
    plan[dayKey] = [...(plan[dayKey] ?? []), entry];
  });

  if (program?.macroEvents) {
    program.macroEvents.forEach((ev) => {
      if (!ev?.date) return;

      const placeholder: CalendarEntry = {
        id:
          ev.id ||
          ((crypto as any)?.randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`),
        creationDate: new Date(),
        title: `${ev.type === "A-Race" ? "תחרות" : ev.type === "Test" ? "טסט" : "מחנה"} - ${ev.name}`,
        description: ev.type,
        type: program?.sport === "Swimming" ? "swim" : program?.sport === "Running" ? "run" : program?.sport === "Cycling" ? "bike" : "run",
        steps: [],
        notes: ev.notes || "",
        isPlaceholder: true,
        isEvent: true,
        plannedSport: program?.sport === "Swimming" ? "Swim" : program?.sport === "Running" ? "Run" : program?.sport === "Cycling" ? "Bike" : "Triathlon",
        color: ev.type === "A-Race" ? "#ef4444" : ev.type === "Test" ? "#8b5cf6" : "#f97316",
      };

      if (program?.durationType === "weeks" && typeof ev.date === "string" && ev.date.startsWith("Week")) {
        const m = ev.date.match(/Week\s*(\d+),\s*Day\s*(\d+)/i);
        if (m) {
          const targetWeekIndex = parseInt(m[1], 10) - 1;
          const targetDayIndex = parseInt(m[2], 10) - 1;
          const key = `${targetWeekIndex}-${targetDayIndex}`;
          plan[key] = [...(plan[key] ?? []), placeholder];
        }
        return;
      }

      const evDate = new Date(ev.date.includes("T") ? ev.date : ev.date + "T00:00:00Z");
      for (const weekData of allWeeks) {
        const rowDates = generateWeekDates(weekData.week.weekStart, false);
        const dayIndex = rowDates.findIndex(
          (d) =>
            d.date.getUTCFullYear() === evDate.getUTCFullYear() &&
            d.date.getUTCMonth() === evDate.getUTCMonth() &&
            d.date.getUTCDate() === evDate.getUTCDate()
        );
        if (dayIndex !== -1) {
          const key = `${weekData.globalWeekIndex}-${dayIndex}`;
          plan[key] = [...(plan[key] ?? []), placeholder];
          break;
        }
      }
    });
  }

  return plan;
}

function ProgramCalendarView({ program, onClose }: Props) {
  const [blocks, setBlocks] = useState<RenderableBlock[]>([]);
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([]);
  const [oneTimeTrainingByWorkoutId, setOneTimeTrainingByWorkoutId] = useState<Record<string, Training>>({});
  const [dailyPlan, setDailyPlan] = useState<Record<string, CalendarEntry[]>>({});
  const isWeeks = program?.durationType === "weeks";
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupTarget, setPopupTarget] = useState<{ weekIndex: number; dayIndex: number } | null>(null);
  const [popupMode, setPopupMode] = useState<"normal" | "libraryNew" | "libraryEdit" | "calendarSchedule">("normal");
  
  async function loadProgramBlocks(programId: string) {
    try {
      const mesoBlocks = await getMesoBlocksByProgramId(programId);
      let loadedBlocks: RenderableBlock[] = [];

      if (mesoBlocks.length > 0) {
        loadedBlocks = await Promise.all(
          mesoBlocks.map(async (block) => {
            const plannedWeeks = await getPlannedWeeks(block.id);
            const weeklyStats = plannedWeeks.map((week) => ({
              weekStart: `Week ${week.weekNumber}, Day 1`,
              weekEnd: `Week ${week.weekNumber}, Day 7`,
              targetVolume: week.targetVolumeHours,
              actualVolume: 0,
              targetDistribution: week.targetDistribution,
              actualDistribution: { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 },
              plannedWeekId: week.id,
              weekNumber: week.weekNumber,
              focus: week.focus,
            }));
            return { ...block, weeklyStats };
          })
        );
        setBlocks(loadedBlocks);
      } else {
        const plans = await getPlans();
        const selectedPlan = plans.find((item) => item.programId === programId) ?? plans[0] ?? null;
        setBlocks(selectedPlan?.blocks ?? []);
        loadedBlocks = selectedPlan?.blocks ?? [];
      }

      const scheduled = await getScheduledWorkouts({ programId });
      setScheduledWorkouts(scheduled ?? []);
      setDailyPlan(buildDailyPlanFromScheduledWorkouts(scheduled ?? [], loadedBlocks, program, [], oneTimeTrainingByWorkoutId));
    } catch (error) {
      console.error("Failed to load blocks for program", error);
    }
  }

  const [quickAddTarget, setQuickAddTarget] = useState<{ weekIndex: number; dayIndex: number } | null>(null);
  const [quickAddData, setQuickAddData] = useState({
    plannedSport: "Swim",
    type: "swim" as Training["type"],
    plannedDurationMins: 60,
    plannedZoneDistribution: { Z2: 100 } as Record<string, number>,
  });
  
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [trainingLibrary, setTrainingLibrary] = useState<Training[]>([]);
  const [weekSettings, setWeekSettings] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isApplyingProgram, setIsApplyingProgram] = useState(false);
  const [applyProgram, setApplyProgram] = useState<ApplyProgramState>({
    open: false,
    targetType: "athlete",
    targetId: "",
    startDate: new Date().toISOString().slice(0, 10),
    defaultHour: 7,
    defaultMinute: 0,
    dayMap: { ...jsDayByPlanDay },
  });

  function parseLocalDate(yyyyMmDd: string): Date {
    const [year, month, day] = yyyyMmDd.split("-").map(Number);
    return new Date(year, (month || 1) - 1, day || 1, 0, 0, 0, 0);
  }

  function getWeekStartDateFromWeekIndex(weekIndex: number): Date {
    const base = parseLocalDate(applyProgram.startDate);
    const day = base.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(base);
    monday.setDate(base.getDate() + diffToMonday + weekIndex * 7);
    return monday;
  }

  function buildAssignmentDate(weekIndex: number, mappedJsDay: number): Date {
    const monday = getWeekStartDateFromWeekIndex(weekIndex);
    const dayOffset = mappedJsDay === 0 ? 6 : mappedJsDay - 1;
    const target = new Date(monday);
    target.setDate(monday.getDate() + dayOffset);
    target.setHours(applyProgram.defaultHour, applyProgram.defaultMinute, 0, 0);
    return target;
  }

  async function handleDeleteProgram() {
    if (!window.confirm(`Are you sure you want to delete "${program.name}" and all its training blocks? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const plans = await getPlans();
      const planToDelete = plans.find((item) => item.programId === program.id);

      if (planToDelete) {
        await deletePlan(planToDelete.id);
      }

      await deleteProgram(program.id);
      onClose();
    } catch (error) {
      console.error("Failed to delete program", error);
      alert("Failed to delete program. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  function openWeekSettings(weekData: WeekWithBlock) {
    const wk = weekData.week;
    setWeekSettings({
      open: true,
      blockId: weekData.blockId,
      plannedWeekId: wk.plannedWeekId,
      weekStart: wk.weekStart,
      weekIndex: weekData.globalWeekIndex,
      targetVolume: wk.targetVolume,
      format: getWeekFormatForSettings(weekData),
      distribution: { ...wk.targetDistribution },
      sport: program?.sport || "Triathlon",
      focus: wk.focus || "General",
    });
  }

  function closeWeekSettings() {
    setWeekSettings(null);
  }

  async function saveWeekSettings() {
    if (!weekSettings) return;
    const { blockId, weekStart, targetVolume, distribution, format, plannedWeekId, focus } = weekSettings;
    const focusForPersistence = format === "Auto" ? "General" : format;

    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId) return b;
        const updatedWeeks = (b.weeklyStats || []).map((w) =>
          w.weekStart === weekStart
            ? {
                ...w,
                targetVolume: Number(targetVolume ?? w.targetVolume),
                targetDistribution: { ...(distribution || w.targetDistribution) },
                focus: focusForPersistence,
              }
            : w
        );
        return { ...b, weeklyStats: updatedWeeks };
      })
    );

    if (plannedWeekId) {
      try {
        await updatePlannedWeek(plannedWeekId, {
          targetVolumeHours: Number(targetVolume),
          targetDistribution: distribution || undefined,
          focus: focusForPersistence || focus || "General",
        });
      } catch (error) {
        console.error("Failed to save planned week settings", error);
      }
    }

    closeWeekSettings();
  }

  useEffect(() => {
    async function loadLibrary() {
      try {
        const trainings = await getTrainings();
        setTrainingLibrary(trainings ?? []);
      } catch (error) {
        console.error("Failed to load training library", error);
      }
    }
    loadLibrary();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [athleteData, groupData] = await Promise.all([getAthletes(), getGroups()]);
        setAthletes(athleteData ?? []);
        setGroups(groupData ?? []);
      } catch (error) {
        console.error("Failed to load apply program targets", error);
      }
    })();
  }, []);

  useEffect(() => {
    if (!program?.id) return;
    loadProgramBlocks(program.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program?.id]);

  useEffect(() => {
    if (!program) return;
    setDailyPlan(buildDailyPlanFromScheduledWorkouts(scheduledWorkouts, blocks, program, trainingLibrary, oneTimeTrainingByWorkoutId));
  }, [scheduledWorkouts, blocks, program, trainingLibrary, oneTimeTrainingByWorkoutId]);

  const allWeeks = useMemo(() => flattenBlocksToWeeks(blocks), [blocks]);

  const getTrainingDurationSeconds = (training: CalendarEntry) => {
    if (training.isPlaceholder && training.plannedDurationMins) {
      return training.plannedDurationMins * 60;
    }
    if (training.duration && training.duration > 0) return training.duration;
    return training.steps.reduce((sum, step) => {
      if (step.mode === "time" && step.duration) {
        return sum + step.duration * 60 * (step.reps ?? 1);
      }
      return sum;
    }, 0);
  };

  const getTrainingZoneHours = (training: CalendarEntry) => {
    if (training.isPlaceholder && training.plannedZoneDistribution) {
      const result: Record<string, number> = {};
      const totalHours = (training.plannedDurationMins ?? 0) / 60;
      
      Object.entries(training.plannedZoneDistribution).forEach(([zone, percentage]) => {
        result[zone] = (result[zone] ?? 0) + (percentage / 100) * totalHours;
      });
      return result;
    }
    
    return training.steps.reduce((zoneTotals, step) => {
      if (!step.intensity) return zoneTotals;
      const duration = step.mode === "time" && step.duration ? step.duration * 60 * (step.reps ?? 1) : 0;
      const hours = duration / 3600;
      zoneTotals[step.intensity] = (zoneTotals[step.intensity] ?? 0) + hours;
      return zoneTotals;
    }, {} as Record<string, number>);
  };

  const weeklyWorkoutSummary = useMemo(() => {
    const summary = new Map<number, { totalVolume: number; zoneVolumes: Record<string, number>; sportVolumes: Record<string, number> }>();

    Object.entries(dailyPlan).forEach(([key, trainings]) => {
      const [weekIndex] = key.split("-").map(Number);
      const weekSummary = summary.get(weekIndex) ?? {
        totalVolume: 0,
        zoneVolumes: { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 },
        sportVolumes: { swim: 0, bike: 0, run: 0, strength: 0 },
      };

      trainings.forEach((training) => {
        if (training.isEvent) return;

        const volumeHours = getTrainingDurationSeconds(training) / 3600;
        weekSummary.totalVolume += volumeHours;

        const rawSport = (training.plannedSport || training.type).toLowerCase();
        let normalizedSport = "other";
        if (rawSport.includes("swim")) normalizedSport = "swim";
        else if (rawSport.includes("bike") || rawSport.includes("cycl") || rawSport.includes("brick")) normalizedSport = "bike";
        else if (rawSport.includes("run")) normalizedSport = "run";
        else if (rawSport.includes("strength") || rawSport.includes("gym")) normalizedSport = "strength";

        weekSummary.sportVolumes[normalizedSport] = (weekSummary.sportVolumes[normalizedSport] ?? 0) + volumeHours;

        const zoneHours = getTrainingZoneHours(training);
        Object.entries(zoneHours).forEach(([zone, hours]) => {
          weekSummary.zoneVolumes[zone] = (weekSummary.zoneVolumes[zone] ?? 0) + hours;
        });
      });

      summary.set(weekIndex, weekSummary);
    });

    return summary;
  }, [dailyPlan]);

  const createBlankTraining = (): Training => ({
    id: crypto.randomUUID(),
    creationDate: new Date(),
    title: "",
    description: "",
    type: "run",
    steps: [],
    notes: "",
  });

  const handleAddTraining = () => {
    setSelectedTraining(createBlankTraining());
    setPopupTarget(null);
    setQuickAddTarget(null);
    setPopupMode("libraryNew");
    setPopupOpen(true);
  };

  const handleAddPlaceholder = async () => {
    if (!quickAddTarget || !program) return;
    const weekData = allWeeks[quickAddTarget.weekIndex];
    if (!weekData) return;

    try {
      const createdWorkout = await createScheduledWorkout({
        programId: program.id,
        plannedWeekId: getPlannedWeekId(weekData.week),
        workoutLibraryId: "",
        weekNumber: getWeekNumberFromWeekStart(weekData.week),
        dayOfWeek: quickAddTarget.dayIndex + 1,
        status: "Planned",
      });
      setScheduledWorkouts((prev) => [...prev, createdWorkout]);
      setQuickAddTarget(null);
    } catch (error) {
      console.error("Failed to create scheduled workout", error);
      alert("Could not add placeholder workout. Please try again.");
    }
  };

  const handleLibrarySelect = (training: Training) => {
    setSelectedTraining(training);
    setPopupTarget(null);
    setPopupMode("libraryEdit");
    setPopupOpen(true);
  };

  const handleDropOnDay = async (e: React.DragEvent<HTMLDivElement>, weekIndex: number, day: number) => {
    e.preventDefault();
    e.stopPropagation();

    const action = e.dataTransfer.getData("action");
  const targetWeekData = allWeeks[weekIndex];
  const targetWeekNumber = targetWeekData ? getWeekNumberFromWeekStart(targetWeekData.week) : weekIndex + 1;
  const targetDayOfWeek = day + 1;
  // --- טיפול בהזזת אימון קיים בתוך הלוח ---
  if (action === "move-workout") {
    const workoutId = e.dataTransfer.getData("workoutId");
    
    // מוצאים את האימון במערך הקיים
    const workoutToMove = scheduledWorkouts.find(w => w.id === workoutId);
    if (workoutToMove) {
      try {
        // עדכון בשרת
        await updateScheduledWorkout(workoutId, {
          plannedWeekId: getPlannedWeekId(targetWeekData.week),
          weekNumber: targetWeekNumber,
          dayOfWeek: targetDayOfWeek
        });
        
        // עדכון בסטייט המקומי
        setScheduledWorkouts(prev => prev.map(w => 
          w.id === workoutId 
            ? { ...w, weekNumber: targetWeekNumber, dayOfWeek: targetDayOfWeek, plannedWeekId: getPlannedWeekId(targetWeekData.week) } 
            : w
        ));
      } catch (error) {
        console.error("Failed to move workout", error);
      }
    }
    return;
  }
    const key = `${weekIndex}-${day}`;
    const payload = e.dataTransfer.getData("payload") || e.dataTransfer.getData("training");

    let newEntry: CalendarEntry = createBlankTraining();
    let persistedWorkout: ScheduledWorkout | null = null;

    try {
      if (payload) {
        const parsed = JSON.parse(payload) as CalendarEntry & { creationDate: string | Date };
        newEntry = {
          ...parsed,
          creationDate: parsed.creationDate ? new Date(parsed.creationDate) : new Date(),
        };

        if (parsed.id && parsed.type) {
          const weekData = allWeeks[weekIndex];
          const plannedWeekId = weekData ? getPlannedWeekId(weekData.week) : "";
          const weekNumber = weekData ? getWeekNumberFromWeekStart(weekData.week) : weekIndex + 1;

          try {
            const createdWorkout = await createScheduledWorkout({
              programId: program?.id ?? "",
              plannedWeekId,
              workoutLibraryId: parsed.id,
              weekNumber,
              dayOfWeek: day + 1,
              status: "Planned",
            });
            persistedWorkout = createdWorkout;
            setScheduledWorkouts((prev) => [...prev, createdWorkout]);
          } catch (saveError) {
            console.error("Failed to persist scheduled workout", saveError);
          }
        }
      }
    } catch {
      newEntry.title = "Planned Workout";
    }

    setDailyPlan((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), persistedWorkout ? { ...newEntry, id: persistedWorkout.id } : newEntry],
    }));
  };

  const openWorkoutPopup = (weekIndex: number, dayIndex: number) => {
    setPopupTarget({ weekIndex, dayIndex });
    setSelectedTraining(createBlankTraining());
    setPopupMode("calendarSchedule");
    setPopupOpen(true);
  };

  const saveTrainingToDb = async (training: Training) => {
    try {
      const exists = trainingLibrary.some((item) => item.id === training.id);
      if (exists) {
        const updated = await updateTraining(training.id, training);
        setTrainingLibrary((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        return updated;
      }
      const created = await createTraining(training);
      setTrainingLibrary((prev) => [...prev, created]);
      return created;
    } catch (error) {
      console.error("Failed to save training", error);
      return training;
    }
  };

  const closeTrainingPopup = () => {
    setPopupOpen(false);
    setPopupTarget(null);
    setSelectedTraining(null);
    setPopupMode("normal");
  };

  const handleLibraryTrainingSaveAsNew = async (training: Training) => {
    const newTraining = {
      ...training,
      id: crypto.randomUUID(),
      creationDate: new Date(),
    };
    await saveTrainingToDb(newTraining);
    closeTrainingPopup();
  };

  const handleLibraryTrainingUpdateExisting = async (training: Training) => {
    await saveTrainingToDb(training);
    closeTrainingPopup();
  };

  const handleLibraryTrainingDelete = async (training: Training) => {
    if (!window.confirm(`Delete "${training.title || "Untitled"}" from library? Scheduled instances will stay as one-time workouts.`)) {
      return;
    }

    try {
      await deleteTraining(training.id);

      setTrainingLibrary((prev) => prev.filter((item) => item.id !== training.id));

      const affectedWorkoutIds = scheduledWorkouts
        .filter((workout) => workout.workoutLibraryId === training.id)
        .map((workout) => workout.id);

      if (affectedWorkoutIds.length) {
        setScheduledWorkouts((prev) =>
          prev.map((workout) =>
            workout.workoutLibraryId === training.id
              ? {
                  ...workout,
                  workoutLibraryId: "",
                  trainingSnapshot: {
                    id: training.id,
                    title: training.title,
                    description: training.description,
                    type: training.type,
                    steps: training.steps,
                    notes: training.notes,
                    duration: training.duration,
                    creationDate: training.creationDate,
                  },
                }
              : workout,
          ),
        );

        setOneTimeTrainingByWorkoutId((prev) => {
          const next = { ...prev };
          affectedWorkoutIds.forEach((workoutId) => {
            next[workoutId] = training;
          });
          return next;
        });
      }

      closeTrainingPopup();
    } catch (error) {
      console.error("Failed to delete training", error);
      alert("Could not delete the training. Please try again.");
    }
  };

  const scheduleTraining = async (workoutLibraryId: string, training?: Training) => {
    if (popupTarget && program) {
      const weekData = allWeeks[popupTarget.weekIndex];
      if (weekData) {
        try {
          const createdWorkout = await createScheduledWorkout({
            programId: program.id,
            plannedWeekId: getPlannedWeekId(weekData.week),
            workoutLibraryId,
            trainingSnapshot: training && !workoutLibraryId ? {
              id: training.id,
              title: training.title,
              description: training.description,
              type: training.type,
              steps: training.steps,
              notes: training.notes,
              duration: training.duration,
              creationDate: training.creationDate,
            } : undefined,
            weekNumber: getWeekNumberFromWeekStart(weekData.week),
            dayOfWeek: popupTarget.dayIndex + 1,
            status: "Planned",
          });
          setScheduledWorkouts((prev) => [...prev, createdWorkout]);
          if (training && !workoutLibraryId) {
            setOneTimeTrainingByWorkoutId((prev) => ({
              ...prev,
              [createdWorkout.id]: training,
            }));
          }
        } catch (error) {
          console.error("Failed to create scheduled workout", error);
          alert("Could not schedule the training. Please try again.");
          return false;
        }
      }
    }

    return true;
  };

  const handleSaveTrainingOneTime = async (training: Training) => {
    const scheduled = await scheduleTraining("", training);
    if (!scheduled) return;

    closeTrainingPopup();
  };

  const handleSaveTrainingToLibrary = async (training: Training) => {
    const savedTraining = await saveTrainingToDb(training);
    const scheduled = await scheduleTraining(savedTraining.id);
    if (!scheduled) return;

    closeTrainingPopup();
  };

  const handleSaveTraining = async (training: Training) => {
    const savedTraining = await saveTrainingToDb(training);
    await scheduleTraining(savedTraining.id);
    closeTrainingPopup();
  };

  const handleRemoveTrainingFromCalendar = async (training: Training) => {
    const workoutId = training.id;
    const existsInCalendar = scheduledWorkouts.some((workout) => workout.id === workoutId);

    if (!existsInCalendar) {
      alert("This item is not a scheduled training in the calendar.");
      return;
    }

    if (!window.confirm(`Remove "${training.title || "Workout"}" from calendar?`)) {
      return;
    }

    try {
      await deleteScheduledWorkout(workoutId);
      setScheduledWorkouts((prev) => prev.filter((workout) => workout.id !== workoutId));
      setOneTimeTrainingByWorkoutId((prev) => {
        const next = { ...prev };
        delete next[workoutId];
        return next;
      });
      closeTrainingPopup();
    } catch (error) {
      console.error("Failed to remove training from calendar", error);
      alert("Could not remove the training from calendar. Please try again.");
    }
  };

  const openApplyProgramModal = () => {
    setApplyProgram((prev) => ({
      ...prev,
      open: true,
      targetId:
        prev.targetType === "athlete"
          ? prev.targetId || athletes[0]?.id || ""
          : prev.targetId || groups[0]?.id || "",
      startDate: prev.startDate || new Date().toISOString().slice(0, 10),
      dayMap: { ...jsDayByPlanDay },
    }));
  };

  const closeApplyProgramModal = () => {
    setApplyProgram((prev) => ({ ...prev, open: false }));
  };

  const applyProgramToTarget = async () => {
    if (!applyProgram.targetId) {
      alert("Please choose an athlete or group.");
      return;
    }

    if (!scheduledWorkouts.length) {
      alert("There are no scheduled workouts in this program yet.");
      return;
    }

    setIsApplyingProgram(true);
    try {
      const targetAthleteIds =
        applyProgram.targetType === "athlete"
          ? [applyProgram.targetId]
          : (await getAthleteGroupsByGroupId(applyProgram.targetId)).map((relation: any) => relation.athleteId);

      if (!targetAthleteIds.length) {
        alert("No athletes found for this target.");
        return;
      }

      const marker = `${PROGRAM_ASSIGNMENT_MARKER_PREFIX}${program.id}`;
      const legacyNoteText = `Applied from program ${program.name}`;

      // Reapply should sync with latest program structure: remove previous assignments from this program first.
      for (const athleteId of targetAthleteIds) {
        const athleteAssignments = (await getAssignments({ athleteId })) || [];
        const managedAssignments = athleteAssignments.filter((assignment: any) => {
          const notes = typeof assignment.notes === "string" ? assignment.notes : "";
          return notes.includes(marker) || notes.includes(legacyNoteText);
        });

        await Promise.all(
          managedAssignments.map((assignment: any) => deleteAssignment(assignment.id)),
        );
      }

      let createdCount = 0;

      for (const workout of scheduledWorkouts) {
        const mappedJsDay = applyProgram.dayMap[workout.dayOfWeek] ?? jsDayByPlanDay[workout.dayOfWeek];
        const startTime = buildAssignmentDate(Math.max(workout.weekNumber - 1, 0), mappedJsDay);

        const trainingForSnapshot =
          workout.workoutLibraryId
            ? trainingLibrary.find((t) => t.id === workout.workoutLibraryId)
            : oneTimeTrainingByWorkoutId[workout.id] || workout.trainingSnapshot;

        for (const athleteId of targetAthleteIds) {
          await createAssignment({
            id: crypto.randomUUID(),
            trainingId: workout.workoutLibraryId || workout.id,
            trainingSnapshot: trainingForSnapshot
              ? {
                  id: trainingForSnapshot.id,
                  title: trainingForSnapshot.title,
                  description: trainingForSnapshot.description,
                  type: trainingForSnapshot.type,
                  steps: trainingForSnapshot.steps,
                  notes: trainingForSnapshot.notes,
                  duration: trainingForSnapshot.duration,
                  creationDate: trainingForSnapshot.creationDate,
                }
              : undefined,
            athleteId,
            groupId: applyProgram.targetType === "group" ? applyProgram.targetId : undefined,
            startTime,
            endTime: undefined,
            status: "PENDING",
            createdAt: new Date(),
            updatedAt: new Date(),
            notes: `${marker} | Applied from program ${program.name}`,
          });

          createdCount += 1;
        }
      }

      alert(`Program applied successfully. Synced ${createdCount} assignments.`);
      closeApplyProgramModal();
    } catch (error) {
      console.error("Failed to apply program", error);
      alert("Failed to apply program. Please try again.");
    } finally {
      setIsApplyingProgram(false);
    }
  };

  const handleDayClick = (weekIndex: number, dayIndex: number, events: CalendarEntry[]) => {
    if (events.length === 0) {
      openWorkoutPopup(weekIndex, dayIndex);
    }
  };

  const allocatedPercentage = Object.values(quickAddData.plannedZoneDistribution ?? {}).reduce((a, b) => a + b, 0);

  const handleDropOnWeek = async (e: React.DragEvent<HTMLDivElement>, targetWeekIndex: number) => {
  e.preventDefault();
  const action = e.dataTransfer.getData("action");
  
  if (action === "move-week") {
    const sourceWeekIndex = parseInt(e.dataTransfer.getData("weekIndex"), 10);
    if (sourceWeekIndex === targetWeekIndex) return;

    const sourceWeekData = allWeeks[sourceWeekIndex];
    const targetWeekData = allWeeks[targetWeekIndex];

    if (!sourceWeekData || !targetWeekData) return;

    // שליפת ה-IDs והמספרים של השבועות
    const sourcePlannedWeekId = getPlannedWeekId(sourceWeekData.week);
    const targetPlannedWeekId = getPlannedWeekId(targetWeekData.week);
    const sourceWeekNum = sourceWeekData.week.weekNumber ?? sourceWeekIndex + 1;
    const targetWeekNum = targetWeekData.week.weekNumber ?? targetWeekIndex + 1;

    try {
      // 1. עדכון השבועות עצמם בשרת (החלפת weekNumber)
      const weekUpdates = [
        updatePlannedWeek(sourcePlannedWeekId, { weekNumber: targetWeekNum }),
        updatePlannedWeek(targetPlannedWeekId, { weekNumber: sourceWeekNum })
      ];

      // 2. מציאת כל האימונים ששייכים לשבועות האלו
      const sourceWorkouts = scheduledWorkouts.filter(w => w.plannedWeekId === sourcePlannedWeekId);
      const targetWorkouts = scheduledWorkouts.filter(w => w.plannedWeekId === targetPlannedWeekId);

      // יצירת בקשות עדכון לכל אימון כך שיקבל את השבוע החדש שלו
      const workoutUpdates = [
        ...sourceWorkouts.map(w => updateScheduledWorkout(w.id, { weekNumber: targetWeekNum })),
        ...targetWorkouts.map(w => updateScheduledWorkout(w.id, { weekNumber: sourceWeekNum }))
      ];

      // מריצים את הכל במקביל (גם את עדכון השבועות וגם את עדכון האימונים)
      await Promise.all([...weekUpdates, ...workoutUpdates]);
      
      // 3. קריאה מחדש של הבלוקים מהשרת כדי לרענן את ה-UI עם הסדר החדש
      if (program?.id) {
        loadProgramBlocks(program.id);
      }
    } catch (error) {
      console.error("Failed to swap weeks", error);
      alert("Could not swap weeks. Please try again.");
    }
  }
};
  return (
    <div className="program-calendar-page">
      <div className="calendar-view-grid">
          <Library trainings={trainingLibrary} onAdd={handleAddTraining} onSelect={handleLibrarySelect} onUpdateTraining={(updatedTraining) => {
    // עדכון ה-State של הספרייה בצורה מיידית
    setTrainingLibrary((prev) => 
      prev.map(t => t.id === updatedTraining.id ? updatedTraining : t)
    );
  }} />

        <main className="calendar-grid-main">
          <section className="meso-block-grid">
            <div className="meso-block-header">
              <div>
                <h2>{program.name} - {program.sport}</h2>
                <p>{isWeeks ? `${program.weeks} Weeks` : `${program.startDate} — ${program.endDate}`}</p>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  className="apply-program-btn"
                  onClick={openApplyProgramModal}
                  title="Apply this program to athlete or group"
                >
                  Apply Program
                </button>
                <button
                  className="delete-program-btn"
                  onClick={handleDeleteProgram}
                  disabled={isDeleting}
                  title="Delete this program and all its blocks"
                >
                  {isDeleting ? "Deleting..." : "Delete Program"}
                </button>
              </div>
            </div>
            <div className="continuous-week-grid-wrapper">
              <div className="continuous-week-grid">
                <div className="grid-row grid-header-row sticky-header">
                  <div className="grid-header meta-header">Week Stats</div>
                  {dayNames.map((day) => (
                    <div key={day} className="grid-header">{day}</div>
                  ))}
                </div>
                {allWeeks.map((weekData) => {
                  const weekDates = generateWeekDates(weekData.week.weekStart, isWeeks);
                  const isDeloadWeek = getIsDeloadWeek(weekData);
                  return (
                    <div
                      className="grid-row"
                      key={`${weekData.blockId}-${weekData.week.weekStart}`}
                      style={{ borderLeftColor: weekData.blockColor, borderLeftWidth: "8px", borderLeftStyle: "solid" }}
                    >
                      <div 
  className="week-meta-cell" 
  onClick={() => openWeekSettings(weekData)} 
  style={{ cursor: 'grab' }} // שינוי סמן
  draggable 
  onDragStart={(e) => {
    e.dataTransfer.setData("action", "move-week");
    e.dataTransfer.setData("weekIndex", weekData.globalWeekIndex.toString());
  }}
  onDragOver={(e) => e.preventDefault()}
  onDrop={(e) => handleDropOnWeek(e, weekData.globalWeekIndex)}
>
                        <div className="week-meta-top">
                          <div className="block-label" style={{ color: weekData.blockColor }}>
                            {weekData.blockName}
                          </div>
                          <div className="week-range">{isWeeks ? `Week ${weekData.globalWeekIndex + 1}` : `${weekData.week.weekStart} → ${weekData.week.weekEnd}`}</div>
                          {isDeloadWeek && (
                            <div className="deload-badge" title="Deload week">
                              Deload Week
                            </div>
                          )}
                        </div>
                        <div className="week-volume-bar">
                          <div className="label-row">
                            <span>Volume</span>
                            <span>{(weeklyWorkoutSummary.get(weekData.globalWeekIndex)?.totalVolume ?? 0).toFixed(1)}h / {weekData.week.targetVolume.toFixed(1)}h</span>
                          </div>
                          <div className="progress-track">
                            <div
                              className="progress-fill"
                              style={{ width: `${clamp(((weeklyWorkoutSummary.get(weekData.globalWeekIndex)?.totalVolume ?? 0) / Math.max(weekData.week.targetVolume, 1)) * 100)}%` }}
                            />
                            
                          </div>

                        <div className="sport-volume-row">
                          {Object.entries(weeklyWorkoutSummary.get(weekData.globalWeekIndex)?.sportVolumes ?? {})
                            .filter(([_, hours]) => hours > 0)
                            .map(([sport, hours]) => {
                              const icon = sport === 'swim' ? '🏊‍♂️' : sport === 'bike' ? '🚴‍♂️' : sport === 'run' ? '🏃‍♂️' : '🏋️‍♂️';
                              return (
                                <span key={sport} className={`sport-vol-pill ${sport}`}>
                                  <span className="sport-icon">{icon}</span>
                                  {hours.toFixed(1)}h
                                </span>
                              );
                            })}
                        </div>
                          
                        </div>
                        
                        <div className="zone-pill-row">
                          {Object.entries(weekData.week.targetDistribution).map(([zone, target]) => {
                            const actual = weeklyWorkoutSummary.get(weekData.globalWeekIndex)?.zoneVolumes?.[zone] ?? 0;
                            return (
                              <span key={zone} className="zone-pill">
                                {zone}: {actual.toFixed(1)}h / {target}%
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {weekDates.map((dateInfo, dayIndex) => {
                        const dayKey = `${weekData.globalWeekIndex}-${dayIndex}`;
                        const events = dailyPlan[dayKey] ?? [];
                        return (
                          <div
                            key={dayKey}
                            className={`day-drop-cell ${events.length ? "has-content" : "empty"}`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDropOnDay(e, weekData.globalWeekIndex, dayIndex)}
                            onClick={() => handleDayClick(weekData.globalWeekIndex, dayIndex, events)}
                          >
                            <button
                              type="button"
                              className="day-add-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuickAddTarget({ weekIndex: weekData.globalWeekIndex, dayIndex });
                                setQuickAddData({
                                  plannedSport: "Swim",
                                  type: "swim",
                                  plannedDurationMins: 60,
                                  plannedZoneDistribution: { Z2: 100 },
                                });
                              }}
                            >
                              +
                            </button>
                            <div className="day-cell-header-row">
                              <span className="day-name">{dayNames[dayIndex]}</span>
                              <span className="day-date">{isWeeks ? `${weekData.globalWeekIndex + 1}` : dateInfo.day}</span>
                            </div>
                            <div className="day-cell-body">
                              {events.length === 0 ? (
                                <div className="day-empty">Tap to add workout</div>
                              ) : (
                                <div className="day-plan-list">
                                  {events.map((item, eventIndex) => (
                                   <div
  key={eventIndex}
  onClick={() => {
    setPopupOpen(true); 
    setSelectedTraining(item); 
    setPopupMode("calendarSchedule"); 
    setPopupTarget({ weekIndex: weekData.globalWeekIndex, dayIndex });
  }}
  className={`day-plan-card ${item.isPlaceholder ? "placeholder" : ""}`}
  style={{
    cursor: 'grab', // סמן גרירה
    ...(item.isPlaceholder ? { borderColor: item.color ?? "#94a3b8", backgroundColor: `${item.color ?? "#94a3b8"}15` } : {})
  }}
  draggable // <-- הפעלת גרירה
  onDragStart={(e) => {
    e.stopPropagation(); // חובה! כדי שלא יגרור בטעות את השבוע עצמו
    e.dataTransfer.setData("action", "move-workout");
    e.dataTransfer.setData("workoutId", item.id);
  }}
>
                                      <div className="plan-label" >{item.isPlaceholder ? item.title || item.plannedSport : item.title}</div>
                                     <div className="plan-meta">
  {item.isEvent 
    ? null
    : item.isPlaceholder
    ? `${item.plannedDurationMins ?? 0}m · ${Object.entries(item.plannedZoneDistribution ?? {}).map(([z, p]) => `${p}% ${z}`).join(", ")}`
    : `${(getTrainingDurationSeconds(item) / 3600).toFixed(1)}h · ${item.type.toUpperCase()}`}
</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </main>
      </div>

      {quickAddTarget && (
        <div className="quick-add-modal-overlay" onClick={() => setQuickAddTarget(null)}>
          <div className="quick-add-modal" onClick={e => e.stopPropagation()}>
            <div className="quick-add-title">Add Placeholder</div>
            <div className="quick-add-row">
              <label>Sport</label>
              <select
                value={quickAddData.plannedSport}
                onChange={e => {
                  const sport = e.target.value as typeof quickAddData.plannedSport;
                  setQuickAddData(prev => ({
                    ...prev,
                    plannedSport: sport,
                    type: sport === "Bike" ? "bike" : sport === "Swim" ? "swim" : sport === "Run" ? "run" : sport === "Brick" ? "bike" : "run",
                  }));
                }}
              >
                <option>Swim</option>
                <option>Bike</option>
                <option>Run</option>
                <option>Brick</option>
                <option>Strength</option>
              </select>
            </div>
            
            <div className="quick-add-row">
              <label>Total Duration (min)</label>
              <input
                type="number"
                min={10}
                value={quickAddData.plannedDurationMins}
                onChange={e => setQuickAddData(prev => ({ ...prev, plannedDurationMins: Number(e.target.value) }))}
              />
            </div>
            
            <div className="quick-add-row zone-dist-row">
              <label>Zone Distribution (%)</label>
              <div className="zone-dist-inputs">
                {["Z1", "Z2", "Z3", "Z4", "Z5"].map(zone => (
                  <div key={zone} className="zone-dist-input-group">
                    <span className="zone-dist-label">{zone}</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={quickAddData.plannedZoneDistribution?.[zone] ?? 0}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setQuickAddData(prev => {
                          const newDist = { ...prev.plannedZoneDistribution, [zone]: val };
                          if (val === 0) delete newDist[zone];
                          return { ...prev, plannedZoneDistribution: newDist };
                        });
                      }}
                    />
                    <span className="zone-dist-mins">%</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="zone-dist-bar-row">
              <div className="zone-dist-bar">
                {(() => {
                  const dist = quickAddData.plannedZoneDistribution ?? {};
                  const colors: { [key: string]: string } = { Z1: "#a3e635", Z2: "#38bdf8", Z3: "#fbbf24", Z4: "#f87171", Z5: "#a78bfa" };
                  let acc = 0;
                  return ["Z1", "Z2", "Z3", "Z4", "Z5"].map(zone => {
                    const percentage = dist[zone] ?? 0;
                    if (!percentage) return null;
                    const width = percentage; 
                    const left = acc;
                    acc += percentage;
                    return (
                      <div
                        key={zone}
                        className="zone-dist-segment"
                        style={{ width: `${width}%`, left: `${left}%`, background: colors[zone] }}
                        title={`${zone}: ${percentage}%`}
                      />
                    );
                  });
                })()}
              </div>
              <div className="zone-dist-bar-labels">
                <span className={allocatedPercentage === 100 ? "zone-dist-ok" : "zone-dist-warn"}>
                  {allocatedPercentage}% / 100% allocated
                </span>
              </div>
            </div>
            
            <div className="quick-add-actions">
              <button type="button" className="quick-add-cancel" onClick={() => setQuickAddTarget(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="quick-add-submit"
                onClick={handleAddPlaceholder}
                disabled={allocatedPercentage !== 100 || quickAddData.plannedDurationMins < 1}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {weekSettings?.open && (
        <div className="quick-add-modal-overlay" onClick={closeWeekSettings}>
          <div className="quick-add-modal" onClick={e => e.stopPropagation()}>
            <div className="quick-add-title">Week Settings</div>

            <div className="quick-add-row">
              <label>Week Format</label>
              <select value={weekSettings.format} onChange={e => setWeekSettings((s: any) => ({ ...s, format: e.target.value }))}>
                <option>Auto</option>
                <option>Base</option>
                <option>Build</option>
                <option>Peak</option>
                <option>Taper</option>
                <option>Deload</option>
              </select>
            </div>

            <div className="quick-add-row">
              <label>Weekly Target Volume (hours)</label>
              <input type="number" min={0} value={weekSettings.targetVolume} onChange={e => setWeekSettings((s: any) => ({ ...s, targetVolume: Number(e.target.value) }))} />
            </div>

            <div className="quick-add-row">
              <label>Sport</label>
              <select value={weekSettings.sport} onChange={e => setWeekSettings((s: any) => ({ ...s, sport: e.target.value }))}>
                <option>Triathlon</option>
                <option>Swimming</option>
                <option>Running</option>
                <option>Cycling</option>
              </select>
            </div>

            <div className="quick-add-row">
              <label>Zone Distribution (%)</label>
              <div className="zone-dist-inputs">
                {['Z1','Z2','Z3','Z4','Z5'].map(z => (
                  <div key={z} className="zone-dist-input-group">
                    <span className="zone-dist-label">{z}</span>
                    <input type="number" min={0} max={100} value={weekSettings.distribution?.[z] ?? 0} onChange={e => {
                      const val = Number(e.target.value);
                      setWeekSettings((s: any) => ({ ...s, distribution: { ...(s.distribution||{}), [z]: val } }));
                    }} />
                    <span className="zone-dist-mins">%</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn-secondary" onClick={closeWeekSettings}>Cancel</button>
              <button className="btn-primary" onClick={saveWeekSettings}>Save Week</button>
            </div>
          </div>
        </div>
      )}

      {applyProgram.open && (
        <div className="quick-add-modal-overlay" onClick={closeApplyProgramModal}>
          <div className="quick-add-modal" onClick={(e) => e.stopPropagation()}>
            <div className="quick-add-title">Apply Program</div>

            <div className="quick-add-row">
              <label>Apply To</label>
              <select
                value={applyProgram.targetType}
                onChange={(e) => {
                  const targetType = e.target.value as ApplyTargetType;
                  setApplyProgram((prev) => ({
                    ...prev,
                    targetType,
                    targetId: targetType === "athlete" ? athletes[0]?.id || "" : groups[0]?.id || "",
                  }));
                }}
              >
                <option value="athlete">Athlete</option>
                <option value="group">Group</option>
              </select>
            </div>

            <div className="quick-add-row">
              <label>{applyProgram.targetType === "athlete" ? "Athlete" : "Group"}</label>
              <select
                value={applyProgram.targetId}
                onChange={(e) => setApplyProgram((prev) => ({ ...prev, targetId: e.target.value }))}
              >
                <option value="">Select...</option>
                {(applyProgram.targetType === "athlete" ? athletes : groups).map((target: any) => (
                  <option key={target.id} value={target.id}>
                    {target.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="quick-add-row">
              <label>Program Start Date</label>
              <input
                type="date"
                value={applyProgram.startDate}
                onChange={(e) => setApplyProgram((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div className="quick-add-row">
              <label>Default Training Time</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={applyProgram.defaultHour}
                  onChange={(e) => setApplyProgram((prev) => ({ ...prev, defaultHour: Number(e.target.value) }))}
                />
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={applyProgram.defaultMinute}
                  onChange={(e) => setApplyProgram((prev) => ({ ...prev, defaultMinute: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="quick-add-row">
              <label>Weekday Mapping (Plan Day -{">"} Calendar Day)</label>
              <div className="apply-day-map-grid">
                {dayNames.map((planDayLabel, index) => {
                  const planDay = index + 1;
                  const mappedDay = applyProgram.dayMap[planDay] ?? jsDayByPlanDay[planDay];

                  return (
                    <div key={planDay} className="apply-day-map-row">
                      <span className="apply-day-map-label">{planDayLabel}</span>
                      <span className="apply-day-map-arrow">-{">"}</span>
                      <select
                        value={mappedDay}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          setApplyProgram((prev) => ({
                            ...prev,
                            dayMap: {
                              ...prev.dayMap,
                              [planDay]: value,
                            },
                          }));
                        }}
                      >
                        {weekdayOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="quick-add-actions">
              <button type="button" className="quick-add-cancel" onClick={closeApplyProgramModal}>
                Cancel
              </button>
              <button
                type="button"
                className="quick-add-submit"
                onClick={applyProgramToTarget}
                disabled={isApplyingProgram || !applyProgram.targetId || !applyProgram.startDate}
              >
                {isApplyingProgram ? "Applying..." : "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}

      {popupOpen && selectedTraining && (
        <TrainingPopup
          training={selectedTraining}
          onSave={handleSaveTraining}
          onClose={closeTrainingPopup}
          mode={popupMode}
          onSaveAsNew={handleLibraryTrainingSaveAsNew}
          onUpdateExisting={handleLibraryTrainingUpdateExisting}
          onDeleteTraining={
            popupMode === "libraryEdit"
              ? handleLibraryTrainingDelete
              : popupMode === "calendarSchedule"
                ? handleRemoveTrainingFromCalendar
                : undefined
          }
          onSaveOneTime={handleSaveTrainingOneTime}
          onSaveLibrary={handleSaveTrainingToLibrary}
          {...(popupMode === "calendarSchedule" ? { isGroupSchedule: true } : {})}
        />
      )}
    </div>
  );
}

export default ProgramCalendarView;