# SPEC 02 — מודלי נתונים

> איפיון מצב קיים (AS-IS) · מסמך ראשי: [../SPEC.md](../SPEC.md)
>
> **שינוי יסודי מול הגרסה הקודמת**: הטיפוסים כבר **לא מוכפלים** בין לקוח לשרת. מקור האמת הוא `shared/types/*` — מיובא ע"י שני הצדדים. קבצי הטיפוסים הישנים (`client/src/types/athlete|group|training|dayEvent.ts` ו-`server/src/models/*`) נמחקו כליל.

## 1. מבנה הטיפוסים המשותפים

`shared/types/` מכיל 11 קבצים, כולם מיוצאים דרך barrel‏ `index.ts`: `training, group, athlete, calendarEvent, note, adminTask, dashboard, attendance, periodization, folder`.

- **לקוח**: כינויי נתיבים ב-`client/tsconfig.json` (`@/shared/*` → `../shared/*`) + alias ב-`vite.config.ts` (`@/shared` → `../shared`). לקוח מייבא ב~54 קבצים, בשלושה סגנונות מעורבים: barrel (`@/shared/types`), מודול ישיר (`@/shared/types/periodization`), ושרידים של נתיבים יחסים מהגרסה הקודמת (למשל `App.tsx:7`, `athleteCard/AthleteCard.tsx:1`).
- ⚠️ `tsconfig.app.json` כולל מפורשות רק 4 מתוך 11 קבצי ה-shared (athlete, group, training, calendarEvent) — השאר נכנסים לתוכנית רק דרך גרף הייבוא.
- **שרת**: כינוי `@shared/*` ב-`server/tsconfig.json` (עובד רק תחת ts-node-dev; build רגיל לא היה מתרגם את הכינוי). כל 16 קבצי ה-routes ו-3 ה-services מייבאים מ-shared.
- **נותרו בלקוח בלבד** (`client/src/types/`): `zoneConfig.ts` (מנוע האזורים — פירוט ב-[06-tests-and-zones.md](06-tests-and-zones.md)), `athleteTalk.ts` (מת — אין אזכור מחוץ להגדרה), `event.ts` (מת — אין אזכורים כלל).

## 2. Athlete (ספורטאי) — `shared/types/athlete.ts`

| שדה | טיפוס | חובה | הערות |
|---|---|---|---|
| `id` | string | ✓ | `Date.now().toString()` בשרת |
| `name`, `level` | string | ✓ | level טקסט חופשי |
| `age`, `experience`, `height`, `weight`, `restingHR`, `maxHR` | number | | ⚠️ **בפועל נשמרים כמחרוזות** ("22", "158"...) — הטופס מנוהל כ-`any` ללא המרה |
| `phone`, `email`, `parentPhone` | string | | הטלפון משמש גם כמספר WhatsApp ברשימת הסיכון |
| `zones` | `{ hr?, pace?, power? }` | | ⚠️ **הטיפוס שקרי**: בפועל מקושי לפי ענף — `Record<"run"\|"bike"\|"swim", {pace?, hr?, power?}>` (נכתב ב-`AthleteDetails.addTest`, נקרא ב-`ZonesTable` כ-`zones[sport]`) |
| `tests` | Test[] | | היסטוריית מבחנים (ברירת מחדל `[]`) |
| `goals` | Goal[] | | יעדים (ברירת מחדל `[]`) |
| `injuries` | string | | תיאור פציעה — משמש גם כדגל (truthy) |
| `injured` | boolean | | נקרא ע"י רשימת הסיכון — ⚠️ אף טופס לא כותב אותו; הנתונים הקיימים משתמשים ב-`injuries` בלבד |
| `injuryType`, `limitations`, `focus`, `medicalNotes`, `notes` | string | | |
| `lastCheckIn` | Date | | נכתב רק ע"י `POST /attendance/resolve-check-in` — מניע את "אין קשר N ימים" |

**שדות שמוזרקים מה-UI ונשמרים בזכות ה-merge ב-PUT, אך לא בטיפוס**: `injuryDate`, `allergies`, `emergencyName`, `emergencyPhone`, `emergencyEmail`.

### 2.1 Test (מבחן כושר)

