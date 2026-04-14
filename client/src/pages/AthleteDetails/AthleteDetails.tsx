import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import type { Athlete, Test } from "@/shared/types";
import {
  deleteAthlete,
  getAthlete,
  updateAthlete,
} from "@/api/athlete";

import "./AthleteDetails.css";
import {AddTestModal, StatsChart, ZonesTable, ProgressChart, AddGoalModal, GoalActionModal} from "@/components/athletes";

import {
  deleteAthleteGroup,
  getAthleteGroupsByAthleteId,
} from "@/api/athleteGroup";
import { getGroup } from "@/api/group";

/* -------- TYPES -------- */

type SportType = "run" | "bike" | "swim" | "gym";

type DayEvent = {
  athleteId?: string;
  groupId?: string;
  type: "training";
  done?: boolean;
};

/* -------- HELPERS -------- */

function secondsToTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const sportIcon = (sport: string) => {
  if (sport === "run") return "🏃";
  if (sport === "bike") return "🚴";
  if (sport === "swim") return "🏊";
  return "";
};

/* -------- FIELD -------- */

function Field({ label, value, editMode, onChange }: any) {
  const [val, setVal] = useState(value);

  useEffect(() => {
    setVal(value);
  }, [value]);

  const handleChange = (newVal: any) => {
    setVal(newVal);
    onChange && onChange(newVal); // 🔥 זה מה שהיה חסר
  };

  return (
    <div className="field">
      <span>{label}:</span>

      {editMode ? (
        <input
          value={val || ""}
          onChange={(e) => handleChange(e.target.value)}
          className="input"
        />
      ) : (
        <span>{value || "-"}</span>
      )}
    </div>
  );
}

/* -------- COMPONENT -------- */

