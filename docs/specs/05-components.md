# SPEC 05 — מלאי קומפוננטות

> איפיון מצב קיים (AS-IS) · מסמך ראשי: [../SPEC.md](../SPEC.md)
>
> מצב שימוש: ✓ בשימוש · ✗ מת (לא מיובא/לא מרונדר) · 💬 מסומן-כהערה (קיים אך מחוץ לעץ הרינדור).
> המבנה אורגן מחדש: כמעט כל תיקיית קומפוננטה מלווה ב-barrel `index.ts` (37 קיימים; חריגים: `dashboard/` ו-`programs/` — בלי barrels בכלל).

## 1. Layout ומשותפים (`components/layout`, `components/shared`)

| קומפוננטה | קובץ | Props | אחריות | מצב |
|---|---|---|---|---|
| `AppLayout` | layout/appLayout/AppLayout.tsx | — | SideBar + Outlet; `no-padding` ל-/schedule* ו-/training-plans/* | ✓ |
| `SideBar` | layout/sideBar/SideBar.tsx | — | 5 NavLink + tooltip; לוגו אייקון בלבד | ✓ (⚠️ מייבא עמוד TrainingPlan ו-Kanban שלא בשימוש — שובר build) |
| `PageHeader` | shared/pageHeader/PageHeader.tsx | `search, setSearch, onAdd` | חיפוש + ⚙ (אין handler — קישוט) + כפתור + | ✓ |
| `NotesPanel` | shared/NotesPanel.tsx | `targetType, targetId, maxNotes=10, collapsible=true, onNoteAdded?, onNoteDeleted?` | **חדש** — פאנל הערות פולימורפי: טעינה לפי target, טופס (title/category/description/flag), מחיקה עם confirm, collapse | ✓ (ATHLETE: AthleteDetails, CheckInResolveModal, AttendancePopup · GROUP: GroupDetails, AttendancePopup) |

> התיקייה הישנה `sherd/` נמחקה (כולל SearchBar הריק). `PageHeader` עבר ל-shared. אין עריכת הערות ב-UI (`updateNote` ב-API מת).

## 2. Dashboard (`components/dashboard/`)

| קומפוננטה | קובץ | Props | אחריות | מצב |
|---|---|---|---|---|
| `TodayTimelineSchedule` | TodayTimline.tsx (שגיאת כתיב בשם הקובץ) | `events, onAdd, onUpdate, onDelete, onToggleDone, ghostedEvents?` (⚠️ ghosted לא בשימוש) | ציר זמן היום ממוין; צבע לפי type; ✓/Edit/🗑; פותח AddEventModal | ✓ |
| `AddEventModal` | AddEventModal.tsx | `onAdd, onUpdate?, onClose, event?` | טופס title/time/type בלבד; תמיד היום; end=start+60 דק'; ⚠️ prefill שעה שבור | ✓ |
| `Alerts` | Alerts.tsx | `alerts: {id, message}[]` | רשימת התראות גנרית | **✗ מת** — אף קובץ לא מייבא |
| `AthleteCheckins` | AthleteCheckIns.tsx | `athletes, onAthleteResolved?` | רשימת סיכון; לחיצה → CheckInResolveModal; resolve מסיר אופטימיסטית (⚠️ לא מתרענן מ-props) | ✓ |
| `AttendanceModal` | AttendancePopup.tsx | `groupId, athletes, eventDate (לא בשימוש), onClose(records)` | סימון נוכחות לכל ספורטאי; All Attended/Missed; NotesPanel לכל אחד + לקבוצה | ✓ (⚠️ גם ✕ שומר — אין ביטול; שדה הערה לא מחובר) |
| `CheckInResolveModal` | CheckInResolveModal.tsx | `athlete, recentNotes? (לא בשימוש), onResolve(summary), onClose` | WhatsApp deep-link + NotesPanel + Save & Resolve | ✓ (⚠️ summary לא מחובר לקלט) |
| `AdminTodoList` | AdminTodoList.tsx | — | מטלות אדמין — **fetch ל-/api/tasks שלא קיים בשרת**; טופס+סטטוסים+מחיקה | **💬 מסומן כהערה בדאשבורד; מת גם אם ירונדר** |
| `QuickInsightWidget` | QuickInsightWidget.tsx | `onSaveNote` | טופס הערת תובנה מהירה (athleteId טקסט חופשי) — שולח payload legacy לנתיב שגוי | **💬 מסומן כהערה** |
| `Stats` | Stats.tsx | `athletes, groups, trainingsToday, callsPending` | 4 מדדים טקסטואליים (עם תוויות מטעות — ראה 04) | ✓ |

## 3. לוח שבועי (`components/calendar/`) — פירוט התנהגות ב-[07-calendar.md](07-calendar.md)

| קומפוננטה | קובץ | Props | אחריות | מצב |
|---|---|---|---|---|
| `Calendar` | Calendar.tsx (~1000 שורות) | `trainings, setTrainings, calendarEvents, setCalendarEvents, selectedGroupId, setSelectedGroupId, athleteId?` | ניהול הכל: שבועים, fetch, פופאפים, יצירה/גרירה/מחיקה, זיהוי אימון מאחורי אירוע | ✓ |
| `WeeklyHeader` | weeklyHeader/ | — | 7 כותרות שני→ראשון + הדגשת היום | ✓ |
| `DaySummeryRow` | daySummeryRow/ | — | **div ריק — placeholder** | ✓ (ללא פונקציה) |
| `TimeColumn` | timeColumn/ | — | 16 שורות שעה (6:00–22:00) | ✓ |
| `CalendarGrid` | calendarGrid/ | events, callbacks | גריד תאי רבע-שעה; מיקום אירועים; עמודת היום; קו זמן (⚠️ מוסט שעה); חפיפות נאיביות; drop-targets | ✓ |
| `Event` | calendarGrid/calendarEvent/ | event, position, handlers | צ'יפ אירוע: מיקום/גובה לפי זמנים, צבע לפי type, draggable | ✓ |
| `TrainingDetails` | TrainingDetails/ | training/event, handlers | מודאל תצוגה לאימון (steps, notes); Edit/Delete | ✓ |
| `Library` | library/ | trainings, folders, callbacks | ספריית אימונים: תיקיות, חיפוש, גרירה ללוח/תיקייה, + New Training/Folder | ✓ (משותף גם ללוח התוכניות) |
| `LoadCalculator` | loadCalculator/ | events, selectedGroupId, athleteId | מדד עומס שבועי (Time/TSS/ACWR/Ext) — חלון 7 ימים מעכשיו | ✓ |
| `GroupSchedulePopup` | groupSchedulePopup/ | event, groups, trainings, callbacks | דריסת מופע קבוצה: שעות + אימון → override; Cancel Session | ✓ (⚠️ שמירה אוטומטית בסגירה בגלל UTC) |
| `TrainingPopup` | trainingPopup/ | training, onSave/callbacks, mode?, isGroupSchedule? | עורך אימון מבוסס-טקסט + פריסטים + סטטיסטיקות + וויזואליזר | ✓ |
| `WorkoutTextEditor` | trainingPopup/components/workoutTextEditor/ | steps, setSteps, sport | טקסט↔steps; פרסור ב-Enter/blur; Format Help | ✓ |
| `WorkoutVisualizer` | trainingPopup/components/workoutVisualizer/ | steps, onDropPreset | בלוקים ויזואליים + drop-zones לפריסטים | ✓ |
| `SportMetricSelector` | trainingPopup/components/sportMetricSelector/ | sport, metrics... | 3 כפתורי ענף בלבד — props ה-metrics מתים | ✓ (חלקית) |
| `PresetSidebar` | trainingPopup/components/presetSidebar/ | — | פריסטים בצד — לא מרונדר | **✗ מת** |
| `WorkoutBuilder` + `EnduranceSetCard` | trainingPopup/components/workoutBuilder/ | — | עורך סטים כרטיסי מלא | **✗ מת — לא מיובא ע"י אף קובץ** |
| `WorkoutTextParser` | trainingPopup/utils/ | (פונקציות) | parseWorkoutText / workoutStepsToText | ✓ |

## 4. אתלטים (`components/athletes/`) — פירוט ב-[06-tests-and-zones.md](06-tests-and-zones.md)

| קומפוננטה | קובץ | Props | אחריות | מצב |
|---|---|---|---|---|
| `AthleteCard` | athleteCard/ | `athlete, onClick` | אווטאר initials, שם, level, גיל | ✓ |
| `AddTestModal` | addTestModal/ | `onAdd, onClose` | מודאל מבחן דינמי מהקונפיג + CSS + custom + preview עריכה | ✓ |
| `AddGoalModal` | addGoalModal/ | `onClose, onAdd` | יצירת יעד general/race | ✓ |
| `GoalActionModal` | goalActionModal/ | `goal, mode, onClose, onSave` (createPortal) | תוכנית/ביקורת מרוץ | ✓ (⚠️ שומר data במקום review; לא מאתחל מערכים קיימים; `feeling` לא בטיפוס; CSS מת) |
| `ZonesTable` | zonesTable/ | `zones, sport` | טבלת אזורים + RPE; gym → "RM zones coming soon" | ✓ |
| `ProgressChart` | progressChart/ | `tests, sport` | גרף SVG עם PB מודגש + tooltip | ✓ |
| `StatsChart` | statsChart/ | `data: number[]` | גרף מוטות CSS; **תוויות S,M,T,W,T,F,S קבועות** ללא קשר לתאריכים בפועל | ✓ |

> `AthletePopup` נמחק. התיקייה `goalModal/` פוצלה ל-`addGoalModal/` + `goalActionModal/`.

## 5. קבוצות (`components/groups/`)

| קומפוננטה | קובץ | Props | אחריות | מצב |
|---|---|---|---|---|
| `GroupCard` | GroupCard/ | `group, onClick` | שם, סלוטים (⚠️ תוויות ימים שגויות), מספר מתאמנים (⚠️ תמיד 0) | ✓ |

> `GroupPopup` נמחק — ניהול הקבוצה עבר לעמוד GroupDetails.

## 6. תוכניות וויזארד — פירוט ב-[09-programs.md](09-programs.md)

| קומפוננטה | קובץ | מצב |
|---|---|---|
| `programCard` | trainingPlan/programCard.tsx | ✓ (בשימוש; פס התקדמות מוקשח) |
| `ProgramCard` | trainingPlan/programCard/ProgramCard.tsx | **✗ מת** — כפיל מוסתר ע"י רזולוציית קובץ-מול-תיקייה |
| `ProgramSetupWizard` | programs/programSetupWizard/ | ✓ |
| `ProgramSetupModal` (צעד 1) | .../programSetupModal/ | ✓ |
| `Step2EventsAndRulesModal` (צעד 2) | .../step2EventsAndRulesModal/ | ✓ |
| `Step3TimelineVisualizationModal` (צעד 3) | .../step3TimelineVisualizationModal/ | ✓ |

## 7. עמודים (גשרים בין layout לקומפוננטות)

| עמוד | קובץ | מצב |
|---|---|---|
| `Dashboard` | pages/Dashboard/Dashboard.tsx | ✓ (⚠️ prop `setTrainings` מת; imports מתים של widgets מסומנים) |
| `Schedule` | pages/Schedule/Schedule.tsx | ✓ (כפילות fetch מול App) |
| `AthletesPage` | pages/Athletes/Athlete.tsx | ✓ |
| `AthleteDetails` | pages/AthleteDetails/AthleteDetails.tsx | ✓ (הועבר מ-pages/Athletes/; כולל רכיב Field פנימי; state `events` מת) |
| `GroupsPage` | pages/Groups/Group.tsx | ✓ |
| `GroupDetails` | pages/GroupDetails/GroupDetails.tsx | ✓ (חדש; 729 שורות) |
| `TrainingPlan` | pages/TrainingPlan/TrainingPlan.tsx | ✓ (חדש) |
| `ProgramCalendarPage` | pages/TrainingPlan/ProgramCalendarPage.tsx | ✓ (חדש; עטיפה) |
| `ProgramCalendarView` | pages/TrainingPlan/ProgramCalendarView.tsx | ✓ (חדש; 1607 שורות — הקובץ הגדול בלקוח) |

> נמחקו: `AthleteFormPage`, `TrainingBuilder`, `pages/Groups/GroupDetails.tsx` הריק (הוחלף בעמוד האמיתי), `pages/Athletes/AthleteDetails.tsx` הישן.

## 8. כללי קוד שחוזרים על עצמם

- **סטייט מקומי בלבד** — אין Context/Redux/query-cache; prop drilling מ-App; refresh ידני דרך מונה (`refreshTrigger`) או טעינה חוזרת מלאה.
- **מודאלים** — conditional render + overlay click לסגירה (חלקם בלי אישור — אובדן טיוטה); `GoalActionModal` ב-createPortal; `AttendancePopup` — גם ✕ שומר.
- **אישורי מחיקה** — `window.confirm` חסימתי + `alert` לסיכום (Apply Program).
- **CSS** — קובץ נלווה לכל קומפוננטה, מחלקות גלובליות שטוחות (בלי modules), אין design tokens; `globals.css` הוא עדיין תבנית Vite ברירת המחדל; **אין RTL**.
- **שגיאות** — try/catch + console.error בצרכן; אין toasts/messages למשתמש (מלבד הודעות מקומיות בודדות ב-NotesPanel/CheckInResolveModal).
- **ייבוא CSS בשגיאת רישיות** (עובד רק ב-Windows): `SideBar.tsx`→`./Sidebar.css`, `Calendar.tsx`→`./Calendar.css`, `programCard.tsx`→`./ProgramCard.css`, `groups/index.ts`→`./groupCard`.