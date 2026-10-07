import { useState, useEffect } from "react";
import type { AthleteCheckInStatus } from "@/shared/types";
import type { Note } from "@/shared/types/note";
import { NotesPanel } from "@/components/shared";
import { FaWhatsapp } from 'react-icons/fa';
import "./CheckInResolveModal.css";

interface Props {
  athlete: AthleteCheckInStatus;
  recentNotes?: Note[];
  onResolve: (noteSummary: string) => Promise<void>;
  onClose: () => void;
}

export default function CheckInResolveModal({
  athlete,
  recentNotes = [],
  onResolve,
  onClose,
}: Props) {
  const [noteSummary, setNoteSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getReasonsText = (): string => {
    const reasons: string[] = [];

    if (athlete.reasons.missedSessions) {
      reasons.push(
        `${athlete.reasons.missedSessions.count} missed session${athlete.reasons.missedSessions.count > 1 ? "s" : ""}`
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

    return reasons.join(", ") || "Check-in needed";
  };

  const openWhatsApp = () => {
    if (athlete.whatsappNumber) {
      // Remove any non-digit characters from the phone number
      const cleanNumber = athlete.whatsappNumber.replace(/\D/g, "");
      const message = `Hi ${athlete.athleteName}, I wanted to check in with you.`;
      const encodedMessage = encodeURIComponent(message);
      window.open(
        `https://wa.me/${cleanNumber}?text=${encodedMessage}`,
        "_blank"
      );
    }
  };

  const handleResolve = async () => {

    setIsLoading(true);
    setError(null);

    try {
      await onResolve(noteSummary);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve check-in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="check-in-modal">
        <div className="modal-header">
          <div>
            <h2>{athlete.athleteName}</h2>
            <p className="reason">{getReasonsText()}</p>
          </div>
                  {/* Communication Options */}
<div className="communication-section">
  <div className="header-actions">
    <button
      className="whatsapp-button"
      onClick={openWhatsApp}
      disabled={!athlete.whatsappNumber}
      aria-label="Open WhatsApp"
    >
      <FaWhatsapp/>
    </button>

    <button
      className="close-button"
      onClick={onClose}
      aria-label="Close modal"
    >
      ×
    </button>
  </div>

  {!athlete.whatsappNumber && (
    <p className="warning">
      WhatsApp number not available for this athlete
    </p>
  )}
</div>
          
        </div>

        {/* Notes Panel */}
        <div className="notes-section">
          <NotesPanel
            targetType="ATHLETE"
            targetId={athlete.athleteId}
            maxNotes={3}
            collapsible={false}
          />
        </div>

  

        {error && <div className="error-message">{error}</div>}

        {/* Action Buttons */}
        <div className="modal-buttons">
          <button
            className="save-button"
            onClick={handleResolve}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save & Resolve"}
          </button>
          <button
            className="cancel-button"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
