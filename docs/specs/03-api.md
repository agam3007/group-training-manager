# SPEC 03 — מפרט REST API

> איפיון מצב קיים (AS-IS) · מסמך ראשי: [../SPEC.md](../SPEC.md)
>
> Base URL: `http://localhost:3001` (מוקש בקוד; הלקוח קורא את הכתובת מ-`VITE_API_URL`) · CORS: פתוח לכל מקור · גוף: JSON.
> אין auth, אין ולידציה כללית, אין pagination. **השרת הורחב מ-4 ל-17 מודולי routes + 3 שירותים.**

## 1. סיכום נקודות קצה

| מתודה | נתיב | תיאור | בשימוש ב-UI |
|---|---|---|---|
| GET | `/groups` , `/groups/:id` | קבוצות | ✓ |
| POST/PUT/DELETE | `/groups` , `/groups/:id` | CRUD | ✓ (יצירה/עריכה; מחיקה — מת בלקוח) |
| GET/POST/PUT/DELETE | `/athletes` , `/athletes/:id` | CRUD ספורטאים | ✓ |
| GET/POST/PUT/DELETE | `/trainings` , `/trainings/:id` | ספריית אימונים | ✓ |
| GET | `/programs` | תוכניות | ✓ |
| POST | `/programs` | יצירה (וויזארד) | ✓ |
| PUT/DELETE | `/programs/:id` | עדכון/מחיקה | מחיקה ✓; PUT ✗ |
| GET/POST/PUT/DELETE | `/program-templates(/:id)` | תבניות | רק POST (write-only) |
| GET | `/meso-blocks?programId` , `/:id` | בלוקי מזו | ✓ (GET/POST; עדכון/מחיקה ✗) |
| GET | `/planned-weeks?mesoBlockId` , `/:id` | שבועות מתוכננים | ✓ (GET/POST/PUT) |
| GET/POST/PUT/DELETE | `/scheduled-workouts(/:id)` | אימונים מתוזמנים בתוכנית | ✓ |
| GET/POST/PUT/DELETE | `/plans(/:id)` | תוכניות legacy | ✓ (POST/GET/DELETE) |
| GET | `/blocks?planId` , `/:id` | בלוקים | **✗ — מת מקצה לקצה** |
| GET | `/events` | אירועים ידניים בלבד | ✗ (בלקוח) |
| GET | `/events/range?start&end` | **אירועי לוח ממוזגים** | ✓ |
| GET | `/events/group/:groupId?start&end` | אירועי קבוצה ממוזגים | ✗ |
| GET | `/events/athlete/:athleteId?start&end` | אירועי ספורטאי ממוזגים | ✗ |
| POST | `/events` | אירוע ידני | ✓ |
| POST | `/events/override` | דריסת מופע (upsert לפי sourceId) | ✓ |
| PUT/DELETE | `/events/:id` | עדכון/מחיקה | ✓ (מחיקה — חלקית, ראה להלן) |
| DELETE | `/events/override/:id` | מחיקת דריסה | ✗ |
| GET | `/athlete-groups?athleteId&groupId` | יחסי צירוף | ✓ |
| GET | `/athlete-groups/group/:groupId` | JOIN → ספורטאי הקבוצה | ✓ (דאשבורד) |
| POST/DELETE | `/athlete-groups(/:id)` | צירוף/ניתוק | ✓ |
| GET | `/training-assignments?athleteId&groupId&trainingId` | שיוכי אימון | ✓ |
| GET | `/training-assignments/:id` | שיוך בודד | ✗ — **וגם שבור (ראה 2.13)** |
| POST/PUT/DELETE | `/training-assignments(/:id)` | ניהול שיוכים | ✓ |
| GET | `/dashboard/today` | מטען הדאשבורד | ✓ |
| GET | `/dashboard/:date` | לפי תאריך | ✗ |
| POST | `/attendance/bulk` | רישום נוכחות קבוצתי | ✓ |
| GET | `/attendance/athlete/:id/compliance` | ציות ספורטאי | ✓ |
| GET | `/attendance/red-list` | רשימת סיכון | ✗ (מגיע דרך הדאשבורד) |
| GET | `/attendance/event/:eventId(/athlete/:athleteId)` | נוכחות לאירוע | ✗ |
| POST | `/attendance/resolve-check-in` | סגירת check-in | ✓ |
| GET/POST/PUT/DELETE | `/notes(/:id)` + `/notes/target/...` | הערות פולימורפיות | חלקי (ראה 2.16) |
| GET/POST/PUT/DELETE | `/folders(/:id)` | תיקיות ספריית אימונים | ✓ (GET/POST; עדכון/מחיקה ✗) |

