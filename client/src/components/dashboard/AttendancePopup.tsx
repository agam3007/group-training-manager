import { useState, useEffect } from "react";
import type { Athlete } from "@/shared/types";
import type { AttendanceStatus, AttendanceRecord } from "@/shared/types";
import { NotesPanel } from "@/components/shared";
import "./AttendancePopup.css";

interface AthleteAttendanceData {
  athleteId: string;
  athleteName: string;
  status: AttendanceStatus;
  note: string;
}

interface Props {
  groupId: string;
  athletes: Athlete[];
  eventDate: Date;
  onClose: (records: (AttendanceRecord & { athleteId: string })[]) => void;
}

export default function AttendanceModal({
  groupId,
  athletes,
  eventDate,
  onClose,
}: Props) {
  const [attendanceData, setAttendanceData] = useState<AthleteAttendanceData[]>([]);
  const [selectAll, setSelectAll] = useState(true);

  useEffect(() => {
    // Initialize all athletes as ATTENDED
    const initialData = athletes.map((athlete) => ({
      athleteId: athlete.id,
      athleteName: athlete.name,
      status: "ATTENDED" as AttendanceStatus,
      note: "",
    }));
    setAttendanceData(initialData);
  }, [athletes]);

  const handleStatusChange = (athleteId: string, status: AttendanceStatus) => {
    setAttendanceData((prev) =>
      prev.map((item) =>
        item.athleteId === athleteId ? { ...item, status } : item
      )
    );
  };

  const handleNoteChange = (athleteId: string, note: string) => {
    setAttendanceData((prev) =>
      prev.map((item) =>
        item.athleteId === athleteId ? { ...item, note } : item
      )
    );
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    const newStatus: AttendanceStatus = newSelectAll ? "ATTENDED" : "MISSED";
    setAttendanceData((prev) =>
      prev.map((item) => ({ ...item, status: newStatus }))
    );
  };

  const handleQuickMark = (status: AttendanceStatus) => {
    setAttendanceData((prev) =>
      prev.map((item) => ({ ...item, status }))
    );
  };

  const handleClose = () => {
    const records = attendanceData.map((item) => ({
      athleteId: item.athleteId,
      status: item.status,
      note: item.note,
      isVerified: true,
    }));
    onClose(records);
  };

  const getStatusColor = (status: AttendanceStatus): string => {
    switch (status) {
      case "ATTENDED":
        return "#22c55e";
      case "MISSED":
        return "#ef4444";
    }
  };

  return (
    <div className="attendance-overlay">
      <div className="attendance-modal">
        <div className="attendance-header">
          <h3>Group Attendance & Insights</h3>
          <button className="close-btn" onClick={handleClose}>
            ✕
          </button>
        </div>

        {/* Group Context Notes */}
        <div className="quick-insights">
          <h4>Insights</h4>
          <NotesPanel
            targetType="GROUP"
            targetId={groupId}
            maxNotes={2}
          />
        </div>

        {/* Quick Actions */}
        <div className="attendance-quick-actions">
          <button
            className="select-all-btn"
            onClick={handleSelectAll}
          >
            {selectAll ? "✓ All Attended" : "✗ All Missed"}
          </button>
          <button
            className="quick-btn attended"
            onClick={() => handleQuickMark("ATTENDED")}
            title="Mark all as attended"
          >
            ✓
          </button>
          <button
            className="quick-btn missed"
            onClick={() => handleQuickMark("MISSED")}
            title="Mark all as missed"
          >
            ✗
          </button>
        </div>

        {/* Athlete List */}
        <div className="attendance-list">
          {attendanceData.map((item) => (
            <div key={item.athleteId} className="attendance-row">
              <div className="athlete-info">
                <span className="athlete-name">{item.athleteName}</span>
              </div>

              <div className="status-buttons">
              <button
  className={`status-btn ${item.status === "ATTENDED" ? "active" : ""}`}
  onClick={() => handleStatusChange(item.athleteId, "ATTENDED")}
  title="Attended"
>

                  ✓
                </button>
                <button
                  className={`status-btn ${item.status === "MISSED" ? "active" : ""}`}
                  style={{
                    borderColor:
                      item.status === "MISSED"
                        ? getStatusColor("MISSED")
                        : "#ddd",
                  }}
                  onClick={() => handleStatusChange(item.athleteId, "MISSED")}
                  title="Missed"
                >
                  ✗
                </button>
              </div>

              <NotesPanel
            targetType="ATHLETE"
            targetId={item.athleteId}
            maxNotes={2}
          />
            </div>
          ))}
        </div>

        <div className="attendance-actions">
          <button className="confirm-btn" onClick={handleClose}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

