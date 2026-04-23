# Workout Text Format Reference

## Quick Examples

```
# Running Workouts
5*400m Z4 R:90
10*1min Z3 R:1min
2*3km Z2 R:5min
30min Z1

# Swimming Workouts
10*100m Z3 R:30
5*8/200m Z4 R:60
200m Z1

# Cycling Workouts
20*1min Z4 R:1min
3*8min Z3 R:3min
45min Z2
```

## Format Guide

### Basic Structure
```
[REPS]*[DISTANCE/TIME] [ZONE] R:[REST]
```

### Components

| Component | Examples | Notes |
|-----------|----------|-------|
| **Reps** | `10*`, `5*`, `3*` | Optional, omit for single |
| **Distance** | `100m`, `1km`, `400m`, `1mi` | m, km, mi supported |
| **Time** | `5min`, `30s`, `10min` | min, s, second supported |
| **Zone** | `Z1`, `Z2`, `Z3`, `Z4`, `Z5` | Easy, Threshold, Hard also work |
| **Rest** | `R:30s`, `R:2min`, `R:90` | Between reps (seconds default) |

### Speed Notations

#### Single Efforts
```
200m Z2          → 1 x 200m at Zone 2
5min Z3          → 1 x 5 minutes at Zone 3
1km Z4           → 1 kilometer at Zone 4
```

#### Repeated Efforts
```
10*100m Z3       → 10 repetitions of 100m at Zone 3
5*400m Z4 R:90   → 5 x 400m at Zone 4, 90 seconds rest
3*5min Z2 R:2min → 3 x 5 minutes at Zone 2, 2 minutes rest
```

#### Advanced (Nested Intervals)
```
3*5/200m Z3 R:60  → 3 sets of (5 x 200m) at Zone 3, 60 seconds rest between sets
2*10/100m Z4      → 2 sets of (10 x 100m intervals)
```

### Zone Reference

| Zone | Intensity | RPE | 💚 HR | Use Case |
|------|-----------|-----|--------|----------|
| **Z1** | Recovery | Very Light | 50-60% | Easy recovery days |
| **Z2** | Endurance | Light | 60-70% | Long, easy training |
| **Z3** | Tempo | Moderate | 70-80% | Sustained effort |
| **Z4** | Threshold | Hard | 80-90% | High intensity |
| **Z5** | VO2 Max | Very Hard | 90-100% | Short, hard efforts |

## Example Workouts

### 5K Running Session
```
5min Z1
3*2min Z5 R:2min
1km Z2
```

### Swimming Workout
```
200m Z1
10*100m Z3 R:30
4*50m Z4 R:20
```

### Cycling Training
```
10min Z1
2*10min Z3 R:5min
5*1min Z5 R:1min
10min Z1
```

## Common Errors & Fixes

| Input | Issue | Fix |
|-------|-------|-----|
| `100m100m` | Missing separator | Use ` ` (space) between items |
| `10x100m` | Invalid multiplier | Use `*` not `x` |
| `Z6` | Invalid zone | Use Z1-Z5 only |
| `100` | Missing unit | Add `m`, `km`, or `min` |
| `R30` | Missing colon | Use `R:30`, not `R30` |

## Tips

✅ **DO:**
- Use consistent formatting
- Include units (m, km, min, s)
- Specify zones for intensity tracking
- Add rest periods for clarity
- Separate each segment with a newline

❌ **DON'T:**
- Mix units (100m and 1m in same block)
- Use invalid zone numbers
- Forget units on distances
- Use abbreviations like "k" instead of "km"

## Sport-Specific Notes

### 🏃 Running
- Use `km` for long efforts, `m` for shorter repeats
- Include zone for pace tracking

### 🚴 Cycling
- Can use distance or time
- Power (watts) saved in metrics for future use
- Zone reference for FTP-based training

### 🏊 Swimming
- Always use `m` for meters
- Pool size affects lap counting
- Distance easier to track than time

---

Each block is processed independently, so you can mix formats freely!
