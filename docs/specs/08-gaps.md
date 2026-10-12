# SPEC 08 — פערים, קוד מת ונקודות לדיון

> איפיון מצב קיים (AS-IS) · מסמך ראשי: [../SPEC.md](../SPEC.md)
>
> מסמך זה הוא **רשימת העבודה לקראת האיפיון הרצוי (TO-BE)** — כל מה שנמצא בקוד ואינו עובד, מדומה, כפול או לא עקבי, ממוין לפי חומרה. רבים מהפערים של הגרסה הקודמת **תוקנו בשכתוב** (אימונים נשמרים, נוכחות אמיתית, קבוצות מנוהלות, Analytics אמיתי, טיפוסים משותפים) — ולצידם נולדו פערים חדשים.

## 0. מה תוקן מאז התיעוד הקודם (סטטוס)

| פער ישן | מצב כיום |
|---|---|
| שתי ישויות Training שונות | ✅ טיפוס משותף אחד; תזמון עבר ל-TrainingAssignment |
| אימוני לוח לא נשמרים (זיכרון בלבד) | ✅ נשמרים דרך events/assignments |
| אין ישות נוכחות | ✅ Attendance + ציות + רשימת סיכון |
| קשר Group↔Athlete שמות לא-מסונכרן | ✅ טבלת צירוף athleteGroups עם מזהים |
| ניהול קבוצות לא מחובר | ✅ יצירה + עמוד פרטים מלא + ניהול חברים |
| Analytics מדומה בפרטי ספורטאי | ✅ מחושב משיוכים אמיתיים (נותרו שאריות, להלן) |
| התראות/צ'ק-אין מדומים בדאשבורד | ✅ נתונים אמיתיים מהשרת (Alerts המדומה נמחק) |
| TodayTimeline מציג הכול | ✅ השרת מסנן ליום |
| כפילות ניתוב ב-App | ✅ נוקתה |
| יום ראשון לא מודגש בלוח | ✅ התצוגה תוקנה (נולד באג חדש בשליפה — 4.5) |
| Open Calendar לנתיב לא קיים (ספורטאי) | ✅ עבר ל-/schedule/athlete/:id (נולד כפיל בקבוצות — 4.14) |
| ניתוב כפול, AthleteFormPage, GroupPopup, AthletePopup, SearchBar, TrainingBuilder, groupToTrainings | ✅ נמחקו כליל |

## 1. פערי דגם-נתונים

| # | פער | השלכה |
|---|---|---|
| 1.1 | **`Athlete.zones` מוקלד שטוח, בפועל מקושי לפי ענף** (`zones[sport]`) | נסתר ע"י `any`; הטיפוס מטעה |
| 1.2 | שדות מספריים נשמרים כמחרוזות; `injuryDate`, `allergies`, `emergency*`, `Test.method` לא בטיפוסים | נשמרים דרך ה-merge הפרוץ ב-PUT; הטיפוסים אינם אמת |
| 1.3 | **`TrainingTime.day`: מוקלד number, נשמר string** — וצרכניו חלוקים (שרת=0 ראשון, GroupCard=0 שני, דאשבורד=+1 עם עקיפה) | ראה באג 4.2 — סדרי קבוצה לא מופיעים בדאשבורד |
| 1.4 | **מכפילי סטטוס**: TrainingAssignment (6 ערכים) מול Attendance (2) | דליים sick/injured ב-compliance מתים; אין דרך לתעד מחלה בנוכחות |
| 1.5 | **שלושה אוצרות מילים לענף**: periodization ("Running"), training ("run"), מקומי ("gym", "strength") | המרות אד-הוק; "gym" חסר מקור נתונים ("RM zones coming soon") |
| 1.6 | **`MacroEvent.date` / `WeeklyStats.weekStart`** — ההערה אומרת ISO, שבועות שומרים `"Week 16, Day 7"` | פרסור regex בכל צריכה; תוכניות תאריכים שבורות בתצוגה (3.4) |
| 1.7 | **`Attendance.eventId` ארעי** — המזהה של אירוע ממוזג מתחלף בכל fetch | נוכחות לא בת-שאילה לפי אירוע; אין מזהה מופע יציב |
| 1.8 | `assigneeName` של תוכנית = **שם תצוגה**, לא מזהה | שינוי שם קבוצה/ספורטאי מנתק את הקישור |
| 1.9 | **AdminTask: טיפוס + קומפוננטה בלי backend** (הקומפוננטה גם מסומנת כהערה) | להחליט: לבנות או למחוק |
| 1.10 | Legacy וחדש במקביל: כל תוכנית נכתבת גם ל-plans (blocks מוטמעים, מזהי בלוקים "1","2" מתנגשים בין תוכניות) וגם ל-meso-blocks; `ProgramTemplate` — **write-only** | כפילות קבועה; מי מקור האמת? |

