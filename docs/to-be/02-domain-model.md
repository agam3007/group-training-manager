# TO-BE 02 — דגם הדומיין

> איפיון רצוי · מסמך ראשי: [SPEC.md](SPEC.md) · החלטות: D6, D8, D9, D17
> משלים את [../specs/02-data-models.md](../specs/02-data-models.md) (AS-IS) ומתקן את הפערים המתועדים ב-[../specs/08-gaps.md](../specs/08-gaps.md) סעיפים 1, 3.

## 1. קיים ב-dev

ישויות מרכזיות: Athlete (פרופיל, טסטים, אזורים, יעדים), Group (עם schedule), athleteGroups (טבלת קשר), Training (ספריית אימונים עם steps ופרסר), TrainingAssignment, CalendarEvent + EventOverride (מיזוג מסונתז), Attendance, Note (פולימורפי), Program→MesoBlock→PlannedWeek→ScheduledWorkout (תקופון), Folder, ProgramTemplate. הכל בקובץ JSON אחד; מזהים על בסיס Date.now; אין עונות, מתקנים, קטלוג ענפים מוגדר, או רישומי ביצוע מרובי-מקורות.

## 2. עקרונות עיצוב (DOM-0)

1. **מזהה יציב לכל ישות** (UUID) — בפרט למופעי מפגש (מתקן פער 1.7/3.2 ב-AS-IS: נוכחות חייבת להיות בת-שאילה לפי מופע).
2. **תאריכים אמיתיים תמיד** — שבועות הם פורמט תצוגה של טווח תאריכים, לא עוגן מדומה (מתקן 1.6/3.4/4.30).
3. **קטלוגים נתונים להגדרה, לא מוקשחים** (D9).
4. **בכל ישות נתונים** — tenant, createdAt/updatedAt, createdBy; **ארכיון במקום מחיקה** לישויות עם היסטוריה.
5. מחיקת ישות מנקה/מארכב את כל התלויים בה (cascade עקבי — מתקן 4.35).

## 3. ישויות חדשות ומשודרגות

### 3.1 Season / עונה (DOM-1) — **חדש**
`Season { id, tenantId, name (למשל "2026/27"), startDate, endDate, status (upcoming|active|archived) }`
- כל תוכנית (Program), חברות בקבוצה, נוכחות ומפגשים מתויגים בעונה.
- **מעבר עונה**: שכפול מבנה קבוצות לעונה החדשה, העברת ספורטאים בין קבוצות, שימור כל ההיסטוריה בעונה הקודמת. כך מתמודדים עם "דגיגונים של השנה שעברה".

### 3.2 Session / מפגש (DOM-2) — מחליף את המיזוג המסונתז
```
SessionSeries (סדרה חוזרת) { id, groupId, facilityId?, dayOfWeek, startTime, endTime, effectiveFrom, effectiveTo?, title?,
                              defaultTrainingId?,   ← תוכן ברירת מחדל לכל מופעי הסדרה
                              defaultStaffIds?: [userId] }   ← שיבוץ מדריכים ברירת מחדל (D27)
SessionOccurrence (מופע) { id (יציב!), seriesId?, date, startTime, endTime, facilityId, lanes?, status: planned|completed|cancelled,
                           contentTrainingId?, staffIds?: [userId] }   ← דריסת שיבוץ פר-מופע
```
- לוח השנה מציג מופעים; נוכחות, פתקים והערות נקשרים ל-`occurrenceId` היציב.
- **תוכן ברירת מחדל לסדרה**: "כל שני = יום טכניקה" — `defaultTrainingId` ברמת הסדרה; מופע בודד יכול לדרוס (`contentTrainingId`). חוסך הגדרה חוזרת של תוכן כל שבוע (D21).
- **הוראות-על (overrides)** נשארות כמושג אבל מוגדרות נקנות: ביטול מופע בודד, הזזה, שינוי מיקום — כל אחת נשמרת כשינוי של המופע (לא דריסה גלובלית לפי sourceId — מתקן 3.2/3.14).
- אירועים ידניים (משימה, שיחה, מבחן, מרוץ) — מופעים חד-פעמיים באותה ישות, עם type.
- מפגש קבוצתי מייצר אוטומטית "צפי נוכחות" לכל חברי הקבוצה (מופיע בפורטל הספורטאי).

