import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {StatsChart} from "@/components/athletes";
import "./GroupDetails.css";
import type { Goal, Group } from "@/shared/types";
import { getGroup, updateGroup } from "@/api/group";
import type { Athlete } from "@/shared/types";
import { getAthlete, getAthletes } from "@/api/athlete";
import {
  createAthleteGroup,
  deleteAthleteGroup,
  getAthleteGroupsByGroupId,
} from "@/api/athleteGroup";
const timeToString = (t: { hour: number; min: number }) => {
  return t
    ? `${t.hour.toString().padStart(2, "0")}:${t.min
        .toString()
        .padStart(2, "0")}`
    : "";
};

const stringToTime = (value: string) => {
  const [hour, min] = value.split(":").map(Number);
  return { hour, min };
};
export default function GroupDetails() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const { id } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState<Group>(null as any);
  const [athletes, setAthletes] = useState<Athlete[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [allAthletes, setAllAthletes] = useState<Athlete[]>([]);
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  const [mode, setMode] = useState<"add" | "edit" | null>(null);

  const [showGoalModal, setShowGoalModal] = useState(false);

  const [newGoal, setNewGoal] = useState<Goal>({
    id: "",
    createdAt: "",
    title: "",
    location: "",
    date: "",
    type: "general",

  });

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (showModal) {
      fetchAllAthletes();
      setSelectedAthletes([]);
    }
  }, [showModal]);

  const fetchAllAthletes = async () => {
    const data = await getAthletes();
    setAllAthletes(data);
  };

  const filteredAthletes = allAthletes.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase());

    const alreadyInGroup = athletes.some((at) => at.id === a.id);

    return matchesSearch && !alreadyInGroup;
  });

  const load = async () => {
    const data = await getGroup(id!);
    setGroup(data);
    setEditData(data);

    // 🔥 מביאים קשרים
    const relations = await getAthleteGroupsByGroupId(data.id);

    // 🔥 מביאים אתלטים לפי קשרים
    const athletesData = await Promise.all(
      relations.map((r: any) => getAthlete(r.athleteId)),
    );

    setAthletes(athletesData);
  };

  const saveEdit = async () => {
    const updated = await updateGroup(group.id, editData);

    setGroup(updated);
    setEditData(updated);

    setEditMode(false);
  };

  const sports = ["run", "bike", "swim", "triathlon", "gym"];
  const levels = ["beginner", "intermediate", "advanced", "elite"];

  const isDirty = JSON.stringify(editData) !== JSON.stringify(group);
  if (!group) return <div>Loading...</div>;

  const toggleAthlete = (athleteId: string) => {
    setSelectedAthletes((prev) =>
      prev.includes(athleteId)
        ? prev.filter((id) => id !== athleteId)
        : [...prev, athleteId],
    );
  };

  const handleAddSelected = async () => {
    try {
      await Promise.all(
        selectedAthletes.map(async (athleteId) => {
          await createAthleteGroup({
            athleteId,
            groupId: group.id,
          });
        }),
      );

      setSelectedAthletes([]);
      setShowModal(false);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveAthlete = async (athleteId: string) => {
    try {
      const relations = await getAthleteGroupsByGroupId(group.id);

      const relation = relations.find((r: any) => r.athleteId === athleteId);

      if (relation) {
        await deleteAthleteGroup(relation.id);
      }

      await load();
    } catch (err) {
      console.error(err);
    }
  };
  const getTestValue = (athlete: Athlete, type: string) => {
    return athlete.tests?.find((t) => t.type === type)?.value;
  };

  const getPerformanceRanges = (athletes: Athlete[], testKey: string) => {
    const results = athletes
      .map((a) => getTestValue(a, testKey))
      .filter((v): v is number => typeof v === "number");

    if (results.length === 0) return null;

    const min = Math.min(...results);
    const max = Math.max(...results);
    const avg = +(results.reduce((a, b) => a + b, 0) / results.length).toFixed(
      2,
    );
    const spread = +(max - min).toFixed(2);

    return { min, max, avg, spread };
  };

  const formatValue = (value: number, type: string) => {
    // זמנים (ריצה / שחייה)
    if (type.includes("K") || type.includes("m")) {
      const m = Math.floor(value / 60);
      const s = Math.round(value % 60);
      return `${m}:${s.toString().padStart(2, "0")}`;
    }

    // אופניים (FTP / וואטים)
    if (type.toLowerCase().includes("ftp")) {
      return `${value}w`;
    }

    return value;
  };

  const getMostRelevantTest = (athletes: Athlete[], sport: string) => {
    const counter: Record<string, number> = {};

    athletes.forEach((a) => {
      a.tests?.forEach((t) => {
        if (t.sport !== sport) return;

        if (!counter[t.type]) counter[t.type] = 0;
        counter[t.type]++;
      });
    });

    const entries = Object.entries(counter);

    if (!entries.length) return null;

    const [bestTest] = entries.sort((a, b) => b[1] - a[1])[0];

    return bestTest;
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const testKeys = ["5K", "10K", "100m", "200m", "500m", "FTP"];

  const handleSaveNote = async () => {
    if (!newNoteTitle.trim()) return;

    let updatedNotes;

    if (editingNoteId) {
      // ✏️ EDIT
      updatedNotes = (group.notes || []).map((n: any) =>
        n.id === editingNoteId
          ? {
              ...n,
              title: newNoteTitle,
              content: newNoteContent,
            }
          : n,
      );
    } else {
      // ➕ CREATE
      const noteToAdd = {
        id: Date.now().toString(),
        title: newNoteTitle,
        content: newNoteContent,
        date: new Date().toISOString(),
      };

      updatedNotes = [...(group.notes || []), noteToAdd];
    }

    const updated = await updateGroup(group.id, {
      ...group,
      notes: updatedNotes,
    });

    setGroup(updated);

    // reset
    setNewNoteTitle("");
    setNewNoteContent("");
    setEditingNoteId(null);
    setShowNoteModal(false);
  };
  const handleCloseModal = () => {
    setShowNoteModal(false);
    setEditingNoteId(null);
    setNewNoteTitle("");
  };

  const handleDeleteNote = async (noteId: string) => {
    const updatedNotes = (group.notes ?? []).filter((n) => n.id !== noteId);

    const updated = await updateGroup(group.id, {
      ...group,
      notes: updatedNotes,
    });

    setGroup(updated);
  };

  const openEditNote = (note: any) => {
    setEditingNoteId(note.id);
    setNewNoteTitle(note.title);
    setNewNoteContent(note.content);
    setShowNoteModal(true);
  };

  const handleSaveGoal = async () => {
    if (!newGoal.title.trim()) return;

    const goalToAdd: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      location: newGoal.location,
      createdAt: new Date().toISOString(),
      date: newGoal.date,
      type: newGoal.type,
    };

    const updated = await updateGroup(group.id, {
      ...group,
      goals: [...(group.goals || []), goalToAdd],
    });

    setGroup(updated);

    setNewGoal({
      id: "",
      createdAt: "",
      title: "",
      location: "",
      date: "",
      type: "general",
    });

    setShowGoalModal(false);
  };
  const bestTest = getMostRelevantTest(athletes, group.sport);

  return (
    <div className="group-details">
      {/* LEFT */}
      <div className="left">
        <div className="card">
          {/* HEADER */}
          <div className="card-header">
            <div className="group-title">
              <div
                className="color-dot"
                style={{ background: group.color || "#ccc" }}
              />
              {editMode ? (
                <input
                  className="input-modern"
                  value={editData.name || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                />
              ) : (
                <h2>{group.name}</h2>
              )}
            </div>

            {!editMode ? (
              <button className="icon-btn" onClick={() => setEditMode(true)}>
                ✏️
              </button>
            ) : (
              <button
                className="icon-btn save"
                onClick={saveEdit}
                disabled={!isDirty}
              >
                💾
              </button>
            )}
          </div>

          {/* COACH */}
          <div className="field">
            <span>Coach:</span>

            {editMode ? (
              <input
                className="input-modern"
                value={editData.coach || ""}
                onChange={(e) =>
                  setEditData({ ...editData, coach: e.target.value })
                }
              />
            ) : (
              <b>{group.coach || "You"}</b>
            )}
          </div>

          {/* SPORT */}
          <div className="field">
            <span>Sport:</span>

            {editMode ? (
              <select
                className="input-modern"
                value={editData.sport || ""}
                onChange={(e) =>
                  setEditData({ ...editData, sport: e.target.value })
                }
              >
                <option value="">Select</option>
                {sports.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <b>{group.sport || "-"}</b>
            )}
          </div>

          {/* LEVEL */}
          <div className="field">
            <span>Level:</span>

            {editMode ? (
              <select
                className="input-modern"
                value={editData.level || ""}
                onChange={(e) =>
                  setEditData({ ...editData, level: e.target.value })
                }
              >
                <option value="">Select</option>
                {levels.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            ) : (
              <b>{group.level || "-"}</b>
            )}
          </div>

          {/* MAX ATHLETES */}
          <div className="field">
            <span>Max Athletes:</span>

            {editMode ? (
              <input
                className="input-modern"
                type="number"
                value={editData.maxAthletes || ""}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    maxAthletes: Number(e.target.value),
                  })
                }
              />
            ) : (
              <b>{group.maxAthletes || "-"}</b>
            )}
          </div>
          {/* SCHEDULE */}
          <div className="field">
            <span>Training Schedule:</span>

            {editMode ? (
              <div className="schedule-edit">
                {(editData.schedule || []).map((s: any, index: number) => (
                  <div key={index} className="schedule-row">
                    <select
                      value={s.day}
                      onChange={(e) => {
                        const updated = [...editData.schedule];
                        updated[index].day = e.target.value;
                        setEditData({ ...editData, schedule: updated });
                      }}
                    >
                      <option value="">Day</option>
                      {days.map((d, i) => (
                        <option key={i} value={i}>
                          {d}
                        </option>
                      ))}
                    </select>

                    <input
                      type="time"
                      value={timeToString(s.start)}
                      onChange={(e) => {
                        const updated = [...editData.schedule];
                        updated[index] = {
                          ...updated[index],
                          start: stringToTime(e.target.value),
                        };
                        setEditData({ ...editData, schedule: updated });
                      }}
                    />

                    <input
                      type="time"
                      value={timeToString(s.end)}
                      onChange={(e) => {
                        const updated = [...editData.schedule];
                        updated[index] = {
                          ...updated[index],
                          end: stringToTime(e.target.value),
                        };
                        setEditData({ ...editData, schedule: updated });
                      }}
                    />

                    <button
                      onClick={() => {
                        const updated = editData.schedule.filter(
                          (_: any, i: number) => i !== index,
                        );
                        setEditData({ ...editData, schedule: updated });
                      }}
                    >
                      ❌
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => {
                    setEditData({
                      ...editData,
                      schedule: [
                        ...(editData.schedule || []),
                        { day: "", start: "" },
                      ],
                    });
                  }}
                >
                  + Add Time
                </button>
              </div>
            ) : (
              <div>
                {(group.schedule || []).length === 0 ? (
                  <div>-</div>
                ) : (
                  (group.schedule || []).map((s: any, i: number) => (
                    <div key={i}>
                      {days[s.day]} • {s.start.hour}:00
                      {s.end && ` - ${s.end.hour}:00`}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          {/* COLOR */}
          <div className="field">
            <span>Color:</span>

            {editMode ? (
              <input
                type="color"
                value={editData.color || "#000000"}
                onChange={(e) =>
                  setEditData({ ...editData, color: e.target.value })
                }
              />
            ) : (
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  background: group.color || "#ccc",
                }}
              />
            )}
          </div>

          {/* CALENDAR */}
          <button
            className="calendar-btn"
            onClick={() => navigate(`/calendar/group/${group.id}`)}
          >
            Open Group Calendar
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Goals</h3>
            <button className="add-btn" onClick={() => setShowGoalModal(true)}>
              +
            </button>
          </div>
          <div className="goals-list">
            {(group.goals || []).map((g: any) => {
              const daysLeft = g.date
                ? Math.ceil(
                    (new Date(g.date).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24),
                  )
                : null;

              return (
                <div key={g.id} className="goal-row">
                  <div className="goal-main">
                    <div className="goal-title">{g.title}</div>

                    {g.location && (
                      <div className="goal-sub">📍 {g.location}</div>
                    )}

                    {g.date && (
                      <div className="goal-date">
                        📅 {new Date(g.date).toLocaleDateString()}
                      </div>
                    )}

                    {daysLeft !== null && (
                      <div className="goal-countdown">
                        ⏳ {daysLeft > 0 ? `${daysLeft} days` : "Passed"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {showGoalModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowGoalModal(false)}
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Add Goal</h3>

              <input
                className="input-modern"
                placeholder="Competition name"
                value={newGoal.title}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, title: e.target.value })
                }
              />

              <input
                className="input-modern"
                placeholder="Location"
                value={newGoal.location}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, location: e.target.value })
                }
              />

              <input
                className="input-modern"
                type="date"
                value={newGoal.date}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, date: e.target.value })
                }
              />

              <button onClick={handleSaveGoal}>Add Goal</button>
            </div>
          </div>
        )}
      </div>

      {/* CENTER */}
      <div className="center">
        <div className="card">
          <h3>Group Load</h3>
          <StatsChart data={[20, 40, 60, 30, 80, 50, 70]} />
          <div className="stats-row">
            <div>
              Weekly Load: <b>320</b>
            </div>
            <div>
              ACWR: <b>1.1</b>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Attendance</h3>
          <div className="big-stat">82%</div>
          <div className="sub">Avg per athlete</div>
        </div>

        <div className="card">
          <h3>Performance Ranges</h3>

          {bestTest &&
            (() => {
              const range = getPerformanceRanges(athletes, bestTest);
              if (!range) return null;

              const spreadPercent = (range.spread / range.avg) * 100;
              const spreadClass =
                spreadPercent > 25
                  ? "high"
                  : spreadPercent > 15
                    ? "medium"
                    : "low";

              return (
                <div className="perf-card">
                  <div className="perf-header">
                    <span className="perf-title">{bestTest}</span>
                    <span className={`perf-spread ${spreadClass}`}>
                      Spread {spreadPercent.toFixed(1)}%
                    </span>
                  </div>

                  <div className="perf-values">
                    <div>
                      <span>Min</span>
                      <b>{formatValue(range.min, bestTest)}</b>
                    </div>

                    <div>
                      <span>Avg</span>
                      <b>{formatValue(range.avg, bestTest)}</b>
                    </div>

                    <div>
                      <span>Max</span>
                      <b>{formatValue(range.max, bestTest)}</b>
                    </div>
                  </div>
                </div>
              );
            })()}
        </div>
      </div>

      {/* RIGHT */}
      <div className="right">
        <div className="card">
          <div className="card-header">
            <h3>Athletes</h3>

            <button className="add-btn" onClick={() => setShowModal(true)}>
              +
            </button>
          </div>

          {athletes.map((a) => (
            <div key={a.id} className="athlete-row">
              <span>{a.name}</span>

              <button
                className="remove-btn"
                onClick={() => handleRemoveAthlete(a.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Notes & Focus</h3>

            <button
              className="add-btn"
              onClick={() => {
                setMode("add");
                setShowNoteModal(true);
              }}
            >
              +
            </button>
          </div>

          {(group.notes || []).length === 0 && (
            <div className="empty">No notes yet</div>
          )}
          <div className="notes-list">
            {(group.notes || []).map((note: any) => {
              const isOpen = expandedNote === note.id;

              return (
                <div key={note.id} className="note-item">
                  <div className="note-header">
                    <div
                      className="note-click"
                      onClick={() => setExpandedNote(isOpen ? null : note.id)}
                    >
                      <b>{note.title}</b>
                      <div className="note-date">
                        {new Date(note.date).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="note-actions">
                      <button onClick={() => openEditNote(note)}>✏️</button>
                      <button onClick={() => handleDeleteNote(note.id)}>
                        🗑️
                      </button>
                    </div>
                  </div>

                  {isOpen && <div className="note-content">{note.content}</div>}
                </div>
              );
            })}
          </div>
        </div>
        {showNoteModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>{editingNoteId ? "Edit Note" : "Add Note"}</h3>

              <input
                className="input-modern"
                placeholder="Title"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
              />

              <textarea
                className="input-modern"
                placeholder="Write note..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
              />

              <button onClick={handleSaveNote}>
                {editingNoteId ? "Save Changes" : "Add Note"}
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Athlete</h3>

            <input
              type="text"
              placeholder="Search athlete..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="athlete-list">
              {filteredAthletes.map((a) => {
                const isInGroup = athletes.some((at) => at.id === a.id);
                const isSelected = selectedAthletes.includes(a.id);

                return (
                  <div
                    key={a.id}
                    className={`athlete-item 
                      ${isInGroup ? "disabled" : ""} 
                      ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      if (isInGroup) return;
                      toggleAthlete(a.id);
                    }}
                  >
                    {a.name}
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleAddSelected}
              disabled={selectedAthletes.length === 0}
            >
              Add Selected ({selectedAthletes.length})
            </button>

            <button onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