| שדה | טיפוס | הערות |
|---|---|---|
| `id` | string | `Date.now().toString()` מהלקוח |
| `sport` | `"run" \| "bike" \| "swim"` | |
| `type` | string | מפתח מ-ZONES_CONFIG: `1k, 5k, 10k, ftp, 20min, css, 400m, 100m, hr, custom` |
| `method` | — | ⚠️ **לא בטיפוס המשותף**, אך נשמר בפועל (`"threshold"|"max"|"race"|"custom"`) — נכתב ב-AddTestModal |
| `value` | number | שניות (run/swim), וואטים (bike), שניות ל-100מ' (CSS — דווקא `zones.pace[3]`) |
| `date` | string (ISO) | |
| `zones` | any | `{pace?: number[], hr?: number[], power?: number[]}` כפי שחושבו בזמן המבחן |

### 2.2 Goal (יעד / מרוץ)

| שדה | טיפוס | הערות |
|---|---|---|
| `id`, `title` | string | id = `Date.now().toString()` מהלקוח |
| `type` | `"general" \| "race"` | |
| `raceName`, `location` | string | `null` עבור general |
| `target` | string | טקסט חופשי ("45:00 / podium / finish") |
| `date` | string | ⚠️ **מוגדר כחובה אך נשמר `null`** עבור יעד כללי |
| `createdAt` | string (ISO) | |
| `plan` | object | `pacing, nutritionPre, nutritionDuring, hydration, gear, schedule, notes` |
| `review` | object | `actualPacing, actualNutrition, whatWorked, whatNot, notes` |
| `done` | boolean | |

## 3. Group (קבוצה) — `shared/types/group.ts`

| שדה | טיפוס | הערות |
|---|---|---|
| `id`, `name` | string | |
| `coach`, `level`, `sport` | string | sport טקסט חופשי ("triathlon") |
| `description` | string | לא נכתב משום מקום |
| `goals` | Goal[] | ⚠️ **מת** — אין UI שכותב; גם GroupDetails כותב יעדים בפועל לשדה הזה רק דרך PUT (ראה 04) |
| `maxAthletes` | number | לא נאכף בשום מקום |
| `color` | string | |
| `notes` | Note[] | ⚠️ **מת** — הערות קבוצה נשמרות כ-Note פולימורפי (targetType="GROUP"), לא בשדה |
| `schedule` | TrainingTime[] | סלוטים שבועיים — מנוע אירועי הלוח |

**TrainingTime**: `{ day: number; start: {hour, min}; end: {hour, min} }`.
⚠️ **`day` מוקלד כ-number אך נשמר כמחרוזת** (`"day": "1"`) כי הטופס כותב את `e.target.value` ישירות. הצרכנים חלוקים בפרשנות: השרת (CalendarEvent.ts) משווה מול `getDay()` (0=ראשון), GroupCard מציג עם מערך ימים שני-ראשון (0=שני), GroupDetails עם ראשון-שבת (0=ראשון), והדאשבורד מוסיף `+1` ומקבל בשל כך מחרוזת ("11"). ראה [08-gaps.md](08-gaps.md).

## 4. תחום האימון — `shared/types/training.ts`

### 4.1 סוגים בסיסיים
- `TrainingType = "swim" | "run" | "bike"` — ⚠️ `"strength"` קיים רק ב-`CalendarEvent.type`, ו-`"gym"` קיים רק כטיפוס מקומי בלקוח (ZonesTable/AthleteDetails). אין איחוד.
- `SetType` (10 ערכים): `warmup, main, technique, cooldown, drill, steady, interval2, interval3, rampup, rampdown` — הורחב עבור הפרסר הטקסטואלי.
- `Unit = "m" | "km" | "mi" | "min" | "s" | "sec" | "h" | "time" | "reps"`.

### 4.2 EnduranceSet (צעד באימון)

| שדה | טיפוס | הערות |
|---|---|---|
| `id` | string | `crypto.randomUUID()` (מפריסט/בונה) או `${Date.now()}-${random}` (מפרסר) |
| `setType` | SetType | מכותרת בלוק בפרסר |
| `sets`, `reps` | number | `5*4*100m` → sets=5, reps=4; ברירת מחדל reps=1 |
| `mode` | `"distance" \| "time" \| "reps" \| "rest" \| "text"` | |
| `distance`, `duration`, `unit` | number/string | duration **בדקות** לאחר נרמול הפרסר |
| `rest` | number | בשניות (הפרסר ממיר) |
| `intensity` | string | `Z1..Z5` או מילות מפתח (EASY/THRESHOLD/HARD/FAST...) |
| `stroke` | string | FR/BK/BR/FLY/IM/MIX |
| `tags` | string[] | ציוד מהטקסט: paddles, pullbuoy, fins, snorkel, band, kickboard, shoes, belt, parachute |
| `movement` | string | Run/Walk/Jog |
| `notes` | string | שורות פירוט מצורפות עם `\n` |
| `_hasBreakdownLine` | boolean | דגל פנימי של הפרסר |
| `equipment` | string | ⚠️ **מת** — הפרסר כותב ל-`tags` במקום |

