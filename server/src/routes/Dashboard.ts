import { Router } from "express";
import { getUnifiedDashboard } from "../services/dashboardService";
import { logger } from "../utils/logger";

const router = Router();

// =========================
// GET dashboard data for today
// =========================
router.get("/today", async (req, res) => {
  try {
    logger.info("GET /dashboard/today");
    const today = new Date();

    const dashboardData = await getUnifiedDashboard(today);
    res.json(dashboardData);
  } catch (err) {
    logger.error("Failed to fetch dashboard data:" + err);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

// =========================
// GET dashboard data for specific date
// =========================
router.get("/:date", async (req, res) => {
  try {
    const { date } = req.params;
    logger.info(`GET /dashboard/${date}`);
    
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }
    
    const dashboardData = await getUnifiedDashboard(targetDate);
    res.json(dashboardData);
  } catch (err) {
    logger.error("Failed to fetch dashboard data:" + err);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

export default router;
