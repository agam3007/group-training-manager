# Training Popup Redesign - Visual Layout Guide

## Layout Structure Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  TRAINING POPUP (1200px max width)                              [✕] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Title: "Workout Name" (click to edit)                              │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│ TYPE SELECTOR  │  RUN  │  BIKE  │  SWIM  │                         │
├─────────────────────────────────────────────────────────────────────┤
│ GOAL:  What is the goal of this workout? ______________ (textbox)   │
├─────────────────────────────────────────────────────────────────────┤
│ METRICS: ☑ HR  ☑ Pace  ○ Distance  ○ Time  (format selector)       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────┬──────────────────────────────────────────────────────┐ │
│  │ PRESETS │  WORKOUT VISUALIZATION (RIGHT TOP)                  │ │
│  │         │  ┌──────────────────────────────────────────────┐   │ │
│  │ 🔥      │  │                                              │   │ │
│  │ Warmup  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │   │ │
│  │   +     │  │  │ 10*100m  │  │ 5*5min   │  │  200m    │  │   │ │
│  │         │  │  │   Z3     │  │   Z2     │  │   Z1     │  │   │ │
│  │ ❄️      │  │  │   10m    │  │   25m    │  │   15m    │  │   │ │
│  │ Cooldown│  │  └──────────┘  └──────────┘  └──────────┘  │   │ │
│  │   +     │  │                                              │   │ │
│  │         │  └──────────────────────────────────────────────┘   │ │
│  │ ⚡      │  WORKOUT TEXT EDITOR (RIGHT BOTTOM)               │ │
│  │ Main    │  ┌──────────────────────────────────────────────┐   │ │
│  │   +     │  │ 10*100m Z3 R:30                              │   │ │
│  │         │  │ 5*5min Z2 R:2min                             │   │ │
│  │ 🎯      │  │ 200m Z1                                      │   │ │
│  │ Drill   │  │                                              │   │ │
│  │   +     │  │                                              │   │ │
│  │         │  │ Format: 10*100m Z3 R:30                      │   │ │
│  │Drag &   │  │ Help: [📝 Format Help ▼]                    │   │ │
│  │drop to  │  └──────────────────────────────────────────────┘   │ │
│  │RIGHT    │                                                     │ │
│  └─────────┴──────────────────────────────────────────────────────┘ │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│ NOTES:  _________________________________________________ (textarea)   │
│         _________________________________________________            │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                     [Cancel]  [Save] │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Sizes & Proportions

```
Total Width: 1200px (max)
Total Height: 90vh (max)

Header Section:        Variable height
Sport Selector:        ~60px
Goal Input:           ~60px
Metrics Selector:     ~80px

Main Body (flex):
├─ Left Sidebar:      120px width
│  └─ Scrollable preset list
│  
└─ Right Area:        Remaining width
   ├─ Top (50%):      Visualizer with variable block heights
   └─ Bottom (50%):   Text editor textarea

Notes Section:        ~120px
Footer:              ~50px
```

## Color Scheme

### Intensity Zones
```
Z1 (Easy)       → 🟢 #90EE90 (Light Green)
Z2 (Endurance)  → 🟨 #FFD700 (Gold)
Z3 (Tempo)      → 🟠 #FFA500 (Orange)
Z4 (Threshold)  → 🔴 #FF6347 (Tomato Red)
Z5 (VO2 Max)    → 🔴 #DC143C (Crimson)
```

### UI Elements
```
Primary:        #2F80ED (Blue)
Background:     #F9FAFB (Light Gray)
Border:         #E5E7EB (Gray)
Text Primary:   #1F2937 (Dark Gray)
Text Secondary: #4B5563 (Medium Gray)
Error:          #DC2626 (Red)
```

## Interaction Flow Diagram

```
User Action              Component               State Update
─────────────────       ─────────────────       ──────────────

1. Add Preset          PresetSidebar           steps += [new]
   Click "+"           → TrainingPopup         Visualizer updates
                       → WorkoutVisualizer

2. Drag Preset         PresetSidebar           steps += [new]
   Drag to RIGHT       → WorkoutVisualizer     Text updates
                       → WorkoutTextEditor

3. Edit Text           WorkoutTextEditor       steps = parsed[]
   Type/paste          → WorkoutTextParser     Visualizer updates
                       → WorkoutVisualizer

4. Select Sport        SportMetricSelector     type changes
                       → PresetSidebar         defaults update
                       → Visualizer units

5. Save               TrainingPopup            Training saved
   Click "Save"       → onSave callback
                      → onClose
```

## Responsive Behavior

```
Desktop (>1200px):    
┌─────────────────────────────────────────┐
│ Normal layout with all elements visible│
└─────────────────────────────────────────┘

Tablet (800px - 1200px):
┌────────────────────┐
│ Layout adjusts     │
│ Sidebar remains    │
│ 120px wide         │
└────────────────────┘

Mobile (<800px):
┌──────┐
│Stack │
│view  │
└──────┘
(sidebar above, main below)
```

## Toggle Controls

```
SportMetricSelector:
├─ Run:
│  ├─ ☑ Heart Rate (HR)
│  ├─ ☑ Pace
│  └─ ○ Distance  ○ Time (format)
│
├─ Bike:
│  ├─ ☑ Heart Rate (HR)
│  ├─ ☑ Pace
│  ├─ ☑ Power (Watts)
│  └─ ○ Distance  ○ Time (format)
│
└─ Swim:
   ├─ Pool Size: [25m] [50m]
   ├─ ☐ Heart Rate (HR) [disabled]
   └─ ☐ Pace [disabled]
```

## Visual Block Proportions

```
Block Height = (Duration / Total Duration) × Max Height

Example:
Total Workout: 40 minutes
Max Height: 200px

10*100m Z3 (10 min)  → Height = (10/40) × 200 = 50px
5*5min Z2  (25 min)  → Height = (25/40) × 200 = 125px
200m Z1    (5 min)   → Height = (5/40) × 200 = 25px (min 30px)

Visual Result:
┌──────────┐
│ 200m Z1  │  ▲
├──────────┤  │ 30px (minimum)
│          │  │
│ 5*5min   │  │ 125px
│   Z2     │  │
│          │  │
├──────────┤  │
│ 10*100m  │  │ 50px
│   Z3     │  │
└──────────┘  ▼
```

## User Tips

✨ **Quick Tips:**
- Drag presets for fast workout building
- Type to edit and customize
- Text and visuals stay in sync
- Click blocks for more details
- Use format guide for reference
- Save as you go (autosave ready)