- `WorkoutStep = EnduranceSet` (כינוי) — כלומר **סט סיבולת הוא צורת הצעד היחידה בפועל**.
- `StrengthExercise` (`id, name, sets, reps, weight?`) — ⚠️ **מת לחלוטין**, אין אזכורים.

### 4.3 Training (פריט ספריית אימונים) — אוסף `trainings`

| שדה | טיפוס | ברירת מחדל בשרת (POST) | הערות |
|---|---|---|---|
| `id` | string | `Date.now().toString()` | |
| `creationDate` | Date | `new Date()` | |
| `title`, `description`, `notes` | string | notes=`""` | |
| `type` | TrainingType | | |
| `steps` | WorkoutStep[] | `[]` | מפורסר מטקסט |
| `equipment` | string[] | `[]` | ⚠️ לא מאוכלס בפועל |
| `duration` | number | — | דקות; נקבע ידנית (טיוטות חדשות: 60) |
| `folderId` | string | — | FK ל-Folder; ⚠️ נשמר רק דרך PUT (POST משמיט) |

### 4.4 TrainingSnapshot
`Pick<Training, "id"|"title"|"description"|"type"|"steps"|"notes"|"duration"|"creationDate">` — עותק מנותק שמוטמע ב-TrainingAssignment וב-ScheduledWorkout. נוצר אוטומטית בשרת במחיקת אימון מהספרייה (כדי שמופעי לוח ישרדו) ובהחלת תוכנית.

### 4.5 TrainingAssignment (שיוך אימון לספורטאי/קבוצה) — אוסף `trainingAssignments`

| שדה | טיפוס | ברירת מחדל בשרת | הערות |
|---|---|---|---|
| `id` | string | `Date.now().toString()` — ⚠️ ה-id שהלקוח מציע (UUID) נזרק | |
| `trainingId` | string | | FK ל-Training (או ל-scheduled workout בהחלת תוכנית) |
| `trainingSnapshot` | TrainingSnapshot | | כשהאימון נמחק |
| `athleteId`, `groupId` | string | `null` | XOR נאכף בשרת |
| `startTime` | Date | | חובה |
| `endTime` | Date | `null` | |
| `notes` | string | `""` | החלת תוכנית כותבת מרקר `PROGRAM_APPLY:{programId} \| Applied from program {name}` |
| `status` | `"ATTENDED" \| "MISSED" \| "SICK" \| "INJURED" \| "PENDING" \| "LATE"` | `"PENDING"` | ⚠️ רחב מ-AttendanceStatus (2 ערכים) |

## 5. CalendarEvent + EventOverride — `shared/types/calendarEvent.ts`

**`CalendarEvent`**: `id, type, title, startTime, endTime (חובה), done?, athleteId?, groupId?, sourceId?, createdAt`.
- `type` — 9 ערכים: `"run" | "bike" | "swim" | "strength" | "training" | "task" | "checkin" | "call" | "groupSchedule"` (לא מאומת בשרת).
- ⚠️ **רוב אירועי הלוח וירטואליים**: `GET /events/range` לא קורא שורות אלא **מגזר** אירועים משלושה מקורות (שיוכים, סדרי קבוצות, אירועים ידניים) + מדביק overrides. ה-`id` של אירועים ממוזגים הוא `crypto.randomUUID()` **חדש בכל בקשה**; המזהה היציב היחיד הוא `sourceId`:
  - `training-{assignmentId}` — שיוך אימון.
  - `groupSchedule-{groupId}-{epochMs}` — מופע של סדר קבוצה.
- **EventOverride** (אוסף `eventOverrides`): `id (uuid), sourceId, originalStartTime, isCancelled?, modifiedTitle?, modifiedStartTime?, modifiedEndTime?, modifiedLocation? (⚠️ מת — שום לוגיקת מיזוג לא קוראת אותו), createdAt`. מזהה מופע בודד של מקור מחזורי.