**⚠️ אין נתיב תחת קידומת `/api` בכלל** — אף על פי ש-AdminTodoList ושני handlers בדאשבורד קוראים ל-`/api/tasks`, `/api/notes`, `/api/contact-record` (404 מובטח).

## 2. פירוט לפי מודול

> אלא אם צוין אחרת: PUT ממזג ב-spread מעל הישות (`{...existing, ...body, id}`) — שדות שרירותיים עוברים דרך; אין ולידציה של תוכן.

### 2.1 Groups
- `GET /groups/:id` **רשום לפני** `GET /groups` (סדר הפוך מהמקובל — עובד). `GET /groups` מחזיר את כולן.
- `POST` שומר רק: `name, coach, level, sport, schedule (default [])` — **משמיט** `description, maxAthletes, color, notes, goals` (קיימים בטיפוס/בנתונים; מגיעים רק דרך PUT).
- `DELETE` מחזיר 200 עם הקבוצה שהוסרה; 404 אם לא קיימת. **אין cascade** — יחסי athleteGroups ושיוכים מתייתמים.

### 2.2 Athletes
- `POST` whitelist: `name, level, age, phone, parentPhone, notes` + אתחול `tests:[], goals:[], zones:{}` — **משמיט** email, height, weight, experience, restingHR, maxHR וכו' (מצטרפים רק ב-PUT עוקב).
- `PUT` מגן על `goals/tests/zones` ב-`??`; ⚠️ **לא מאכף את ה-id** — body יכול להחליף מזהה.
- `DELETE` מחזיר 200 `{message:"Athlete deleted"}` **גם כשהמזהה לא קיים**; לא מנקה יחסים/הערות/שיוכים.

### 2.3 Trainings (ספריית אימונים)
- `POST` שומר `type, title, description, equipment([]), steps([]), notes("")` + כופה `creationDate`; **משמיט** `folderId, duration` ביצירה.
- `PUT` שומר id (בהערה בקוד). 
- **`DELETE` עם cleanup חלקי**: בונה `trainingSnapshot` מהאימון, מצמיד אותו לכל `trainingAssignments` עם `trainingId` תואם ומרוקן+מצמיד snapshot לכל `scheduledWorkouts` עם `workoutLibraryId` תואם — מופעי לוח שורדים מחיקת ספרייה.

### 2.4 Programs
- try/catch; שגיאות בפורמט `{error}`.
- `POST` = `{id: Date.now().toString(), ...req.body, createdAt}` — ⚠️ **spread אחרי ה-id**: id שנשלח מהלקוח מנצח.
- `PUT` לא מאכף id/createdAt. **DELETE בלי cascade** — משאיר meso-blocks, planned-weeks, scheduled-workouts, templates והחלות יתומות.

### 2.5 ProgramTemplates
- `POST` whitelist: `name, sport, durationType, startDate, weeksLength, assigneeType, assigneeName, mainGoal, level, macroEvents([])`. האוסף לא קיים ב-DB — נוצר בכתיבה ראשונה.

### 2.6 MesoBlocks / 2.7 PlannedWeeks / 2.8 ScheduledWorkouts
- שלושתם: GET עם פילטר אופציונלי (`?programId` / `?mesoBlockId` / `?programId&plannedWeekId` — AND), POST עם whitelist, PUT מאכף id, DELETE מחזיר את הישות + 404 מדויק.
- PlannedWeeks POST: `focus` ברירת מחדל `"General"`. ScheduledWorkouts POST: `status` ברירת מחדל `"Planned"`, `trainingSnapshot` עובר בלי ולידציה.

### 2.9 Plans (legacy) / 2.10 Blocks (מת)
- Plans: `POST` שומר `programId, name, description(""), blocks([])`; blocks **מוטמעים** בתוך ה-plan. האוסף נוצר בכתיבה ראשונה.
- Blocks: route מלא קיים אך **אף קוד לא קורא לו**; `db.blocks` ריק.

