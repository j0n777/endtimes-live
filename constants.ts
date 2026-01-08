import { MonitorEvent, EventCategory, RadioChannel, SurvivalGuide, ProphecyEvent, ConflictLevel, SourceType } from './types';

// --- MASTER SOURCE LIST ---
export const RSS_SOURCES = [
  "Liveuamap", "Institute for the Study of War (ISW)", "South China Morning Post (Defense)",
  "The War Zone (Drive)", "Oryx Spioenkop", "BNO News", "Global Disaster Alert (GDACS)",
  "USGS Earthquakes", "Al Jazeera Live", "Jerusalem Post Defense", "Times of India Defense",
  "Arctic Today", "Taiwan News", "DefOne", "Stratfor"
];

// --- MOCK EVENTS (Fallback/Base Layer) ---
export const MOCK_EVENTS: MonitorEvent[] = [
  // NEW: Greenland/Arctic Threat
  {
    id: 'e_arctic_1',
    title: 'Thule Air Base Alert Status Elevated',
    description: 'Unidentified high-altitude balloon and drone activity reported near Greenland airspace. NORAD monitoring.',
    category: EventCategory.CONFLICT,
    severity: 'ELEVATED',
    conflictLevel: ConflictLevel.MILITARY_MOVEMENT,
    sourceType: SourceType.TWITTER_OSINT,
    sourceName: '@PolarSentinel',
    location: 'Qaanaaq, Greenland',
    timestamp: new Date().toISOString(),
    coordinates: { lat: 77.46, lng: -69.23 },
    propheticReference: 'Jeremiah 1:14 (North)'
  },
  // NEW: Taiwan Strait
  {
    id: 'e_taiwan_1',
    title: 'PLA Naval Blockade Drill',
    description: '24 PLA aircraft and 6 vessels crossed the median line. Simulated blockade formation observed.',
    category: EventCategory.CONFLICT,
    severity: 'HIGH',
    conflictLevel: ConflictLevel.POLITICAL_THREAT,
    sourceType: SourceType.RSS,
    sourceName: 'Taiwan Ministry of Defense',
    location: 'Taiwan Strait',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    coordinates: { lat: 24.0, lng: 119.5 }
  },
  // NEW: India/China Border
  {
    id: 'e_india_1',
    title: 'Arunachal Pradesh Skirmish',
    description: 'Reports of physical clashes between patrol units in the Tawang sector. Minor injuries reported.',
    category: EventCategory.CONFLICT,
    severity: 'MEDIUM',
    conflictLevel: ConflictLevel.BORDER_SKIRMISH,
    sourceType: SourceType.TELEGRAM,
    sourceName: 'IndoPac_Intel',
    location: 'Tawang, India',
    timestamp: new Date(Date.now() - 43200000).toISOString(),
    coordinates: { lat: 27.58, lng: 91.86 }
  },
  {
    id: 'e1',
    title: 'Mechanized Infantry Division Deployment',
    description: 'Satellite imagery confirms 4th Armored Division moving to Golan sector.',
    category: EventCategory.CONFLICT,
    severity: 'HIGH',
    conflictLevel: ConflictLevel.MILITARY_MOVEMENT,
    sourceType: SourceType.TWITTER_OSINT,
    sourceName: '@ImageSatIntl',
    location: 'Golan Heights',
    timestamp: new Date().toISOString(),
    coordinates: { lat: 33.1, lng: 35.8 },
    propheticReference: 'Jeremiah 49:23'
  },
  {
    id: 'e2',
    title: 'Anatolian Fault Tectonic Spike',
    description: 'Series of tremors >5.0 detected. Precursor signs elevated.',
    category: EventCategory.NATURAL_DISASTER,
    severity: 'ELEVATED',
    sourceType: SourceType.OFFICIAL,
    sourceName: 'USGS / EMSC',
    location: 'Turkey',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    coordinates: { lat: 38.9, lng: 35.2 },
    propheticReference: 'Matthew 24:7'
  },
  {
    id: 'e3',
    title: 'Eurozone Cash Limit Enforcement',
    description: 'New directive limiting physical cash transactions to €1000 active.',
    category: EventCategory.ECONOMIC,
    severity: 'MEDIUM',
    conflictLevel: ConflictLevel.POLITICAL_THREAT,
    sourceType: SourceType.RSS,
    sourceName: 'Financial Times',
    location: 'Brussels, EU',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    coordinates: { lat: 50.8, lng: 4.3 },
    propheticReference: 'Revelation 13:17'
  },
  {
    id: 'e4',
    title: 'Euphrates Drying Acceleration',
    description: 'Water levels critically low. Agricultural collapse in sector 4.',
    category: EventCategory.NATURAL_DISASTER,
    severity: 'MEDIUM',
    sourceType: SourceType.TELEGRAM,
    sourceName: 'MidEastWatcher',
    location: 'Iraq',
    timestamp: new Date(Date.now() - 200000000).toISOString(),
    coordinates: { lat: 32.0, lng: 44.0 },
    propheticReference: 'Revelation 16:12'
  },
  {
    id: 'e5',
    title: 'Red Sea Naval Engagement',
    description: 'Intercept missiles fired at commercial vessel. Coalition response initiated.',
    category: EventCategory.CONFLICT,
    severity: 'HIGH',
    conflictLevel: ConflictLevel.MILITIA_ACTION,
    sourceType: SourceType.TELEGRAM,
    sourceName: 'YemenObserver',
    location: 'Bab el-Mandeb Strait',
    timestamp: new Date().toISOString(),
    coordinates: { lat: 12.5, lng: 43.3 }
  }
];