## 6. Attendance (נוכחות) — `shared/types/attendance.ts`

- `AttendanceStatus = "ATTENDED" | "MISSED"` — ⚠️ צר מסטטוס השיוכים; הסליקים `sick`/`injured` ב-compliance לעולם לא יתמלאו.
- **Attendance** (אוסף `attendances`): `id (uuid), eventId, athleteId, status, note?, isVerified, createdAt, updatedAt`.
  - ⚠️ `eventId` מקבל מהלקוח את ה-**id הארעי** של אירוע ממוזג (מתחלף בכל fetch) — אינו מפתח יציב.
  - ⚠️ `isVerified = record.isVerified || true` — תמיד true; שדה דקורטיבי.
  - Upsert לפי (eventId, athleteId) שומר id/createdAt.
- **AttendanceRecord** (DTO ל-bulk): `{athleteId, status, note?, isVerified?}`.
- **AthleteCompliance**: `{athleteId, athleteName, sessionsAssigned, sessionsAttended, compliancePercentage, lastSevenDays: {attended, missed, sick, injured}}` — מחושב מתאריך יצירת רשומות הנוכחות (createdAt), לא מזמן האירוע.

## 7. Note (הערה פולימורפית) — `shared/types/note.ts`

| שדה | טיפוס | הערות |
|---|---|---|
| `id` | string | `note_{Date.now()}_{random9}` |
| `title`, `description` | string | חובה |
| `category` | NoteCategory | 8 ערכים: Technical, Injury, Next-Session-Focus, General, Athlete, Group, Check-In, Other — ⚠️ לא מאומת בשרת |
| `targetType` | `"ATHLETE" \| "GROUP" \| "ATTENDANCE" \| "EVENT"` | נאכף בשרת |
| `targetId` | string | |
| `athleteId`, `groupId` | string | **legacy** — נתמכים לאחור בשאילתות (notesService) |
| `flagForWorkoutSelection` | boolean | ברירת מחדל false — "דגל לבחירת אימון" |
| `createdAt`, `updatedAt` | Date | |

אין pinning, אין עריכה ב-UI, אין resolve להערות.

## 8. AdminTask — `shared/types/adminTask.ts`

`{id, title, description?, status ("pending"|"in-progress"|"completed"), dueDate?, assignedTo?, category ("Logistics"|"Communication"|"Admin"|"Other"), priority ("low"|"medium"|"high"), createdAt, updatedAt, completedAt?}`.
⚠️ **מת מקצה לקצה**: אין route בשרת (AdminTodoList קורא ל-`/api/tasks` שלא קיים — שום route לא מורכב תחת `/api`), אין אוסף ב-DB. הטיפוס מיובא רק ע"י AdminTodoList.

## 9. טיפוסי דאשבורד — `shared/types/dashboard.ts`

- **AthleteCheckInStatus** (שורת "רשימה אדומה"): `{athleteId, athleteName, risk ("safe"|"warning"|"danger"), reasons {recentInjury?, missedSessions?, noContact?}, whatsappNumber (=phone), email, lastCheckedAt}`. הקריטריונים בפועל: 7+ ימים בלי check-in → warning; 2 החמצות **רצופות** מאז ה-check-in → danger; `injured===true` + 3 ימים בלי מעקב → danger.
- **DashboardStats**: `{totalAthletes, totalGroups, trainingsToday, pendingTasks, atRiskAthletes}` — `trainingsToday` סופר בפועל **את כל** האירועים של היום; `pendingTasks` מחושב אך לא מוצג ב-UI.
- **TodayTimeline**: `{date, events: (CalendarEvent & {isOverridden?})[], stats, atRiskAthletes}` — התשובה של `GET /dashboard/today`.

## 10. Periodization — `shared/types/periodization.ts` (11 טיפוסים, עמוד השדרה של מודול התוכניות)

⚠️ `SportType` כאן שונה משאר המערכת: `"Triathlon" | "Swimming" | "Running" | "Cycling"` (ערים גדולות) מול `"swim"|"run"|"bike"` ב-training/zoneConfig.

