# SPEC 04 — עמודים, ניתוב וזרימות משתמש

> איפיון מצב קיים (AS-IS) · מסמך ראשי: [../SPEC.md](../SPEC.md)

## 1. ניתוב

מוגדר ב-`client/src/App.tsx` — עץ ניתוב אחד (הכפילויות של הגרסה הקודמת נוקו) בתוך `AppLayout`:

| נתיב | רכיב | מצב |
|---|---|---|
| `/` | `Dashboard` (מקבל `setTrainings` — ⚠️ prop מת, לא בשימוש) | פעיל |
| `/schedule` | `Schedule` (מקבל `trainings, setTrainings` מ-App) | פעיל |
| `/schedule/group/:groupId` | `Schedule` | ⚠️ **הפרמטר מתעלם** — זהה ל-/schedule |
| `/schedule/athlete/:athleteId` | `Schedule` | פעיל; מסנן לספורטאי (אירועי קבוצה לא מוצגים — באג) |
| `/athletes` | `AthletesPage` | פעיל |
| `/athletes/:id` | `AthleteDetails` | פעיל |
| `/groups` | `GroupsPage` | פעיל |
| `/groups/:id` | `GroupDetails` | **פעיל — עמוד מלא שלא היה קיים** |
| `/training-plans` | `TrainingPlan` | פעיל (מודול חדש) |
| `/training-plans/calendar` | `ProgramCalendarPage` | פעיל; programId עובר ב-router state — **רענון מאבד בחירה** |
| `/calendar/*` | — | **אין כזה** — אך "Open Group Calendar" ב-GroupDetails מנווט אליו (מסך ריק) |

**AppLayout**: SideBar צר (70px) עם 5 NavLink + tooltip ב-hover: Dashboard (`/`, Home), Schedule (`/schedule`, Calendar), Groups (`/groups`, Users), Athletes (`/athletes`, User), Training Plans (`/training-plans`, Folder). לוגו = אייקון Dumbbell בלבד — בלי שם מערכת, משתמש או יציאה. עמודי `/schedule*` ו-`/training-plans/*` מקבלים `no-padding`.

**זרימת state**: אין סטייט גלובלי — `App` טוען `trainings` פעם אחת (`GET /trainings`) ומעביר לכל מסלולי ה-Schedule; Schedule טוען **שוב** בעצמו (כפילות). כל עמוד טוען את שלו ב-useEffect.

## 2. Dashboard (`/`)

טוען נקודת קצה **אחת**: `GET /dashboard/today` (מטען TodayTimeline: events, stats, atRiskAthletes). לאחר כל מוטציה — `refreshTrigger` מוגדל והכול נטען מחדש.

### 2.1 פריסה
- **Stats** (מספרים אמיתיים מהשרת): Athletes, Groups, Trainings Today (⚠️ סופר את **כל** האירועים של היום), Calls Pending (⚠️ בפועל — מספר הספורטאים בסיכון). `pendingTasks` מחושב בשרת ולא מוצג.
- **ראשי**: TodayTimeline. **QuickInsightWidget ו-AdminTodoList מסומנים כהערה** (לא מרונדרים — ראה 08).
- **צד**: AthleteCheckins (רשימת סיכון).

### 2.2 TodayTimline — "Today's Schedule"
- מציג את אירועי היום (השרת כבר מסנן ליום — תוקן מהגרסה הקודמת), ממוין לפי שעה.
- צבע לפי type: training ירוק, task כתום, call כחול, **כל השאר אפור** (כולל groupSchedule).
- פעולות: ✓ (done — נשמר דרך PUT), Edit, 🗑 (DELETE), + (הוספה). אירוע מסומן done מוצג מושתק+קו חוצה.
- ⚠️ **סימון ✓ על אירוע groupSchedule פותח את פופאפ הנוכחות** (ראה 2.4); עריכת/מחיקת אירוע groupSchedule סינתטי נכשלים בשקט (המזהה לא קיים ב-db.events).
- **AddEventModal**: שלושה שדות בלבד — Title, Time (בלי בורר תאריך — תמיד היום), Type (task/call/training). end = start+60 דק'. ⚠️ באג מילוי-עריכה: השעה מאותחלת מ-slice(0,10) של ISO (תאריך לתוך שדה time).
- ⚠️ מסנני selectedGroupId/selectedAthleteId ו-ghosting — **מוגדרים ולעולם לא נקבעים** (מתים).