// --- RADIO DATA ---
export const RADIO_CHANNELS: RadioChannel[] = [
  // VHF/UHF Emergency
  { id: 'r1', name: 'Intl Air Distress', frequency: '121.500 MHz', mode: 'AM', band: 'VHF', description: 'Civilian aircraft emergency' },
  { id: 'r2', name: 'Marine Calling', frequency: '156.800 MHz', mode: 'FM', band: 'VHF', description: 'Marine Ch 16 - Distress/Safety' },
  { id: 'r3', name: 'US National Simplex', frequency: '146.520 MHz', mode: 'FM', band: 'VHF', description: 'Primary Ham Calling Freq' },
  { id: 'r4', name: 'UHF Calling', frequency: '446.000 MHz', mode: 'FM', band: 'UHF', description: 'PMR446 / 70cm Calling' },
  { id: 'r5', name: 'GMRS Emergency', frequency: '462.675 MHz', mode: 'FM', band: 'UHF', description: 'GMRS Ch 20 / Travel Tone' },
  // HF Long Range
  { id: 'h1', name: '20m Survival Net', frequency: '14.242 MHz', mode: 'USB', band: 'HF', description: 'TAPRN / Prepper Net' },
  { id: 'h2', name: '40m Night Calling', frequency: '7.180 - 7.200 MHz', mode: 'LSB', band: 'HF', description: 'Regional Emergency Comms' },
  { id: 'h3', name: '80m Deep Night', frequency: '3.818 MHz', mode: 'LSB', band: 'HF', description: 'Prepper Net (Night)' },
  { id: 'h4', name: 'WWV Time', frequency: '10.000 MHz', mode: 'AM', band: 'HF', description: 'NIST Time & Propagation Reports' },
  { id: 'h5', name: 'Hurricane Watch', frequency: '14.325 MHz', mode: 'USB', band: 'HF', description: 'Hurricane Watch Net' },
];

// --- PROPHECY DATA ---
export const PROPHECY_EVENTS: ProphecyEvent[] = [
  { id: 'p1', title: 'Rebirth of Israel', scripture: 'Isaiah 66:8', status: 'FULFILLED', description: 'Israel re-established as a nation in 1948.' },
  { id: 'p2', title: 'Jerusalem Retaken', scripture: 'Luke 21:24', status: 'FULFILLED', description: 'Jerusalem under Jewish control (1967).' },
  { id: 'p3', title: 'Knowledge Increase', scripture: 'Daniel 12:4', status: 'FULFILLED', description: 'Explosion of technology and travel in the last century.' },
  { id: 'p4', title: 'Gospel to All Nations', scripture: 'Matthew 24:14', status: 'IN_PROGRESS', description: 'Global internet and translation accelerating reach.' },
  { id: 'p5', title: 'Wars and Rumors of Wars', scripture: 'Matthew 24:6', status: 'IN_PROGRESS', description: 'Rising global geopolitical tension.' },
  { id: 'p6', title: 'Apostasy', scripture: '2 Thessalonians 2:3', status: 'IN_PROGRESS', description: 'Falling away from the faith in institutional church.' },
  { id: 'p7', title: 'Digital Mark/Control', scripture: 'Revelation 13:16-17', status: 'IN_PROGRESS', description: 'Move towards cashless society and biometric ID.' },
  { id: 'p8', title: 'Third Temple', scripture: '2 Thessalonians 2:4', status: 'PENDING', description: 'Preparations (Red Heifer, Plans) are complete. Temple not built.' },
  { id: 'p9', title: 'Gog and Magog', scripture: 'Ezekiel 38', status: 'PENDING', description: 'Coalition of nations (North) attacking Israel.' },
];

