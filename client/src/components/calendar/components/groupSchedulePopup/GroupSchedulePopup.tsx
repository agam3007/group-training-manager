import { useEffect, useState } from "react";
import type { Training, CalendarEvent } from "@/shared/types";
import "./GroupSchedulePopup.css";
import { TrainingPopup } from "../trainingPopup";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent;
  trainings: Training[];
  onTrainingSelected: (
    trainingId: string,
    selectedTraining?: Training,
    modifiedStartTime?: Date,
    modifiedEndTime?: Date,
    saveToLibrary?: boolean,
  ) => void;
  onCancel: (event: CalendarEvent) => void;
  groupName?: string;
}

export default function GroupSchedulePopup({
  isOpen,
  onClose,
  event,
  trainings,
  onTrainingSelected,
  onCancel,
  groupName
}: Props) {
  const [selectedTrainingId, setSelectedTrainingId] = useState<string>("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [showTrainingPopup, setShowTrainingPopup] = useState(false);
  const [startTime, setStartTime] = useState(
  event.startTime.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })
);

const [endTime, setEndTime] = useState(
  event.endTime.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })
);

  useEffect(() => {
    setSelectedTrainingId("");
    setIsCreatingNew(false);
    setShowTrainingPopup(false);
setStartTime(
  event.startTime.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })
);

setEndTime(
  event.endTime.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })
);
  }, [event]);

  if (!isOpen) return null;

  // Extract group name from event title (format: "Group Name - Session")
  const displayGroupName = groupName || event.title.split(" - ")[0] || "Group";

  const parseTime = (timeString: string, referenceDate: Date) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const copy = new Date(referenceDate);
    copy.setHours(hours, minutes, 0, 0);
    return copy;
  };

  const modifiedStartTime = parseTime(startTime, event.startTime);
  const modifiedEndTime = parseTime(endTime, event.endTime);

  const shouldSaveOverride = () => {
    return (
      selectedTrainingId !== "" ||
      startTime !== event.startTime.toISOString().slice(11, 16) ||
      endTime !== event.endTime.toISOString().slice(11, 16)
    );
  };

  const handleSave = async (saveToLibrary = false) => {
    const selectedTraining = selectedTrainingId
      ? trainings.find((t) => t.id === selectedTrainingId)
      : undefined;

    const trainingId = selectedTrainingId || event.id;

    onTrainingSelected(
      trainingId,
      selectedTraining,
      modifiedStartTime,
      modifiedEndTime,
      saveToLibrary,
    );
  };

  const handleLibrarySelection = async () => {
    if (shouldSaveOverride()) {
      await handleSave(false);
    }
    onClose();
  };

  const handleNewTrainingSubmit = async (
    training: Training,
    saveMode: "one-time" | "library",
  ) => {
    const saveToLibrary = saveMode === "library";

    onTrainingSelected(
      training.id,
      training,
      modifiedStartTime,
      modifiedEndTime,
      saveToLibrary,
    );

    setShowTrainingPopup(false);
    onClose();
  };

  const handleCancel = async () => {
    onCancel(event);
    onClose();
  };

  // If showing training popup for new training
  if (showTrainingPopup) {
    const newTraining: Training = {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      duration: 60,
      type: "swim",
      creationDate: new Date(),
      equipment: [],
      steps: [],
      notes: "",
    };

    return (
      <div className="popup-overlay" onClick={onClose}>
        <div className="popup-content" onClick={(e) => e.stopPropagation()}>
          <TrainingPopup
            training={newTraining}
            groupName={displayGroupName}
            onClose={() => {
              setShowTrainingPopup(false);
              onClose();
            }}
            onSave={() => {}} // Not used in group schedule mode
            onSaveOneTime={(training) => handleNewTrainingSubmit(training, "one-time")}
            onSaveLibrary={(training) => handleNewTrainingSubmit(training, "library")}
            isGroupSchedule={true}
          />
        </div>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "swim":
        return "🏊";
      case "bike":
        return "🚴";
      case "run":
        return "🏃";
      case "strength":
        return "💪";
      default:
        return "📋";
    }
  };

  const groupedTrainings = trainings.reduce(
    (acc, t) => {
      if (!acc[t.type]) acc[t.type] = [];
      acc[t.type].push(t);
      return acc;
    },
    {} as Record<string, Training[]>,
  );

  const handleClose = async () => {
    if (shouldSaveOverride()) {
      await handleSave(false);
    }
    onClose();
  };

  return (
    <div className="popup-overlay" onClick={handleClose}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h3>Schedule for {displayGroupName}</h3>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="popup-body">
          <div className="event-info">
            <p><strong>Date:</strong> {event.startTime.toLocaleDateString()}</p>
            <div className="time-edit-row">
              <label>
                Start
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </label>
              <label>
                End
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="training-selection">
            <h4>Select Training</h4>

            <div className="training-options">
              <div className="option-tabs">
                <button
                  className={!isCreatingNew ? 'active' : ''}
                  onClick={() => setIsCreatingNew(false)}
                >
                  Choose from Library
                </button>
                <button
                  className={isCreatingNew ? 'active' : ''}
                  onClick={() => {
                    setIsCreatingNew(true);
                    setShowTrainingPopup(true);
                  }}
                >
                  Create New
                </button>
              </div>

              {!isCreatingNew && (
                <div className="training-list">
                  {Object.entries(groupedTrainings).map(([type, list]) => (
                    <div key={type} className="training-group">
                      <div className="training-group-header">
                        {getIcon(type)} {type === "bike" ? "Cycling" : type === "strength" ? "Gym" : type.charAt(0).toUpperCase() + type.slice(1)} ({list.length})
                      </div>
                      <div className="training-group-items">
                        {list.map((training) => (
                          <div
                            key={training.id}
                            className={`training-item ${selectedTrainingId === training.id ? 'selected' : ''}`}
                            onClick={() => setSelectedTrainingId(training.id)}
                          >
                            <div className="training-info">
                              <h5>{training.title}</h5>
                              <p>{training.type} • {training.duration || 60}min</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="popup-footer">
          <button className="cancel-btn" onClick={handleCancel}>
            Cancel This Session
          </button>
          <button
            className="submit-btn"
            onClick={handleLibrarySelection}
            disabled={!selectedTrainingId}
          >
            Save One-time Override
          </button>
        </div>
      </div>
    </div>
  );
}