### 2.3 AthleteCheckins — "At-Risk Athletes"
מוזן מ-`atRiskAthletes` שמחושב בשרת (`getRedListAthletes`): 7+ ימים מאז check-in → warning; 2+ החמצות רצופות מאז check-in → danger; `injured===true` + 3 ימים → danger. ממוין danger→warning. שורה: פס צבע סיכון, שם, סיבות ("missed 2 workout(s)", "injured", "no contact for N days" — 999 למי שאין לו check-in בכלל). לחיצה → CheckInResolveModal:
- כפתור WhatsApp (wa.me מ-`athlete.phone`, פסל לא-ספרות).
- NotesPanel (targetType=ATHLETE) — כן, הערות אמיתיות (fetch/הוספה/מחיקה דרך `/notes`).
- **Save & Resolve** → `POST /attendance/resolve-check-in` → קובע `athlete.lastCheckIn = now` → הסרה אופטימית מהרשימה. (שדה "סיכום שיחה" מוגדר אך לא מחובר לקלט — נשלח תמיד "".)
- ⚠️ הרשימה מאותחלת פעם אחת מה-props ולא מתרעננת כשהדאשבורד נטען מחדש (stale).
- ⚠️ הערות שנשלפות בלחיצה (`recentNotes`) לא מוצגות במודאל.

### 2.4 זרימת נוכחות (חדשה)
1. ✓ על אירוע groupSchedule → הדאשבורד פותר את ספורטאי הקבוצה (N+1: יחסים ואז getAthlete לכל אחד) → **AttendancePopup**: כל ספורטאי מסומן ATTENDED כברירת מחדל; כפתורי All Attended/All Missed + ✓/✗ לכל אחד; NotesPanel לכל ספורטאי + פאנל "Insights" לקבוצה.
2. אישור (**או ✕ — שניהם שומרים**) → `POST /attendance/bulk` (upsert לכל ספורטאי) + `PUT /events/{id}` done (לסינתטי — 404 שנבלע) → רענון; רשימת הסיכון מתעדכנת מהנוכחות החדשה.
- ⚠️ אין מצב SICK/INJURED/LATE בפופאפ (רק ATTENDED/MISSED); שדה הערה לכל ספורטאי לא מחובר (נשלח "").

## 3. Schedule (`/schedule` ומסלולי המשנה)

עטיפה: טוען ספרייה + אירועי השבוע, מסנן לפי מסלול (ספורטאי) ובורר קבוצה, ומעביר הכול ל-`Calendar`. פירוט מלא ב-[07-calendar.md](07-calendar.md).

## 4. Groups (`/groups`) + GroupDetails (`/groups/:id`)

### 4.1 רשימת הקבוצות
- PageHeader עם חיפוש + ⚙ (מת) + **+ שמחובר**: `createGroup` עם אובייקט ברירת מחדל → ניווט ל`/groups/{id}` — **יצירת קבוצות עובדת כעת** (אין עריכה/מחיקה ברשימה; `deleteGroup` ב-API מת).
- GroupCard: שם, סלוטי schedule, מספר מתאמנים. לחיצה → פרטי קבוצה.
- ⚠️ **מספר המתאמנים תמיד 0** — משתנה let לא-מסונכרן שנכתב בתוך async. ⚠️ תוויות הימים בכרטיס שני-ראשון בעוד העורך ראשון-שבת.

### 4.2 GroupDetails — עמוד חדש (3 עמודות)
- **שמאל — מידע**: נקודת צבע + שם, מצב עריכה (✏️/💾 עם isDirty, PUT מלא), Coach (מוצג "You" כשריק), Sport, Level, Max Athletes (לא נאכף), Color.
  - **Training Schedule**: תצוגת סלוטים (⚠️ דקות מוצגות תמיד ":00"); בעריכה: יום + שעות start/end, מחיקת סלוט, "+ Add Time" — ⚠️ מוסיף שורה חלקית `{day:"", start:""}` בלי end.
  - **Goals**: מודאל יצירה פשוט (שם תחרות, מיקום, תאריך) — נשמרים ב-`group.goals` דרך PUT (type מוקשח "general" ובלי target).
  - **"Open Group Calendar"** → ⚠️ ניווט ל-`/calendar/group/{id}` — **נתיב לא קיים, מסך ריק** (הנתיב האמיתי: `/schedule/group/:groupId`).
- **מרכז — סטטיסטיקות**: "Group Load" (⚠️ גרף ומספרים **מוקשחים** [20,40,60,30,80,50,70], "320", "1.1") ו-"Attendance" (⚠️ "82%" מוקשח) — מול **"Performance Ranges" אמיתי**: מבחן הדומיננטי בקבוצה → מינ/ממוצע/מקס/פיזור% לפי הערך האחרון של כל ספורטאי.
- **ימין — מתאמנים והערות**: רשימת ספורטאי הקבוצה (✕ מנתק — DELETE על היחס), "+ Add Athlete" — מודאל עם חיפוש ובחירה מרובה מכל הספורטאים שאינם בקבוצה → `POST /athlete-groups` לכל נבחר (409 לכפילים). NotesPanel (GROUP).

## 5. Athletes (`/athletes`) + AthleteDetails (`/athletes/:id`)

### 5.1 רשימה
חיפוש לפי שם; יצירה מהירה ללא שינוי: **+ → `POST /athletes` עם אובייקט ריק → ניווט לפרטים** (השרת שומר name ריק; שאר השדות נשמרים בעריכה). AthleteCard: אווטאר ראשי-תיבות, שם, level, גיל.

