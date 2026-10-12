# SPEC 01 — ארכיטקטורה ותשתית

> איפיון מצב קיים (AS-IS) · מסמך ראשי: [../SPEC.md](../SPEC.md)

## 1. טכנולוגיות

### Client (`client/`)
| טכנולוגיה | גרסה | שימוש |
|---|---|---|
| React | ^19.2.0 | SPA (strict mode) |
| react-router-dom | ^7.13.1 | ניתוב (BrowserRouter, 10 מסלולים) |
| TypeScript | ~5.9.3 (strict + noUnusedLocals/Parameters + erasableSyntaxOnly) | טיפוסים |
| Vite | ^7.3.1 | dev server + build |
| axios | ^1.13.6 | **רק** דרך `api/api.ts` — instance אחד שמשמש 6 מודולי periodization בלבד |
| lucide-react | ^0.577.0 | אייקוני SideBar בלבד |
| react-icons | ^5.6.0 | אייקון בודד — FaWhatsapp ב-CheckInResolveModal (התלות החדשה שנוספה) |
| @dnd-kit/core, @dnd-kit/sortable | ^6.3.1 / ^10.0.0 | **עדיין מותקן ולא בשימוש כלל** (הגרירה ממומשת ידנית) |

- devDependencies: ESLint 9 (flat config + react-hooks/react-refresh), typescript-eslint 8, @vitejs/plugin-react 5. ⚠️ `@types/react-router-dom` ^5.3.3 — **שריד מיושן** (v7 מגיע עם טיפוסים משלו).

### Server (`server/`)
| טכנולוגיה | גרסה | שימוש |
|---|---|---|
| Express | ^5.2.1 | REST API — 17 routers |
| cors | ^2.8.6 | פתוח לכל המקורות |
| dotenv | ^17.4.2 | **מיובא רק ב-env.ts שאיננו בשימוש** — התלות מתה |
| ts-node-dev | ^2.0.0 | הרצה ב-dev עם respawn + `--transpile-only` (אין בדיקת טיפוסים בזמן ריצה) |
| TypeScript | ^5.9.3 | טיפוסים |

**אין**: אימות/הרשאות, ולידציה כללית של בקשות, בדיקות, ORM/DB אמיתי, error middleware, סקריפט build/start לשרת (רק `dev`; סקריפט `test` stub שמחזיר 1 תמיד).

## 2. טיפוסים משותפים — השינוי הארכיטקטוני המרכזי