### 3.3 קטלוג ענפים ושיטות (DOM-3) — **חדש** (D9)
```
SportCatalog (פר-tenant): Sport { id, name, metrics: [pace|hr|power|rpe|...] },
  TestType { id, sportId, name (למשל 5K/FTP/CSS/100m), inputKind (time|distance|watts|hr), distanceKm? }
  ZoneMethod { id, name (threshold|max|race|custom|<הגדרת מאמן>), testTypes: [TestType], zoneCount, multipliers per metric }
```
- ברירת מחדל מסופקת: Run (1K/5K/10K, Threshold/Max/Race/Custom), Bike (FTP/20min), Swim (CSS/400m/100m) — **מבוסס על ZONES_CONFIG הקיים שהופך ל-seed ולא לקוד**.
- מאמן ענף אחר (כדורגל? אתלטיקה? קרוספיט?) מגדיר ענף, מבחנים ושיטות משלו — **אותה מערכת בדיוק**.
- תיקון נוסחת CSS וחישובי pace נכנסים לקטלוג כפונקציות חישוב מוגדרות (מתקן 4.2/4.3/4.8) עם **בדיקות יחידה** על הנוסחאות.

### 3.4 מתקנים ומסלולים (DOM-4) — **חדש** (D6)
```
Facility { id, name, kind: pool|gym|track|open-water|other, notes? }
  PoolFacility תוספת: laneCount }
Lane { facilityId, index, kind: standard|training|kids }
OccurrenceResource { occurrenceId, facilityId, lanes?: number[] | "all" }
```
- מפגש שוריין לבריכה שלמה (`"all"`) או למסלולים מסוימים; משתנה ממופע למופע.
- איתור התנגשויות: שני מפגשים של אותו מאמן באותו זמן / אותם מסלולים באותו מופע — אזהרה למאמן.

### 3.5 רישום ביצוע (PerformanceLog) (DOM-5) — **חדש** (D2, D17)
```
PerformanceLog { id, athleteId, occurrenceId?, date, source: coach|athlete|guardian|watch-import,
  completed: bool, durationMin, distanceKm?, avgHr?, rpe?, notes?, metrics: jsonb (ספורטאי-ספציפי) }
```
- **סכמה אחת לכל המקורות** עם ייחוס מקור — כך עובדים רישום ידני של המאמן, דיווח עצמי של ספורטאי/הורה, ובעתיד ייבוא משעון — בלי לפרק את המערכת (D17).
- נוכחות היא מקרה פרטי מובנה: `Attendance` נשארת כרשומת סטטוס פורמלית למפגש (ATTENDED/MISSED/LATE/EXCUSED — הרחבה מ-2 ערכים, מתקן 1.4) ומקושרת למופע היציב.

### 3.6 Athlete — שדרוגים (DOM-6)
- תיקון טיפוסים: `zones` לפי ענף (`zones[sportId]`), שדות חסרים נוספים לטיפוס (מתקן 1.1/1.2), מספרים כמספרים (ולידציה בשרת).
- **רמת יכולת** (ability) כשדה מובנה + תגיות — מניע מסלולים, קבוצות והתאמות אישיות (D8). גיל נשמר כנתון, לא כבסיס חלוקה.
- **היסטוריית אזורים**: כל מבחן שומר גרסת אזורים; `athlete.currentZones` נגזר מהמבחן האחרון לכל ענף, אך אפשר לחזור לגרסה קודמת.
- **נתוני גדילה** (גובה/משקל לאורך זמן) — לילדים; מוצגים מול עומס אימונים במסך המעקב.
- **סגמנט (segment)**: תגית על הספורטאי ועל הקבוצה — `children | youth | elite | adults | <מותאם>` (ילדים/נוער/עילית/מבוגרים). משמשת **לסינון, קטגוריות תחרות, מיקוד תוכן והצגה** — לא מגבילה כלום (D8: החלוקה האמיתית לפי יכולת).
- פציעה הופכת לישות עם מצב ותאריכים (ראה [05-monitoring.md](05-monitoring.md)) במקום שדה מחרוזת.

### 3.7 Group — שדרוגים (DOM-7)
- קישור ל-Season, רמת יכולת, מאמן אחראי (Coach), צבע, maxAthletes (הקיים נשמר).
- schedule הופך ל-SessionSeries (3.2) — עם end time, חריגות ומיקום.
- חברות (athleteGroups) מתויגת בעונה; העברה בין קבוצות שומרת היסטוריה.

### 3.8 מהנשאר כמו שהוא
- Training library + EnduranceSet + פרסר הטקסט + Folders + snapshots במחיקה — מצוין, נשמר (עם תיקוני באגים מה-AS-IS).
- Note הפולימורפי — נשמר, מתויג גם ל-occurrence.
- Program/MesoBlock/PlannedWeek/ScheduledWorkout — נשמרים עם תיקוני היציבות (תאריכים, מזהים, ביטול הכפילות legacy plans/blocks — מקור אמת אחד; מתקן 1.10).
- ProgramTemplate הופך לשימושי: שמירת תבנית קיימת כתבנית לשימוש חוזר, ולא עותק write-only.

## 4. ישויות חדשות — סניפים, תחרויות, קליטה, מסמכים, ציוד (D18, D21)

