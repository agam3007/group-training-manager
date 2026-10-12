# SPEC 07 — הלוח השבועי ובונה האימון

> איפיון מצב קיים (AS-IS) · מסמך ראשי: [../SPEC.md](../SPEC.md)
>
> מקור: `client/src/pages/Schedule/Schedule.tsx`, `client/src/components/calendar/**` (הועתק מחדש מאפס בשכתוב — אין כמעט דמיון לגרסה הקודמת), `server/src/routes/CalendarEvent.ts`.
>
> **שינוי יסודי**: הלוח כבר **לא חי בזיכרון**. הוא ניזון מ-`GET /events/range` שממזג בשרת שיוכי אימונים, סדרי קבוצות (וירטואליים), דריסות ואירועים ידניים — ופעולות הלוח נשמרות לשרת (אימונים דרך `/trainings`, שיוכים דרך `/training-assignments`, אירועים דרך `/events`, דריסות דרך `/events/override`).

## 1. מקור הנתונים, השליפה והשמירה

### 1.1 מה מוצג
- **ספריית אימונים** (`trainings`): נטענת ב-`App` (`GET /trainings`, state משותף לכל העמודים) ו**שוב** ב-`Schedule` עצמו (כפילות).
- **אירועי הלוח**: `GET /events/range?start&end` — השרת ממזג 4 מקורות (פירוט ב-[03-api.md](03-api.md) סעיף 2.11): שיוכים (`sourceId="training-{assignmentId}"`), סדרי קבוצות (`groupSchedule-{gid}-{ms}"`, id **ארעי — UUID חדש בכל fetch**), overrides, ואירועים ידניים.
- מסלולי `/schedule/group/:groupId` ו-`/schedule/athlete/:athleteId` מציגים את אותו Schedule; הסינון מתבצע בלקוח (`filteredEvents`).
  - ⚠️ **`/schedule/group/:groupId` מתעלם מהפרמטר** — Schedule קורא רק את `athleteId` מ-useParams, ולכן המסלול זהה לחלוטין ל-`/schedule`.
  - ⚠️ **אירועי קבוצה לא מוצגים ביומן הספורטאי**: הסינון בודק `groups.includes(athleteId)` על מערך **אובייקטי יחסים** — תמיד false (באג; N+1 קריאות לכל אירוע קבוצה בדרך).

### 1.2 טווח השליפה
- שבוע **שני-ראשון**: `diff = day===0 ? -6 : 1-day` — בכל הקצוות **פרט לאפקט השליפה** שמשתמש ב-`-7` ליום ראשון → ⚠️ **בימי ראשון הטווח שנשלף הוא שבוע קודם והאירועים של היום חסרים**.
- `Schedule` שולף פעם אחת בעלייה; אפקט ב-`Calendar` שולף שוב עם כל שינוי `weekOffset` (כולל פעם נוספת בעלייה — כפילות). רענון אחרי מחיקה שולף חלון של 8 ימים (`+7`).

### 1.3 מיפוי פעולות ← קריאות שרת

