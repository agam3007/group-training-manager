import type { Training } from "@/shared/types";
import "./TrainingDetails.css";

interface Props {
  training: Training;
  onClose: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
}

export default function TrainingDetails({
  training,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  const getColor = (type: string) => {
    switch (type) {
      case "warmup":
        return "#ff6b6b";
      case "main":
        return "#4dabf7";
      case "cooldown":
        return "#51cf66";
      case "recovery":
        return "#adb5bd";
      default:
        return "#dee2e6";
    }
  };

  return (
    <div className="popup">
      <div className="td-container">
        {/* HEADER */}
        <div className="td-header">
          <div>
            <h2>{training.title || "Workout"}</h2>

            <div className="td-summary">
              <span>🏃 {training.type}</span>
              <span>• {training.description}</span>
            </div>
          </div>

          <div className="td-actions">
            <button className="edit-btn" onClick={onEdit}>
              Edit
            </button>

            <button
              className="delete-btn"
              onClick={() => {
                if (window.confirm("Delete this training?")) {
                  onDelete(training.id);
                }
              }}
            >
              Delete
            </button>

            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="td-body">
          {/* LEFT - WORKOUT */}
          <div className="td-left">
            {training.steps.map((step: any) => (
              <div key={step.id} className="td-step">
                <div
                  className="td-color"
                  style={{ background: getColor(step.setType) }}
                />

                <div className="td-step-content">
                  <div className="td-step-title">{step.setType}</div>

                  <div className="td-step-details">
                    {step.mode === "distance" && (
                      <span>
                        {step.reps} × {step.distance}
                        {step.unit}
                      </span>
                    )}

                    {step.mode === "time" && (
                      <span>
                        {step.reps} × {Math.round(step.duration / 60)} min
                      </span>
                    )}
                  </div>

                  <div className="td-step-intensity">
                    {step.intensity || "Z?"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT */}
          <div className="td-right">
            {/* NOTES */}
            <div className="td-card">
              <h4>Notes</h4>
              <ul>
                {training.notes?.split("\n").map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
