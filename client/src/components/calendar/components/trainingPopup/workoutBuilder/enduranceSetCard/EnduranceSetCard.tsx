import { useState } from "react";
import type { EnduranceSet } from "@/shared/types";
import "./EnduranceSetCard.css";

interface Props {
  set: EnduranceSet;
  update: (id: string, data: any) => void;
  remove: (id: string) => void;
  duplicate: () => void;
}

export default function EnduranceSetCard({
  set,
  update,
  remove,
  duplicate,
}: Props) {
  const [editing, setEditing] = useState(false);

  const formatMain = () => {
    if (set.mode === "time") {
      return `${set.reps} × ${set.duration || 0}s`;
    }
    return `${set.reps} × ${set.distance || 0}${set.unit || ""}`;
  };

  return (
    <div className={`set-card ${set.setType}`}>
      {/* ================= SUMMARY ================= */}
      {!editing && (
        <div className="set-summary" onClick={() => setEditing(true)}>
          <div className="set-main">
            <strong>{formatMain()}</strong>

            {set.intensity && (
              <span className="intensity">{set.intensity}</span>
            )}
          </div>

          {set.notes && <div className="set-notes">{set.notes}</div>}

          <div className="set-extra">
            {set.rest && <span>Rest {set.rest}s</span>}
          </div>
        </div>
      )}

      {/* ================= EDIT ================= */}
      {editing && (
        <div className="set-edit">
          {/* ===== ROW 1: STRUCTURE ===== */}
          <div className="set-row">
            {/* REPS */}
            <div className="field small">
              <label>Reps</label>
              <input
                type="number"
                value={set.reps}
                onChange={(e) =>
                  update(set.id, {
                    reps: Number(e.target.value),
                  })
                }
              />
            </div>

            {/* MODE */}
            <div className="field small">
              <label>Type</label>
              <select
                value={set.mode}
                onChange={(e) =>
                  update(set.id, {
                    mode: e.target.value,
                  })
                }
              >
                <option value="distance">Distance</option>
                <option value="time">Time</option>
              </select>
            </div>

            {/* DISTANCE / TIME */}
            {set.mode === "distance" ? (
              <>
                <div className="field">
                  <label>Distance</label>
                  <input
                    type="number"
                    value={set.distance || ""}
                    onChange={(e) =>
                      update(set.id, {
                        distance: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="field small">
                  <label>Unit</label>
                  <select
                    value={set.unit}
                    onChange={(e) =>
                      update(set.id, {
                        unit: e.target.value,
                      })
                    }
                  >
                    <option value="m">m</option>
                    <option value="km">km</option>
                  </select>
                </div>
              </>
            ) : (
              <div className="field">
                <label>Time (sec)</label>
                <input
                  type="number"
                  value={set.duration || ""}
                  onChange={(e) =>
                    update(set.id, {
                      duration: Number(e.target.value),
                    })
                  }
                />
              </div>
            )}
          </div>

          {/* ===== ROW 2: PERFORMANCE ===== */}
          <div className="set-row">
            {/* REST */}
            <div className="field">
              <label>Rest (sec)</label>
              <input
                type="number"
                value={set.rest || ""}
                onChange={(e) =>
                  update(set.id, {
                    rest: Number(e.target.value),
                  })
                }
              />
            </div>

            {/* INTENSITY */}
            <div className="field">
              <label>Intensity</label>
              <input
                placeholder="Z2 / 80% / RPE 6"
                value={set.intensity || ""}
                onChange={(e) =>
                  update(set.id, {
                    intensity: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {/* ===== NOTES ===== */}
          <textarea
            className="set-notes-input"
            placeholder="Notes..."
            value={set.notes || ""}
            onChange={(e) =>
              update(set.id, {
                notes: e.target.value,
              })
            }
          />

          {/* ===== ACTIONS ===== */}
          <div className="set-actions">
            <button className="btn-primary" onClick={() => setEditing(false)}>
              Done
            </button>

            <button className="btn-secondary" onClick={duplicate}>
              Duplicate
            </button>

            <button className="btn-danger" onClick={() => remove(set.id)}>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
