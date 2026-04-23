# Training Popup Redesign - Implementation Summary

## Overview
The training popup has been completely redesigned with a modern interface featuring drag-and-drop presets, visual workout representation, and real-time text parsing.

## New Layout Structure

### 1. **Header Section**
- Editable training title (click to edit)
- Training type selector (Run/Bike/Swim)
- Workout goal description
- Close button

### 2. **Sport/Metric Selector** (New)
- Located at the top below the goal section
- **For Run/Bike:**
  - Heart Rate (HR) checkbox
  - Pace checkbox
  - Format selector: Distance vs Time
  - Power (Watts) for bike only
- **For Swim:**
  - Pool size selector (25m or 50m)
  - HR and Pace options (disabled for swim tracking)

### 3. **Main Body - Three Part Layout**

#### Left Side: Preset Sidebar (120px width)
- **Draggable Presets:**
  - 🔥 Warmup (Yellow)
  - ❄️ Cooldown (Blue)
  - ⚡ Main Set (Red)
  - 🎯 Drill (Purple)
- Click **+** button to add preset
- Drag presets to the right panel to create workouts
- Visual feedback on hover

#### Right Top: Workout Visualizer
- Visual representation of your workout as colored blocks
- Block size = duration (taller = longer)
- Block height scales automatically based on workout duration
- Each block shows:
  - Distance/Duration label (e.g., "10km", "5min")
  - Intensity zone (Z1-Z5)
  - Total duration
- Color coding by intensity zone:
  - Z1: Green (Easy)
  - Z2: Gold
  - Z3: Orange
  - Z4: Tomato Red
  - Z5: Crimson (Hard)
- Rest periods shown below each block

#### Right Bottom: Workout Text Editor
- Editable text box for workout details
- Format guide with examples
- Real-time parsing of workout notation
- Errors/warnings display

### 4. **Workout Text Format**
The system parses workout text in a flexible format:

**Examples:**
- `10*100m Z3 R:30` - 10 reps of 100m at Zone 3 with 30 second rest
- `5*5min Z2 R:2min` - 5 intervals of 5 minutes at Zone 2 with 2 minute rest
- `200m Z1` - Single 200m swim at Zone 1
- `3*5/200m Z4 R:60` - 3 sets of 5 x 200m intervals

**Format Components:**
- **Distance:** `100m`, `1km`, `1mi`
- **Time:** `5min`, `10s`
- **Repetitions:** `10*100m`, `5*5min`
- **Zones:** `Z1`, `Z2`, `Z3`, `Z4`, `Z5`
- **Rest:** `R:30s`, `R:2min`

### 5. **Notes Section**
- Multi-line text area for additional notes
- Appears between main body and footer

### 6. **Footer**
- Cancel button
- Save options (varies based on context):
  - Regular save: "Add"
  - Group schedule: "Save to Library & Schedule" + "Save & Schedule (One-time)"

## Key Features

### ✨ Interaction Flow
1. **Drag & Drop:** Click preset icon and drag to the right visualization area to add workout segments
2. **Quick Add:** Click + button on any preset to add immediately
3. **Text-Based Editing:** Type workout details in the text editor
4. **Real-time Sync:** Changes in text immediately update visual blocks
5. **Visual Feedback:** Hover effects on presets and workout blocks

### 🎨 Visual Features
- Responsive layout with proper sizing
- Color-coded intensity zones
- Collapsible format help in text editor
- Error messages for invalid workout formats
- Height proportional to duration for quick visual scanning

### 📱 Responsive Design
- Works on various screen sizes
- Maximum width: 1200px
- Scrollable sidebar and components as needed

## New Component Files

1. **WorkoutVisualizer.tsx** - Displays workout blocks visually
2. **WorkoutVisualizer.css** - Styling for visualizer
3. **WorkoutTextEditor.tsx** - Text input with parsing
4. **WorkoutTextEditor.css** - Editor styling
5. **WorkoutTextParser.ts** - Parses text notation to workout steps
6. **SportMetricSelector.tsx** - Sport/metric configuration
7. **SportMetricSelector.css** - Selector styling
8. **PresetSidebar.tsx** - Draggable presets (updated)
9. **PresetSidebar.css** - Sidebar styling (new)

## Usage Tips

### Adding Workouts
1. **Method 1 (Drag & Drop):** Drag preset icons to the visualization area
2. **Method 2 (Quick Add):** Click + button on presets
3. **Method 3 (Text Input):** Type in the text editor below

### Editing Workouts
- Modify the text box to automatically update visualizer
- Click on any block to see its details
- Edit directly or use presets to rebuild

### Saving
- All changes sync between text and visual representations
- Save includes title, description, sport type, workout steps, and notes
- Group schedule has additional save options

## Future Enhancements (Optional)
- Delete individual blocks
- Reorder blocks via drag & drop
- Performance metrics (watts, pace, HR) integration
- Workout templates library
- Advanced parsing for complex intervals
- Export to various formats
