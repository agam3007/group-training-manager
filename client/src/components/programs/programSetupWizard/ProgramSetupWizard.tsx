import { useState } from "react";
import type { Program, MacroEvent, MesoPhase, WeeklyStats, ZoneDistribution, MesoIntensityDistribution, ProgramTemplate, ProgramMesoBlock, PlannedWeek } from "@/shared/types/periodization";
import ProgramSetupModal from "./components/programSetupModal/ProgramSetupModal";
import Step2EventsAndRulesModal from "./components/step2EventsAndRulesModal/Step2EventsAndRulesModal";
import Step3TimelineVisualizationModal from "./components/step3TimelineVisualizationModal/Step3TimelineVisualizationModal";
import { createProgram } from "@/api/program";
import { createPlan } from "@/api/plan";
import { createProgramTemplate } from "@/api/programTemplate";
import { createMesoBlock } from "@/api/mesoBlock";
import { createPlannedWeek } from "@/api/plannedWeek";
import "./ProgramSetupWizard.css";

interface WizardFormData extends Partial<Program> {
  events?: MacroEvent[];
  loadingPattern?: string;
  periodizationModel?: string;
  mesoPhases?: MesoPhase[];
}

interface Props {
  onClose: () => void;
  onComplete: (program: Program) => void;
}

function parseIntensityDistribution(intensity: string): ZoneDistribution {
  const parts = intensity.split("/").map((value) => Number(value.trim()));
  return {
    Z1: parts[0] || 0,
    Z2: parts[1] || 0,
    Z3: parts[2] || 0,
    Z4: parts[3] || 0,
    Z5: parts[4] || 0,
  };
}

function parseMesoIntensityDistribution(intensity: string): MesoIntensityDistribution {
  const parts = intensity.split("/").map((value) => Number(value.trim()));
  return {
    Z1_Z2: parts[0] || 0,
    Z3: parts[1] || 0,
    Z4_Z5: parts[2] || 0,
  };
}

function normalizeLoadingPattern(pattern: string): "3:1" | "2:1" | "Custom" {
  if (pattern === "2:1" || pattern === "3:1" || pattern === "Custom") {
    return pattern;
  }
  return "3:1";
}