### 4.1 סניפים (Branch) (DOM-8)
```
Branch { id, tenantId, name, managerUserId?, location?, notes? }
```
- כל קבוצה וכל איש צוות משויכים לסניף (אופציונלי — מאמן עצמאי עובד בלי סניף או עם סניף יחיד).
- הרשאות נגזרות לפי ההיררכיה ([01](01-users-and-permissions.md) USR-10); סיכומים (נוכחות, הכנסות, דגלים) זמינים לפי סניף.

### 4.2 תחרויות ותוצאות (DOM-9)
```
Competition { id, tenantId, name, date, location, facilityId?, sportId,
  competitionType: meet|time-trial|open-water|league|championship|other,   ← סוג התחרות
  level: club|regional|national|international,                             ← דרגת התחרות
  courseType?: pool25|pool50|open-water|track|road|trail|other,            ← סוג מסלול/בריכה (25מ' מול 50מ')
  courseInfo?: string,   ← מבנה מסלול חופשי (כיוונים, סבבים, מספר מקצים וכו')
  notes? }
CompetitionEvent { id, competitionId, name (למשל 50m חופשי), distance?, stroke?, unit,
  categories?: [קטגוריות גיל/רמה], relay?: { teamAthleteIds[] } }   ← שליחים עם סדר
CompetitionEntry { id, competitionId, athleteId, eventIds: [], category?, heat? }
CompetitionResult { id, entryId, eventId, value (שניות/מטרים), place?,
  timing: electronic|manual,          ← תזמון אלקטרוני/ידני
  status: finished|dq|dns|dnf,        ← כולל פסילה / לא-התייצב / לא-סיים
  notes?, source: coach|imported }
```
- **התוצאה נשמרת תמיד עם כל ההקשר שלה** (סוג תחרות, דרגה, סוג מסלול, תזמון). **PB הוא נגזרת מאושרת — לא אוטומטית** (המדיניות המלאה ב-[05](05-monitoring.md) MON-8): רק תוצאה שסיימה, בתזמון תקין, במקצה שמתאים לקטגוריית השיא — **ובאישור המאמן**.
- **PB פר-הקשר**: שיא נשמר לכל (ספורטאי × מקצה × סוג מסלול) — שיא 25מ' לא נדרס ע"י שיא 50מ' ולהפך; שניהם מוצגים זה לצד זה.
- **אזורים**: תחרות לעולם לא מעדכנת אזורים; אם המאמן רוצה — רושם אותה מפורשות כמבחן (MON-5), והיא עוברת את זרימת המבחן הרגילה.
- המרות בין סוגי מסלול (25מ'↔50מ' בשחייה): **להצגה בלבד**, דרך טבלאות המרה בקטלוג הטננט; התוצאה הגולמית תמיד הנתון השמור.
- הרכבי שליחים: `relay.teamAthleteIds` — קבוצת שחיינים למקצה שליחים, עם סדר.

### 4.3 קליטה וגיוס (Intake) (DOM-10)
```
TrialParticipant { id, tenantId/branchId, name, phone, guardianPhone?, source?, trialDate, notes, status: pending|attended|converted|lost }
WaitingListEntry { id, branchId?, name, contact, requestedGroup?, priority?, notes, createdAt, status }
SeasonRegistration { id, athleteId (או PendingAthlete), seasonId, forms: [ConsentRecord], registrationFeeChargeId?, status }
```
- **מתאמן אורח** (ניסיון): משתתף במופע ונספר בנוכחות **בלי פרופיל מלא**; בהמרה — הופך ל-Athlete (הנתונים הקיימים נשמרים).
- רישום עונתי: טופס רישום דיגיטלי להורה → יצירת פרופיל + חברות בקבוצה + הסכמות + **דמי רישום** (חיוב חד-פעמי — [07](07-payments.md)).

### 4.4 מסמכים והסכמות (DOM-11)
```
Document { id, targetType: athlete|group|tenant, targetId, kind: medical|insurance|consent|certificate|other, fileId, expiryDate?, notes }
ConsentFormTemplate { id, tenantId, kind: medical|insurance|media|terms, title, body, requiresSignature: bool, appliesTo: all|new-athletes }
ConsentRecord { id, templateId, athleteId, signedByUserId (guardian/athlete), signedAt, revoked? }
```
- הסכמות חתומות דיגיטלית (שם + תאריך + יומן) — בעיקר **הסכמת מדיה לקטינים** (פרסום תמונות/וידאו במגזין), הרשאה רפואית, ביטוח (D21).
- מסמכים עם תוקף (`expiryDate`) מזינים דגל "אישור פג תוקף" במרכז הבקרה (MON-1).
- לאיזה תוכן נדרשת הסכמה: פרסום תמונת ספורטאי קטין במגזין מותר **רק** אם קיימת הסכמת מדיה בתוקף.

