# SPEC 06 — מבחנים, אזורי אימון ושיאים אישיים

> איפיון מצב קיים (AS-IS) · מסמך ראשי: [../SPEC.md](../SPEC.md)
>
> מקור: `client/src/types/zoneConfig.ts` (מנוע), `client/src/components/athletes/addTestModal/AddTestModal.tsx` (מודאל — נבנה מחדש), `client/src/pages/AthleteDetails/AthleteDetails.tsx` (PBs, גרפים), `ZonesTable.tsx`, `ProgressChart.tsx`.

## 1. מושגי יסוד

ללא שינוי מהותי: **מבחן** (Test) — מדידה בודדת עם `value` + `zones` מחושבים; **שיטה** (Method) — `threshold | max | race | custom`; **ענף** — `run | bike | swim`; **מדדים** — `pace` (שניות לק"מ / ל-100מ'), `hr`, `power` (וואטים); **אזורים** — מערך גבולות עליונים (5, או 7 ב-CSS שחייה; 3/5/7 ב-custom). המכניקה נותרה: ערך × מכפיל; הגבול התחתון של Zn הוא העליון של Z(n-1).

## 2. קונפיגורציית האזורים — `ZONES_CONFIG` (`client/src/types/zoneConfig.ts`)

מבנה: `Record<SportType, Partial<Record<MethodType, {tests: Record<string, {label, zones}>}>>>` — Partial מאפשר ענף בלי כל שיטה. ⚠️ שדה ה-`label` מוגדר **ולא בשימוש** (ה-UI מציג את המפתחות הגולמיים ב-upper-case). הערכים `custom` מכילים מערכי אפסים — ממלאים את הדרופדאון בלבד; החישוב בפועל עוקף אותם.

### Run
| שיטה | מבחן | מכפילי pace | מכפילי hr |
|---|---|---|---|
| threshold | 1k | `1/0.8, 1/0.9, 1, 1.05, 1.1` | `0.7, 0.8, 0.9, 0.95, 1` |
| threshold | 5k | `1/0.75, 1/0.85, 1/0.95, 1/1.05, 1/1.15` | זהה |
| threshold | 10k | `1/0.78, 1/0.88, 1/0.96, 1.05, 1.1` — ⚠️ שני האחרונים לא הופכו (1.05, 1.1 גלויים) — לא עקבי עם 5k | זהה |
| max | hr | — | `0.6, 0.7, 0.8, 0.9, 1` |
| race | 5k | `1/0.8, 1/0.9, 1, 1.05, 1.1` | — |

### Bike
| שיטה | מבחן | מכפילי power | מכפילי hr |
|---|---|---|---|
| threshold | ftp | `0.55, 0.75, 0.9, 1.05, 1.2` | `0.7, 0.8, 0.9, 0.95, 1` |
| threshold | 20min | `0.6, 0.8, 0.9, 1.05, 1.15` | — |
| max | hr | — | `0.6, 0.7, 0.8, 0.9, 1` |
| race | ftp | `0.7, 0.85, 1, 1.1, 1.2` | — |

### Swim
| שיטה | מבחן | מכפילי pace (שנ'/100מ') |
|---|---|---|
| threshold | css | `1.2, 1.1, 1.05, 1, 0.95, 0.9, 0.85` — **7 אזורים**, יורדים (Z7 הכי מהיר) |
| threshold | 400m | `1/0.88, 1/0.95, 1, 1/1.05, 1/1.1` |
| race | 100m | `1/0.95, 1, 1/1.05, 1/1.1, 1/1.2` |

לשחייה **אין שיטת max**. אין ענף gym בקונפיג.

## 3. מנוע החישוב — `buildZones({sport, method, testType, pace?, hr?, power?})`

1. `ZONES_CONFIG[sport][method]` חסר → `{}`; `tests[testType]` חסר → `{}`.
2. לכל מדד שקיים בקונפיג **וגם** סופק ערך: `result[metric] = multipliers.map(f => input × f)`.
3. תוצאה: `{pace?, hr?, power?}` בלי עיגול.

## 4. מודאל הוספת מבחן — `AddTestModal` (נבנה מחדש)

פופאפ `modal-overlay > modal.large` (גובה עד 90vh, גלילה, כפתורים sticky). ⚠️ לחיצה על ה-overlay **לא סוגרת**.

### 4.1 מבנה הטופס (דינמי מהקונפיג)
1. **Sport**: run / bike / swim (אין gym).
2. **Method**: מפתחות הקונפיג של הענף (מוצגים גולמיים ב-upper-case). החלפת ענף מאפסת שיטה; החלפת שיטה מאפסת מבחן.
3. **Test type**: לפי ענף+שיטה.
4. שדות מותנים:
   - `showPace` = לא bike, לא max, לא (swim+css): בחירה **Total Time** (דק:שנ) או **Pace** (דק/ק"מ:שנ); ב-custom — גם שדה מרחק (ק"מ בריצה / מטרים בשחייה).
   - `showHR` = לא race, לא swim: Avg HR.
   - `showPower` = bike בלבד: Watts.
   - **CSS** (swim+threshold+css): cssMode "Total Time" או "Pace (/100m)" + זמני 400m ו-200m.
   - **Custom**: בחירת מספר אזורים 3/5/7 + טבלת אחוזים ידנית לכל מדד רלוונטי (ברירת מחדל 60 לכל אזור; מתאפס בשינוי מספר אזורים).

### 4.2 נוסחאות החישוב בפועל (`calculate` — כפתור חובה לפני תצוגה מקדימה)
- **Run/swim (time)**: `pace = (דק×60+שנ) / מרחק`; מרחק לפי סוג (5k→5, 10k→10, 400m→0.4, 1k→1, custom לפי קלט); שחייה ×10 → שניות ל-100מ' (custom: מטרים/100).
- **Pace mode**: הקלט מתקבל ישירות כשניות ליחידה.
- **Custom**: `pace_zone = pace / (אחוז/100)`; `hr_zone = hr × (אחוז/100)`; `power_zone = power × (אחוז/100)`.
- **CSS** — כפי שמומש (ההערה "classic formula" בקוד **שגויה**):
  - מצב Total Time: `pace = (t400 − t200) / 2`
  - מצב Pace/100m: `pace = (t400×4 − t200×2) / 2` (= 2·p400 − p200)
  - ⚠️ נוסחת ה-CSS הקלאסית היא `(t400+t200)/6` (עם זמנים כוללים) — הקוד מחסר במקום לחבר ומחלק ב-2. למשל t400=360, t200=170: קלאסי ≈ 88.3 שנ'/100מ', הקוד → 95.
- **אין ולידציה נוספת**: ריצה עם זמן ריק מייצרת אזורי pace אפסיים; bike בלי וואטים → `buildZones` מחזיר `{}` — התצוגה המקדימה ריקה אך השמירה **עדיין זמינה**.

### 4.3 תצוגה מקדימה ושמירה
- **ZonesPreview**: טבלה עריכה ידנית לפני שמירה — שורה לכל אזור, עמודה לכל מדד (PACE/HR/POWER); פורמט: pace `m:ss`, hr מספר, power `Xw`. ⚠️ **באג**: עריכת תא pace מפרסרת את המחרוזת המפורמטת ("5:30" → NaN).
- `value` שנשמר: **bike** → וואטים; **swim+css** → `zones.pace[3]` (האזור ה-1.0× בקונפיג ה-7 — קרי קצב ה-CSS) או האחרון; אחרת → סך שניות מהקלט. ⚠️ **במצב קלט Pace** שדות הזמן לא מרונדרים → value נשמר 0 (באג קיים מהגרסה הקודמת).
- נשמר: `{id: Date.now().toString(), sport, type: testType, method, value, date: ISO-now, zones}` — וב-AthleteDetails: המבחן מצורף ל-`athlete.tests` **וגם מחליף את `athlete.zones[sport]`** (דורס את הקודם) בשמירת PUT אחת.
- ⚠️ **באג סנכרון עריכה**: addTest לא מעדכן את `editData` — אם המשתמש נמצא במצב עריכה של הפרופיל, שמירה (💾) תשלח את ה-editData הישן ו**תשחזר למעשה את המבחן החדש**.

## 5. שיאים אישיים (PBs) — תצוגה

מחושבים on-the-fly ב-AthleteDetails: קיבוץ לפי `test.type`; PB = מקסימלי (bike, `${pb}w`) או מינימלי (שאר, `m:ss`); שורה = אייקון ענף + שם המבחן upper-case; לחיצה פורשת ProgressChart לכל ההיסטוריה של הסוג.

## 6. ProgressChart

SVG ידני 300×150 (preserveAspectRatio="none"): מיון לפי תאריך עולה, סקאלה min/max, `isLowerBetter = sport !== "bike"`; נקודת PB גדולה וירוקה, שאר כחולות; 5 קווי רשת + תוויות Y מפורמטות; hover → tooltip (ערך+תאריך); תוויות X מתחת.

## 7. טבלת אזורים — `ZonesTable`

- קלט: `athlete.zones` + `sport` (run/bike/swim/gym). אין אזורים לענף → "Add test to see zones"; שורות ריקות → "No zones for this sport yet".
- המרת גבולות לטווחים `{min: קודם, max: נוכחי}`; עמודות: run → RPE, Pace, HR, Zone · bike → RPE, Power, HR, Zone · swim → RPE, Pace, Zone.
- RPE לפי אינדקס (7 שורות מוגדרות): 1-2 😴 · 3-4 🙂 · 5-6 😐 · 7 😤 · 8 🥵 · 9 🤢 · 10 💀 — מוצמד לפי מיקום גם ב-7 אזורים.
- צביעת Zone: Z1-2 ירוק, Z3-4 כתום, שאר אדום.
- **gym** → "RM zones coming soon" — עדיין לא ממומש, ואין דרך ליצור אזורי gym (המבחן לא מציע את הענף).

## 8. חישוב התקדמות מול יעד מרוץ — `getPBProgress`

- מאתר מבחנים שבהם `test.type === goal.raceName`; PB לפי כיוון הענף; `progress = min(100, round(pb / Number(goal.target) × 100))`.
- ⚠️ עובד רק כש-`goal.target` **מספרי** — "45:00" → NaN → 0 (באג קיים).
- ⚠️ שני הענפים (bike מול run/swim) מחושבים **באותו ביטוי ממש** — ההבחנה הכיוונית (וואטים לעומת שניות) לא ממושה; PB גרוע מהיעד נחסם ל-100% "התקדמות".