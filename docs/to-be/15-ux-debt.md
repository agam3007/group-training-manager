# TO-BE 15 — שיפורי UX ושדות (חוב שיטתי)

> איפיון רצוי · מסמך ראשי: [SPEC.md](SPEC.md)
> נכתב בעקבות בקשת המאמנת (14/10/2026) — "לכתוב לעצמך שנצטרך לעשות שיפורי UX ושדות"
> זהו צ'קליסט עבודה שנאכל במהלך F0.7 (עיצוב) ובתוך כל פיצ'ר של שלב 1 שנוגע ב-UI.

## 1. שיפורי UX כלליים

| # | בעיה נוכחית | מה צריך | איפה |
|---|---|---|---|
| UX-1 | `window.confirm` ו-`alert` | מודאלים ו-toasts מעוצבים (עקביים) | כל העמודים |
| UX-2 | אין loading states | skeleton loaders בכל טעינת נתונים | Dashboard, Athletes, Groups, TrainingPlans |
| UX-3 | שגיאות נבלעות ב-console | הודעות שגיאה מוצגות למשתמש (toast/inline) | API layer |
| UX-4 | אין feedback על שמירה | toast "Saved ✓" / spinner על כפתור | כל הטפסים |
| UX-5 | sidebar לא מציע את שם העמוד הנוכחי | breadcrumb / page title ב-header | AppHeader |
| UX-6 | אין keyboard shortcuts | Ctrl+Enter לשמירה, Esc לסגירת מודאל | מודאלים |
| UX-7 | טפסים לא עוצרים submit בזמן busy | disabled + spinner | כל הטפסים |
| UX-8 | אין responsive בטלפון | מובייל-first למצב שטח (F1.6) | כל המסכים |
| UX-9 | RTL לא קיים | dir="rtl" עברית מלאה (F0.4) | כל ה-UI |
| UX-10 | צבעים קשיחים בכל מקום | design tokens (CSS variables) — עקביות | חדש (F0.7) |

## 2. שיפורי שדות — לפי עמוד

### 2.1 Groups / GroupDetails

| # | בעיה | מה צריך |
|---|---|---|
| F-G1 | `schedule[].day` נשמר כ-string | `<select>` עם 0-6 (Sun-Sat) — ערך number |
| F-G2 | שעת התחלה/סיום — input חופשי | `<input type="time">` |
| F-G3 | `+ Add Time` יוצר `{day:"", start:""}` בלי end | יצירה עם end מוגדר (default 1h) |
| F-G4 | אין ולידציה של סוגם שבועי | הצגת סיכום שבועי ("שני 18:00-19:00") |
| F-G5 | `sport` ו-`level` — input טקסט חופשי | `<select>` מתוך קטלוג (D9) |
| F-G6 | אין דרך להעלות תמונה/לוגו לקבוצה | upload (Supabase Storage) |

### 2.2 Athletes / AthleteDetails

| # | בעיה | מה צריך |
|---|---|---|
| F-A1 | יצירה = POST ריק ואז עריכת שם | טופס יצירה מלא עם שם חובה לפני שמירה |
| F-A2 | גיל/גובה/משקל — input חופשי | `<input type="number">` + min/max |
| F-A3 | קבוצות מוצגות כ-IDs | שמות קבוצות (JOIN) |
| F-A4 | טאב Health: מתג פציעה מאחסן `""` | boolean אמיתי + תאריך פציעה (date picker) |
| F-A5 | `Test.zones: any` | preview מסודר + עריכת תא בפורמט m:ss |
| F-A6 | פרוגרס מול יעד לא עובד עם "45:00" | target בפורמט סטנדרטי (שניות) |
| F-A7 | אין field לנושאי קשר רפואיים | שדות מסודרים בטאב Health (מתועד ב-DOM-11) |

### 2.3 TrainingPlans / ProgramCalendarView

| # | בעיה | מה צריך |
|---|---|---|
| F-P1 | ProgramSetupModal — assigneeName טקסט חופשי | `<select>` מתוך קבוצות/ספורטאים |
| F-P2 | ProgramSetupModal — durationType לא מתשמר בחזרה | persist state בין צעדי הוויזארד |
| F-P3 | Step3 — גרירת פאזה מגנרטת מחדש ומוחקת עריכות | שמור עריכות ידניות דרך מיזוג diff |
| F-P4 | תוכניות מבוססות-תאריכים לא מוצגות | אנקור תאריכים אמיתי (במקום MOCK_BASE_DATE) |
| F-P5 | Quick Add Placeholder מאבד קלט | שמור את הקלט ב ScheduledWorkout |
| F-P6 | ProgramCard progress = 60% קבוע | progress אמיתי (שבועות שחלפו / סך שבועות) |

### 2.4 Dashboard

| # | בעיה | מה צריך |
|---|---|---|
| F-D1 | StatsChart — תוויות S,M,T,W,T,F,S קבועות | תוויות מהתאריכים בפועל |
| F-D2 | "Calls Pending" = מספר בסיכון | שם מדד נכון ("At Risk") |

### 2.5 Admin (חדש)

| # | בעיה | מה צריך |
|---|---|---|
| F-AD1 | אין חיפוש טננטים | search input ב-header |
| F-AD2 | אין מספר קבוצות/מאמנים לכל טננט | סטטיסטיקה מלאה |
| F-AD3 | אין עמוד פרטי טננט | לחיצה על כרטיס → כניסה לטננט + צפייה בנתונים |

### 2.6 Calendar / Schedule

| # | בעיה | מה צריך |
|---|---|---|
| F-C1 | `import "./Calendar.css"` case (נוקה ב-F0.5) | lint CI שיתפוס מקרים דומים |
| F-C2 | תא ריק → פופאפ עם "choose" | inline popover מהיר (מתוכנן ב-F1.3) |
| F-C3 | מפגשים חופפים מוצגים אחד על השני | columns (מתועד: calculateEventPositions קיים אך עם bug 4.29) |
| F-C4 | יום ראשון לא מודגש | תוקן ב-AS-IS (4.5); נשאר לוודא ב-CI |

## 3. כללי ולידציה (מקושר ל-F0.3)

| # | בעיה | מה צריך |
|---|---|---|
| V-1 | `POST /athletes` משמיט email/height/weight | שרת מקבל את כל השדות |
| V-2 | מחרוזות נשמרות כמספרים | zod schema פר-ישות |
| V-3 | `POST /events` משמיט athleteId/groupId/done | שרת מקבל את כל השדות |
| V-4 | אין 400/409 עקביים | error envelope אחיד (ARC-13) |

## 4. קישורים

- [F0.7 UX](10-roadmap.md) — העיצוב וה-design system
- [F0.4 i18n](10-roadmap.md) — RTL/עברית
- [F0.3 validation](10-roadmap.md) — ולידציה ו-error envelope
- [08-gaps](../specs/08-gaps.md) — הבאגים שכבר מתועדים (שיפורי שדות שנסגרו שם מסומנים)