### 4.5 ציוד מועדון (DOM-12)
```
EquipmentItem { id, tenantId/branchId, name, kind: fins|paddles|board|other, totalUnits, notes }
EquipmentLoan { id, itemId, athleteId?, groupId?, units, lentAt, dueAt?, returnedAt?, notes }
```
- ניהול השאלות: מי מחזיק כמה יחידות, החזרות, ואבדות (החזרה לא סומנה X שבועות → דגל).
- נפרד מהחנות (מכירה); דף ציוד בניהול המאמן בלבד.

### 4.6 משוב אימונים ובנק מצטבר (DOM-13) (D21)
```
WorkoutFeedback { id, trainingId, occurrenceId?, groupId?, athleteId?,
  byUserId, rating: 1–5 | "successful", tags: [flow | difficulty-fit | engagement | ...], note? }
```
- **סימון הצלחה**: אימון שעבד טוב בפועל מתויג אחרי המפגש — עם ההקשר (איזו קבוצה, איזו רמה, אילו אזורים).
- **בנק אימונים** = הספרייה + נתוני ההצלחה (מספר שימושים, דירוגים, תגיות): חיפוש "אימוני Z2 מוצלחים לראשנים" מחזיר אימונים **מוכחים בשטח**, לא רק קיימים.
- **הכנה ל-AI (D17)**: הבנק הוא גוף הידע שעליו יתבסס מנוע ההמלצות העתידי — "תבנית שהוכחה" גוברת על יצירה מאפס. תיעוד ההצלחה נאסף מיום 1, בלי מודול נפרד.

### 4.7 אנשי מקצוע (DOM-14) (D22)
```
ProfessionalProfile { userId, specialty: nutritionist|physiotherapist|<custom>, mode: internal|external }
ClientLink      { id, professionalId, athleteId, grantedFields: [], grantedByUserId (guardian/athlete/owner), status, expiresAt? }
NutritionPlan   { id, athleteId, authorId, startDate?, targets?, notes?, linkedGoalId? }
RehabPlan       { id, athleteId, injuryId?, authorId, status: active|completed,
                  phases: [{ name, durationWeeks, restrictions: [], exercises: [], returnCriteria: [] }] }
```
- **מפגש מקצועי** = `SessionOccurrence` מסוג appointment/rehab שבו האחראי הוא איש/אשת המקצוע — מופיע בלוז של הספורטאי (וההורה) ובלוז האישי של בעל המקצוע.
- `ClientLink.grantedFields` מגדיר בדיוק לאילו נתונים איש מקצוע חיצוני נחשף (מטריצת 9.2 ב-[01](01-users-and-permissions.md) כברירת מחדל); הקישור ניתן לביטול ע"י המעניק בכל עת.
- **RehabPlan → תכנון**: `restrictions` מזרימות אזהרות/החלפות בבונה התוכניות (PLAN-5) ולדגלים (MON-4) — כל עוד השיקום פעיל.
- **NutritionPlan → יעדים**: תזונת מרוץ (pre/during/hydration) ממלאת את שדות `Goal.plan.nutrition*` הקיימים — מקור אחד, שני נותני שירות (מאמן/תזונאי).
- **סוג טננט (D23)**: `tenantType: club | practice` — מועדון (ברירת המחדל) או **פרקטיקה עצמאית** של איש/אשת מקצוע. אותן ישויות בדיוק (ספורטאים, מפגשים, תוכניות, מבחנים) — אין שכפול מודל; השדה נכנס לסכמה מיום 1 והמימוש המלא של מצב הפרקטיקה הוא שלב עתידי.

## 5. תרשים קשרים (מצטמצם)

```
Tenant ─< Branch ─< User (Owner/BranchManager/Coach/Instructor)
Tenant ─< Season                      Season ─< Group ─< Membership >─ Athlete ─< Guardians(User)
Group ─< SessionSeries (defaultTrainingId?) ─< SessionOccurrence >─ Facility/Lanes
Occurrence ─< Attendance, Note, (מופיע בלוח); Occurrence ← TrialParticipant (אורחים)
Athlete ─< Test ─< ZoneVersion          Athlete ─< PerformanceLog, Injury, Goal, Document, ConsentRecord, EquipmentLoan
Season ─< Program ─< MesoBlock ─< PlannedWeek ─< ScheduledWorkout >─ Training(library)
Program ─apply→ Assignment(athleteId/groupId, occurrenceId?)
Competition ─< Entry (athlete/events/relays) ─< Result → (מוזרם ל-Test/PB/אזורים)
Athlete ─< Charge/Payment (07)   Tenant ─< Content/Magazine (08)   Branch ─< WaitingList/TrialParticipant
```