### 2.11 CalendarEvent (`/events`) — המודול המורכב ביותר
**מנוע מיזוג** (`GET /events/range`, דורש `?start&end`, אחרת 400):
1. `trainingAssignments` → אירוע לכל שיוך: type מהאימון (default `"training"`), title מהאימון (default `"Training"`), end = start+60 דק', `sourceId = "training-{assignmentId}"`, id = **UUID חדש בכל בקשה**.
2. `groups[].schedule` → אירועי `groupSchedule` מחזוריים: מרחיב כל סלוט לפי מופעים בטווח (`(targetDay - currentDay + 7) % 7` על `getDay()`, כלומר day=0 נחשב ראשון — עובד גם עם day-string בזכות כפיית טיפוס של `-`), title = `"{group.name} - {group.sport}"`, `sourceId = "groupSchedule-{groupId}-{ms}"`, id ארעי.
3. **Overrides**: התאמה לפי `sourceId` **וגם** שוויון ms מדויק של `originalStartTime`; `isCancelled` מסיר את המופע, אחרת דורס title/זמנים.
4. `db.events` (ידניים) מסונן לטווח ומצורף.
- `GET /events` — רק `db.events || []` (בלי מיזוג).
- `POST /events` — שומר `title, type, startTime, endTime, athleteId/groupId/sourceId` בלי ולידציה (`new Date(undefined)` → Invalid Date → null ב-JSON). **משמיט `done`**.
- `POST /events/override` — upsert לפי **sourceId בלבד** (400 אם חסר sourceId/originalStartTime); ⚠️ מקור מחזורי אחד יכול לשאת **דריסה אחת בלבד** — מופע שני דורס את הראשון.
- `PUT /events/:id` — merge; ⚠️ לא מאכף id.
- `DELETE /events/:id` / `/events/override/:id` — **200 תמיד**, גם לישות שלא קיימת.
- `GET /events/athlete/:id` לא מחזיר 404 לספורטאי לא קיים ([]), בניגוד ל-`/events/group/:id` (404).

### 2.12 AthleteGroup (טבלת צירוף)
- GET עם `?athleteId&groupId` (AND). `GET /group/:groupId` — JOIN שמחזיר **ספורטאים** (לא יחסים).
- `POST` — 400 אם חסר אחד המזהים; **409 על יחס כפול** (ה-409 היחיד במערכת). `DELETE` — 404 מדויק.
- אין PUT. אין cascade במחיקת ספורטאי/קבוצה.

### 2.13 TrainingAssginment (שם הקובץ עם שגיאת כתיב)
- `GET /:id` — ⚠️ **באג: מחפש לפי `a.groupId === id`** במקום לפי `a.id` — שיוכי ספורטאי (groupId=null) לעולם לא יימצאו; בנוסף לוג את כל האוסף בכל קריאה.
- `POST` — ולידציה אמיתית (היחידה כמעט בשרת): 400 אם חסר `trainingId/startTime`; 400 אם איט או גם וגם `athleteId+groupId`. ברירות מחדל: status=`"PENDING"`, notes=`""`. id שנשלח נזרק.
- `PUT` — מאמת את XOR גם בעדכון; לא מאכף id.

### 2.14 Dashboard
- `GET /today` — TodayTimeline להיום; `GET /:date` — 400 לתאריך לא תקין. (`today` רשום לפני `/:date`.)
- ראה פירוט החישוב ב-[04-pages-and-flows.md](04-pages-and-flows.md).

### 2.15 Attendance
- `POST /bulk` — **200** (לא 201); 400 אם אין `eventId` או `records[]`. Upsert לפי (eventId, athleteId); `isVerified` תמיד true.
- `GET /athlete/:id/compliance?days=7` — ספירה לפי **createdAt** של רשומות הנוכחות (לא זמן האירוע). sick/injured תמיד 0.
- `POST /resolve-check-in` — 400 בלי athleteId, 404 אם לא קיים; קובע `athlete.lastCheckIn = now`. הערה בקוד "Create a note for this check-in" — **בלי מימוש**.

### 2.16 Notes
- `targetType` נאמת מול 4 הערכים (400). **`category` לא נאמת**.
- נקודות גישה: `GET /notes`, `GET /notes/target/:type/:id`, `.../recent?limit=5`, `.../category/:category`, `GET /notes/:id`, `POST` (400 אם חסר אחד מהשדות), `PUT /:id` (⚠️ בלי whitelist — אפשר לדרוס id/targetType), `DELETE /:id`.
- ⚠️ `?limit` לא מספרי → `slice(0, NaN)` → מערך ריק.

### 2.17 Folders
- CRUD מלא; `POST` שומר רק `name`. **`DELETE` מנקה `folderId`** מכל האימונים בתיקייה (עם `delete` — הסרת מפתח ולא null).

## 3. שירותים (server/src/services)

### 3.1 attendanceService
- `recordBulkAttendance` — upsert שורה לכל (eventId, athleteId); שומר id/createdAt בעדכון.
- `getAthleteCompliance(athleteId, days=7)` — מספר רשומות ב-N ימים אחרונים לפי createdAt; אחוז ציות = attended/assigned.
- `hasMissedTwoSessionsSinceCheckIn` — מונה החמצות **רצופות** (מהחדש לישן) עד ה-check-in האחרון; אמת ב-≥2.
- `getRedListAthletes` — לכל ספורטאי: 7+ ימים בלי check-in (999 אם מעולם) → warning "noContact"; 2+ החמצות רצופות → danger "missedSessions" (count מוקשח 2); `injured===true` + 3 ימים → danger "recentInjury". ממוין danger→warning→safe. ⚠️ תיעוד הקוד לא תואם למימוש; משתנה compliance מחושב ולא בשימוש.

