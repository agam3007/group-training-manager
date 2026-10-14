/**
 * F0.4 — Translation dictionary.
 * Flat keys, two languages. When a feature adds strings, they go here.
 * TypeScript will catch missing keys once we add a type for the `en` keys.
 */

export type Lang = "he" | "en";

export const translations: Record<Lang, Record<string, string>> = {
  en: {
    // Login
    "login.title": "Group Training Manager",
    "login.email": "Email",
    "login.password": "Password",
    "login.submit": "Sign In",
    "login.signingIn": "Signing in…",
    "login.invalid": "Invalid login credentials",

    // Sidebar
    "nav.dashboard": "Dashboard",
    "nav.schedule": "Schedule",
    "nav.groups": "Groups",
    "nav.athletes": "Athletes",
    "nav.trainingPlans": "Training Plans",
    "nav.admin": "Platform Admin",
    "nav.signOut": "Sign out",

    // Dashboard
    "dash.todaySchedule": "Today's Schedule",
    "dash.atRisk": "At-Risk Athletes",
    "dash.noAthletesAtRisk": "No athletes at risk",
    "dash.stats.athletes": "Athletes",
    "dash.stats.groups": "Groups",
    "dash.stats.trainingsToday": "Trainings today",
    "dash.stats.atRisk": "At risk",

    // Header
    "header.selectTenant": "Select tenant",

    // Common
    "common.loading": "Loading…",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.add": "Add",
    "common.search": "Search…",
  },

  he: {
    // Login
    "login.title": "מנהל אימונים קבוצתי",
    "login.email": "אימייל",
    "login.password": "סיסמה",
    "login.submit": "התחברות",
    "login.signingIn": "מתחבר…",
    "login.invalid": "אימייל או סיסמה שגויים",

    // Sidebar
    "nav.dashboard": "לוח בקרה",
    "nav.schedule": "לוח שבועי",
    "nav.groups": "קבוצות",
    "nav.athletes": "ספורטאים",
    "nav.trainingPlans": "תוכניות אימון",
    "nav.admin": "ניהול מערכת",
    "nav.signOut": "התנתקות",

    // Dashboard
    "dash.todaySchedule": "לוז היום",
    "dash.atRisk": "ספורטאים בסיכון",
    "dash.noAthletesAtRisk": "אין ספורטאים בסיכון",
    "dash.stats.athletes": "ספורטאים",
    "dash.stats.groups": "קבוצות",
    "dash.stats.trainingsToday": "אימונים היום",
    "dash.stats.atRisk": "בסיכון",

    // Header
    "header.selectTenant": "בחר מועדון",

    // Common
    "common.loading": "טוען…",
    "common.cancel": "ביטול",
    "common.save": "שמירה",
    "common.delete": "מחיקה",
    "common.edit": "עריכה",
    "common.add": "הוספה",
    "common.search": "חיפוש…",
  },
};