function buildWeeklyStats(phase: MesoPhase, isWeeks = false): WeeklyStats[] {
  const stats: WeeklyStats[] = [];
  const start = new Date(phase.startDate);
  const end = new Date(phase.endDate);
  let currentStart = new Date(start);
  let weekCounter = 1;

  while (currentStart <= end) {
    const weekEnd = new Date(currentStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    if (weekEnd > end) {
      weekEnd.setTime(end.getTime());
    }

    if (!isWeeks) {
      stats.push({
        weekStart: currentStart.toISOString().slice(0, 10),
        weekEnd: weekEnd.toISOString().slice(0, 10),
        targetVolume: phase.targetVolumeHours,
        actualVolume: 0,
        targetDistribution: parseIntensityDistribution(phase.intensityDistribution),
        actualDistribution: { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 },
      });
    } else {
      // For week-based programs store week identifiers instead of ISO dates
      const daysInThisWeek = Math.ceil((weekEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const startDay = 1;
      const endDay = Math.min(7, daysInThisWeek);
      stats.push({
        weekStart: `Week ${weekCounter}, Day ${startDay}`,
        weekEnd: `Week ${weekCounter}, Day ${endDay}`,
        targetVolume: phase.targetVolumeHours,
        actualVolume: 0,
        targetDistribution: parseIntensityDistribution(phase.intensityDistribution),
        actualDistribution: { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 },
      });
    }

    currentStart = new Date(currentStart);
    currentStart.setDate(currentStart.getDate() + 7);
    weekCounter++;
  }

  return stats;
}

function mapPhasesToBlocks(phases: MesoPhase[], isWeeks = false) {
  return phases.map((phase) => {
    const weeklyStats = buildWeeklyStats(phase, isWeeks);
    return {
      id: phase.id,
      name: phase.phaseType,
      startDate: phase.startDate,
      endDate: phase.endDate,
      loadingPattern: normalizeLoadingPattern(phase.loadingPattern),
      startVolume: phase.targetVolumeHours,
      weeklyVolumes: weeklyStats.map((week) => week.targetVolume),
      intensityDistribution: parseMesoIntensityDistribution(phase.intensityDistribution),
      weeklyStats,
    };
  });
}

function buildProgramMesoBlocks(phases: MesoPhase[], programId: string) {
  const mesoPayloads: Omit<ProgramMesoBlock, "id">[] = [];
  let currentWeekStart = 1;

  phases.forEach((phase, index) => {
    const stats = buildWeeklyStats(phase, true);
    const durationWeeks = stats.length;
    mesoPayloads.push({
      programId,
      name: phase.phaseType,
      order: index + 1,
      startWeekNumber: currentWeekStart,
      durationWeeks,
      loadingPattern: normalizeLoadingPattern(phase.loadingPattern),
      intensityDistribution: parseMesoIntensityDistribution(phase.intensityDistribution),
    });
    currentWeekStart += durationWeeks;
  });

  return mesoPayloads;
}

function buildPlannedWeekPayloads(phase: MesoPhase, blockId: string, startWeekNumber: number) {
  const weeklyStats = buildWeeklyStats(phase, true);
  return weeklyStats.map((week, index) => ({
    mesoBlockId: blockId,
    weekNumber: startWeekNumber + index,
    targetVolumeHours: week.targetVolume,
    targetDistribution: week.targetDistribution,
    focus: phase.phaseType,
  } as Omit<PlannedWeek, "id">));
}

export default function ProgramSetupWizard({ onClose, onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleStep1Complete = (basicData: Partial<Program>) => {
    setFormData((prev) => ({ ...prev, ...basicData }));
    setCurrentStep(2);
  };

  const handleStep2Complete = (eventsAndRules: {
    events: MacroEvent[];
    loadingPattern: string;
    periodizationModel: string;
  }) => {
    setFormData((prev) => ({
      ...prev,
      events: eventsAndRules.events,
      loadingPattern: eventsAndRules.loadingPattern,
      periodizationModel: eventsAndRules.periodizationModel,
    }));
    setCurrentStep(3);
  };

  const handleStep3Complete = async (mesoPhases: MesoPhase[]) => {
    setSaving(true);
    setSaveError(null);

    const finalProgram: Program = {
      id: Date.now().toString(),
      name: formData.name || "",
      assigneeType: formData.assigneeType || "Individual",
      assigneeName: formData.assigneeName || "",
      sport: formData.sport || "Triathlon",
      startDate: formData.startDate || "",
      endDate: formData.endDate || "",
      // include durationType and weeks when present
      durationType: formData.durationType || undefined,
      weeks: formData.weeks || undefined,
      mainGoal: formData.mainGoal || "",
      level: formData.level || "Beginner",
      createdAt: new Date().toISOString(),
      macroEvents: formData.events,
    };

    try {
      const programPayload: any = {
        name: finalProgram.name,
        assigneeType: finalProgram.assigneeType,
        assigneeName: finalProgram.assigneeName,
        sport: finalProgram.sport,
        startDate: finalProgram.startDate,
        endDate: finalProgram.endDate,
        mainGoal: finalProgram.mainGoal,
        level: finalProgram.level,
        macroEvents: finalProgram.macroEvents,
      };
      if (finalProgram.durationType) programPayload.durationType = finalProgram.durationType;
      if (finalProgram.weeks) programPayload.weeks = finalProgram.weeks;

      const savedProgram = await createProgram(programPayload);

      const templatePayload: Omit<ProgramTemplate, "id"> = {
        name: savedProgram.name,
        sport: savedProgram.sport,
        durationType: finalProgram.durationType ?? "dates",
        startDate: finalProgram.durationType === "dates" ? finalProgram.startDate : undefined,
        weeksLength: finalProgram.durationType === "weeks" ? finalProgram.weeks : undefined,
        assigneeType: savedProgram.assigneeType,
        assigneeName: savedProgram.assigneeName,
        mainGoal: savedProgram.mainGoal,
        level: savedProgram.level,
        createdAt: new Date().toISOString(),
        macroEvents: savedProgram.macroEvents || [],
      };
      await createProgramTemplate(templatePayload);

      const planBlocks = mapPhasesToBlocks(mesoPhases, formData.durationType === "weeks");
      await createPlan({
        programId: savedProgram.id,
        name: savedProgram.name,
        description: savedProgram.mainGoal,
        blocks: planBlocks,
      });

      const mesoBlocks = buildProgramMesoBlocks(mesoPhases, savedProgram.id);
      let currentWeekStart = 1;
      for (let index = 0; index < mesoBlocks.length; index++) {
        const blockPayload = mesoBlocks[index];
        const createdBlock = await createMesoBlock(blockPayload);
        const phase = mesoPhases[index];
        const plannedWeekPayloads = buildPlannedWeekPayloads(phase, createdBlock.id, currentWeekStart);
        for (const plannedWeekPayload of plannedWeekPayloads) {
          await createPlannedWeek(plannedWeekPayload);
        }
        currentWeekStart += blockPayload.durationWeeks;
      }

      onComplete({ ...savedProgram, macroEvents: finalProgram.macroEvents });
    } catch (error) {
      console.error("Failed to save program and plan", error);
      setSaveError("Unable to save program. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="wizard-overlay">
      <div className="wizard-wrapper">
        {saving && <div className="wizard-save-status">Saving program and blocks...</div>}
        {currentStep === 1 && (
          <ProgramSetupModal
            initial={formData}
            onClose={onClose}
            onSave={handleStep1Complete}
            isStep={true}
          />
        )}

        {currentStep === 2 && (
          <Step2EventsAndRulesModal
            program={formData}
            onBack={() => setCurrentStep(1)}
            onNext={handleStep2Complete}
          />
        )}

        {currentStep === 3 && (
          <Step3TimelineVisualizationModal
            program={formData}
            events={formData.events || []}
            loadingPattern={formData.loadingPattern || "3:1"}
            periodizationModel={formData.periodizationModel || "Linear"}
            onBack={() => setCurrentStep(2)}
            onComplete={handleStep3Complete}
          />
        )}
        {saveError && <div className="wizard-save-error">{saveError}</div>}
      </div>
    </div>
  );
}