| פעולה | קריאות |
|---|---|
| יצירה מתא ריק ("New workout") → "Save & Schedule (One-time)" | מסלול ספורטאי: `POST /training-assignments` (עם trainingSnapshot) · אחרת: `POST /events` (type=סוג האימון, `sourceId="training-{id}"`, end=start+(duration??60)) |
| יצירה → "Save to Library & Schedule" | אותו הדבר + `POST /trainings` קודם |
| יצירה מתא ריק ("Choose from library") | כמו One-time (הפריט לא נוצר מחדש) |
| יצירה מתא ריק ("Group schedule override") | `POST /events` עם `type:"groupSchedule"`, title `"{Group} - {Training}"`, `sourceId="groupSchedule-{gid}-{ms}"` |
| גרירת פריט ספרייה לתא | מסלול ספורטאי: `POST /training-assignments` · מאמן: `POST /events` **בלי sourceId** (האימון מזוהה אח"כ רק לפי כותרת) |
| גרירת אירוע לתא אחר | `groupSchedule` → `POST /events/override` (העברת זמנים) · אירוע ספורטאי → `PUT /training-assignments/{id}` (⚠️ ה-id מנוחש מ-sourceId — עלול להחטיא) · אחרת → `PUT /events/{id}` |
| עריכת אימון מהספרייה | `POST /trainings` / `PUT /trainings/{id}` |
| עריכת אימון מתוך אירוע לוח | "One-time": `POST /trainings` עותק `"{title} (Modified)"` + החלפת `trainingId` בשיוך התואם · "Library": `PUT /trainings/{id}` על המקור |
| מחיקת אירוע לוח | `groupSchedule`: אם כמה אירועים ב-fetch חולקים sourceId → `POST /events/override` ביטול; אחרת `DELETE /events/{id}` · אחרת: `DELETE /events/{id}` |
| מחיקת אימון מהספרייה | `DELETE /trainings/{id}` — השרת ממיר שיוכים ואימונים מתוכננים ל-snapshot |

- ⚠️ **ביטול מופע של סדר קבוצה שבור בפועל**: למופעים המסונתזים בשרת יש sourceId **ייחודי לכל מופע** ו-id ארעי — בדיקת "חוזר?" כמעט תמיד false, ו-`DELETE /events/{id}` לא מוצא כלום (האירוע וירטואלי) — **האירוע חוזר ב-fetch הבא**. ביטול עובד רק לאירועי groupSchedule ידניים.

### 1.4 זיהוי האימון מאחורי אירוע (`getTrainingForEvent`)
שרשרת: sourceId שמתחיל ב-`training-` → חיפוש בספרייה לפי ה-id שבסופו → מפה מקומית `localTrainingBySourceId` (זיכרון בלבד) → `GET /training-assignments` והתאמת `assignment.id` → חיפוש שיוך לפי זמן התחלה מדויק → **fallback: האימון הראשון בספרייה ששמו מוכל בכותרת**.

## 2. מודל הזמן והפריסה

- **ימים**: 7 עמודות שני→ראשון. מיקום לפי `(getDay()+6)%7` — **ראשון ממופה נכון לעמודה 6** (הבאג הישן תוקן בתצוגה; שרד רק בשליפה, סעיף 1.2). הדגשת "היום": בכותרת לפי השוואת תאריכים, בגריד לפי `todayIndex` + רקע עמודה.
- **סמנטיקת ימים של קבוצות**: `Group.schedule[].day` נכתב כ-0=ראשון (GroupDetails), השרת מפרש כך גם (`(targetDay-currentDay+7)%7` מול `getDay()`; ההערה בקוד "0=Monday" שגויה אך לא מזיקה). ⚠️ **GroupCard מציג את אותו שדה עם מערך שני-ראשון** — תוויות ימים חלוקות באחד.
- **שעות**: 06:00–22:00 (16 תאי שעה, אחרון מכסה 21–22), קוורטרים 0/15/30/45. `calendarConfig` מגדיר `{startHour:6, endHour:22, defaultDuration:60, snapMinutes:15}` — **רק startHour בשימוש**.
- **סקאלה**: 60px/שעה = 1px/דק'. `top=(startH-6)*60+startMin`, `height=durationMin`. ⚠️ אירועים מחוץ לטווח לא נחסמים (top שלילי).
- ⚠️ **חוסר התאמת יישור**: עמודת הזמן בגוף הלוח רחבה 70px, בכותרת ובשורת הסיכום 80px — הכותרות מוסטות 10px מהעמודות.
- **קו זמן נוכחי**: נקודה אדומה בעמודת היום בלבד — ⚠️ מחושב פעם אחת ב-render (לא מתקתק), ומוגדר `START_HOUR=5` מקומי בעוד האירועים משתמשים ב-6 → **הקו מוצג שעה מתחת למקום**.
- **חפיפות**: הצבת עמודות נאיבית לפי אשכול חפיפה (רוחב מתחלק); בשרשראות של 3 אירועים עלולים להישאר חפיפות ויזואליות.
- **DaySummeryRow** — עדיין div ריק (placeholder).
- פריסה כללית: Library בצד שמאל, ואז שורת ניווט (◀/Today/▶, טווח השבוע, LoadCalculator, בורר קבוצה), WeeklyHeader, גריד ניתן לגלילה.

## 3. אינטראקציות

| פעולה | התנהגות |
|---|---|
| לחיצה על תא רבע-שעה | פותחת מודאל "New event" עם 3 אפשרויות: New workout (פופאפ אימון חדש), Choose from library (בחירה מהספרייה, מקובצים לפי סוג), Group schedule override (בחירת קבוצה+אימון → אירוע groupSchedule חד-פעמי) |
| לחיצה על אירוע | `groupSchedule` → GroupSchedulePopup · `run/bike/swim/strength/training` → TrainingDetails (אחרי זיהוי האימון) · `task/checkin/call` → **כלום** |
| לחיצה כפולת | stopPropagation בלבד — אין התנהגות |
| גרירת פריט ספרייה לתא | שחרור בתא רבע-שעה → יצירת שיוך/אירוע לפי המסלול (סעיף 1.3) |
| גרירת אירוע לתא אחר | העברה לפי סוג (override / PUT assignment / PUT event); משך נשמר |
| **שינוי משך בגריד — אין** | לא קיים יותר resize-handle; המשך נקבע מ-`training.duration ?? 60` ביצירה, וניתן לשינוי רק דרך GroupSchedulePopup (override) או עריכת האימון |
| ניווט שבועים | ◀/▶ משנים weekOffset (גורם re-fetch), Today מאפס |
| בורר קבוצה (מאמן) | מסנן אירועים לפי groupId בלקוח |
| סגירת פופאפ בלחיצה על ה-overlay | נסגר **בלי אישור** — טיוטת אימון חדשה אובדת |

## 4. פופאפ אימון — `TrainingPopup`

פופאפ-על (עד 1400px) עם עבודת עריכה **מבוססת-טקסט** (שכתוב מהיסוד):

- **כותרת**: שם האימון לחיצה-לעריכה (h2 ↔ input, Enter/blur מאשר) + ✕.
- **שורת ענף**: `SportMetricSelector` — 3 כפתורים בלבד (swim/bike/run). ⚠️ props ה-metrics וה-state המקביל **מתים** — לא מרונדרים ולא נשמרים.
- **גוף**: משמאל `WorkoutTextEditor` (flex:1; הכפתור drop-target לפריסטים); מימין פאנל סטטיסטיקה קבוע (320px): מרחק (ק"מ), זמן, התפלגות אזורים עם אחוזים, Description, Notes; בתחתית `WorkoutVisualizer` בכל הרוחב (drop-zones להוספת פריסט בין בלוקים).
- **פריסטים**: `PresetSidebar` **מת (לא מרונדר)**. הפריסטים החיים: `getDefaultSet` — warmup (1×10min Z1), cooldown (1×8min Z1), steady (1×20min Z2), interval2 (6×2min R60s Z4), interval3 (5×3min R30s Z4 + 5×2min Z2), rampup (3×5min Z2→Z3→Z4), rampdown, drill (1×200m Z1) — מוספים **בגרירה** על העורך או על drop-zone בוויזואליזר. משכי הפריסטים בדקות.
- **סנכרון דו-כיווני טקסט↔steps**: פרסור ב-Enter/blur בלבד (לא בזמן הקלדה); פרסור תקין → `setSteps`; טקסט ריק → steps=[]; שינוי steps מבחוץ (פריסט) מתורגם חזרה לטקסט כשלא בהקלדה. שגיאות פרסור מוצגות בתיבה — אך **הפרסר לעולם לא מחזיר שגיאות** (כל שורה לא מזוהה הופכת לצעד טקסט). פאנל "Format Help" מתעד את התחביר.
- **כפתורי השמירה** לפי מצב: `normal` — "Add" (שומר לספרייה דרך ה-parent) + מחיקה אם סופקה; `isGroupSchedule` — "Save to Library & Schedule" / "Save & Schedule (One-time)". ⚠️ מצבי `libraryNew/libraryEdit/calendarSchedule` (footer חלופי, `onSaveAsNew/onUpdateExisting`) **מוגדרים ולעולם לא מועברים** — מתים. אין שדה משך בפופאפ (עובר דרך `training.duration`).
- `buildUpdatedTraining` שומר id/creationDate ומעדכן `title, description, type, steps, notes`.

## 5. פורמט הטקסט — `WorkoutTextParser` (דקדוק בפועל)

`parseWorkoutText(text, sport)`: פיצול שורות; לכל שורה:
1. **כותרות בלוק** (אחרי הורדת `:`/`-` והומשה): `wu|warmup`, `cd|cooldown`, `d|drill`, `main|"main set"|set`, `technique|"pre set"|prep|tech` → setType. קבוצת ברירת מחדל לפני כל כותרת: **warmup**. ⚠️ `"pre-set"` לא מזוהה (הופך ל-"preset").
2. **כפל**: `^(\d+)[xX*]` → reps; `3*5*100m` → sets=3, reps=5.
3. **מנוחה**: `R:30`, `R:2min`, `REST 45` → שניות; ההתאמה האחרונה מנצחת.
4. **אינטנסיביות**: `Z1..Z5` או `EASY|THRESHOLD|HARD|ALLOUT|MAX|FAST|SPRINT|SLOW` — ראשון מנצח.
5. **סגנון שחייה**: free/fr→FR, back/bk→BK, breast/br→BR, fly→FLY, medley/im→IM, mix→MIX.
6. **תנועה**: run→Run, walk→Walk, jog→Jog.
7. **ציוד (tags)**: paddles, pullbuoy, fins, snorkel, band, kickboard, shoes, belt, parachute.
8. **מדדים**: `MM:SS` → דקות שבריות; מספר בלי יחידה → **מטרים**; יחידות m/km/mi/min/s/sec/h. שורה מורכבת (כמה מדדים): סיווג מספרים למרחקים/זמנים; אם המרחק הראשון שווה לסכום השאר → הוא הכמות, אחרת סכום הכל; notes = שארית השורה. שורה בודדת → mode יחיד.
9. **קיבוץ**: שורת "כפל בודד" (למשל `3 *`) בולעת את השורות הבאות — סכימת מרחק/זמן לצעד אחד עם פירוט ב-notes; צעדים עוקבים זהים מתמזגים.
- **סריאליזציה הפוכה** `workoutStepsToText`: כותרת TYPE: רק בשינוי סוג; קידומות `sets *` / `reps *`; שדות עזר; פירוט ב-notes כשורות.
- ⚠️ **באגי סטטיסטיקות הפופאפ**: `formatTime` מקבל דקות ומפרמט כשניות ("0:45" ל-45 דק'); `sets` לא נספר במרחק הכולל; `mi` מחולק ב-1000.

## 6. ספרייה — `Library`

פאנל צד שמאל של הלוח ושל לוח התוכניות — **מקור האימונים לשימוש חוזר**:
- תיקיות מ-`GET /folders`, קיבוץ לפי `folderId` ("Unsorted" פסאודו), יצירת תיקייה inline (בדיקת כפילות).
- חיפוש לפי title/description/type.
- "+" ← "New Training" (פופאפ על טיוטה: type=swim, duration=60) או "New Folder".
- לחיצה על פריט → TrainingDetails (תצוגה).
- **גרירה**: לתא בלוח → תזמון; לכותרת תיקייה → העברה (`PUT /trainings` עם folderId; "Unsorted" מסיר).

## 7. LoadCalculator

ווידג'ט בשורת הניווט: "Week load" + מדד (Time/TSS/ACWR/Ext) + tooltip פירוק ענפים.
- ⚠️ ה"שבוע" הוא **7 הימים האחרונים מעכשיו** — לא השבוע המוצג (ניווט לא משנה את הערך).
- נוסחאות: time = מספר אירועים×50 · tss = Σ לפי ענף (run 150, bike 180, swim 120, strength 110, default 100) · acwr = (שבועי×50) / ((28 ימים×50)/4) — ⚠️ בפועל תמיד ~4 כי האירועים שבידיו הם שבוע אחד בלבד · ext = סכום דקות.

## 8. GroupSchedulePopup

פופאפ לפעולה על **מופע בודד** של אירוע `groupSchedule`:
- שדות Start/End (type=time) + בחירת אימון מהספרייה או "Create New" (TrainingPopup מקונן).
- "Save One-time Override" → `POST /events/override` עם `modifiedTitle: "{Group} - {Training}"` והזמנים שנבחרו.
- "Cancel This Session" → override ביטול / DELETE — ⚠️ שבור לסדרים אמיתיים (סעיף 1.3).
- ⚠️ **שמירה אוטומטית בסגירה**: ההשוואה `HH:MM` מקומי מול `toISOString()` (UTC) כמעט תמיד לא-שווה → סגירה סתם יוצרת override, ובלי אימון נבחר הכותרת הופכת ל-"{Group} - Custom Training"".

## 9. TrainingDetails

מודאל תצוגה בלבד, שתי כניסות: פריט ספרייה / אירוע לוח. מציג כותרת, `type emoji • description`, רשימת steps (נקודת צבע לפי setType, כמות, אינטנסיביות, fallback "Z?") ורשימת notes.
⚠️ באג תצוגה: משך מוצג כ-`Math.round(duration/60)` בעוד duration כבר בדקות — סט של 10 דק' מוצג "0 min". כפתורים: Edit / Delete (או "Cancel Session" ל-groupSchedule) / ✕.

## 10. שאריות וקוד מת במודול

- `WorkoutBuilder` + `EnduranceSetCard` (מתחת ל-trainingPopup/components/workoutBuilder) — **מיושמים אך לא מיובאים ע"י אף קובץ**.
- `PresetSidebar` — מיוצא, לא מרונדר; שארית עמודת 120px ב-CSS.
- מצבי footer המתים של TrainingPopup (סעיף 4), metrics מתים, `typingTimeout` שנוצר ולעולם לא נקבע, `onStepClick` לא בשימוש, console.log בוויזואליזר.
- `client/src/types/event.ts` — טיפוס legacy מת.
- פונקציות API לא בשימוש במודול: `getAllEvents/getGroupEvents/getAthleteEvents`, `getTrainingsByGroup/getTrainingsByAthlete` (⌛ גם **שבורות** — הנתיבים לא קיימים בשרת), `getAssignmentById`.
- יחידות זמן לא עקביות בין רכיבים: הפרסר/פריסטים/סטטיסטיקות — דקות; EnduranceSetCard — שניות; TrainingDetails — מחלק דקות ב-60.