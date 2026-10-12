# SPEC 09 — מודול תוכניות אימון (Programs / Periodization)

> איפיון מצב קיים (AS-IS) · מסמך ראשי: [../SPEC.md](../SPEC.md)
>
> מקור: `client/src/pages/TrainingPlan/*`, `client/src/components/programs/programSetupWizard/**`, `client/src/components/trainingPlan/*`, `client/src/api/{program,plan,mesoBlock,plannedWeek,programTemplate,scheduledWorkout,folder}.ts`, `shared/types/periodization.ts`.
>
> **מודול חדש לגמרי** שנוסף בשכתוב: בניית תוכנית אימון רב-שבועית (מקרו-מחזור) עם פאזות מזו, שבועות מתוכננים ומטרות נפח/אזורים — ולוח תוכנית שבו ממוקמים אימונים לכל שבוע ויום, עד החלת התוכנית על ספורטאי/קבוצה.

## 1. היררכיית הישויות והזרימה

```
Program (db.programs)  ─── macroEvents: MacroEvent[] (מוטמעים)
 ├── ProgramTemplate (db.programTemplates)     עותק אוטומטי — write-only, לא נקרא אף פעם
 ├── TrainingPlan (db.plans)                   מבנה LEGACY: programId + blocks: PlanBlock[] מוטמעים
 │     └── (route ‏/blocks ו-db.blocks קיימים אך ריקים ולא בשימוש)
 ├── ProgramMesoBlock (db.mesoBlocks)          programId → פאזה (Base/Build/Peak/Taper)
 │     └── PlannedWeek (db.plannedWeeks)       mesoBlockId → שבוע (weekNumber גלובלי לכל התוכנית)
 └── ScheduledWorkout (db.scheduledWorkouts)    programId + plannedWeekId (+ workoutLibraryId → Training)
```

- מיקום כפול: `weekNumber` (גלובלי, 1-based) + `dayOfWeek` (1=שני..7=ראשון); שדה `date` אופציונלי **לעולם לא מאוכלס** ע"י ה-UI.
- **אין materialization אוטומטי**: הוויזארד יוצר תוכנית מלאה עם **אפס אימונים** — הלוח מתמלא ידנית (גרירה מהספרייה / פופאפ / placeholder). המרה ל"יומן אמיתי" קורית רק ב-**Apply Program** שהופך כל ScheduledWorkout ל-TrainingAssignment לכל ספורטאי.

## 2. עמוד התוכניות — `/training-plans` (TrainingPlan.tsx)

- רשימת **תוכניות בלבד** (`GET /programs`): כרטיסי ProgramCard בגריד רספונסיבי + חיפוש בלקוח לפי name/assigneeName.
- PageHeader עם כפתור ⚙ **ללא handler** (מת) + "+" שפותח את הוויזארד.
- לחיצה על כרטיס → `navigate("/training-plans/calendar", {state: {programId}})`.
- ⚠️ אין עריכה/שכפול/תיקיות בעמוד; מחיקה רק מתוך לוח התוכנית.
- ProgramCard: שם, assigneeType: assigneeName, ענף, טווח תאריכים, level, mainGoal — **פס התקדמות מוקשח 60%**.
- ⚠️ **שתי גרסאות ProgramCard** בקוד: `trainingPlan/programCard.tsx` (הקובץ שבשימוש — רזולוציה מעדיפה קובץ על תיקייה) ו-`trainingPlan/programCard/ProgramCard.tsx` (כפיל מסוגנן, **מת** — מיוצא דרך ה-barrel שאינו בשימוש). ייבוא ה-CSS בשגיאת רישיות (`ProgramCard.css` מול `programCard.css` בדיסק).

## 3. הוויזארד — `ProgramSetupWizard` (3 צעדים)

state משותף `formData` (Partial<Program> + events, loadingPattern, periodizationModel, mesoPhases); הצעדים ממזגים אליו.

### צעד 1 — ProgramSetupModal
שדות: Program Name (חובה); Assignee Type (Group/Athlete→"Individual"); **Assignee — select שערכו שם, לא מזהה** (נפילה ל-input חופשי אם הרשימה ריקה; אופציונלי במצב שבועות); Duration Method — "Specific Dates" (start/end) או "Number of Weeks" (ברירת מחדל 12); Sport (Triathlon/Swimming/Running/Cycling); Main Goal; Level.
⚠️ `durationType`/`weeks` מאותחלים קשיח ולא מה-`initial` — **חזרה אחורה מצעד 2 מאפסת את בחירת המשך** בעוד שאר השדות נשמרים.

