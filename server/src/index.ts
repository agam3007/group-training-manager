import express from "express";
import cors from "cors";

import groupRoutes from "./routes/Groups";
import athleteRoutes from "./routes/Athlete";
import trainingRoutes from "./routes/Trainings";
import programRoutes from "./routes/Programs";
import planRoutes from "./routes/Plans";
import blockRoutes from "./routes/Blocks";
import eventRoutes from "./routes/CalendarEvent";
import athleteGroupRoutes from "./routes/AthleteGroup";
import trainingAssignmentRoutes from "./routes/TrainingAssginment";
import dashboardRoutes from "./routes/Dashboard";
import attendanceRoutes from "./routes/Attendance";
import notesRoutes from "./routes/Notes";
import programTemplateRoutes from "./routes/ProgramTemplates";
import mesoBlockRoutes from "./routes/MesoBlocks";
import plannedWeekRoutes from "./routes/PlannedWeeks";
import scheduledWorkoutRoutes from "./routes/ScheduledWorkouts";
import folderRoutes from "./routes/Folders";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/groups", groupRoutes);
app.use("/athletes", athleteRoutes);
app.use("/trainings", trainingRoutes);
app.use("/programs", programRoutes);
app.use("/program-templates", programTemplateRoutes);
app.use("/meso-blocks", mesoBlockRoutes);
app.use("/planned-weeks", plannedWeekRoutes);
app.use("/scheduled-workouts", scheduledWorkoutRoutes);
app.use("/plans", planRoutes);
app.use("/blocks", blockRoutes);
app.use("/events", eventRoutes);
app.use("/athlete-groups", athleteGroupRoutes);
app.use("/training-assignments", trainingAssignmentRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/notes", notesRoutes);
app.use("/folders", folderRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
