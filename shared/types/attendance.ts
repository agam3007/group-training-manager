export type AttendanceStatus = "ATTENDED" | "MISSED";

export interface Attendance {
  id: string;
  eventId: string;
  athleteId: string;
  status: AttendanceStatus;
  note?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceRecord {
  athleteId: string;
  status: AttendanceStatus;
  note?: string;
  isVerified?: boolean;
}

export interface AthleteCompliance {
  athleteId: string;
  athleteName: string;
  sessionsAssigned: number;
  sessionsAttended: number;
  compliancePercentage: number;
  lastSevenDays: {
    attended: number;
    missed: number;
    sick: number;
    injured: number;
  };
}
