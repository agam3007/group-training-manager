import { useState } from "react";
import type { MacroEvent } from "@/shared/types/periodization";
import "./Step2EventsAndRulesModal.css";

const LOADING_PATTERNS = ["1:1", "2:1", "3:1", "4:1", "5:1"];
const PERIODIZATION_MODELS = ["Linear", "Block", "Undulating"];

interface Props {
  program: Partial<any>;
  onBack: () => void;
  onNext: (data: {
    events: MacroEvent[];
    loadingPattern: string;
    periodizationModel: string;
  }) => void;
}

export default function Step2EventsAndRulesModal({
  program,
  onBack,
  onNext,
}: Props) {
  const [events, setEvents] = useState<MacroEvent[]>(program.events || []);
  const [loadingPattern, setLoadingPattern] = useState(program.loadingPattern || "3:1");
  const [periodizationModel, setPeriodizationModel] = useState(program.periodizationModel || "Linear");

  const isWeeks = program.durationType === "weeks";

  const [newEvent, setNewEvent] = useState<Partial<MacroEvent>>({
    type: "A-Race",
    name: "",
    date: program.startDate || "",
    endDate: program.startDate || "",
    location: "",
    notes: "",
  });

  // State עבור משך זמן מבוסס שבועות
  const [eventWeek, setEventWeek] = useState<number>(1);
  const [eventDay, setEventDay] = useState<number>(7); // ברירת מחדל: יום שבת/ראשון
  const [endWeek, setEndWeek] = useState<number>(1);
  const [endDay, setEndDay] = useState<number>(7);

  const getSortValue = (str: string) => {
    if (!str) return 0;
    // אם זה מחרוזת של שבוע/יום, נחשב לה ציון (לדוגמה שבוע 4 יום 2 יקבל ציון 42)
    if (str.startsWith("Week")) {
      const match = str.match(/Week (\d+), Day (\d+)/);
      if (match) return parseInt(match[1]) * 10 + parseInt(match[2]);
    }
    // אחרת, זה תאריך רגיל
    const date = new Date(str);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  };

  const addEvent = () => {
    // הרכבת ערך התאריך הנכון בהתאם לסוג משך הזמן של התוכנית
    const dateVal = isWeeks ? `Week ${eventWeek}, Day ${eventDay}` : newEvent.date;
    const endDateVal = isWeeks 
      ? `Week ${endWeek}, Day ${endDay}` 
      : newEvent.endDate;

    if (!newEvent.name || !dateVal) return;

    const event: MacroEvent = {
      id: Date.now().toString(),
      type: newEvent.type as MacroEvent["type"],
      name: newEvent.name,
      date: dateVal,
      endDate: newEvent.type === "Training Camp" ? endDateVal : dateVal,
      location: newEvent.location || "",
      notes: newEvent.notes || "",
    };

    const nextEvents = [...events, event].sort(
      (a, b) => getSortValue(a.date) - getSortValue(b.date)
    );
    
    setEvents(nextEvents);
    
    // איפוס הטופס
    setNewEvent({
      type: "A-Race",
      name: "",
      date: program.startDate || "",
      endDate: program.startDate || "",
      location: "",
      notes: "",
    });
    setEventWeek(1);
    setEventDay(7);
    setEndWeek(1);
    setEndDay(7);
  };

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleNext = () => {
    onNext({
      events,
      loadingPattern,
      periodizationModel,
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    // אם התאריך הוא פורמט שבועות (Week X, Day Y), נחזיר אותו כמו שהוא
    if (dateStr.startsWith("Week")) return dateStr;
    
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getBadgeClass = (type: string) => {
    switch (type) {
      case "A-Race": return "a-race";
      case "B-Race": return "b-race";
      case "C-Race": return "c-race";
      case "Training Camp": return "camp";
      case "Test": return "b-race"; // משתמש בצבע של B-Race כברירת מחדל לטסט
      default: return "";
    }
  };

  return (
    <div className="step2-modal-backdrop">
      <div className="step2-modal-container">
        <div className="step2-modal-header">
          <h2>Step 2: Events & Periodization</h2>
          <p>Define your key race/camp dates and training strategy</p>
        </div>

        <div className="step2-modal-content">
          {/* Events Section */}
          <div className="step2-section">
            <h3>Key Events</h3>
            <p className="section-desc">Add races, tests, and training camps throughout your program</p>

            <div className="events-form-grid">
              <label>
                Event Type
                <select
                  value={newEvent.type || "A-Race"}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, type: e.target.value as MacroEvent["type"] })
                  }
                >
                  <option value="A-Race">A-Race</option>
                  <option value="B-Race">B-Race</option>
                  <option value="C-Race">C-Race</option>
                  <option value="Test">Test (Assessment)</option>
                  <option value="Training Camp">Training Camp</option>
                </select>
              </label>

              <label>
                Name
                <input
                  type="text"
                  value={newEvent.name || ""}
                  onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                  placeholder="e.g., FTP Test / Ironman"
                />
              </label>

              {/* Start Date / Timing */}
              {isWeeks ? (
                <label>
                  {newEvent.type === "Training Camp" ? "Start Timing" : "Timing"}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      min={1}
                      max={program.weeks || 52}
                      value={eventWeek}
                      onChange={(e) => setEventWeek(Number(e.target.value))}
                      placeholder="Week"
                      style={{ width: '50%' }}
                    />
                    <select 
                      value={eventDay} 
                      onChange={(e) => setEventDay(Number(e.target.value))} 
                      style={{ width: '50%' }}
                    >
                      <option value={1}>Day 1</option>
                      <option value={2}>Day 2</option>
                      <option value={3}>Day 3</option>
                      <option value={4}>Day 4</option>
                      <option value={5}>Day 5</option>
                      <option value={6}>Day 6</option>
                      <option value={7}>Day 7</option>
                    </select>
                  </div>
                </label>
              ) : (
                <label>
                  {newEvent.type === "Training Camp" ? "Start Date" : "Date"}
                  <input
                    type="date"
                    value={newEvent.date || ""}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  />
                </label>
              )}

              {/* End Date / Timing (Only for Camps) */}
              {newEvent.type === "Training Camp" && (
                isWeeks ? (
                  <label>
                    End Timing
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        min={eventWeek}
                        max={program.weeks || 52}
                        value={endWeek}
                        onChange={(e) => setEndWeek(Number(e.target.value))}
                        placeholder="Week"
                        style={{ width: '50%' }}
                      />
                      <select 
                        value={endDay} 
                        onChange={(e) => setEndDay(Number(e.target.value))} 
                        style={{ width: '50%' }}
                      >
                        <option value={1}>Day 1</option>
                        <option value={2}>Day 2</option>
                        <option value={3}>Day 3</option>
                        <option value={4}>Day 4</option>
                        <option value={5}>Day 5</option>
                        <option value={6}>Day 6</option>
                        <option value={7}>Day 7</option>
                      </select>
                    </div>
                  </label>
                ) : (
                  <label>
                    End Date
                    <input
                      type="date"
                      value={newEvent.endDate || newEvent.date}
                      min={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                    />
                  </label>
                )
              )}

              <label>
                Location
                <input
                  type="text"
                  value={newEvent.location || ""}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="City or region"
                />
              </label>

              <label className="full-width">
                Notes
                <textarea
                  value={newEvent.notes || ""}
                  onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                  placeholder="Optional details"
                  rows={2}
                />
              </label>

              <button className="add-event-btn" onClick={addEvent}>
                + Add Event
              </button>
            </div>

            {events.length > 0 && (
              <div className="events-list">
                {events.map((event) => (
                  <div key={event.id} className="event-item">
                    <div className="event-item-header">
                      <span className={`event-badge ${getBadgeClass(event.type)}`}>
                        {event.type}
                      </span>
                      <strong>{event.name}</strong>
                      <span className="event-date">
                        {formatDate(event.date)}
                        {event.type === "Training Camp" && event.endDate && event.endDate !== event.date 
                          ? ` - ${formatDate(event.endDate)}` 
                          : ""}
                      </span>
                    </div>
                    {event.location && <div className="event-location">{event.location}</div>}
                    {event.notes && <div className="event-notes">{event.notes}</div>}
                    <button
                      className="event-remove-btn"
                      onClick={() => removeEvent(event.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Periodization Strategy Section */}
          <div className="step2-section">
            <h3>Periodization Strategy</h3>
            <p className="section-desc">
              These parameters will auto-generate your training phases
            </p>

            <div className="strategy-grid">
              <label>
                Loading Pattern
                <select
                  value={loadingPattern}
                  onChange={(e) => setLoadingPattern(e.target.value)}
                >
                  {LOADING_PATTERNS.map((pattern) => (
                    <option key={pattern} value={pattern}>
                      {pattern} (Work:Recovery)
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Periodization Model
                <select
                  value={periodizationModel}
                  onChange={(e) => setPeriodizationModel(e.target.value)}
                >
                  {PERIODIZATION_MODELS.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="strategy-info">
              <strong>Model Description:</strong>
              <p>
                {periodizationModel === "Linear" &&
                  "Linear periodization gradually increases intensity while decreasing volume. Ideal for single main event focus."}
                {periodizationModel === "Block" &&
                  "Block periodization organizes training into distinct mesocycles with specific focuses. Good for multiple competition waves."}
                {periodizationModel === "Undulating" &&
                  "Undulating periodization varies intensity and volume within the week. Balances adaptation and freshness."}
              </p>
            </div>
          </div>
        </div>

        <div className="step2-modal-footer">
          <button className="btn-secondary" onClick={onBack}>
            ← Back
          </button>
          <span className="step-indicator">Step 2 of 3</span>
          <button className="btn-primary" onClick={handleNext}>
            Next: Review Timeline →
          </button>
        </div>
      </div>
    </div>
  );
}