| טיפוס | שדות | הערות |
|---|---|---|
| **Program** (db.programs) | `id, name, assigneeType ("Group"\|"Individual"), assigneeName (שם תצוגה — לא מזהה!), sport, startDate, endDate, durationType? ("dates"\|"weeks"), weeks?, mainGoal, level ("Beginner"\|"Intermediate"\|"Elite"), createdAt, macroEvents?` | תוכניות מבוססות-שבועות שומרות `startDate/endDate = ""` |
| **MacroEvent** | `id, type ("A-Race"\|"B-Race"\|"C-Race"\|"Test"\|"Training Camp"), name, date, endDate?, location?, notes?` | ⚠️ `date` הוא ISO **רק** בתוכניות מבוססות-תאריכים; בתוכניות שבועות נשמרת המחרוזת המילולית `"Week 16, Day 7"` |
| **MesoIntensityDistribution** | `Z1_Z2, Z3, Z4_Z5` | 3 דליים (אחוזים) |
| **ZoneDistribution** | `Z1..Z5` | 5 אזורים |
| **WeeklyStats** | `weekStart, weekEnd, targetVolume, actualVolume, targetDistribution, actualDistribution` | weekStart/End: ISO במצב תאריכים, `"Week N, Day D"` במצב שבועות |
| **MesoBlock** | `id, name, startDate, endDate, loadingPattern ("3:1"\|"2:1"\|"Custom"), startVolume, weeklyVolumes, intensityDistribution, weeklyStats?` | קיים **רק** בתור PlanBlock מוטמע ב-TrainingPlan.blocks — לא אוסף עצמאי |
| **MesoPhase** | `id, phaseType ("Base"\|"Build"\|"Peak"\|"Taper"), startDate, endDate, targetVolumeHours, loadingPattern (string), intensityDistribution (string "80/20")` | DTO של הוויזארד בלבד |
| **WeeklyTarget** | — | ⚠️ **מת** — אפס אזכורים |
| **PlanBlock** | = MesoBlock + `planId?` | id של הפאזה מהלקוח ("1","2"...) — עלול להתנגש בין תוכניות |
| **TrainingPlan** (db.plans) | `id, programId, name, description, createdAt, updatedAt, blocks: PlanBlock[]` | **מבנה legacy** — נכתב ע"י הוויזארד במקביל ל-meso-blocks; הלוח קורא אותו רק כ-fallback |
| **ProgramTemplate** (db.programTemplates) | `name, sport, durationType, startDate?, weeksLength? (⚠️ שם שונה מ-Program.weeks), assigneeType?, assigneeName?, mainGoal?, level?, createdAt, macroEvents?` | נכתב אוטומטית עם כל תוכנית — **write-only**, אף קוד לא קורא |
| **ProgramMesoBlock** (db.mesoBlocks) | `id, programId, name, order, startWeekNumber, durationWeeks, loadingPattern, intensityDistribution` | ⚠️ האוסף נקרא mesoBlocks אך מכיל את ProgramMesoBlock — לא את MesoBlock |
| **PlannedWeek** (db.plannedWeeks) | `id, mesoBlockId, weekNumber (גלובלי לכל התוכנית), targetVolumeHours, targetDistribution, focus` | focus: "General"/"Deload"/"Base" |
| **ScheduledWorkout** (db.scheduledWorkouts) | `id, programId, plannedWeekId, workoutLibraryId (""=placeholder), trainingSnapshot?, weekNumber, dayOfWeek (1=שני..7=ראשון), date?, status ("Planned"\|"Completed"\|"Missed"\|"Skipped"), actualDuration?, athleteNotes?` | ⚠️ `date` לעולם לא מאוכלס ע"י ה-UI → אימונים בתוכניות מבוססות-תאריכים לא מוצגים בלוח |

**זרימת היצירה**: וויזארד → POST /programs → POST /program-templates → POST /plans (blocks מוטמעים) → לכל פאזה POST /meso-blocks + POST /planned-weeks לכל שבוע. "Apply Program" ממיר כל ScheduledWorkout ל-TrainingAssignment עם מרקר ב-notes.

## 11. Folder — `shared/types/folder.ts`

`{id, name, createdAt, updatedAt}` — בלי parent ובלי רשימת פריטים; החברות חיה על הפריט (`Training.folderId`). מארגן **את ספריית האימונים בלבד** (לא תוכניות). מחיקת תיקייה מנקה `folderId` מהאימונים (ה-cascade היחיד מסוגו עם זה של Training).

## 12. athleteGroups — טבלת צירוף בלי טיפוס