### צעד 2 — Step2EventsAndRulesModal
- **Key Events** (→ macroEvents): סוג (A-Race/B-Race/C-Race/Test/Training Camp), שם, מיקום, הערות; תזמון — בתוכניות שבועות: Week+Day (המועד נשמר כמחרוזת `"Week N, Day D"`), בתוכניות תאריכים: date picker; מחנה-אימון מקבל גם סיום. מיון לפי getSortValue (שבועות → N*10+D; תאריכים → timestamp).
- **Periodization Strategy**: Loading Pattern (1:1 / 2:1 / 3:1 / 4:1 / 5:1, ברירת מחדל 3:1) + Model (Linear/Block/Undulating + תיאור סטטי).
- ⚠️ שני הפרמטרים האלה **לא נשמרים על ה-Program** — הם רק קלט לגנרציה בצעד 3. וכן `normalizeLoadingPattern` דורס בשקט 1:1/4:1/5:1 → 3:1.

### צעד 3 — Step3TimelineVisualizationModal (סקירת המקרו)
- תצוגת גאנט של הפאזות עם **ידיות גרירה** (עכבר+מגע, מוגבל לשכנים ולגבולות), סמני אירועים; תוכניות שבועות עוגנות לתאריך מדומה (בוויזארד `2024-01-01`; בלוח — **השני של ינואר הנוכחי** — האנקורים לא תואמים).
- **generatePhases** (אוטומטי לפי A-Race/סוף): Taper 14 יום לפי המרוץ (8 ש"ש, "1:1", "50/50") ← Peak 21 יום לפניו ← Build ← Base עם יחס לפי המודל (Linear 0.6 / Block 0.4 / Undulating 0.5); מחנה בתוך פאזה → סיומת "(Overload)"; שאריות ימים → Base+Build. אין אירועים → פאזת Base אחת על כל התוכנית.
- כרטיסי פאזה לעריכה: סוג (Base/Build/Peak/Taper/**Transition** — ⚠️ Transition לא באיחוד MesoPhase ומומר ב-force), התחלה/סיום, נפח (ש"ש), loading, intensity ("80/20"). כפתורים: הזז מוקדם/מאוחר (אורז מחדש מתחילת התוכנית), מחיקה, "+ Add Custom Phase".
- ⚠️ שינוי היקף/מודל **מגנרט מחדש ומוחק עריכות ידניות**; שינוי רשימת האירועים דווקא לא מגנרט.

### מה נשלח בפועל — סדר הקריאות בסיום
1. `POST /programs` (name, assigneeType, assigneeName, sport, startDate, endDate, mainGoal, level, macroEvents, durationType?, weeks?).
2. `POST /program-templates` — עותק אוטומטי.
3. `POST /plans` (legacy) — `{programId, name, description, blocks: PlanBlock[]}`; לכל בלוק id של הפאזה מהלקוח ("1","2"...) — **עלול להתנגש בין תוכניות**; weeklyStats עם ISO במצב תאריכים או `"Week N, Day X"` במצב שבועות.
4. לכל פאזה: `POST /meso-blocks` `{programId, name, order, startWeekNumber (מצטבר), durationWeeks, loadingPattern, intensityDistribution (3 דליים)}` ← ואז לכל שבוע: `POST /planned-weeks` `{mesoBlockId, weekNumber (מצטבר גלובלי), targetVolumeHours, targetDistribution (Z1..Z5 מפורק מ-"80/20"), focus}`. ⚠️ weeklyStats נבנה תמיד עם `isWeeks=true` — **גם לתוכניות תאריכים אין שבועים עם תאריכים אמיתיים**.
5. ניווט ללוח התוכנית החדשה.

## 4. לוח התוכנית — `/training-plans/calendar`

### 4.1 ProgramCalendarPage (עטיפה)
קורא את `programId` מ-`location.state` — ⚠️ **רענון/כתובת ישירה מאבדים אותו** ונופלים לתוכנית הראשונה ברשימה.

### 4.2 ProgramCalendarView — גריד שבועות רציף
לא לוח חודש: **שורה לכל שבוע מתוכנן**, 7 עמודות שני-ראשון, עמודת מטא-שבוע (280px) משמאל; Library משותפת (260px) בצד.
- טעינה: `GET /meso-blocks?programId` → לכל בלוק `GET /planned-weeks?mesoBlockId` → שורות; **fallback** ל-plan legacy (blocks מוטמעים) כשאין meso-blocks; `GET /scheduled-workouts?programId` + ספריית אימונים + ספורטאים/קבוצות.
- ⚠️ תאריכי השורות **פסאו-תאריכים** בשני המצבים: `"Week N"` מורחב מהאנקור "שני הראשון של ינואר הנוכחי"; תוכניות מבוססות-תאריכים מציגות גם כן שבועות מדומים.
- צבעי בלוקים מוקשחים ל-id `"block-1"`/`"block-2"` — המזהים בפועל timestamps → **כל הבלוקים אפורים**.
- **עמודת מטא-שבוע**: שם בלוק, טווח, תג Deload (ידני לפי focus; אוטומטי לפי loadingPattern — כל שבוע 3 ב-"2:1", כל 4 ב-"3:1"), פס התקדמות נפח (פועל מהאימונים המוצגים, בזיכרון), גרורות נפח לפי ענף ואזור.
- **אירועי מקרו** מוצגים ככרטיסים (עברית קשיחה: "תחרות"/"טסט"/"מחנה"); במצב תאריכים הם מושווים מול התאריכים הפסאו — **בדרך כלל מחוץ לטווח ולא מוצגים**.

### 4.3 אינטראקציות
| פעולה | התנהגות |
|---|---|
| לחיצה על תא יום ריק | TrainingPopup במצב calendarSchedule — כפתורי "Remove From Calendar" / "Schedule & Save to Library" / "Schedule One-time" |
| לחיצה על כרטיס אימון | אותו פופאפ, ממולא |
| "+" על תא יום | Quick Add Placeholder: ענף, משך כולל, הקצאת Z1-Z5 (בר צבעוני; חובה 100%) → ⚠️ **הנתונים שהוזנו נזרקים** — נשלח רק `{programId, plannedWeekId, workoutLibraryId:"", weekNumber, dayOfWeek, status:"Planned"}` והכרטיס מציג "0m · " |
| גרירת אימון ספרייה לתא | `POST /scheduled-workouts` עם `workoutLibraryId` |
| גרירת כרטיס אימון לתא אחר | `PUT /scheduled-workouts/:id` עם `{plannedWeekId, weekNumber, dayOfWeek}` של היעד |
| גרירת שבוע על שבוע אחר | החלפת שני שבועות: `PUT /planned-weeks` על שניהם (weekNumber) + PUT על כל האימונים ⚠️ **בלי החלפת plannedWeekId, והשורות נטענות מחדש לפי סדר הכנסה** — סדר התצוגה לא משתנה |
| לחיצה על עמודת מטא-שבוע | Week Settings: פורמט (Auto/Base/Build/Peak/Taper/Deload), נפח שבועי, הקצאת אזורים, ענף — ⚠️ הענף לא נשמר; נשמר `{targetVolumeHours, targetDistribution, focus}` |
| ספרייה | זהה ללוח השבועי (חיפוש, תיקיות, New Training/Folder, מחיקה) — ⚠️ מחיקת אימון מהספרייה ממירה את המשויכים ל-snapshot **ב-state המקומי בלבד** (בלי PUT) — אחרי רענון הם הופכים ל-"Scheduled Workout" גנרי |
| **Apply Program** | מודאל: יעד (Athlete/Group), תאריך התחלה, שעת ברירת מחדל, מיפוי ימים (יום תוכנית 1-7 → יום שבוע). מוחק שיוכים קודמים של אותה תוכנית (לפי מרקר `PROGRAM_APPLY:{programId}` ב-notes) ואז `POST /training-assignments` לכל אימון×ספורטאי עם startTime מחושב + snapshot; מסיים ב-alert |
| Delete Program | confirm → מחיקת ה-plan הlegacy + התוכנית בלבד — ⚠️ **meso-blocks, planned-weeks, scheduled-workouts, templates והחלות נשארים יתומים** למרות שהודעת האישור מבטיחה "and all its training blocks" |

## 5. תיקיות (Folders)

- `Folder` חסר parent; החברות על `Training.folderId`. CRUD מלא בשרת; המחיקה מנקה folderId מהאימונים.
- **מארגנות את ספריית האימונים בלבד** — לא תוכניות. אין להן כל נוכחות בעמוד התוכניות; השימוש היחיד — פאנל ה-Library.
- ⚠️ `api/folder.ts` כתוב ב-fetch גולמי בעוד מודולי ה-periodization ב-axios — חוסר אחידות.

## 6. מגבלות ומצב חצי-מוכן (תמצית)

1. **תוכניות מבוססות-תאריכים שבורות בתצוגה** — ה-UI לא כותב `date` לאימונים, והרינדור במצב תאריכים דורש אותו; אירועי מקרו עם תאריכים אמיתיים לא נופלים בטווח הפסאו. המודול עובד בפועל רק במצב שבועות.
2. Placeholder מאבד את קלט המשתמש (סעיף 4.3).
3. Legacy וחדש במקביל: כל יצירה כותבת גם plan (blocks מוטמעים) וגם meso-blocks; הלוח מעדיף meso-blocks ונופל ל-plans רק כשאין.
4. Route ה-/blocks וה-api שלו — מתים לחלוטין; templates — write-only.
5. עוד פערים (אנקורים לא תואמים, Transition, צבעי בלוקים, שמירת ענף ב-Week Settings, assigneeName כשם תצוגה שנשבר בשינוי שם) — מרוכזים ב-[08-gaps.md](08-gaps.md).