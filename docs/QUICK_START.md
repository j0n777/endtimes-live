# 🚀 Quick Start Guide - Phase 1 Data Sources

## 3-Minute Setup

### Step 1: Open Admin Panel (15 seconds)
```
1. Launch application
2. Click "ADMIN" in top navigation bar
3. Scroll to "PHASE 1 DATA SOURCES" section (green header)
```

### Step 2: Enable Free Sources (30 seconds)
Toggle these switches to ON (no registration needed):

| Source | What It Does | Action |
|--------|-------------|---------|
| 🌍 **GDACS** | Earthquakes, Tsunamis, Cyclones, Floods | ✅ Toggle ON |
| 🏥 **WHO** | Disease Outbreaks, Pandemics | ✅ Toggle ON |
| 📰 **GDELT** | Global News Events, 100+ languages | ✅ Toggle ON |

### Step 3: Save & Refresh (15 seconds)
```
1. Scroll to bottom
2. Click "SAVE CONFIGURATION" button
3. Click "REFRESH" button in top-right header
4. Wait ~10 seconds for data to load
```

### Step 4: Verify (10 seconds)
Look at the header - you should see:
```
[●] 3/6 SOURCES ACTIVE • ~100-300 EVENTS
```

**Done!** You now have real-world disaster, health, and news events on your map.

---

## 🔥 Maximum Coverage Setup (Optional)

Want **ALL 6 sources** for 500-800+ events? Add these API keys:

### NASA EONET (Optional - Free)
**Get 100-200 natural events** (wildfires, storms, earthquakes)
1. Visit: https://api.nasa.gov/
2. Fill out form (30 seconds)
3. Copy API key from email
4. Paste in Admin Panel → "NASA EONET API KEY"

### ACLED (Required for conflict data - Free)
**Get 50-100 armed conflict events** (battles, protests, violence)
1. Visit: https://acleddata.com/
2. Register for researcher access (2 minutes)
3. Copy API key + email
4. Paste in Admin Panel → "ACLED API KEY" and "ACLED EMAIL"

### NASA FIRMS (Required for fire data - Free)
**Get 200-400 active fire alerts** globally
1. Visit: https://firms.modaps.eosdis.nasa.gov/api/
2. Register (1 minute)
3. Copy API key
4. Paste in Admin Panel → "NASA FIRMS API KEY"

**Save & Refresh again** - You'll now see **6/6 SOURCES ACTIVE**!

---

## 📊 What Each Source Provides

| Source | Events | Auth | Coverage |
|--------|--------|------|----------|
| GDACS | 50-100 | ❌ Free | Major disasters (M5.0+ quakes, hurricanes, floods) |
| NASA EONET | 100-200 | ⭐ Optional | Natural events tracked by NASA satellites |
| ACLED | 50-100 | ✅ Required | Armed conflicts, protests, political violence |
| WHO | 10-20 | ❌ Free | Disease outbreaks, health emergencies |
| GDELT | 50-100 | ❌ Free | Breaking news from global media |
| NASA FIRMS | 200-400 | ✅ Required | Active fires and thermal hot spots |

---

## 🎯 Visual Guide

### Before Phase 1
```
┌─────────────────────────────────┐
│ OLD SYSTEM                       │
├─────────────────────────────────┤
│ Sources: 1 (AI-generated only)  │
│ Events:  ~25-100                 │
│ Real Data: Limited               │
└─────────────────────────────────┘
```

### After Phase 1 (Free sources only)
```
┌─────────────────────────────────┐
│ NEW SYSTEM - FREE TIER           │
├─────────────────────────────────┤
│ Sources: 3/6 Active              │
│ Events:  100-300 REAL            │
│ Coverage: ✅ Disasters            │
│           ✅ Health               │
│           ✅ News                 │
└─────────────────────────────────┘
```

### After Phase 1 (All API keys)
```
┌─────────────────────────────────┐
│ NEW SYSTEM - FULL COVERAGE       │
├─────────────────────────────────┤
│ Sources: 6/6 Active ✅            │
│ Events:  500-800+ REAL           │
│ Coverage: ✅ Disasters            │
│           ✅ Fires                │
│           ✅ Conflicts            │
│           ✅ Health               │
│           ✅ News                 │
│           ✅ Natural Events       │
└─────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### "No events showing up"
1. Did you click SAVE after enabling sources? → Try again
2. Did you wait 10+ seconds after clicking REFRESH? → Wait longer (first load can take 30s)
3. Check browser console (F12) for errors → Report them

### "0/6 sources active"
- Toggles need to be ON (green)
- After enabling, must click SAVE
- Then click REFRESH in header

### "ACLED not working"
- Both API key AND email are required
- Email must match your ACLED registration
- Check you're not over 3,000 requests/year limit

---

## 💡 Pro Tips

1. **First load is slow** (10-30 seconds) - Subsequent clicks are fast due to caching
2. **Disable sources you don't need** - Faster refresh, less clutter
3. **ACLED has a limit** (3,000 req/year) - Don't refresh constantly
4. **Free sources = no limits** - GDACS, WHO, GDELT can be refreshed frequently
5. **Check header status** - Green dot = sources working correctly

---

## 📞 Support

- **Full Documentation**: See `DATA_SOURCES_README.md`
- **API Issues**: Check individual API docs in README
- **Bug Reports**: Check browser console for error messages

---

**That's it!** In under 3 minutes you can have real disaster, health, and news data flowing into your End Times Monitor. 🌍⚡