אוסף `athleteGroups` ב-DB: `{id, athleteId, groupId}` — **אין לה טיפוס ב-shared** (ה-route וה-API בלקוח עובדים עם `any`). זהו כיום הקשר היחיד ספורטאי↔קבוצה: השדות הישנים `Athlete.groups`/`Group.athletes` **נמחקו** מהטיפוסים. שני הצדדים (עמוד הקבוצה ועמוד הספורטאי) קוראים וכותבים דרך `/athlete-groups` בלבד.

## 13. קשרים בין ישויות

```
Folder ──< Training.folderId >── Training (ספריית אימונים)
                                        │
Athlete ──< athleteGroups >── Group      │
   │  (צירוף N:N, בלי טיפוס משותף)      ├──< TrainingAssignment.trainingId (עם trainingSnapshot במחיקה)
   ├──< tests: Test[] >── zones[sport]   └──< ScheduledWorkout.workoutLibraryId (עם snapshot)
   └──< goals: Goal[] >
Group ──< schedule: TrainingTime[] >── (מנוע אירועי groupSchedule בלוח)
Program ──< macroEvents[] (מוטמע)
        ├──< ProgramMesoBlock.programId ──< PlannedWeek.mesoBlockId ──< ScheduledWorkout.plannedWeekId
        ├──< TrainingPlan.programId (legacy, blocks מוטמעים)
        └──< ProgramTemplate (עותק write-only)
TrainingAssignment ──> CalendarEvent וירטואלי (sourceId="training-{id}")
Group.schedule ──> CalendarEvent וירטואלי (sourceId="groupSchedule-{gid}-{ms}") ──< EventOverride (לפי sourceId+originalStartTime)
Attendance ──> eventId (⚠️ ארעי) · Note ──> targetType+targetId (פולימורפי)
Athlete.lastCheckIn <── resolve-check-in · Athlete.zones[sport] <── המבחן האחרון של אותו ענף
```

## 14. מדיניות מזהים

- **בשרת (Authoritative)**: `Date.now().toString()` — הרוב המכריע (athletes, groups, trainings, assignments, folders, blocks, plans, programs, templates, meso-blocks, planned-weeks, scheduled-workouts, athlete-groups). התנגשות אפשרית באותה מילישנייה.
- `crypto.randomUUID()`: אירועים ידניים, overrides, נוכחות — **וגם ה-id הארעי של אירועים ממוזגים (מתחלף בכל fetch!)**.
- Notes: `note_{Date.now()}_{random9}`.
- **מהלקוח, נשמרים**: Test.id, Goal.id, MacroEvent.id, מזהי צעדים באימון (UUID או timestamp-random) — כי הם מוטמעים בתוך אובייקט שנשמר בשלמותו.
- **מהלקוח, נזרקים ע"י השרת**: מזהי assignment (UUID), טיוטות אימון, תוכנית — השרת דורס עם `Date.now().toString()`.
- ⚠️ `POST /programs` מבצע spread אחרי ה-id שנוצר — id שנשלח מהלקוח **מנצח**.

## 15. מבנה קובץ ה-DB (`database.json`)

15 אוספים קיימים: `groups (1), athletes (4), trainings (18), programs (2), mesoBlocks (29), plannedWeeks (119), scheduledWorkouts (11), blocks (ריק), events (ריק), athleteGroups (3), trainingAssignments (17), eventOverrides (2), attendances (ריק), notes (ריק), folders (2)`.
**נוצרים בכתיבה ראשונה** (חסרים מהקובץ): `plans`, `programTemplates`.

### אנומליות בנתונים ובטיפוסים
- `Athlete.zones` — הטיפוס שטוח, הנתונים מקושיים לפי ענף (ראה סעיף 2).
- שדות מספריים נשמרים כמחרוזות; `injuryDate`, `allergies`, `emergency*` לא בטיפוס; `Test.method` לא בטיפוס.
- `TrainingTime.day` מוקלד number, נשמר string.
- `Goal.date` מוקלד חובה, נשמר null ליעדים כלליים.
- `db.events` ריק — כל תוכן הלוח נגזר משיוכים/סדרים/overrides.
- `db.blocks` ריק — הפיצ'ר לא בשימוש.
- שני "עולמות" מנועי-אירועים: `/events/range` (כולל שיוכים) מול `dashboardService` (לא כולל שיוכים; מזהה `group-{...}`; מפרש ימים אחרת).