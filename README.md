# 🌍 End Times Monitor

**A comprehensive global intelligence platform for monitoring eschatological events, conflicts, disasters, and prophetic developments in real-time.**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()
[![Data Sources](https://img.shields.io/badge/data%20sources-9-orange)]()
[![Events](https://img.shields.io/badge/events-800%2B-red)]()

---

## 📖 Overview

End Times Monitor is an advanced OSINT (Open Source Intelligence) and data aggregation platform designed to track global events relevant to biblical prophecy, conflicts, natural disasters, pandemics, and geopolitical developments. Built with React, TypeScript, and powered by multiple authoritative data sources including Telegram channels and prediction markets.

### Key Features

- 🗺️ **Interactive Global Map** - Visualize events worldwide with severity indicators
- 📡 **9 Real-Time Data Sources** - GDACS, NASA, WHO, ACLED, Telegram, Polymarket, and more
- 🤖 **AI-Powered Analysis** - Google Gemini integration for intelligent event classification
- 📊 **Prediction Markets Intelligence** - Polymarket integration for early event detection
- 🔔 **Real-Time Alerts** - Monitor Telegram channels for breaking news
- 📖 **Biblical Prophecy Tracking** - Correlate events with scriptural references
- 🛰️ **OSINT Integration** - Multiple intelligence sources in one platform
- 🌐 **Multilingual Support** - English (with Portuguese, Spanish, French, Arabic coming soon)

---

## 🎯 What It Monitors

### Event Categories

| Category | Description | Data Sources |
|----------|-------------|--------------|
| **CONFLICT** | Wars, military actions, armed conflicts, protests | ACLED, GDELT, Telegram, Polymarket |
| **NATURAL DISASTER** | Earthquakes, tsunamis, hurricanes, floods, volcanoes | GDACS, USGS, NASA EONET |
| **FIRES** | Wildfires, thermal anomalies | NASA FIRMS, NASA EONET |
| **PANDEMIC** | Disease outbreaks, epidemics, health emergencies | WHO, Telegram |
| **ECONOMIC** | Financial crises, market crashes, economic instability | News APIs, Polymarket |
| **PROPHETIC** | Israel/Jerusalem events, Middle East developments | Multiple sources |
| **PERSECUTION** | Religious persecution, martyrdom reports | News APIs, Telegram |

---

## 📊 Data Sources (9 Total)

### Free & No Authentication Required

1. **GDACS** - Global Disaster Alert and Coordination System
   - Coverage: Major disasters (earthquakes M5.0+, hurricanes, floods, volcanoes)
   - Update Frequency: Real-time
   - Events: 50-100

2. **WHO** - World Health Organization Disease Outbreaks
   - Coverage: Global health emergencies, epidemics, pandemics
   - Update Frequency: Daily
   - Events: 10-20

3. **GDELT** - Global Database of Events, Language & Tone
   - Coverage: Global news events in 100+ languages
   - Update Frequency: Every 15 minutes
   - Events: 50-100

4. **Polymarket** - Prediction Markets Intelligence
   - Coverage: Geopolitical events, conflicts, wars (market-based predictions)
   - Update Frequency: Real-time
   - Events: 20-40 high-relevance markets

### Requires Free API Key

5. **NASA EONET** - Earth Observatory Natural Event Tracker
   - Coverage: Wildfires, storms, volcanoes, floods, droughts
   - Events: 100-200
   - Get Key: https://api.nasa.gov/

6. **ACLED** - Armed Conflict Location & Event Data
   - Coverage: Armed conflicts, protests, violence, battles
   - Events: 50-100
   - Get Key: https://acleddata.com/ (3,000 requests/year free)

7. **NASA FIRMS** - Fire Information for Resource Management
   - Coverage: Active fires, thermal anomalies globally
   - Events: 200-400
   - Get Key: https://firms.modaps.eosdis.nasa.gov/api/

### Requires Configuration

8. **Telegram Bot** - Real-Time Channel Monitoring
   - Coverage: Configurable news channels (supports Portuguese, English, etc.)
   - Events: Varies (10-100+ depending on channels)
   - Setup: Create bot via @BotFather

9. **Legacy APIs** - NewsAPI, MediaStack (optional)

---

## 🚀 Quick Start - Run Locally

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Gemini API Key** (for AI analysis)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/j0n777/End-Times-Monitor.git
   cd End-Times-Monitor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API Key**
   
   Create a `.env.local` file in the project root:
   ```env
   API_KEY=your_gemini_api_key_here
   ```

   Get your Gemini API key: https://makersuite.google.com/app/apikey

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

### Build for Production

```bash
npm run build
```

Built files will be in the `dist/` directory.

---

## ⚙️ Configuration

### Admin Panel Setup

Navigate to **Admin** in the app to configure:

#### 1. Telegram Bot (Optional but Recommended)

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` and follow instructions
3. Copy the bot token (format: `123456:ABC-DEF...`)
4. In Admin Panel → TELEGRAM BOT INTEGRATION:
   - Paste bot token
   - Add channel IDs (e.g., `@channelname` or `-1001234567890`)
5. Save configuration

**Recommended Channels**: News channels in your language covering geopolitics, conflicts

#### 2. External API Keys (Optional)

**NASA EONET** (Optional):
- Get free key: https://api.nasa.gov/
- Paste in Admin → NASA EONET API KEY

**ACLED** (Recommended for conflict data):
- Register: https://acleddata.com/
- Requires: API Key + Email
- Paste in Admin → ACLED section

**NASA FIRMS** (For fire tracking):
- Register: https://firms.modaps.eosdis.nasa.gov/api/
- Paste in Admin → NASA FIRMS API KEY

#### 3. Free Sources (Pre-Enabled)

- **GDACS** - Toggle ON (default)
- **WHO** - Toggle ON (default)
- **GDELT** - Toggle ON (default)
- **Polymarket** - Toggle ON (default)

### Save & Refresh

1. Click **SAVE CONFIGURATION**
2. Click **REFRESH** button in header
3. Wait 10-30 seconds for initial data load
4. Check header for "X/9 SOURCES • Y EVENTS"

---

## 📱 Features Overview

### 1. Situation Map

- **Interactive global map** showing all monitored events
- **Color-coded markers** by severity (RED = High, ORANGE = Elevated, YELLOW = Medium)
- **Category filtering** - Show/hide specific event types
- **Real-time updates** - 5-minute cache refresh
- **Event details** - Click markers for full information

### 2. Live Intelligence Wire

- **Chronological feed** of all events
- **Source attribution** - Know where each event came from
- **Severity indicators** - Visual priority markers
- **Conflict level classification** - Detailed threat assessment

### 3. Prophetic Timeline

- **Biblical prophecy tracker** - Monitor fulfillment status
- **Scripture references** - Correlate events with prophecy
- **Status tracking** - FULFILLED / IN_PROGRESS / PENDING

### 4. Survival Protocols

- **Emergency preparedness guides**
- **Water, Food, Security, Communications**
- **Checklists and instructions**
- **Tactical survival information**

### 5. AI Tactical Advisor

- **Gemini-powered analysis** - Ask questions about current events
- **Cascade effects analysis** - Understand 2nd/3rd order consequences
- **Prophetic context** - Biblical perspective on events
- **Strategic recommendations**

### 6. Communications Panel

- **Radio frequencies** - Emergency communications
- **HF/VHF/UHF bands** - Survival radio frequencies
- **PACE communication planning**

---

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (custom tactical theme)
- **Maps**: Leaflet (React-Leaflet)
- **AI**: Google Gemini API
- **Icons**: Lucide React
- **State Management**: React Hooks
- **Storage**: Browser localStorage

---

## 📂 Project Structure

```
End-Times-Monitor/
├── components/
│   ├── AIChat.tsx              # Gemini AI advisor
│   ├── AdminPanel.tsx          # Configuration UI
│   ├── CommsPanel.tsx          # Radio frequencies
│   ├── IntelFeed.tsx           # Event feed
│   ├── ProphecyIntel.tsx       # Prophecy tracker
│   ├── SituationMap.tsx        # Interactive map
│   ├── SurvivalManual.tsx      # Survival guides
│   └── TacticalRadar.tsx       # Threat radar
├── services/
│   ├── data-sources.ts         # Unified aggregator
│   ├── geminiService.ts        # AI integration
│   ├── gdacs-service.ts        # GDACS API
│   ├── nasa-eonet-service.ts   # NASA EONET
│   ├── acled-service.ts        # Conflict data
│   ├── who-service.ts          # Health data
│   ├── gdelt-service.ts        # Global news
│   ├── nasa-firms-service.ts   # Fire tracking
│   ├── telegram-service.ts     # Telegram bot
│   └── polymarket-service.ts   # Prediction markets
├── App.tsx                     # Main application
├── types.ts                    # TypeScript types
├── constants.ts                # Data constants
└── index.html                  # Entry point
```

---

## 🔐 Security & Privacy

- **All API keys stored locally** - Browser localStorage only
- **No backend server** - Pure client-side application
- **No user tracking** - No analytics or external tracking
- **Open source** - Transparent code
- **CORS considerations** - Some APIs may require CORS proxy in production

---

## 🌐 Planned Features & Roadmap

### Phase 2 (Coming Soon)
- [ ] Additional news APIs (MediaStack, Currents)
- [ ] Volcano tracking (USGS Volcano API)
- [ ] Space weather monitoring (NOAA)
- [ ] Economic indicators (Alpha Vantage)
- [ ] Religious persecution tracking (Open Doors)

### Phase 3 (Future)
- [ ] Multilingual UI (Portuguese, Spanish, French, Arabic)
- [ ] Mobile app (React Native)
- [ ] Webhook notifications for critical events
- [ ] Export events (CSV/JSON)
- [ ] Historical timeline view
- [ ] Advanced filters and search

---

## 📚 Documentation

- **[DATA_SOURCES_README.md](DATA_SOURCES_README.md)** - Complete data sources documentation
- **[QUICK_START.md](QUICK_START.md)** - Quick setup guide
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Technical implementation details
- **[TELEGRAM_POLYMARKET_GUIDE.md](TELEGRAM_POLYMARKET_GUIDE.md)** - Portuguese guide for Telegram/Polymarket

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## ⚠️ Disclaimer

This application is for **informational and educational purposes only**. It aggregates publicly available data from various sources. Users should:

- Verify critical information through official channels
- Use prediction market data for intelligence only, not gambling
- Follow local laws and regulations
- Respect data source terms of service

The developers are not responsible for decisions made based on this information.

---

## 🙏 Acknowledgments

- **Data Providers**: GDACS, NASA, WHO, ACLED, GDELT, Polymarket
- **Technology**: Google Gemini, React, Leaflet
- **Inspiration**: Biblical prophecy and global awareness

---

## 📧 Contact & Support

- **Issues**: https://github.com/j0n777/End-Times-Monitor/issues
- **Discussions**: https://github.com/j0n777/End-Times-Monitor/discussions

---

**Built with ❤️ for global awareness and preparedness**

Stay informed. Stay prepared. Stay vigilant.

🌍 **End Times Monitor** - *When the world changes, be the first to know.*
