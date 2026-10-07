import { useEffect, useState } from "react";
import type { Athlete } from "@/shared/types/athlete";
import type { Group } from "@/shared/types/group";
import type { Program } from "@/shared/types/periodization";
import { getAthletes } from "@/api/athlete";
import { getGroups } from "@/api/group";
import "./ProgramSetupModal.css";

const defaultData: Partial<Program> = {
  assigneeType: "Group",
  sport: "Triathlon",
  level: "Beginner",
};

export default function ProgramSetupModal({
  initial,
  onClose,
  onSave,
  isStep,
}: {
  initial?: Partial<Program> | null;
  onClose: () => void;
  onSave: (data: Program) => void;
  isStep?: boolean;
}) {
  const [form, setForm] = useState<Partial<Program>>(initial || defaultData);
  const [groups, setGroups] = useState<Group[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);

  // ניהול סוג משך הזמן (תאריכים קבועים או מספר שבועות)
  const [durationType, setDurationType] = useState<'dates' | 'weeks'>('dates');
  const [weeks, setWeeks] = useState<number>(12);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [groupsData, athletesData] = await Promise.all([getGroups(), getAthletes()]);
        setGroups(groupsData);
        setAthletes(athletesData);
      } catch (error) {
        // Silently fail and use input fallback
        console.error("Unable to load groups and athletes");
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, []);

  const handleChange = (field: keyof Program, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAssigneeTypeChange = (value: "Group" | "Individual") => {
    setForm((prev) => ({ ...prev, assigneeType: value, assigneeName: "" }));
  };

  const handleDurationTypeChange = (type: 'dates' | 'weeks') => {
    setDurationType(type);
    if (type === 'weeks') {
      // נאפס תאריכים אם עוברים לתצוגת שבועות
      handleChange("startDate", "");
      handleChange("endDate", "");
      // אפשר גם לאפס את השיוך כי זה כנראה טמפלייט
      handleChange("assigneeName", ""); 
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // וולידציה בסיסית - שם התוכנית תמיד חובה
    if (!form.name) return;
    
    // שיוך (ספורטאי/קבוצה) הוא חובה רק אם מדובר בתאריכים ספציפיים
    if (durationType === 'dates' && !form.assigneeName) return;
    
    // בדיקת חוקיות תאריכים או שבועות
    if (durationType === 'dates' && (!form.startDate || !form.endDate)) return;
    if (durationType === 'weeks' && (!weeks || weeks <= 0)) return;

    // בניית האובייקט שיישלח הלאה
    const payload = {
      ...form,
      durationType,
      weeks: durationType === 'weeks' ? weeks : undefined,
    };

    onSave(payload as Program);
  };

  const assigneeOptions = form.assigneeType === "Individual" ? athletes : groups;
  const assigneeLabel = form.assigneeType === "Individual" ? "Athlete" : "Group";

  return (
    <div className={`modal-backdrop ${isStep ? "step-modal-backdrop" : ""}`} onClick={isStep ? undefined : onClose}>
      <div className={`modal ${isStep ? "step-modal" : ""}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {isStep ? "Step 1: Basic Setup" : "New Program Setup"}
          </h2>
          {isStep && <p className="modal-step-desc">Configure your program's core details</p>}
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <label>Program Name</label>
            <input value={form.name || ""} onChange={e => handleChange("name", e.target.value)} required />
          </div>
          
          <div className="form-row form-radio-row">
            <label>Assignee Type</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  checked={form.assigneeType === "Group"}
                  onChange={() => handleAssigneeTypeChange("Group")}
                />
                Group
              </label>
              <label>
                <input
                  type="radio"
                  checked={form.assigneeType === "Individual"}
                  onChange={() => handleAssigneeTypeChange("Individual")}
                />
                Athlete
              </label>
            </div>
          </div>

          <div className="form-row">
            <label>
              {assigneeLabel}
              {/* מציג למשתמש שזה אופציונלי אם בחר בשבועות */}
              {durationType === 'weeks' && (
                <span style={{ fontWeight: 'normal', color: '#64748b', marginLeft: '6px' }}>(Optional - Template)</span>
              )}
            </label>
            {loading ? (
              <div className="loading-text">Loading {assigneeLabel.toLowerCase()}s...</div>
            ) : assigneeOptions.length > 0 ? (
              <select
                value={form.assigneeName || ""}
                onChange={e => handleChange("assigneeName", e.target.value)}
                required={durationType === 'dates'} // חובה רק אם זה תאריכים
              >
                <option value="">Select {assigneeLabel}</option>
                {assigneeOptions.map(option => (
                  <option key={option.id} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={form.assigneeName || ""}
                onChange={e => handleChange("assigneeName", e.target.value)}
                placeholder={`Enter ${assigneeLabel.toLowerCase()} name`}
                required={durationType === 'dates'} // חובה רק אם זה תאריכים
              />
            )}
          </div>

          {/* מקטע הגדרת הזמן החדש: תאריכים או שבועות */}
          <div className="form-row">
            <label>Duration Method</label>
            <div className="radio-group" style={{ display: 'flex', gap: '15px', marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                <input type="radio" checked={durationType === 'dates'} onChange={() => handleDurationTypeChange('dates')} /> 
                Specific Dates
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                <input type="radio" checked={durationType === 'weeks'} onChange={() => handleDurationTypeChange('weeks')} /> 
                Number of Weeks
              </label>
            </div>

            {durationType === 'dates' ? (
              <div className="date-row">
                <div className="form-row small" style={{ marginBottom: 0 }}>
                  <label>Start Date</label>
                  <input type="date" value={form.startDate || ""} onChange={e => handleChange("startDate", e.target.value)} required />
                </div>
                <div className="form-row small" style={{ marginBottom: 0 }}>
                  <label>End Date</label>
                  <input type="date" value={form.endDate || ""} onChange={e => handleChange("endDate", e.target.value)} required />
                </div>
              </div>
            ) : (
              <div className="form-row" style={{ marginBottom: 0 }}>
                <label>Total Weeks</label>
                <input 
                  type="number" 
                  min="1" 
                  value={weeks} 
                  onChange={e => setWeeks(Number(e.target.value))} 
                  required 
                />
              </div>
            )}
          </div>

          <div className="form-row">
            <label>Sport Type</label>
            <select value={form.sport} onChange={e => handleChange("sport", e.target.value)}>
              <option>Triathlon</option>
              <option>Swimming</option>
              <option>Running</option>
              <option>Cycling</option>
            </select>
          </div>

          <div className="form-row">
            <label>Main Goal</label>
            <input value={form.mainGoal || ""} onChange={e => handleChange("mainGoal", e.target.value)} />
          </div>

          <div className="form-row">
            <label>Level</label>
            <select value={form.level} onChange={e => handleChange("level", e.target.value)}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Elite</option>
            </select>
          </div>

          <div className={`modal-actions ${isStep ? "step-modal-actions" : ""}`}>
            <button type="button" onClick={onClose} className={isStep ? "btn-secondary" : ""}>
              {isStep ? "Cancel" : "Cancel"}
            </button>
            {isStep && <span className="step-indicator">Step 1 of 3</span>}
            <button type="submit" className={`save-btn ${isStep ? "btn-primary" : ""}`}>
              {isStep ? "Next: Events & Rules →" : "Save & Next"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}