## 2. נתונים מדומים / קשיחים (Mock)

| מיקום | מה מדומה |
|---|---|
| GroupDetails — "Group Load" | גרף `[20,40,60,30,80,50,70]` + "Weekly Load: 320" + "ACWR: 1.1" |
| GroupDetails — "Attendance" | "82% / Avg per athlete" |
| AthleteDetails | ערך התחלתי `[20,45,60,30,80,0,50]` לציר היומי (עד לסיום טעינה/בכשל) |
| ProgramCard | פס התקדמות מוקשח 60% (ובכפיל המת — 58%) |
| AdminTodoList | "נתונים" תמיד ריקים — הendpoints לא קיימים בשרת |

## 3. זרימות שבורות / לא עובדות

| # | זרימה | פירוט |
|---|---|---|
| 3.1 | **סדרי קבוצות לא מופיעים בדאשבורד** | `dashboardService`: `trainingTime.day + 1` על string → "11"; גם עם מספרים, התנאי הכפול מתאים לשני ימי-שבוע שונים |
| 3.2 | **ביטול מופע של סדר קבוצה בלוח שקט-נכשל** | למופעים המסונתזים sourceId ייחודי לכל מופע + id ארעי → הענף הלא-נכון; DELETE לא מוצא כלום; האירוע חוזר ב-fetch. כמו כן עריכה/מחיקה/sdone של אירועים סינתטיים → 404 שנבלע |
| 3.3 | **`/schedule/group/:groupId` מתעלם מהפרמטר**; אירועי קבוצה לא מוצגים ביומן הספורטאי | `groups.includes(athleteId)` על מערך אובייקטים — תמיד false |
| 3.4 | **תוכניות מבוססות-תאריכים לא מוצגות בלוח התוכנית** | ה-UI לעולם לא כותב `ScheduledWorkout.date`; אנקור התאריכים שונה בין הוויזארד ללוח; אירועי מקרו עם תאריכים אמיתיים מחוץ לטווח הפסאו |
| 3.5 | **Quick Add Placeholder מאבד את הקלט** | ענף/משך/אזורים שהוזנו לא נשלחים ולא נשמרים; הכרטיס מציג "0m ·" |
| 3.6 | החלפת שבועות בלוח התוכנית לא מסונכרנת | weekNumber מוחלף אך plannedWeekId לא; השורות נטענות לפי סדר הכנסה — התצוגה לא משתנה |
| 3.7 | **מחיקת תוכנית משאירה יתומים** | נמחקים plan+program בלבד; meso-blocks, planned-weeks, scheduled-workouts, templates, החלות — נשארים; הודעת ה-confirm מבטיחה "and all its training blocks" |
| 3.8 | **GroupSchedulePopup שומר override אוטומטית בסגירה** | השוואת HH:MM מקומי מול ISO (UTC) תמיד לא-שווה → סגירה סתם יוצרת דריסה; בלי אימון נבחר הכותרת הופכת "Custom Training" |
| 3.9 | מחווני הדאשבורד המושבתים | AdminTodoList + QuickInsightWidget מסומנים כהערה; גם אם יוחזרו — הם קוראים ל-`/api/...` שלא קיים |
| 3.10 | **"Open Group Calendar"** ב-GroupDetails → `/calendar/group/:id` | נתיב לא קיים — מסך ריק (הנתיב הנכון: `/schedule/group/:groupId`) |
| 3.11 | **מודאל אירוע**: אין בורר תאריך (תמיד היום); מילוי שעה בעריכה שבור (slice(0,10) של ISO לתוך type=time) | לא ניתן לתזמן אירוע ליום אחר; שדה השעה ריק בעריכה |
| 3.12 | LoadCalculator | חלון "שבועי" = 7 ימים מעכשיו (לא השבוע המוצג); ACWR≈4 מבניין הנתונים |
| 3.13 | מחיקת אימון מהספרייה דרך לוח התוכנית | המרת scheduled-workouts ל-snapshot ב-state מקומי בלבד — אחרי רענון מוצגים כ-"Scheduled Workout" גנרי |
| 3.14 | **דריסות override**: upsert לפי sourceId בלבד (מקור חוזר = דריסה אחת בלבד); התאמה לא עקבית בין הלוח (ms מדויק) לדאשבורד (יום בלבד) | מופע שני של אותו מקור לא ניתן לדריסה נפרדת |
| 3.15 | הדאשבורד לא כולל שיוכי אימון בציר הזמן (בניגוד ל-/events/range) + כותרות/מזהים שונים לאותו מושג | שתי "אמיתות" על אותם אירועים |