export default function AthleteDetails() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [athlete, setAthlete] = useState<Athlete | null>(null);

  const [events, setEvents] = useState<DayEvent[]>([]);

  const [sport, setSport] = useState<SportType>("run");

  const [showTestModal, setShowTestModal] = useState(false);

  const [openDropdown, setOpenDropdown] = useState(false);

  const [selectedPB, setSelectedPB] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    "overview" | "contacts" | "health" | "groups"
  >("overview");

  const [editMode, setEditMode] = useState(false);

  const [editData, setEditData] = useState<any>(null);

  const [showGoalModal, setShowGoalModal] = useState(false);

  const [activeGoal, setActiveGoal] = useState<any>(null);
  const [goalMode, setGoalMode] = useState<"plan" | "review" | null>(null);

  const [groups, setGroups] = useState<any[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const load = async () => {
    const data = await getAthlete(id!);
    setAthlete(data);

    setEditData(data);

    const relations = await getAthleteGroupsByAthleteId(id!);
    const groupsData = await Promise.all(
      relations.map((r: any) => getGroup(r.groupId)),
    );

    setGroups(groupsData);
  };

  const saveEdit = async () => {
    const updated = await updateAthlete(id!, editData);

    setAthlete(updated);
    setEditData(updated);

    setEditMode(false);
  };

  if (!athlete || !editData) return <div>Loading...</div>;

  const isDirty = JSON.stringify(editData) !== JSON.stringify(athlete);
  /* -------- ATTENDANCE -------- */

  const athleteTrainings = events.filter(
    (e) =>
      e.type === "training" &&
      (e.athleteId === athlete.id || groups.some((g) => g.id === e.groupId)),
  );
  /* -------- LOAD + ANALYTICS -------- */

  // כרגע אין לך trainings אמיתיים → נשתמש ב-events כבסיס
  // (בהמשך תחליפי ל-trainings אמיתיים)

  const weeklyTrainings = athleteTrainings.slice(-7);

  const weeklyLoad = weeklyTrainings.length * 50; // זמני (עד שיהיה zones אמיתי)

  const lastWeekLoad = athleteTrainings.slice(-14, -7).length * 50;

  const loadChange = lastWeekLoad
    ? Math.round(((weeklyLoad - lastWeekLoad) / lastWeekLoad) * 100)
    : 0;

  // ACUTE / CHRONIC (PRO)
  const acuteLoad = weeklyLoad;
  const chronicLoad = (athleteTrainings.slice(-28).length * 50) / 4;

  const acwr = chronicLoad ? (acuteLoad / chronicLoad).toFixed(2) : "0";

  // STREAK
  let streak = 0;
  for (let i = athleteTrainings.length - 1; i >= 0; i--) {
    if (athleteTrainings[i].done) streak++;
    else break;
  }

  // MISSED
  const missed = athleteTrainings.filter((t) => !t.done).length;

  // LAST TRAINING
  const lastDoneIndex = [...athleteTrainings]
    .reverse()
    .findIndex((t) => t.done);
  const lastTrainingDaysAgo = lastDoneIndex === -1 ? null : lastDoneIndex;

  const insights = [];

  if (loadChange > 20) {
    insights.push("⚠️ Load increased sharply");
  }

  if (Number(acwr) > 1.3) {
    insights.push("⚠️ Injury risk (high ACWR)");
  }

  if (streak >= 5) {
    insights.push("🔥 Great consistency");
  }

  if (missed >= 2) {
    insights.push("⚠️ Missed trainings");
  }

  if (!insights.length) {
    insights.push("✅ Balanced training");
  }

  /* -------- ADD TEST -------- */

  const addTest = async (test: any) => {
    if (!athlete) return;

    const updatedAthlete = {
      ...athlete,
      tests: [...(athlete.tests || []), test],
      zones: {
        ...athlete.zones,
        [test.sport]: test.zones,
      },
    };

    const saved = await updateAthlete(athlete.id, updatedAthlete);

    setAthlete(saved);
  };

  /* -------- GOALS -------- */

  const addGoal = async (goal: any) => {
    if (!athlete) return;

    const updatedAthlete = {
      ...athlete,
      goals: [...(athlete.goals || []), goal],
    };

    const saved = await updateAthlete(athlete.id, updatedAthlete);

    setAthlete(saved);
  };

  const getDaysLeft = (date: string) => {
    if (!date) return null;

    const diff = new Date(date).getTime() - new Date().getTime();

    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getGoalStatus = (g: any) => {
    if (g.done) return "done";

    if (g.date) {
      const days = getDaysLeft(g.date);

      if (days !== null) {
        if (days < 0) return "missed";
        if (days < 7) return "soon";
        return "on-track";
      }
    }

    return "active";
  };

  const getPBProgress = (g: any, tests: Test[] | undefined) => {
    if (!g.target || !tests?.length) return 0;

    const relevantTests = tests.filter((t) => t.type === g.raceName);

    if (!relevantTests.length) return 0;

    const sport = relevantTests[0].sport;

    const pb =
      sport === "bike"
        ? Math.max(...relevantTests.map((t) => t.value))
        : Math.min(...relevantTests.map((t) => t.value));

    const target = Number(g.target);

    if (!target) return 0;

    // ריצה/שחייה → נמוך יותר טוב
    if (sport !== "bike") {
      return Math.min(100, Math.round((pb / target) * 100));
    }

    // אופניים → גבוה יותר טוב
    return Math.min(100, Math.round((pb / target) * 100));
  };

  const isPast = (date: string) => {
    return new Date(date).getTime() < Date.now();
  };

  const openGoalModal = (goal: any) => {
    setActiveGoal(goal);

    if (goal.date && isPast(goal.date)) {
      setGoalMode("review");
    } else {
      setGoalMode("plan");
    }
  };

  const isOneWeekAway = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();

    const days = diff / (1000 * 60 * 60 * 24);

    return days <= 7 && days > 0;
  };

  const saveGoalAction = async (goalId: string, data: any) => {
    if (!athlete) return;

    const updatedGoals = athlete.goals?.map((g) =>
      g.id === goalId
        ? {
            ...g,
            plan: goalMode === "plan" ? data : g.plan,
            review: goalMode === "review" ? data : g.review,
          }
        : g,
    );

    const updatedAthlete = {
      ...athlete,
      goals: updatedGoals,
    };

    const saved = await updateAthlete(athlete.id, updatedAthlete);

    setAthlete(saved);

    setActiveGoal(null);
    setGoalMode(null);
  };

  const getGoalBtnType = (g: any) => {
    if (!g.date) return "update";
    return isPast(g.date) ? "review" : "plan";
  };

  const saveName = async () => {
    if (!athlete?.id) return;
    if (!editData.name?.trim()) return;

    const updated = await updateAthlete(athlete.id, {
      ...athlete,
      name: editData.name,
    });

    setAthlete(updated);
  };

  const handleDelete = async () => {
    if (!athlete) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this athlete?",
    );

    if (!confirmDelete) return;

    try {
      await deleteAthlete(athlete.id);

      navigate("/athletes"); // חוזר לרשימה
    } catch (err) {
      alert("Failed to delete athlete");
    }
  };

  const handleRemoveFromGroup = async (groupId: string) => {
    const relations = await getAthleteGroupsByAthleteId(athlete.id);

    const relation = relations.find((r: any) => r.groupId === groupId);

    if (relation) {
      await deleteAthleteGroup(relation.id);
      await load();
    }
  };

  return (
    <div className="dashboard">
      {/* LEFT */}

      <div className="left">
        <div className={`profile ${athlete.injuries ? "injured" : ""}`}>
          <div className="avatar" />
          {athlete.name ? (
            <h2>{athlete.name}</h2>
          ) : (
            <input
              className="name-input"
              value={editData.name || ""}
              onChange={(e) =>
                setEditData({ ...editData, name: e.target.value })
              }
              placeholder="Athlete name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  saveName();
                }
              }}
              onBlur={() => {
                if (editData.name?.trim()) {
                  saveName();
                }
              }}
            />
          )}

          <p>{athlete.level}</p>
        </div>

        <div className="card">
          {/* TABS */}
          <div className="tabs">
            {["overview", "contacts", "health", "groups"].map((tab) => {
              const isHealth = tab === "health";
              const hasInjury = !!editData.injuries;

              return (
                <div
                  key={tab}
                  className={`tab ${activeTab === tab ? "active" : ""} ${isHealth && hasInjury ? "alert" : ""}`}
                  onClick={() => setActiveTab(tab as any)}
                >
                  {tab.toUpperCase()}

                  {/* 🔥 אינדיקציה */}
                  {isHealth && hasInjury && (
                    <span className="tab-alert-icon">⚠️</span>
                  )}
                </div>
              );
            })}

            {!editMode ? (
              <button
                className="icon-btn"
                onClick={() => {
                  setEditData({ ...athlete });
                  setEditMode(true);
                }}
              >
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

          <div className="tab-content">
            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <>
                <Field
                  label="Age"
                  value={editData.age}
                  editMode={editMode}
                  onChange={(v: any) => setEditData({ ...editData, age: v })}
                />
                <Field
                  label="Height"
                  value={editData.height}
                  editMode={editMode}
                  onChange={(v: any) => setEditData({ ...editData, height: v })}
                />
                <Field
                  label="Weight"
                  value={editData.weight}
                  editMode={editMode}
                  onChange={(v: any) => setEditData({ ...editData, weight: v })}
                />
                <Field
                  label="Rest HR"
                  value={editData.restingHR}
                  editMode={editMode}
                  onChange={(v: any) =>
                    setEditData({ ...editData, restingHR: v })
                  }
                />
                <Field
                  label="Max HR"
                  value={editData.maxHR}
                  editMode={editMode}
                  onChange={(v: any) => setEditData({ ...editData, maxHR: v })}
                />
                <Field
                  label="Experience"
                  value={editData.experience}
                  editMode={editMode}
                  onChange={(v: any) =>
                    setEditData({ ...editData, experience: v })
                  }
                />
              </>
            )}

            {/* CONTACTS */}
            {activeTab === "contacts" && (
              <>
                <Field
                  label="Phone"
                  value={editData.phone}
                  editMode={editMode}
                  onChange={(v: any) => setEditData({ ...editData, phone: v })}
                />
                <Field
                  label="Email"
                  value={editData.email}
                  editMode={editMode}
                  onChange={(v: any) => setEditData({ ...editData, email: v })}
                />
                <Field
                  label="Emergency Name"
                  value={editData.emergencyName}
                  editMode={editMode}
                  onChange={(v: any) =>
                    setEditData({ ...editData, emergencyName: v })
                  }
                />

                <Field
                  label="Emergency Phone"
                  value={editData.emergencyPhone}
                  editMode={editMode}
                  onChange={(v: any) =>
                    setEditData({ ...editData, emergencyPhone: v })
                  }
                />

                <Field
                  label="Emergency Email"
                  value={editData.emergencyEmail}
                  editMode={editMode}
                  onChange={(v: any) =>
                    setEditData({ ...editData, emergencyEmail: v })
                  }
                />
              </>
            )}

            {/* HEALTH */}
            {activeTab === "health" && (
              <>
                <div className="field">
                  <span>Injury:</span>

                  {editMode ? (
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={!!editData.injuries}
                        onChange={(e) => {
                          const val = e.target.checked;

                          setEditData({
                            ...editData,
                            injuries: val ? "" : null,
                            injuryDate: val
                              ? new Date().toISOString().slice(0, 10)
                              : null,
                          });
                        }}
                      />
                      <span className="slider" />
                    </label>
                  ) : (
                    <span>{editData.injuries ? "Yes" : "No"}</span>
                  )}
                </div>

                {editData.injuries && (
                  <div className="alert-box">
                    ⚠️ {editData.injuries || "Injury"}
                  </div>
                )}

                {editData.injuries !== null && (
                  <>
                    <Field
                      label="Injury Type"
                      value={editData.injuries}
                      editMode={editMode}
                      onChange={(v: any) =>
                        setEditData({ ...editData, injuries: v })
                      }
                    />
                    <Field
                      label="Limitations"
                      value={editData.limitations}
                      editMode={editMode}
                      onChange={(v: any) =>
                        setEditData({ ...editData, limitations: v })
                      }
                    />
                    <Field
                      label="Focus"
                      value={editData.focus}
                      editMode={editMode}
                      onChange={(v: any) =>
                        setEditData({ ...editData, focus: v })
                      }
                    />
                    <Field
                      label="Injury Date"
                      value={editData.injuryDate}
                      editMode={editMode}
                      onChange={(v: any) =>
                        setEditData({ ...editData, injuryDate: v })
                      }
                    />
                  </>
                )}

                <Field
                  label="Allergies"
                  value={editData.allergies}
                  editMode={editMode}
                  onChange={(v: any) =>
                    setEditData({ ...editData, allergies: v })
                  }
                />
              </>
            )}

            {/* GROUPS */}
            {activeTab === "groups" && (
              <>
                {groups.map((g) => (
                  <div key={g.id} className="group-row">
                    <span>{g.name}</span>

                    <button onClick={() => handleRemoveFromGroup(g.id)}>
                      ✕
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* CENTER */}

      <div className="center">
        <div className="card">
          <h3>Stats</h3>
          {/* <div className="stats-grid">
            <div>Attendance</div>
            <div style={{
              color:
                attendance>80?"green":
                attendance>60?"orange":"red"
            }}>
              {attendance}%
            </div>

            <div>Trainings</div>
            <div>{total}</div>
          </div> */}
          <div className="stats-compact">
            {/* KPI */}
            <div className="stats-kpis">
              <div className="kpi">
                <span>Load</span>
                <b>{weeklyLoad}</b>
              </div>

              <div className="kpi">
                <span>ACWR</span>
                <b>{acwr}</b>
              </div>

              <div className="kpi">
                <span>Streak</span>
                <b>{streak}</b>
              </div>

              <div className="kpi">
                <span>Missed</span>
                <b>{missed}</b>
              </div>
            </div>

            {/* MINI GRAPH + TREND */}
            <div className="stats-bottom">
              <div className="mini-chart">
                <StatsChart data={[20, 45, 60, 30, 80, 0, 50]} />
              </div>

              <div className="stats-side">
                <div className="trend">
                  {loadChange > 0 ? `↑ ${loadChange}%` : `${loadChange}%`}
                </div>

                <div className="last">
                  {lastTrainingDaysAgo === null
                    ? "-"
                    : `${lastTrainingDaysAgo}d`}
                </div>
              </div>
            </div>

            {/* 🔥 INSIGHT אחד בלבד */}
            <div className="insight-line">{insights[0]}</div>
          </div>{" "}
        </div>

        <div className="card">
          <div className="zones-header" ref={dropdownRef}>
            <div
              className="zones-title"
              onClick={() => setOpenDropdown((prev) => !prev)}
            >
              <h3>
                {sport === "run" && "Running Zones"}
                {sport === "bike" && "Cycling Zones"}
                {sport === "swim" && "Swimming Zones"}
                {sport === "gym" && "Gym Zones"}
              </h3>

              <span className={`arrow ${openDropdown ? "open" : ""}`}>▼</span>
            </div>

            {openDropdown && (
              <div className="zones-dropdown">
                <div
                  onClick={() => {
                    setSport("run");
                    setOpenDropdown(false);
                  }}
                >
                  🏃 Running
                </div>
                <div
                  onClick={() => {
                    setSport("bike");
                    setOpenDropdown(false);
                  }}
                >
                  🚴 Cycling
                </div>
                <div
                  onClick={() => {
                    setSport("swim");
                    setOpenDropdown(false);
                  }}
                >
                  🏊 Swimming
                </div>
                <div
                  onClick={() => {
                    setSport("gym");
                    setOpenDropdown(false);
                  }}
                >
                  🏋️ Gym
                </div>
              </div>
            )}
          </div>

          <ZonesTable zones={athlete.zones} sport={sport} />
        </div>
      </div>

      {/* RIGHT נשאר ללא שינוי */}

      <div className="right">
        <div className="card">
          <div className="header-row">
            <h3>Tests</h3>
            <button onClick={() => setShowTestModal(true)}>+</button>
          </div>

          <div className="pb-section">
            <h4>Personal Bests</h4>

            {[...new Set((athlete.tests || []).map((t) => t.type))].map(
              (type) => {
                const tests =
                  athlete.tests?.filter((t) => t.type === type) || [];

                if (!tests.length) return null;

                const sport = tests[0].sport;

                const pb =
                  sport === "bike"
                    ? Math.max(...tests.map((t) => t.value))
                    : Math.min(...tests.map((t) => t.value));

                return (
                  <div key={type}>
                    <div
                      className="pb-row clickable"
                      onClick={() =>
                        setSelectedPB(selectedPB === type ? null : type)
                      }
                    >
                      <span>
                        {sportIcon(sport)} {type.toUpperCase()}
                      </span>

                      <b>{sport === "bike" ? `${pb}w` : secondsToTime(pb)}</b>
                    </div>

                    {selectedPB === type && (
                      <ProgressChart tests={tests} sport={sport} />
                    )}
                  </div>
                );
              },
            )}
          </div>
        </div>

        <div className="card goals">
          <div className="header-row">
            <h3>Goals</h3>
            <button onClick={() => setShowGoalModal(true)}>+</button>
          </div>
 

          {(athlete.goals || []).length === 0 && <div>No goals yet</div>}

          {(athlete.goals || []).map((g) => {
            const daysLeft = getDaysLeft(g.date);
            const status = getGoalStatus(g);
            const progress = getPBProgress(g, athlete.tests);
            const type = getGoalBtnType(g);
            return (
              <div key={g.id} className={`goal-row ${status}`}>
                <div className="goal-main">
                  <div className="goal-title">{g.title}</div>

                  {g.type === "race" && (
                    <div className="goal-sub">
                      {g.raceName} • {g.location}
                    </div>
                  )}

                  {/* 🎯 יעד */}
                  {g.target && <div className="goal-target">🎯 {g.target}</div>}

                  {/* ⏳ countdown */}
                  {daysLeft !== null && (
                    <div className="goal-countdown">
                      ⏳ {daysLeft > 0 ? `${daysLeft} days` : "Race passed"}
                    </div>
                  )}

                  {/* 📊 progress */}
                  {g.date && (
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}

                  {g.date && isOneWeekAway(g.date) && (
                    <div className="goal-alert">
                      🔔 Race in less than a week!
                    </div>
                  )}

                  {g.plan && <span className="tag">📝 Plan</span>}
                  {g.review && <span className="tag">📊 Review</span>}
                </div>

                {g.date && (
                  <button
                    className={`goal-action-btn ${type}`}
                    onClick={() => openGoalModal(g)}
                  >
                    {type === "plan" && "🧠 Plan"}
                    {type === "review" && "📊 Review"}
                  </button>
                )}
              </div>
            );
          })}


        </div>
        <button
          className="calendar-btn"
          onClick={() => navigate(`/schedule/athlete/${athlete.id}`)}
        >
          Open Calendar
        </button>

        <button className="icon-btn danger" onClick={handleDelete}>
          🗑️
        </button>
      </div>         {showGoalModal && (
            <AddGoalModal
              onClose={() => setShowGoalModal(false)}
              onAdd={(goal) => {
                addGoal(goal);
                setShowGoalModal(false);
              }}
            />
          )}
                {activeGoal && goalMode && (
            <GoalActionModal
              goal={activeGoal}
              mode={goalMode}
              onClose={() => {
                setActiveGoal(null);
                setGoalMode(null);
              }}
              onSave={saveGoalAction}
            />
          )}

      {showTestModal && (
        <AddTestModal
          onClose={() => setShowTestModal(false)}
          onAdd={(test) => {
            addTest(test);
            setShowTestModal(false);
          }}
        />
      )}
    </div>
  );
}