```
shared/types/  ← מקור האמת היחיד לטיפוסי דומיין (11 קבצים + barrel)
   ├── client: tsconfig paths `@/shared/*` + alias ב-Vite (53 קובצי לקוח מייבאים)
   └── server: tsconfig paths `@shared/*` (עובד תחת ts-node-dev בלבד)
```

- קבצי הטיפוסים הכפולים הישנים נמחקו (`client/src/types/athlete|group|training|dayEvent.ts`, `server/src/models/*`). ב-`client/src/types/` נותרו: `zoneConfig.ts` (מנוע האזורים, בשימוש), `athleteTalk.ts` (מת), `event.ts` (מת).
- `tsconfig.app.json` כולל מפורשות רק 4 מתוך 11 קבצי ה-shared — השאר נכנסים רק דרך גרף הייבוא.
- ⚠️ **סדר ה-alias ב-vite.config.ts הוא מלכודת**: `"@"` רשום לפני `"@/shared"`, והפלאגין (@rollup/plugin-alias, first-match-wins עם התאמת קידומת) יתפוס קודם את `"@"` — וינתב את `@/shared/*` אל `client/src/shared/*` שאינו קיים. **כרגע זה לא מפיל כלום** כי כל ייבואי הלקוח מ-`@/shared` הם `import type` בלבד — esbuild מוחק אותם עוד לפני שלב הרזולוציה (וגם בבנייה), ו-tsc מפענח נכון דרך tsconfig. הייבוא הראשון של **ערך** (enum/const/קומפוננטה) מ-`@/shared` ישבור את ה-dev ואת ה-build עם "Failed to resolve import". תיקון: להקדים את `"@/shared"` ל-`"@"`.
- בלקוח נותרו 2 ייבואים יחסיים מהסגנון הישן (`App.tsx`, `AthleteCard.tsx`) לצד 53 ייבואי alias.

## 3. מבנה הפרויקט

```
group-training-manager/
├── client/src/
│   ├── api/            # 17 מודולי API (fetch גולמי; axios רק ל-periodization)
│   ├── components/
│   │   ├── layout/    # appLayout + sideBar (barrels קיימים ולא בשימוש)
│   │   ├── shared/    # PageHeader + NotesPanel (barrel בשימוש)
│   │   ├── dashboard/ # 9 קומפוננטות (בלי barrels)
│   │   ├── calendar/  # Calendar + components/ (16 תתי-קומפוננטות + utils/WorkoutTextParser)
│   │   ├── athletes/  # 7 קומפוננטות + barrels
│   │   ├── groups/    # GroupCard
│   │   ├── trainingPlan/  # programCard ×2 (אחד מת)
│   │   └── programs/  # programSetupWizard + 3 מודאלי צעדים (בלי barrels)
│   ├── pages/         # Dashboard, Schedule, Athletes, AthleteDetails (הועבר),
│   │                  # Groups, GroupDetails (חדש), TrainingPlan (חדש, 3 קבצים)
│   ├── types/         # zoneConfig (מנוע), athleteTalk (מת), event (מת)
│   ├── env/env.ts     # VITE_API_URL
│   ├── config/        # calendarConfig
│   └── styles/globals.css  # תבנית Vite ברירת המחדל (אין תמה אמיתית, אין RTL)
├── server/src/
│   ├── index.ts       # Express + 17 הרכבות routes + פורט 3001 מוקש
│   ├── routes/        # 17 קבצים (כולל TrainingAssginment — שגיאת כתיב בשם)
│   ├── services/      # attendanceService, dashboardService, notesService (חדש)
│   ├── env/env.ts     # dotenv — מת, לא מיובא
│   ├── utils/         # fileDb, logger
│   └── db/database.json
└── shared/types/      # 11 קבצי טיפוסים
```

נמחקו: `client/src/utils/` (groupToTraining), `components/sherd/`, `components/workoutBuilder/` הישן, `pages/TrainingBuilder`, `AthleteFormPage`, `TrainingPopup/` הישן ברמש העליונה, `App.css`.

## 4. פקודות הרצה

| צד | פקודה | תוצאה |
|---|---|---|
| Server | `npm run dev` (בתוך `server/`) | ts-node-dev (בלי type-check), `http://localhost:3001` |
| Client | `npm run dev` (בתוך `client/`) | Vite על 5173 — **דורש `VITE_API_URL` מוגדר** (אין .env בפרויקט, אין proxy — בלעדיו הבסיס הוא `undefined/...`) |
| Client | `npm run build` | `tsc -b && vite build` — ⚠️ **צפוי להיכשל ב-tsc** (ראה הערה) |
| Client | `npm run lint` | ESLint 9 flat |

> ⚠️ **בנייה צפויה להיכשל** ב-`tsc -b` תחת `noUnusedLocals/noUnusedParameters`: ייבוא `TrainingPlan` ו-`Kanban` שלא בשימוש ב-SideBar.tsx; `NOTES_API` והייבוא `Note` שלא בשימוש ב-api/attendance.ts; destructure של `setTrainings` שלא בשימוש ב-Dashboard; ייבוא ה-widgets המסומנים-כהערה. (נבדק סטטית; אין Node מותקן בסביבת התיעוד להרצה חיה.) הגורמים הישנים (AthleteFormPage/pbs) נעלמו עם מחיקת הקובץ.
> ⚠️ לשרת אין build בכלל — ואם ייבנה someday: `rootDir: "../"` יפלוט את הקוד ל-`dist/server/...` וה-DB ייפתח מנתיב אחר (DB "חדש" וריק).

## 5. תקשורת Client↔Server

- REST/JSON. **כתובת הבסיס** מרוכזת סוף-סוף: `client/src/env/env.ts` מייצא `env.apiUrl` מ-`import.meta.env.VITE_API_URL` (וגם `appName` — מת, לא בשימוש). אין `vite-env.d.ts` — הטיפוס לא מאומת.
- **שתי שיטות מקבילות בשכבת ה-API**: fetch גולמי (רוב המודולים) מול axios (periodization). שלושה סגנונות טיפול שגיאות מתקיימים: בדיקת `res.ok`+זריקה · בדיקה+פרסור הודעת השרת · **בלי בדיקה כלל** (`getAthletes/getAthlete/getGroups/createGroup/updateGroup/createAthlete/updateAthlete/getAssignments` — גוף שגיאה חוזר כנתונים). מחיקות רבות fire-and-forget.
- **קריאות שעוקפות את שכבת ה-API**: `fetch("/api/tasks")` ב-AdminTodoList, `fetch("/api/notes")` ו-`fetch("/api/contact-record")` בדאשבורד — קידומת `/api` לא קיימת בשרת והנתיבים 404.
- **אין סטייט גלובלי**: אין Context/Redux/query-cache. `App` מחזיק `trainings` (loaded once) + prop drilling; Schedule טוען שוב בעצמו; דאשבורד מרענן דרך מונה `refreshTrigger`.

## 6. מסד הנתונים (fileDb)

- קובץ יחיד `server/src/db/database.json` (~99KB, נשמר ב-git, נתוני אמת) — `readDb()` מפרסר **הכול** בכל בקשה; `writeDb()` כותב **הכול** (2-space indent) בכל מוטציה.
- אין נעילות/אטומיות (בלי temp+rename) — תנאי מרוץ ושחיתות אפשריים. 15 אוספים קיימים + 2 נוצרים בכתיבה ראשונה (plans, programTemplates).
- מזהים: רוב `Date.now().toString()` בשרת; UUID לאירועים/נוכחות (**ולאירועים וירטואליים — ארעיים בכל fetch**); ל-Notes פורמט מיוחד. פירוט ב-[02-data-models.md](02-data-models.md).

## 7. לוגינג

`logger.info/error` → קונסולה בלבד (`[INFO]/[ERROR] + ISO`). רוב ה-routers מלוגגים (Programs לא). באג: `GET /training-assignments/:id` מדפיס **את כל האוסף** בכל קריאה. אין לוגים בלקוח מלבד console.error מקומי.

## 8. קונפיגורציית לקוח

- `vite.config.ts` — פלאגין react + aliases בלבד; אין proxy, אין define. (ראה סעיף 2 לגבי סדר ה-aliases.)
- `calendarConfig.ts` — `{startHour:6, endHour:22, defaultDuration:60, snapMinutes:15}`; רק startHour בשימוש בפועל.
- `index.html` — `lang="en"`, בלי `dir`, כותרת "group-training-manager".
- `styles/globals.css` — תבנית Vite הסטנדרטית (לא תמת אמיתית). **אין RTL** למרות תוכן עברי בנתונים, בקוד וב-UI (כותרות בעברית בלוח התוכניות). CSS לכל קומפוננטה, מחלקות גלובליות שטוחות, בלי modules/tokens.
- ⚠️ ייבואי CSS בשגיאת רישיות שעובדים רק ב-Windows: `SideBar.tsx→Sidebar.css`, `Calendar.tsx→Calendar.css`, `programCard.tsx→ProgramCard.css`, `groups/index.ts→./groupCard`.