### 5.2 AthleteDetails (3 עמודות; 1054 שורות)
- **שמאל**: פרופיל (שם-input כשריק, שומר ב-Enter/blur; מחלקה injured כש-injuries truthy) + 4 טאבים במצב צפייה/עריכה (isDirty):
  - **Overview**: Age, Height, Weight, Rest HR, Max HR, Experience.
  - **Contacts**: Phone, Email, Emergency Name/Phone/Email (לא בטיפוס, נשמרים ב-PUT).
  - **Health**: מתג פציעה (⚠️ הפעלה כותבת `injuries: ""` שקרי → הסימון האדום לא מופיע עד הקלדת טקסט), Injury Type/Limitations/Focus/Injury Date/Allergies.
  - **Groups**: קבוצות הספורטאי **בשמות אמיתיים** (דרך athlete-groups) + ✕ לניתוק. ⚠️ הוספת קבוצה אפשרית רק מצד הקבוצה.
  - מתחת: **NotesPanel (ATHLETE)** — הערות אמיתיות.
  - מחיקת ספורטאי: confirm → DELETE → ניווט חזרה (⚠️ לא מנקה יחסים/הערות/שיוכים).
- **מרכז — Analytics אמיתיים** (שינוי מהותי; מחושב מ-`training-assignments`):
  - עומס אימון: דקות×~100/שעה + בונוס עד 50% לפי יחס צעדי אינטנסיביים ב-steps.
  - ציר יומי 7 ימים (רק ATTENDED; ⚠️ ערך התחלתי מוקשח עד לסיום הטעינה), KPIs: weekly load, monthly load, ACWR=weekly/(monthly/4), Streak (רצף ATTENDED מהחדש), Missed (7 ימים), מגמה %, שורת insight בודדת לפי חוקים (קפיצה >20%, ACWR>1.3, streak≥5, missed≥2, אחרת balanced).
  - compliance מהשרת — מוצג רק "N sessions".
  - **Zones**: דרופדאון ענף (Run/Bike/Swim/Gym) → ZonesTable (פירוט ב-[06-tests-and-zones.md](06-tests-and-zones.md)).
- **ימין**: **Tests** (+ → AddTestModal; רשימת PBs לפי type; לחיצה → ProgressChart) · **Goals** (+ → AddGoalModal; כרטיסי יעד עם countdown, progress לפי PB (⚠️ עובד רק target מספרי), Plan/Review) · כפתור **"Open Calendar"** → `/schedule/athlete/{id}` (כעת נתיב קיים; אך ראה באג הסינון בסעיף 3/07) · 🗑️ מחיקה.

## 6. Training Plans — `/training-plans`, `/training-plans/calendar`
מודול חדש — וויזארד 3-צעדים ליצירת תוכנית, לוח שבועות רציף לתכנון אימונים, Apply לספורטאי/קבוצה. פירוט מלא ב-[09-programs.md](09-programs.md).

## 7. זרימות משתמש עיקריות

### 7.1 יצירה ומילוי פרופיל
1. `/athletes` → + → POST ריק → פרטים; הזנת שם שומרת ב-blur; טאבים שומרים PUT מלא ב-💾.
2. מבחן/יעד → PUT של הספורטאי כולו (⚠️ באג סנכרון editData — שמירת עריכה פתוחה עלולה לשחזר).
3. קבוצה: + ברשימה → POST → פרטים; הוספת מתאמנים במודאל; סדר אימונים שבועי בלוח עריכה.

### 7.2 נוכחות ומעקב
סימון ✓ על אימון קבוצה בדאשבורד → נוכחות קבוצתית → ספורטאים שהחמיצו פעמיים רצוף מגיעים לרשימת הסיכון → שיחה + Save & Resolve מאפס את המונה.

### 7.3 תכנון בלוח השבועי
תא ריק → אימון חדש/מהספרייה/דריסת קבוצה → נשמר לשרת (אירוע או שיוך). עריכה/גרירה/מחיקה — דרך events/assignments/overrides. מחיקת אימון מהספרייה שומרת מופעי עבר בזכות snapshot.

### 7.4 תוכנית אימון
וויזארד (פרטים+אירועי מפתח+פאזות) → לוח התוכנית (אימונים מהספרייה לשבועות) → Apply על ספורטאי/קבוצה → האימונים מופיעים כשיוכים בלוח השבועי ובציר הנוכחות.

### 7.5 מה לא אפשרי כיום
- עריכת/מחיקת קבוצה מהרשימה (רק דרך... למעשה אין מחיקת קבוצה בכלל — רק ה-API קיים ומת).
- מחיקת תוכנית עם ניקוי נתוניה; תוכנית מבוססת-תאריכים שעובדת בלוח.
- ביטול מופע של סדר קבוצה וירטואלי (חוזר ב-fetch).
- משך אימון בפופאפ/בלוח (קבוע מ-training.duration ?? 60).
- עריכת הערה לאחר יצירה; נוכחות בסטטוס שאינו ATTENDED/MISSED; מסנן תאריך במודאל האירועים.
- הצגת אירועי קבוצה ביומן הספורטאי (באג סינון).