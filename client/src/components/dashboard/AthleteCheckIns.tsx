import { useState, useCallback } from "react";
import type { AthleteCheckInStatus } from "@/shared/types";
import type { Note } from "@/shared/types/note";
import CheckInResolveModal from "./CheckInResolveModal";
import { resolveCheckIn } from "@/api/attendance";
import "./AthleteCheckIns.css";
import { getNotesByTarget } from "@/api/notes";

interface Props {
  athletes: AthleteCheckInStatus[];
  onAthleteResolved?: (athleteId: string) => void;
}

export default function AthleteCheckins({
  athletes: initialAthletes,
  onAthleteResolved,
}: Props) {
  const [athletes, setAthletes] = useState(initialAthletes);
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteCheckInStatus | null>(null);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);

  const handleAthleteClick = useCallback(
    async (athlete: AthleteCheckInStatus) => {
      setSelectedAthlete(athlete);
      try {
        const notes = await getNotesByTarget("ATHLETE", athlete.athleteId);
        setRecentNotes(notes);
      } catch (err) {
        console.error("Failed to fetch athlete notes:", err);
        setRecentNotes([]);
      }
    },
    []
  );

  const handleResolveCheckIn = useCallback(
    async () => {
      if (!selectedAthlete) return;

      try {
        await resolveCheckIn(selectedAthlete.athleteId);

        // Optimistic update: remove athlete from the list
        setAthletes((prev) =>
          prev.filter((a) => a.athleteId !== selectedAthlete.athleteId)
        );

        // Notify parent component if callback provided
        onAthleteResolved?.(selectedAthlete.athleteId);

        setSelectedAthlete(null);
        setRecentNotes([]);
      } catch (err) {
        throw err;
      }
    },
    [selectedAthlete, onAthleteResolved]
  );

  const getReasonsText = (athlete: AthleteCheckInStatus): string => {
    const reasons: string[] = [];

    if (athlete.reasons.missedSessions) {
      reasons.push(
        `missed ${athlete.reasons.missedSessions.count} workout${athlete.reasons.missedSessions.count > 1 ? "s" : ""}`
      );
    }

    if (athlete.reasons.recentInjury) {
      reasons.push("injured");
    }

    if (athlete.reasons.noContact) {
      reasons.push(
        `no contact for ${athlete.reasons.noContact.daysSinceContact} days`
      );
    }

    return reasons.join(", ");
  };

  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case "danger":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      case "safe":
        return "#22c55e";
      default:
        return "#94a3b8";
    }
  };

  if (athletes.length === 0) {
    return (
      <div className="athlete-checkins-card">
        <h3>At-Risk Athletes</h3>
        <div className="empty-state">
          <p>No athletes at risk</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="athlete-checkins-card">
        <h3>At-Risk Athletes ({athletes.length})</h3>
        <div className="athlete-list">
          {athletes.map((athlete) => (
            <div
              key={athlete.athleteId}
              className={`athlete-item risk-${athlete.risk}`}
              onClick={() => handleAthleteClick(athlete)}
              style={{ cursor: "pointer" }}
            >
              <div
                className="athlete-risk-indicator"
                style={{ backgroundColor: getRiskColor(athlete.risk) }}
              />
              <div className="athlete-info">
                <div className="athlete-name">{athlete.athleteName}</div>
                <div className="athlete-reason">{getReasonsText(athlete)}</div>
              </div>
              <div className="athlete-action">
                <span className="arrow">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedAthlete && (
        <CheckInResolveModal
          athlete={selectedAthlete}
          recentNotes={recentNotes}
          onResolve={handleResolveCheckIn}
          onClose={() => {
            setSelectedAthlete(null);
            setRecentNotes([]);
          }}
        />
      )}
    </>
  );
}