## 4. באגים

| # | באג | מיקום |
|---|---|---|
| 4.1 | **שמירת Review ביעדים**: המודאל שולח תמיד את אובייקט `data` (צורת plan) — גם במצב review; שדות הביקורת אובדים, ואובייקט plan-shaped נשמר לתוך `g.review`. המודאל גם לא מאתחל מערכים קיימים (שמירה חוזרת מאפסת), `feeling` לא מחובר, CSS לא מיובא | GoalActionModal.tsx:151 + AthleteDetails |
| 4.2 | **נוסחת CSS** `(t400−t200)/2` במצב זמנים (והערת "classic formula" שגויה) / `2·p400−p200` במצב pace — מול הקלאסי `(t400+t200)/6` | AddTestModal |
| 4.3 | **value=0 למבחן במצב קלט Pace** (שדות הזמן לא מרונדרים) | AddTestModal.submit |
| 4.4 | עריכת תא pace ב-ZonesPreview → `Number("m:ss")` = NaN | AddTestModal |
| 4.5 | **ביום ראשון הלוח שולף שבוע קודם** (`-7` מול `-6` בשאר הקצוות) — אירועי היום חסרים | Calendar.tsx:113 |
| 4.6 | קו הזמן הנוכחי: `START_HOUR=5` מול 6 → מוצג שעה מתחת; מחושב פעם אחת ולא מתקתק | CalendarGrid |
| 4.7 | חוסר יישור: עמודת זמן 70px בגוף מול 80px בכותרת — היסט 10px | calendar.css/CalendarGrid.css |
| 4.8 | מבחן bike בלי וואטים נשמר עם `zones: {}`; ריצה עם זמן ריק → אזורי אפס | AddTestModal |
| 4.9 | **נתוני עריכה לא מסונכרנים**: addTest/addGoal/saveGoalAction לא מעדכנים editData — שמירת עריכה פתוחה משחזרת אותם | AthleteDetails |
| 4.10 | מתג הפציעה כותב `injuries: ""` (שקרי) — סימון הפציעה לא מופיע עד הקלדת טקסט | AthleteDetails |
| 4.11 | התקדמות מול יעד: `Number("45:00")`=NaN → 0; שני הענפים מחושבים באותו ביטוי (אין הבחנה כיוונית; PB גרוע נחסם ל-100%) | AthleteDetails.getPBProgress |
| 4.12 | תוויות StatsChart קבועות S,M,T,W,T,F,S ללא קשר לתאריכים בפועל | StatsChart |
| 4.13 | GroupCard: מספר מתאמנים תמיד 0 (let לא-state בתוך async); תוויות ימים שני-ראשון מול עורך ראשון-שבת | GroupCard |
| 4.14 | סדר הקבוצה: דקות מוצגות תמיד ":00"; "+ Add Time" יוצר `{day:"", start:""}` בלי end; day נשמר כ-string | GroupDetails |
| 4.15 | DELETE מחזיר 200 לישות לא-קיימת: athletes, events, events/override | routes |
| 4.16 | `PUT /events/:id` קורס אם `db.events` חסר (findIndex ללא `|| []`) | CalendarEvent.ts |
| 4.17 | `POST /athletes` משמיט email/height/weight וכו' (כרגע רדום — היצירה שולחת ריק); `POST /groups` משמיט color/maxAthletes/goals; `POST /trainings` משמיט folderId/duration | routes |
| 4.18 | **`GET /training-assignments/:id` מחפש לפי groupId במקום id** + מדפיס את כל האוסף ללוג בכל קריאה | TrainingAssginment.ts |
| 4.19 | `isVerified: record.isVerified || true` — תמיד אמת | attendanceService |
| 4.20 | רשימת הסיכון: count מוקשח 2; קורא `injured` בוליאני שאף UI לא כותן (הנתונים ב-`injuries`); 999 ימים למי בלי check-in; תיעוד לא תואם מימוש; compliance מחושב ולא בשימוש; getRedListAthletes נקרא פעמיים לבקשה | attendanceService/dashboardService |
| 4.21 | AthleteCheckIns לא מתרענן מ-props חדשים (useState(initial)) | AthleteCheckIns |
| 4.22 | AttendancePopup: ✕ שומר כמו Confirm (אין ביטול); שדה הערה לא מחובר (תמיד ""); `eventDate` לא בשימוש | AttendancePopup |
| 4.23 | CheckInResolveModal: `noteSummary` לא מחובר (נשלח ""); recentNotes נשלפים ולא מוצגים | CheckInResolveModal |
| 4.24 | תוויות סטטיסטיקות מטעות: "Trainings Today" = כל האירועים; "Calls Pending" = מספר בסיכון; `pendingTasks` מחושב ולא מוצג | Stats + dashboardService |
| 4.25 | ענף מת ב-handleAddEvent לgroupSchedule: משתמש ב-id היחס במקום id הספורטאי + trainingId ריק → היה נדחה 400; לא בר-השגה מה-UI ממילא | Dashboard.tsx |
| 4.26 | גרירת אירוע ספורטאי מנחש id שיוך מ-`sourceId.split("-")[1]` — שגוי ל-UUIDs | Calendar |
| 4.27 | סטטיסטיקות הפופאפ: `formatTime` מקבל דקות ומפרמט כשניות ("0:45" ל-45 דק'); `sets` לא נספר במרחק; `mi` מחולק ב-1000 | TrainingPopup |
| 4.28 | TrainingDetails מציג משך כ-`duration/60` בעוד duration בדקות — סט של 10 דק' מוצג "0 min" | TrainingDetails |
| 4.29 | פריסת חפיפות נאיבית — שרשרת של 3 אירועים יוצרת חפיפה ויזואלית | CalendarGrid |
| 4.30 | וויזארד: 1:1/4:1/5:1 נדרסים בשקט ל-3:1; Transition לא באיחוד MesoPhase; שינוי היקף/מודל מגנרט מחדש ומוחק עריכות (שינוי אירועים לא); אנקור 2024 בוויזארד מול ינואר-השנה בלוח | ProgramSetupWizard/Step3 |
| 4.31 | פרסר: הכותרת "pre-set" לא מזוהה; שורות לפני כל כותרת → warmup; מנגנון השגיאות לא מופעל לעולם (הכול הופך לצעד טקסט) | WorkoutTextParser |
| 4.32 | **`tsc -b` נכשל** (noUnusedLocals): ייבואי SideBar (TrainingPlan/Kanban), NOTES_API+Note ב-attendance.ts, setTrainings ב-Dashboard | client |
| 4.33 | **סדר ה-alias ב-vite.config** (`"@"` לפני `"@/shared"`) — פצצה רדומה: נכון לעכשיו כי כל ייבואי ה-shared בלקוח הם `import type` (נמחקים לפני הרזולוציה); ייבוא ערך ראשון ישבור dev/build | vite.config.ts |
| 4.34 | ייבואי CSS בשגיאת רישיות (Sidebar.css, Calendar.css, ProgramCard.css, ./groupCard) — Windows בלבד | לקוח |
| 4.35 | **מחיקות בלי cascade**: ספורטאי (יחסים/הערות/שיוכים/נוכחות יתומים), קבוצה (יחסים/שיוכים), תוכנית (הכול) — בעוד Training ו-Folder כן מנקים (אי-עקביות) | routes |
| 4.36 | `POST /programs` מבצע spread אחרי ה-id (id שנשלח מנצח); PUTים במספר routes לא מאכפים id | Programs.ts ועוד |
| 4.37 | אין שליטה במשך אימון מהפופאפ/הלוח (קבוע duration??60) | TrainingPopup/Calendar |
| 4.38 | N+1 בפריסה: ספורטאי קבוצה (יחס+getAthlete לכל אחד), סינון הלוח לפי ספורטאי, טעינת אימונים לשיוכים | Dashboard/Schedule/AthleteDetails |

## 5. קוד מת / לא בשימוש

| פריט | סוג | הערות |
|---|---|---|
| `AdminTodoList` | קומפוננטה | מסומן כהערה בדאשבורד; endpoints לא קיימים |
| `QuickInsightWidget` | קומפוננטה | מסומן כהערה; שולח payload legacy לנתיב שגוי |
| `Alerts` | קומפוננטה | **אף קובץ לא מייבא** (שריד הגרסה הקודמת) |
| `WorkoutBuilder` + `EnduranceSetCard` | קומפוננטות | מיושמות במלואן, **לא מיובאות ע"י אף קובץ**; עוד יחידות שניות מול הקונבנציה של הפרסר |
| `PresetSidebar` | קומפוננטה | מיוצא, לא מרונדר; שארית עמודת 120px ב-CSS |
| מצבי TrainingPopup (libraryNew/libraryEdit/calendarSchedule) + onSaveAsNew/onUpdateExisting + metrics | פרופס/סטייט | לעולם לא מועברים |
| `ProgramCard` (תיקיית programCard/) | קומפוננטה | כפיל מוסתר (רזולוציה מעדיפה את הקובץ השטוח) |
| `DaySummeryRow` | קומפוננטה | div ריק שמרונדר |
| `types/athleteTalk.ts`, `types/event.ts`, `StrengthExercise`, `WeeklyTarget`, `Group.goals/notes/description`, `EventOverride.modifiedLocation`, `Training.equipment`, `EnduranceSet.equipment`, `env.appName` | טיפוסים/שדות | אפס אזכורים |
| `AthleteDetails` — state `events` + טיפוס DayEvent משוכפל | קוד | מת בתוך העמוד |
| ~25 פונקציות API לא בשימוש | API | כולל `/blocks` כולו; read-side של program-templates; `getTrainingsByGroup/Athlete` (**גם שבורות** — הנתיבים לא קיימים בשרת!); helpers של notes; `getDashboardByDate`; `deleteGroup`; `getAssignmentById` |
| קריאות fetch גולמיות ל-`/api/...` | קוד | עוקפות את שכבת ה-API ופוגעות בנתיבים לא קיימים |
| `server/src/env/env.ts` + תלות dotenv | קוד/תלות | לא מיובא |
| route `/blocks` + אוסף `blocks` | שרת | ריק, לא בשימוש |
| ~85 שורות מסומנות כהערות ב-dashboardService; ייבוא node:http; `createNote` מיובא ולא נקרא ב-Attendance; `trainings.find` ללא שימוש | שרת | מתים |
| `@dnd-kit/*`, `@types/react-router-dom@5` | תלויות | מותקנות ולא בשימוש |
| barrels: layout ×3, trainingPlan/index | מודולים | לא מיובאים |
| כפילויות fetch (App+Schedule ל-trainings; Schedule+Calendar ל-events) | קוד | בזבוז + סיכון חוסר-עקביות |

## 6. חוסרים תפעוליים להחלטה באיפיון הרצוי

1. **אימות ומשתמשים** — עדיין פתוח לחלוטין (CORS פתוח, בלי auth).
2. **מסד נתונים** — עדיין JSON בלי נעילות; היקף הנתונים גדל משמעותית (15 אוספים).
3. **שלושה "עולמות ביצוע"** — TrainingAssignment (סטטוסים), Attendance (נוכחות), CalendarEvent.done: מה מקור האמת ל"בוצע"? נוכחות נרשמת מול eventId ארעי.
4. **מזהי מופע יציבים** לאירועים מחזוריים (ביטול/דריסה/נוכחות תלויים בזה), ותיקון סדר ימי-השבוע (day string + שלוש פרשנויות).
5. **תוכניות**: לאחד legacy (plans/blocks) מול החדש (meso-blocks)? תבניות — להשמיד או לתת להן UI? תאריכים אמיתיים במקום אנקור פסאו? מחיקה עם cascade?
6. **AdminTask** — לבנות backend או למחוק את המודול כולל הטיפוס.
7. **הערות** — הוספת עריכה/pinning? לממש את `flagForWorkoutSelection` (מוצהל אך לא מנוצל)?
8. **נוכחות** — האם להוסיף SICK/INJURED/LATE (הסטטוסים כבר קיימים בשיוכים)? אכיפת isVerified אמיתי?
9. **סביבה ובנייה** — VITE_API_URL (.env/proxy), תיקון סדר ה-alias לפני ייבוא-ערך ראשון מ-shared, תיקון tsc, החלטה על build לשרת, CI ב-Linux (ייבואי רישיות).
10. **שפה וכיווניות** — ה-UI אנגלית, מחרוזות עבריות קשיחות בלוח התוכניות, נתונים בעברית; עדיין אין RTL.
11. **Gym/strength** — "RM zones coming soon" עדיין; האם בטווח? (גם באזורים וגם בענפי אימון הטיפוס חסר).
12. **ולידציה וטיפול שגיאות** — עדיין אין 400/409/422 מלבד בודדים; חוזים מעורבים ({message}/{error}); שגיאות נבלעות ב-console; אין משוב למשתמש.
13. **איחוד אוצרות מילים** — ענפים, SetType/סטטוסים, מזהים (Date.now מול UUID), פורמט תאריכים.

## 7. סיכום מצב פונקציונלי במשפט אחד

המערכת מאפשרת **כיום בפועל**: לנהל ספורטאים וקבוצות במלואן (כולל חברות, סדרים שבועיים, מבחנים/אזורים/PBs/יעדים, הערות), לנהל יומן אירועים ולוח שבועי **שנשמרים בשרת** (כולל דריסות וספריית אימונים בתיקיות), לתעד נוכחות קבוצתית ולעקוב אחר ספורטאים בסיכון, לבנות תוכניות אימון רב-שבועיות ולהחילן על ספורטאים — ואינה מאפשרת עדיין: ביטול מופע חוזר של סדר קבוצה, תוכניות מבוססות-תאריכים שמוצגות נכון, ניתוחי קבוצה אמיתיים, מחיקות עם ניקוי תלויים, או עבודה בסביבה מאובטחת/מרובת משתמשים.