### 3.2 dashboardService
- `getUnifiedDashboard(date)`: מאחה `db.events` (מסונן ליום) עם overrides (**התאמה לפי יום בלבד** — שונה מהלוח שמשווה ms מדויק), מוסיף אירועי groupSchedule מסונתזים (⚠️ `trainingTime.day + 1` על string → "11" — **סדרי קבוצות לא מופיעים בדאשבורד**; מזהה בפורמט שונה מהלוח; **לא כולל שיוכים**, בניגוד ל-/events/range), ומחזיר stats + atRiskAthletes (getRedListAthletes — נקרא פעמיים).
- ~85 שורות של לוגיקת סיכון ישנה מסומנות כהערות.

### 3.3 notesService
- שאילתות target עם **תאימות לאחור** לשדות legacy `athleteId`/`groupId`; מיון חדש→ישן.
- `createNote` — id `note_{ts}_{random}`; category עובר בלי ולידציה. `updateNote` — merge בלי whitelist.

## 4. קודי שגיאה — התנהגות בפועל

| מצב | התנהגות |
|---|---|
| חוסר ולידציה | כמעט בכל מקום — ערכים חסרים נשמרים כ-null/undefined |
| ישות לא נמצאה | `404 {message}` (רוב ה-routers) או `404 {error}` (Programs/Dashboard/Attendance/Notes) |
| DELETE לא קיים | 200 שקרי ב-athletes, events, event-overrides; 404 מדויק בשאר |
| ולידציות | 400 אמיתי רק ב-events/range, override, training-assignments, attendance/bulk, notes POST, athlete-groups POST (וגם 409 יחס כפול) |
| שגיאת שרת | Programs/Dashboard/Attendance/Notes: JSON 500 `{error}`; **כל השאר: HTML 500 של Express** (אין try/catch) |
| פורמט שגיאה | מעורב: `{message}` מול `{error}` |

## 5. מדיניות מזהים בשרת

`Date.now().toString()` ברוב ה-POSTs · `crypto.randomUUID()` לאירועים ידניים/overrides/נוכחות **ולאירועים ממוזגים (ארעי!)** · `note_{ts}_{random}` להערות. פירוט מלא ב-[02-data-models.md](02-data-models.md) סעיף 14.

## 6. פרוטוקול ותשתית

- Express 5 + `cors()` פתוח + `express.json()` — **שתי middleware בלבד**. אין auth, אין מגבלות קצב, אין לוג בקשות מרכזי, אין error middleware.
- `server/src/env/env.ts` (dotenv, פורט 3000) — **מת: לא מיובא**; הפורט 3001 מוקש ב-index.
- fileDb: קריאה/כתיבה של הקובץ כולו בכל בקשה, בלי נעילות/אטומיות (ראה [01-architecture.md](01-architecture.md)).
- לוגים: `logger.info/error` לקונסולה ברוב ה-routers (Programs לא מלוגג כלל); `/training-assignments/:id` מדפיס **את כל האוסף** ללוג בכל קריאה.

## 7. שכבת ה-API בלקוח (`client/src/api/`, 17 מודולים)

- **כתובת הבסיס**: `env.apiUrl` מ-`import.meta.env.VITE_API_URL` (`client/src/env/env.ts`). אין קובץ `.env` בפרויקט ואין proxy ב-Vite — בלי משתנה חיצוני ה-URL הוא `undefined/...`.
- **שני סגנונות מתקיימים במקביל**: `fetch` גולמי (רוב המודולים) מול axios instance משותף (`api.ts` — משמש רק את מודולי ה-periodization: mesoBlock, plan, plannedWeek, program, programTemplate, scheduledWorkout).
- **טיפול שגיאות לא-עקבי**: חלק בודקים `res.ok` וזורקים; `getAthletes/getAthlete/getGroups/createGroup/updateGroup/createAthlete/updateAthlete/getAssignments` מחזירים `res.json()` **בלי בדיקה** (גוף שגיאה חוזר כאילו היה נתונים); מחיקות רבות fire-and-forget.
- קריאות **שעוקפות את השכבה**: `fetch("/api/tasks")` ב-AdminTodoList, `fetch("/api/notes")` + `fetch("/api/contact-record")` בדאשבורד — נתיבים לא קיימים בשרת.
- פונקציות רבות מיוצאות ולא בשימוש (בעיקר read-side של periodization, `/blocks` כולו, `getTrainingsByGroup/Athlete`, `getGroupEvents/getAthleteEvents/getAllEvents`, `getRedListAthletes` ועוד) — פירוט ב-[08-gaps.md](08-gaps.md).