// --- SURVIVAL GUIDES ---
export const SURVIVAL_GUIDES: SurvivalGuide[] = [
  {
    id: 's1',
    title: 'Water Protocols',
    category: 'WATER',
    content: `### CRITICAL PRIORITY
Water is the absolute priority. You can survive 3 weeks without food, but only 3 days without water.

### 1. Requirements
- **Drinking**: 2-3 Liters per person/day.
- **Hygiene**: 2-4 Liters per person/day.
- **Minimum Stock**: 2 weeks (approx 60L per person).

### 2. Purification Methods
**Boiling (Tier 1)**: Bring to rolling boil for 1 min (3 min at high altitude). Kills bacteria, viruses, and parasites.
**Chemical (Tier 2)**: Unscented Bleach (5-9%). 8 drops per gallon clear water, 16 drops cloudy. Wait 30 mins.
**Filtration (Tier 3)**: Mechanical filters (0.1 micron). Removes bacteria/protozoa but NOT viruses.

### 3. Sourcing
- Rainwater harvesting (requires pre-filtration).
- Natural springs (boil first).
- Hot water heater tank (turn off power/gas first!).
- Toilet tanks (NOT the bowl, and only if no chemical blocks used).`,
    checklist: [
      { id: 'w1', text: 'Determine daily household consumption', completed: false },
      { id: 'w2', text: 'Purchase primary filter (Sawyer/LifeStraw)', completed: false },
      { id: 'w3', text: 'Store 14 days of water in cool dark place', completed: false },
      { id: 'w4', text: 'Acquire backup purification tablets', completed: false }
    ]
  },
  {
    id: 's2',
    title: 'Food Stockpile',
    category: 'FOOD',
    content: `### STRATEGY: "Deep Larder"
Do not buy "survival food" you don't eat. Eat what you store, store what you eat.

### 1. The Staples (Long Term)
- **White Rice**: 30+ years in Mylar bags with O2 absorbers.
- **Dried Beans**: 30+ years. Complete protein when combined with rice.
- **Honey/Sugar/Salt**: Indefinite shelf life.
- **Pasta**: 20+ years.
- **Canned Goods**: 2-5 years.

### 2. Nutritional Balance
Focus on high calorie density. Stress burns calories.
- Oils (Olive, Coconut) for fats.
- Multivitamins to prevent scurvy/deficiencies.

### 3. Cooking Without Power
- Propane camping stove (store fuel safely).
- Rocket stove (burns twigs/debris).
- Solar oven (stealthy, no smoke).`,
    checklist: [
      { id: 'f1', text: 'Calculate 2000 cal/person/day requirement', completed: false },
      { id: 'f2', text: 'Buy 20lb bag of rice + bucket', completed: false },
      { id: 'f3', text: 'Stockpile 2 weeks of canned meat', completed: false },
      { id: 'f4', text: 'Secure manual can opener', completed: false }
    ]
  },
  {
    id: 's3',
    title: 'Bug-Out Bag (72h)',
    category: 'SECURITY',
    content: `### CONCEPT
A kit to keep you alive while moving from Point A to Point B. Max weight: 20% of body weight.

### THE 5 C's of SURVIVABILITY
1. **Cutting**: Full tang fixed blade knife + Multitool.
2. **Combustion**: Ferro rod, 2x Bic lighters, waterproof matches.
3. **Cover**: Tarp, wool blanket, or bivy sack.
4. **Container**: Single-walled stainless steel bottle (can boil water in it).
5. **Cordage**: 100ft Paracord (550lb test).

### Additional Essentials
- Map & Compass (Local area).
- First Aid Kit (Trauma focused).
- Headlamp + spare batteries.
- Cash (Small bills).
- Copies of Documents (Sealed).`,
    checklist: [
      { id: 'b1', text: 'Acquire robust backpack (grey man style)', completed: false },
      { id: 'b2', text: 'Pack 5 C\'s', completed: false },
      { id: 'b3', text: 'Pack 3 days of freeze-dried food', completed: false },
      { id: 'b4', text: 'Scan and encrypt important docs to USB', completed: false }
    ]
  },
  {
    id: 's4',
    title: 'Communication Plan',
    category: 'COMMS',
    content: `### PACE Plan
**P**rimary: Cell Phone (while grid is up).
**A**lternate: Internet/Apps (Signal, Bridgefy for mesh).
**C**ontingency: UHF/VHF Radio (Local squad comms).
**E**mergency: HF Radio (Long distance news/contact).

### Monitoring
- Listen more than you transmit.
- Keep radios charged (solar).
- Know your frequencies (See Radio Panel).

### Signals
- Whistle: 3 blasts = Distress.
- Visual: Signal mirror, VS-17 panel.`,
    checklist: [
      { id: 'c1', text: 'Agree on family meeting point', completed: false },
      { id: 'c2', text: 'Buy Baofeng UV-5R or similar', completed: false },
      { id: 'c3', text: 'Program local repeater frequencies', completed: false },
      { id: 'c4', text: 'Print contact list (hard copy)', completed: false }
    ]
  }
];