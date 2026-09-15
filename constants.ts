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
  // ========================================
  // GLOBAL EMERGENCY (All Continents)
  // ========================================
  {
    id: 'g1', name: 'Intl Aviation Emergency', frequency: '121.500 MHz', mode: 'AM', band: 'VHF',
    region: 'GLOBAL', continent: 'GLOBAL', license: 'AVIATION',
    description: 'International aeronautical emergency frequency',
    restrictions: 'Restricted to aircraft emergencies. Monitor only unless in distress.'
  },

  {
    id: 'g2', name: 'Marine Ch 16 (Voice)', frequency: '156.800 MHz', mode: 'FM', band: 'VHF',
    region: 'GLOBAL', continent: 'GLOBAL', license: 'MARINE',
    description: 'International maritime distress, safety, and calling',
    restrictions: 'Marine VHF license required. Keep clear for distress calls.'
  },

  {
    id: 'g3', name: 'Marine Ch 70 (DSC)', frequency: '156.525 MHz', mode: 'DSC', band: 'VHF',
    region: 'GLOBAL', continent: 'GLOBAL', license: 'MARINE',
    description: 'Digital Selective Calling (GMDSS)',
    restrictions: 'Automated distress alerting. DSC-equipped radio required.'
  },

  {
    id: 'g4', name: 'Maritime MF Distress', frequency: '2182 kHz', mode: 'AM', band: 'MF',
    region: 'GLOBAL', continent: 'GLOBAL', license: 'MARINE',
    description: 'Medium-range maritime voice distress (legacy)',
    notes: 'Many coast guards no longer monitor continuously'
  },

  {
    id: 'g5', name: 'Maritime MF DSC', frequency: '2187.5 kHz', mode: 'DSC', band: 'MF',
    region: 'GLOBAL', continent: 'GLOBAL', license: 'MARINE',
    description: 'Maritime digital distress alerting'
  },

  {
    id: 'g6', name: 'Maritime HF Distress 1', frequency: '4125 kHz', mode: 'USB', band: 'HF',
    region: 'GLOBAL', continent: 'GLOBAL', license: 'MARINE',
    description: 'Long-distance maritime voice distress'
  },

  {
    id: 'g7', name: 'Maritime HF Distress 2', frequency: '8291 kHz', mode: 'USB', band: 'HF',
    region: 'GLOBAL', continent: 'GLOBAL', license: 'MARINE',
    description: 'Long-distance maritime voice distress'
  },

  {
    id: 'g8', name: '20m Emergency (Intl)', frequency: '14.300 MHz', mode: 'USB', band: 'HF',
    region: 'GLOBAL', continent: 'GLOBAL', license: 'AMATEUR',
    description: 'PRIMARY international amateur emergency frequency',
    network: 'IARU EmComm',
    notes: 'Recognized worldwide. ±20 kHz activity zone.'
  },

  {
    id: 'g9', name: '17m Emergency', frequency: '18.160 MHz', mode: 'USB', band: 'HF',
    region: 'GLOBAL', continent: 'GLOBAL', license: 'AMATEUR',
    description: 'International emergency center of activity',
    network: 'IARU EmComm'
  },

  {
    id: 'g10', name: '15m Emergency', frequency: '21.360 MHz', mode: 'USB', band: 'HF',
    region: 'GLOBAL', continent: 'GLOBAL', license: 'AMATEUR',
    description: 'International emergency center of activity',
    network: 'IARU EmComm'
  },

  // ========================================
  // NORTH AMERICA (IARU Region 2)
  // ========================================
  {
    id: 'na1', name: 'US National Simplex', frequency: '146.520 MHz', mode: 'FM', band: 'VHF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'AMATEUR',
    description: 'Primary US ham calling frequency',
    restrictions: 'US Technician license or higher'
  },

  {
    id: 'na2', name: 'GMRS Emergency', frequency: '462.675 MHz', mode: 'FM', band: 'UHF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'GMRS',
    description: 'GMRS Ch 20 / Emergency & Travel',
    restrictions: 'US GMRS license required (no exam)'
  },

  {
    id: 'na3', name: '6m FM Calling', frequency: '52.525 MHz', mode: 'FM', band: 'VHF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'AMATEUR',
    description: 'International 6-meter FM simplex calling'
  },

  {
    id: 'na4', name: 'UHF Calling', frequency: '446.000 MHz', mode: 'FM', band: 'UHF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'AMATEUR',
    description: 'PMR446 / 70cm calling frequency'
  },

  {
    id: 'na5', name: '80m Prepper Net', frequency: '3.818 MHz', mode: 'LSB', band: 'HF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'AMATEUR',
    description: 'Prepper/survival net (night)',
    notes: 'Active after sunset. General or higher license.'
  },

  {
    id: 'na6', name: '60m NVIS Emergency', frequency: '5.357 MHz', mode: 'USB', band: 'HF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'AMATEUR',
    description: 'Near Vertical Incidence Skywave (500mi range)',
    network: 'Prepper NVIS Channel',
    notes: 'Excellent for regional emergency comms'
  },

  {
    id: 'na7', name: '40m TAPRN', frequency: '7.242 MHz', mode: 'LSB', band: 'HF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'AMATEUR',
    description: 'The American Prepper Radio Network',
    network: 'TAPRN'
  },

  {
    id: 'na8', name: '20m TAPRN (Intl)', frequency: '14.242 MHz', mode: 'USB', band: 'HF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'AMATEUR',
    description: 'TAPRN international/long-distance',
    network: 'TAPRN',
    notes: 'Daytime propagation. Worldwide reach.'
  },

  {
    id: 'na9', name: 'Hurricane Watch Net', frequency: '14.325 MHz', mode: 'USB', band: 'HF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'AMATEUR',
    description: 'Active during Atlantic hurricane season',
    network: 'Hurricane Watch Net'
  },

  {
    id: 'na10', name: 'WWV Time Standard', frequency: '10.000 MHz', mode: 'AM', band: 'HF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'NONE',
    description: 'NIST time broadcasts & propagation reports',
    notes: 'Monitor only. Also 5/15/20 MHz.'
  },

  {
    id: 'na11', name: 'SHARES Net 1', frequency: '6765 kHz', mode: 'USB', band: 'HF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'AMATEUR',
    description: 'CISA SHARES weekly net (Wed 1600 UTC)',
    network: 'SHARES',
    restrictions: 'US government emergency network. Monitoring encouraged.'
  },

  {
    id: 'na12', name: 'SHARES Net 2', frequency: '6845 kHz', mode: 'USB', band: 'HF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'AMATEUR',
    description: 'CISA SHARES weekly net alternate',
    network: 'SHARES'
  },

  {
    id: 'na13', name: 'MARS Primary', frequency: '13.927 MHz', mode: 'USB', band: 'HF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'AMATEUR',
    description: 'Military Auxiliary Radio System',
    network: 'MARS',
    restrictions: 'MARS membership required for transmission'
  },

  {
    id: 'na14', name: '40m Emergency (R2)', frequency: '7.240 MHz', mode: 'LSB', band: 'HF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'AMATEUR',
    description: 'Region 2 emergency center of activity',
    network: 'IARU EmComm'
  },

  {
    id: 'na15', name: '80m Emergency (R2)', frequency: '3.750 MHz', mode: 'LSB', band: 'HF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'AMATEUR',
    description: 'Region 2 emergency (night)',
    network: 'IARU EmComm'
  },

  {
    id: 'na16', name: 'CB Prepper 37', frequency: '27.375 MHz', mode: 'USB', band: 'HF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'CB',
    description: 'CB Channel 37 USB - Prepper/survival network',
    restrictions: 'No license in US. Max 4W. 20mi range typical.',
    notes: 'Informal prepper calling frequency'
  },

  {
    id: 'na17', name: 'CB Survivalist', frequency: '27.365 MHz', mode: 'USB', band: 'HF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'CB',
    description: 'CB Channel 36 USB - Survivalist network'
  },

  // ========================================
  // SOUTH AMERICA (IARU Region 2)
  // ========================================
  {
    id: 'sa1', name: 'Brazil 70cm Primary', frequency: '430-440 MHz', mode: 'FM', band: 'UHF',
    region: 'IARU_R2', continent: 'SOUTH_AMERICA', license: 'AMATEUR',
    description: 'Brazilian amateur primary allocation',
    network: 'RENER',
    restrictions: 'ANATEL amateur license required'
  },

  {
    id: 'sa2', name: 'Brazil 4mm Band', frequency: '81-81.5 MHz', mode: 'FM', band: 'VHF',
    region: 'IARU_R2', continent: 'SOUTH_AMERICA', license: 'AMATEUR',
    description: 'Recent allocation - 4mm band',
    restrictions: 'Brazil ANATEL license'
  },

  {
    id: 'sa3', name: 'Argentina 60m', frequency: '5.3515-5.3665 MHz', mode: 'USB', band: 'HF',
    region: 'IARU_R2', continent: 'SOUTH_AMERICA', license: 'AMATEUR',
    description: 'Argentina 60-meter band allocation',
    restrictions: 'ENACOM license required'
  },

  {
    id: 'sa4', name: 'South America 40m', frequency: '7.050 MHz', mode: 'LSB', band: 'HF',
    region: 'IARU_R2', continent: 'SOUTH_AMERICA', license: 'AMATEUR',
    description: 'Popular net frequency - emergency monitoring',
    notes: 'High concentration of monitoring stations'
  },

  {
    id: 'sa5', name: 'South America 20m', frequency: '14.270 MHz', mode: 'USB', band: 'HF',
    region: 'IARU_R2', continent: 'SOUTH_AMERICA', license: 'AMATEUR',
    description: 'Popular daily traffic - emergency capability'
  },

  // ========================================
  // EUROPE (IARU Region 1)
  // ========================================
  {
    id: 'eu1', name: 'PMR446 Ch 1 Emergency', frequency: '446.00625 MHz', mode: 'FM', band: 'UHF',
    region: 'IARU_R1', continent: 'EUROPE', license: 'NONE',
    description: 'PRIMARY European license-free emergency calling',
    restrictions: 'No license. Max 0.5W. Simplex only.',
    notes: 'Use CTCSS 67.0 Hz (tone 1) for prepper nets'
  },

  {
    id: 'eu2', name: 'PMR446 Ch 8 Italy', frequency: '446.09375 MHz', mode: 'FM', band: 'UHF',
    region: 'IARU_R1', continent: 'EUROPE', license: 'NONE',
    description: 'Rete Radio Montana - Italian mountain safety',
    notes: 'Use CTCSS 16 in Italy'
  },

  {
    id: 'eu3', name: 'PMR446 Ch 9 DMR', frequency: '446.10625 MHz', mode: 'DIGITAL', band: 'UHF',
    region: 'IARU_R1', continent: 'EUROPE', license: 'NONE',
    description: 'DMR digital distress channel',
    notes: 'CC1 TG9112 - DMR radios only'
  },

  {
    id: 'eu4', name: '80m Emergency (R1)', frequency: '3.760 MHz', mode: 'LSB', band: 'HF',
    region: 'IARU_R1', continent: 'EUROPE', license: 'AMATEUR',
    description: 'Region 1 emergency center (night)',
    network: 'IARU EmComm',
    restrictions: 'CEPT amateur license'
  },

  {
    id: 'eu5', name: '40m Emergency (R1)', frequency: '7.110 MHz', mode: 'LSB', band: 'HF',
    region: 'IARU_R1', continent: 'EUROPE', license: 'AMATEUR',
    description: 'Region 1 emergency center',
    network: 'IARU EmComm'
  },

  // ========================================
  // ASIA-PACIFIC (IARU Region 3)
  // ========================================
  {
    id: 'ap1', name: 'Australia VHF Calling', frequency: '146.500 MHz', mode: 'FM', band: 'VHF',
    region: 'IARU_R3', continent: 'OCEANIA', license: 'AMATEUR',
    description: 'Australian 2m simplex calling',
    restrictions: 'ACMA amateur license'
  },

  {
    id: 'ap2', name: 'Australia 6m Intl DX', frequency: '50.110 MHz', mode: 'USB', band: 'VHF',
    region: 'IARU_R3', continent: 'OCEANIA', license: 'AMATEUR',
    description: 'International 6m DX frequency'
  },

  {
    id: 'ap3', name: 'Australia 6m Calling', frequency: '50.200 MHz', mode: 'FM', band: 'VHF',
    region: 'IARU_R3', continent: 'OCEANIA', license: 'AMATEUR',
    description: 'Australian 6m calling frequency'
  },

  {
    id: 'ap4', name: 'Japan 2m Emergency', frequency: '145.00 MHz', mode: 'FM', band: 'VHF',
    region: 'IARU_R3', continent: 'ASIA', license: 'AMATEUR',
    description: 'Japanese emergency calling',
    restrictions: 'JARL amateur license',
    network: 'JARL EmComm'
  },

  {
    id: 'ap5', name: 'Japan 2m Emergency Alt', frequency: '145.50 MHz', mode: 'FM', band: 'VHF',
    region: 'IARU_R3', continent: 'ASIA', license: 'AMATEUR',
    description: 'Japanese emergency calling (alternate)',
    network: 'JARL EmComm'
  },

  {
    id: 'ap6', name: 'Japan 70cm Emergency', frequency: '433.0 MHz', mode: 'FM', band: 'UHF',
    region: 'IARU_R3', continent: 'ASIA', license: 'AMATEUR',
    description: 'Japanese UHF emergency',
    network: 'JARL EmComm'
  },

  {
    id: 'ap7', name: 'China 40m Popular', frequency: '7.050 MHz', mode: 'USB', band: 'HF',
    region: 'IARU_R3', continent: 'ASIA', license: 'AMATEUR',
    description: 'Popular daily traffic - emergency monitoring',
    restrictions: 'CRAC amateur license (Class A/B/C)'
  },

  {
    id: 'ap8', name: 'China 20m Popular', frequency: '14.270 MHz', mode: 'USB', band: 'HF',
    region: 'IARU_R3', continent: 'ASIA', license: 'AMATEUR',
    description: 'High concentration of monitoring stations'
  },

  {
    id: 'ap9', name: 'China Space Station', frequency: '435.075 MHz', mode: 'FM', band: 'UHF',
    region: 'IARU_R3', continent: 'ASIA', license: 'AMATEUR',
    description: 'Chinese Space Station FM repeater',
    notes: 'Active when station is overhead'
  },

  {
    id: 'ap10', name: 'Asia-Pacific 80m', frequency: '3.600 MHz', mode: 'LSB', band: 'HF',
    region: 'IARU_R3', continent: 'ASIA', license: 'AMATEUR',
    description: 'Region 3 emergency center',
    network: 'IARU EmComm'
  },

  // ========================================
  // AFRICA (IARU Region 1)
  // ========================================
  {
    id: 'af1', name: 'SADC 20m Emergency', frequency: '14.300 MHz', mode: 'USB', band: 'HF',
    region: 'IARU_R1', continent: 'AFRICA', license: 'AMATEUR',
    description: 'Southern Africa emergency frequency',
    network: 'HAMNET',
    notes: 'South African Radio League emergency network'
  },

  {
    id: 'af2', name: 'SADC 40m Emergency', frequency: '7.110 MHz', mode: 'LSB', band: 'HF',
    region: 'IARU_R1', continent: 'AFRICA', license: 'AMATEUR',
    description: 'SADC regional emergency',
    network: 'HAMNET'
  },

  {
    id: 'af3', name: 'SADC 80m Emergency', frequency: '3.760 MHz', mode: 'LSB', band: 'HF',
    region: 'IARU_R1', continent: 'AFRICA', license: 'AMATEUR',
    description: 'SADC night emergency frequency',
    network: 'HAMNET'
  },

  // ========================================
  // ADDITIONAL SPECIALIZED FREQUENCIES
  // ========================================
  {
    id: 'sp1', name: 'APRS North America', frequency: '144.390 MHz', mode: 'DIGITAL', band: 'VHF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'AMATEUR',
    description: 'Automatic Packet Reporting System',
    notes: 'Position tracking and messaging'
  },

  {
    id: 'sp2', name: 'APRS Europe/Africa', frequency: '144.800 MHz', mode: 'DIGITAL', band: 'VHF',
    region: 'IARU_R1', continent: 'EUROPE', license: 'AMATEUR',
    description: 'APRS frequency for Region 1'
  },

  {
    id: 'sp3', name: 'APRS Australia', frequency: '145.175 MHz', mode: 'DIGITAL', band: 'VHF',
    region: 'IARU_R3', continent: 'OCEANIA', license: 'AMATEUR',
    description: 'APRS frequency for Region 3'
  },

  {
    id: 'sp4', name: 'NAVTEX International', frequency: '518 kHz', mode: 'DIGITAL', band: 'MF',
    region: 'GLOBAL', continent: 'GLOBAL', license: 'NONE',
    description: 'Maritime safety information broadcasts',
    notes: 'Monitor only. Automated weather and safety info.'
  },

  {
    id: 'sp5', name: 'Satellite EPIRB', frequency: '406.0-406.1 MHz', mode: 'DIGITAL', band: 'UHF',
    region: 'GLOBAL', continent: 'GLOBAL', license: 'MARINE',
    description: 'Cospas-Sarsat emergency beacon',
    restrictions: 'Emergency Position Indicating Radio Beacon. Distress use only.',
    notes: 'Satellite-based search and rescue'
  },

  // ========================================
  // PUBLIC MONITORING FREQUENCIES (Receive-Only)
  // ========================================

  // --- Aviation Communications ---
  {
    id: 'av1', name: 'Aviation Voice Band', frequency: '118.0-136.975 MHz', mode: 'AM', band: 'VHF',
    region: 'GLOBAL', continent: 'GLOBAL', license: 'MONITORING',
    description: 'Civil aviation ATC communications',
    restrictions: 'Monitor only. Transmitting requires pilot/ATC license.',
    notes: 'Tower, Ground, Approach/Departure. Varies by airport.'
  },

  {
    id: 'av2', name: 'Military Air Guard', frequency: '243.0 MHz', mode: 'AM', band: 'UHF',
    region: 'GLOBAL', continent: 'GLOBAL', license: 'MONITORING',
    description: 'Military aircraft emergency frequency',
    restrictions: 'Monitor only. Military use.',
    notes: 'UHF guard frequency, continuously monitored'
  },

  {
    id: 'av3', name: 'ACARS Primary', frequency: '131.550 MHz', mode: 'DIGITAL', band: 'VHF',
    region: 'GLOBAL', continent: 'GLOBAL', license: 'MONITORING',
    description: 'Aircraft Communications Addressing and Reporting System',
    notes: 'Digital aircraft data - position, weather, messages. Requires decoder.'
  },

  {
    id: 'av4', name: 'ACARS Europe', frequency: '131.725 MHz', mode: 'DIGITAL', band: 'VHF',
    region: 'IARU_R1', continent: 'EUROPE', license: 'MONITORING',
    description: 'ACARS European primary frequency'
  },

  {
    id: 'av5', name: 'ACARS North America', frequency: '130.025 MHz', mode: 'DIGITAL', band: 'VHF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'MONITORING',
    description: 'ACARS secondary North American frequency'
  },

  {
    id: 'av6', name: 'ACARS Japan/Asia', frequency: '131.450 MHz', mode: 'DIGITAL', band: 'VHF',
    region: 'IARU_R3', continent: 'ASIA', license: 'MONITORING',
    description: 'ACARS primary for Japan, Australia, Oceania'
  },

  // --- Weather Services ---
  {
    id: 'wx1', name: 'NOAA Weather 1', frequency: '162.400 MHz', mode: 'FM', band: 'VHF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'WEATHER',
    description: 'NOAA Weather Radio All Hazards',
    restrictions: 'Broadcast only. Special receiver required.',
    notes: '24/7 weather, watches, warnings, emergency alerts (EAS)'
  },

  {
    id: 'wx2', name: 'NOAA Weather 2', frequency: '162.425 MHz', mode: 'FM', band: 'VHF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'WEATHER',
    description: 'NOAA Weather Radio All Hazards'
  },

  {
    id: 'wx3', name: 'NOAA Weather 3', frequency: '162.450 MHz', mode: 'FM', band: 'VHF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'WEATHER',
    description: 'NOAA Weather Radio All Hazards'
  },

  {
    id: 'wx4', name: 'NOAA Weather 4', frequency: '162.475 MHz', mode: 'FM', band: 'VHF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'WEATHER',
    description: 'NOAA Weather Radio All Hazards'
  },

  {
    id: 'wx5', name: 'NOAA Weather 5', frequency: '162.500 MHz', mode: 'FM', band: 'VHF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'WEATHER',
    description: 'NOAA Weather Radio All Hazards'
  },

  {
    id: 'wx6', name: 'NOAA Weather 6', frequency: '162.525 MHz', mode: 'FM', band: 'VHF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'WEATHER',
    description: 'NOAA Weather Radio All Hazards'
  },

  {
    id: 'wx7', name: 'NOAA Weather 7', frequency: '162.550 MHz', mode: 'FM', band: 'VHF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'WEATHER',
    description: 'NOAA Weather Radio All Hazards'
  },

  // --- Weather Satellites (APT) ---
  {
    id: 'sat1', name: 'NOAA 15 APT', frequency: '137.6200 MHz', mode: 'FM', band: 'VHF',
    region: 'GLOBAL', continent: 'GLOBAL', license: 'MONITORING',
    description: 'NOAA 15 Automatic Picture Transmission',
    notes: 'Weather satellite images. Requires SDR + decoder software.'
  },

  {
    id: 'sat2', name: 'NOAA 18 APT', frequency: '137.9125 MHz', mode: 'FM', band: 'VHF',
    region: 'GLOBAL', continent: 'GLOBAL', license: 'MONITORING',
    description: 'NOAA 18 Automatic Picture Transmission'
  },

  {
    id: 'sat3', name: 'NOAA 19 APT', frequency: '137.1000 MHz', mode: 'FM', band: 'VHF',
    region: 'GLOBAL', continent: 'GLOBAL', license: 'MONITORING',
    description: 'NOAA 19 Automatic Picture Transmission'
  },

  // --- Shortwave International Broadcast ---
  {
    id: 'sw1', name: 'BBC World Service', frequency: '5875-17885 kHz', mode: 'AM', band: 'HF',
    region: 'GLOBAL', continent: 'GLOBAL', license: 'BROADCAST',
    description: 'BBC international shortwave broadcasts',
    notes: 'Multiple frequencies. Best after sunset 5900-10000 kHz. Day: 12000-22000 kHz.'
  },

  {
    id: 'sw2', name: 'Voice of America', frequency: '4930-17895 kHz', mode: 'AM', band: 'HF',
    region: 'GLOBAL', continent: 'GLOBAL', license: 'BROADCAST',
    description: 'VOA international shortwave broadcasts',
    notes: 'Multiple languages. Check voanews.com for schedules.'
  },

  {
    id: 'sw3', name: 'Deutsche Welle', frequency: '6100-17840 kHz', mode: 'AM', band: 'HF',
    region: 'GLOBAL', continent: 'GLOBAL', license: 'BROADCAST',
    description: 'DW (Germany) international broadcasts',
    notes: 'Multiple languages. dw.com for current schedule.'
  },

  {
    id: 'sw4', name: 'Radio China Int\'l', frequency: '5960-17650 kHz', mode: 'AM', band: 'HF',
    region: 'GLOBAL', continent: 'ASIA', license: 'BROADCAST',
    description: 'China Radio International shortwave'
  },

  {
    id: 'sw5', name: 'Radio France Int\'l', frequency: '5925-17850 kHz', mode: 'AM', band: 'HF',
    region: 'GLOBAL', continent: 'GLOBAL', license: 'BROADCAST',
    description: 'RFI international shortwave broadcasts'
  },

  // --- Railroad Operations (US/Canada) ---
  {
    id: 'rr1', name: 'Railroad Main Band', frequency: '160-161 MHz', mode: 'FM', band: 'VHF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'RAILROAD',
    description: 'AAR railroad communications (97 channels)',
    restrictions: 'Monitor only. Railroad operations.',
    notes: 'Dispatch, crew, maintenance. Some moving to NXDN digital.'
  },

  {
    id: 'rr2', name: 'End-of-Train Device', frequency: '452.9375 MHz', mode: 'FM', band: 'UHF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'RAILROAD',
    description: 'EOT telemetry - lead locomotive',
    notes: 'Can indicate approaching train. Pairs with 457.9375 MHz.'
  },

  {
    id: 'rr3', name: 'End-of-Train Device (Rear)', frequency: '457.9375 MHz', mode: 'FM', band: 'UHF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'RAILROAD',
    description: 'EOT telemetry - end-of-train device'
  },

  {
    id: 'rr4', name: 'Positive Train Control', frequency: '217-222 MHz', mode: 'DIGITAL', band: 'VHF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'RAILROAD',
    description: 'PTC safety system data link',
    notes: 'Automated braking system. Digital data bursts.'
  },

  // --- Public Safety Interoperability ---
  {
    id: 'ps1', name: 'Public Safety VHF', frequency: '150-174 MHz', mode: 'FM', band: 'VHF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'MONITORING',
    description: 'Police, Fire, EMS (analog + P25 digital)',
    restrictions: 'Monitor only. Many agencies use encrypted P25.',
    notes: 'Check radioreference.com for local frequencies. Varies by jurisdiction.'
  },

  {
    id: 'ps2', name: 'Public Safety UHF', frequency: '450-470 MHz', mode: 'FM', band: 'UHF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'MONITORING',
    description: 'Police, Fire, EMS (analog + P25 digital)',
    notes: 'UHF better in urban areas. Many going digital/encrypted.'
  },

  {
    id: 'ps3', name: 'Public Safety 800 MHz', frequency: '806-869 MHz', mode: 'DIGITAL', band: 'UHF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'MONITORING',
    description: 'Trunked P25 systems',
    restrictions: 'Requires P25-capable scanner.',
    notes: 'Most major cities. Check local trunked system info.'
  },

  // --- FRS/GMRS Additional Channels ---
  {
    id: 'frs1', name: 'FRS Channel 1', frequency: '462.5625 MHz', mode: 'FM', band: 'UHF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'NONE',
    description: 'Family Radio Service Ch 1',
    restrictions: 'License-free. Max 2W. Fixed antenna. US only.',
    notes: 'Useful for local coordination.'
  },

  {
    id: 'frs2', name: 'FRS/GMRS Ch 15', frequency: '462.5500 MHz', mode: 'FM', band: 'UHF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'GMRS',
    description: 'Shared FRS/GMRS channel',
    restrictions: 'FRS: license-free, 2W. GMRS: license required, 50W + repeaters.',
    notes: 'Popular for hiking/outdoor groups.'
  },

  // --- Time Standards & Propaganda ---
  {
    id: 'ts1', name: 'WWV 5 MHz', frequency: '5.000 MHz', mode: 'AM', band: 'HF',
    region: 'GLOBAL', continent: 'GLOBAL', license: 'NONE',
    description: 'NIST time standard (alternate frequency)',
    notes: 'Also broadcasts solar-terrestrial info. Primary: 10 MHz.'
  },

  {
    id: 'ts2', name: 'WWV 15 MHz', frequency: '15.000 MHz', mode: 'AM', band: 'HF',
    region: 'GLOBAL', continent: 'GLOBAL', license: 'NONE',
    description: 'NIST time standard (alternate frequency)'
  },

  {
    id: 'ts3', name: 'CHU Canada', frequency: '3.330 MHz', mode: 'AM', band: 'HF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'NONE',
    description: 'Canadian time standard',
  },

  // ========================================
  // WEBSDR & AMATEUR RADIO
  // ========================================
  {
    id: 'wsdr1', name: 'Univ Twente WebSDR', frequency: '0-29 MHz', mode: 'USB', band: 'HF',
    region: 'IARU_R1', continent: 'EUROPE', license: 'MONITORING',
    description: 'The most popular WebSDR, located in Enschede, Netherlands.',
    notes: 'Access via: http://websdr.ewi.utwente.nl:8901/'
  },
  {
    id: 'wsdr2', name: 'Secret Nuclear Bunker', frequency: '0-30 MHz', mode: 'USB', band: 'HF',
    region: 'IARU_R1', continent: 'EUROPE', license: 'MONITORING',
    description: 'WebSDR located in a former nuclear bunker in Cheshire, UK.',
    notes: 'Access via: http://hackgreen.co.uk/'
  },
  {
    id: 'wsdr3', name: 'Pardinho KiwiSDR', frequency: '0-30 MHz', mode: 'USB', band: 'HF',
    region: 'IARU_R2', continent: 'SOUTH_AMERICA', license: 'MONITORING',
    description: 'Excellent reception for amateur radio and shortwave in South America.',
    notes: 'Access via: http://pardinho.proxy.kiwisdr.com:8073/'
  },
  {
    id: 'wsdr4', name: 'K3FEF WebSDR', frequency: 'Varies', mode: 'USB', band: 'HF',
    region: 'IARU_R2', continent: 'NORTH_AMERICA', license: 'MONITORING',
    description: 'Pennsylvania USA node, good for US military monitoring (HFGCS).',
    notes: 'Access via: http://k3fef.com:8901/'
  }
];

// --- PROPHECY DATA ---
// NOTE: This is the legacy system. For the COMPREHENSIVE prophecy system with 60+ prophecies
// cataloged (Daniel, Isaiah, Ezekiel, Zechariah, Joel, Jesus, Revelation, Minor Prophets,
// and Warnings about Islamic prophecies), see: prophecyData.ts and PROPHECY_STUDY.md
// The ProphecyIntel component now uses the comprehensive system automatically.

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
    title: 'Water Protocols (Scarcity Edition)',
    category: 'WATER',
    content: `### PRIORITY 0: HYDRATION IN COLLAPSE
Without water, death occurs in 72 hours. In a scarcity scenario, potable water is your most valuable currency.

### 1. Urban and Rural Sourcing (Scavenging)
- **Subterranean Cisterns**: Commercial buildings and condos keep clean tanks for days after utility shutoff. Use a hand pump or a bucket with a rope.
- **Air Conditioning**: Condensation water is distilled. It lacks minerals but is bacteria-free. Collect it and add a pinch of salt.
- **Rainwater**: Use polyethylene tarps. **WARNING**: The first 10 inches of rain clean pollutants from the air; discard the first 20 liters.

### 2. DIY Bio-Sand Filter (Construction)
If commercial filters (Sawyer/Lifestraw) fail, build this system:
- **Body**: 5-gallon bucket or 6-inch PVC pipe.
- **Base (2 inches)**: Large stones for flow support.
- **Middle (4 inches)**: Activated charcoal (burn wood and crush it). **ESSENTIAL**: Removes chemical toxins.
- **Top (6 inches)**: Washed fine sand.
- **The Secret**: Keep 2 inches of water above the sand. In 2 weeks, a *Schmutzdecke* (biological layer) creates itself, actively consuming bacteria.

### 3. Final Disinfection
DIY filters do not kill viruses. Use:
- **Boiling**: 1 minute at a rolling boil.
- **SODIS**: Transparent PET bottles in the sun for 6 hours (UV rays kill pathogens).
- **Bleach**: 2 drops of unscented bleach per liter. Wait 30 minutes.`,
    checklist: [
      { id: 'w1', text: 'Locate alternative water sources (cisterns, wells)', completed: false },
      { id: 'w2', text: 'Build a bio-sand filter prototype', completed: false },
      { id: 'w3', text: 'Stock 5 gallons of bleach (cleaning and purification)', completed: false },
      { id: 'w4', text: 'Learn to identify water-indicator plants (Willows, Reeds)', completed: false }
    ]
  },
  {
    id: 's2',
    title: 'Food Stockpiling (Maximum Resilience)',
    category: 'FOOD',
    content: `### STRATEGY: "Deep and Living Pantry"
Food runs out. Knowledge of calorie preservation is eternal.

### 1. The "5-Gallon Bucket" Method
For 25+ year storage, use:
- **Mylar Bags**: 7 mil thickness.
- **O2 Absorbers**: 2000cc per bucket.
- **Items**: White rice, beans, oats, sugar, salt.
- **Sealing**: Use a hair straightener or clothes iron to seal the Mylar bag.

### 2. Calories vs. Nutrition
Combat/flight stress burns 3000-4000 kcal/day.
- **Fats**: The hardest item to store (rancidity). Focus on Ghee (clarified butter) and Coconut Oil.
- **Protein**: Canned meat (Spam, Tuna) and pickled eggs (limewater method).
- **Vitamins**: Fresh bean sprouts (Sprouting) provide Vitamin C in 3 days without soil.

### 3. Stealth Cooking
Avoid smoke to not reveal your position.
- **Solar Oven**: Silent, odorless.
- **Thermal Blanket**: Boil the food and place it in an insulated box (Haybox) to finish cooking without using fuel.`,
    checklist: [
      { id: 'f1', text: 'Set up 3 months of rotation (FIFO - First In, First Out)', completed: false },
      { id: 'f2', text: 'Learn to make Ghee to store fat long-term', completed: false },
      { id: 'f3', text: 'Acquire 10 Mylar bags and 50 O2 absorbers', completed: false },
      { id: 'f4', text: 'Stock 10lbs of salt (essential for meat preservation)', completed: false }
    ]
  },
  {
    id: 's3',
    title: 'Bug-out Bag & Grey Man Theory',
    category: 'SECURITY',
    content: `### THE CONCEPT OF MOBILITY AND INVISIBILTY
Your kit must be discreet. A tactical backpack full of "molle" is a target for confiscation by police or looters.

### 1. The Backpack (Defense Levels)
- **Level 1 (Pockets)**: Lighter, pocket knife, small flashlight, cash. If you lose the bag, you survive.
- **Level 2 (Backpack)**: The 5 C's of survival (Cutting, Combustion, Cover, Container, Cordage).
- **Level 3 (Bug-out Location)**: Construction tools and seeds.

### 2. The "Grey Man" Style
- **Clothing**: Ordinary clothes, neutral colors (navy blue, grey, brown). No logos.
- **Behavior**: Move with purpose, but without haste. Do not make prolonged eye contact.
- **Equipment**: Cover shiny items with matte electrical tape.

### 3. Sourcing Items on the Run
- **Aquarium Tubing**: For siphoning gas from abandoned vehicles.
- **Microwave Magnet**: To create improvised compasses.
- **Broken Glass**: Excellent scraper for wood and fire tinder.`,
    checklist: [
      { id: 'b1', text: 'Reduce bag weight to 15% of your body weight', completed: false },
      { id: 'b2', text: 'Test the kit on a 10km hike in the dark', completed: false },
      { id: 'b3', text: 'Acquire a portable water filter (Sawyer Squeeze)', completed: false },
      { id: 'b4', text: 'Encrypt documents on an SD card hidden in your belt', completed: false }
    ]
  },
  {
    id: 's4',
    title: 'Comms & Signals (Low-Tech)',
    category: 'COMMS',
    content: `### COMMUNICATION WHEN THE GRID GOES DOWN
Information is power. Silence is security.

### 1. Visual Signals (Scarcity)
- **Signal Mirror**: Can be seen from 20 miles away. Use an old CD or a powered-off phone screen.
- **Hobo Signs**: Agree on symbols with your group (e.g., a scratch on a wall = "Safe Area").
- **Improvised VS-17**: A neon orange or pink cloth for aerial signaling.

### 2. Radio and Signal Intelligence (SIGINT)
- **Monitoring**: Never transmit without extreme necessity. Use DIY "Yagi" antennas (made with hangers) to focus signal and avoid being triangulated.
- **Group Code**: Use a "One-time pad" (book of codes) for secure communications that even governments cannot crack without the physical key.

### 3. Dead Drops
Hide physical messages in wall cracks or hollow trees. Avoid direct communication that exposes both members.`,
    checklist: [
      { id: 'c1', text: 'Create a One-time pad codebook with your family', completed: false },
      { id: 'c2', text: 'Learn to build a Tape Measure J-Pole antenna', completed: false },
      { id: 'c3', text: 'Practice Morse code (at least SOS)', completed: false },
      { id: 'c4', text: 'Keep a crank/solar AM/FM radio', completed: false }
    ]
  },
  {
    id: 's5',
    title: 'Bio-Sand Filtration (Advanced)',
    category: 'WATER',
    content: `### SEMI-PERMANENT FILTRATION SYSTEM
For a stable base, you need larger volumes of water.

### 1. Container Construction
Use a 55-gallon blue food-grade drum.
- **Bottom**: Drain layer with drilled PVC pipes for water outlet.
- **Media**: 16 inches of fine silica sand (0.1 to 0.3mm).
- **Diffuser**: A drilled plate at the top so water doesn't "bore" through the sand when poured.

### 2. The Biological Layer (Schmutzdecke)
This layer is an ecosystem of protozoa and "good" bacteria that attack pathogens.
- **Maintenance**: Never let the sand dry out. Biological life needs moisture.
- **Cleaning**: Every 6 months, scrape off the first inch of sand ("Scraping") and replace.

### 3. Improvised Potability Test
In the absence of a lab, use the "Transparency Test": if you can read a newspaper through 1 foot of water in a white bucket, it is physically clean, but still requires boiling.`,
    checklist: [
      { id: 'w5', text: 'Acquire food-grade 55-gallon drum', completed: false },
      { id: 'w6', text: 'Wash 200lbs of fine sand until water runs clear', completed: false },
      { id: 'w7', text: 'Install outlet faucet with rubber sealing', completed: false },
      { id: 'w8', text: 'Keep system running for 2 weeks for maturation', completed: false }
    ]
  },
  {
    id: 's6',
    title: 'Fire Protocols (Extreme)',
    category: 'SKILLS',
    content: `### HEAT AND SIGNALING WITHOUT RESOURCES
At 32°F (0°C), hypothermia kills in a few hours. Fire is life.

### 1. Ignition in Adverse Conditions
- **Battery and Steel Wool**: Touch the terminals of a 9V battery (or 2 AAs) to steel wool. Instant reaction.
- **Hand Drill (Friction)**: Requires extremely dry wood (Yucca, Cedar). Demands calloused hands and patience.
- **Scavenging Flint**: Use a carbon steel knife against a piece of quartz or chert to generate sparks.

### 2. Invisible Fire Structure (Dakota Fire Pit)
Hide your light and smoke:
- Dig two holes connected by an underground tunnel.
- The fire burns in one hole while the other provides constant oxygen.
- **Advantage**: Produces almost no smoke and light is not visible from a distance.

### 3. Emergency Tinder (Char Cloth)
Turn cotton t-shirt scraps into Char Cloth. It catches the smallest spark and turns into immediate ember.`,
    checklist: [
      { id: 'sk1', text: 'Practice the Dakota Fire Pit in your yard', completed: false },
      { id: 'sk2', text: 'Make a batch of Char Cloth using a metal tin', completed: false },
      { id: 'sk3', text: 'Learn to identify pine resin (natural accelerant)', completed: false },
      { id: 'sk4', text: 'Master ignition with glasses/presbyopia lens', completed: false }
    ]
  },
  {
    id: 's7',
    title: 'Debris & Thermal Shelter',
    category: 'SKILLS',
    content: `### SHELTER ENGINEERING IN SCARCITY
The goal is 98.6°F (37°C). The shelter must be small to retain body heat.

### 1. The Debris Hut (A-Frame)
- **Spine**: A strong log supported in a V or tree branch.
- **Ribs**: Branches leaning against the spine.
- **Insulation**: 2 to 3 feet of dry leaves, moss, or grass over the ribs. **WARNING**: If the layer is thin, you will get wet and die of cold.

### 2. The Thermal Bed (Vital)
NEVER sleep directly on the ground. The soil sucks your heat.
- Build a "bed" 8 inches high made of crumpled leaves or pine boughs.

### 3. Urban Shelter
- **Cardboard**: Best urban thermal insulator. Use multiple layers.
- **Bubble Wrap**: Traps static air. Wrap yourself in it inside a large trash bag.`,
    checklist: [
      { id: 'sk5', text: 'Store 100ft of Paracord (essential cordage)', completed: false },
      { id: 'sk6', text: 'Practice building a Lean-to in 15 minutes', completed: false },
      { id: 'sk7', text: 'Learn to identify the prevailing wind direction', completed: false },
      { id: 'sk8', text: 'Identify hazards (Widowmakers - dead branches above)', completed: false }
    ]
  },
  {
    id: 's8',
    title: 'Bio-Fuel & DIY Energy',
    category: 'ENERGY',
    content: `### ENERGY INDEPENDENCE IN CHAOS
Old diesel engines (mechanical) can run on almost any oil.

### 1. Biodiesel Production (Scarcity Step)
- **Ingredients**: Used cooking oil, Methanol (can be 99% racing fuel or HEET), and Lye (Sodium Hydroxide).
- **The Chemistry**: Transesterification removes glycerin which clogs fuel injectors.
- **Purification**: Without modern gear, use "Solar Sedimentation": leave the mix in PET bottles in the sun for 48h. Glycerin drops, fuel rises.

### 2. Wood Gas (Gasifier)
Convert wood into gas to run gasoline engines.
- Requires two sealed metal buckets and copper tubing.
- Wood burns without oxygen, releasing CO and H (syngas).

### 3. Dead Batteries
Recover lead-acid car batteries using Epsom salt (Magnesium Sulfate) and distilled water.`,
    checklist: [
      { id: 'e1', text: 'Stock 10lbs of Lye and 5 gallons of 99% Alcohol', completed: false },
      { id: 'e2', text: 'Build a mini-solar still for water and fuel', completed: false },
      { id: 'e3', text: 'Learn basic diesel generator mechanics', completed: false },
      { id: 'e4', text: 'Identify vehicles without electronics (pre-1998)', completed: false }
    ]
  },
  {
    id: 's9',
    title: 'Crisis Sanitation & Bio-Hazards',
    category: 'SKILLS',
    content: `### THE WAR AGAINST DYSENTERY
In disasters, lack of hygiene kills more than hunger. When the sewage stops flowing, you need a plan.

### 1. The "Two-Bucket" System (Strategic)
Separation is the key to avoiding odor and disease propagation.
- **Bucket 1 (Liquids)**: Urine only. Can be disposed of in absorbent soil far from water sources.
- **Bucket 2 (Solids)**: Use a heavy-duty bag. After each use, cover with sawdust, campfire ash, or lime. This dries the waste and prevents flies (vectors) from carrying diseases to your food.

### 2. Scarcity Hygiene
- **Sponge Bath**: Use only 1 pint (500ml) of water. Focus on armpits, groin, and feet.
- **DIY Handwash**: Hang a PET bottle with a small hole. Use a nail as a plug. Use coconut soap (most versatile).

### 3. Waste Management
- **DIY Incinerator**: Use a 55-gallon metal drum with side holes for high-temp burning. Burn only biologically hazardous waste.`,
    checklist: [
      { id: 'sk9', text: 'Acquire two 5-gallon buckets and snap-on seats', completed: false },
      { id: 'sk10', text: 'Stock 20lbs of lime or 2 bags of dry sawdust', completed: false },
      { id: 'sk11', text: 'Learn to make Lye soap from wood ashes', completed: false },
      { id: 'sk12', text: 'Identify a disposal zone 150ft from any water', completed: false }
    ]
  },
  {
    id: 's10',
    title: 'Trauma & Combat Medicine',
    category: 'MEDICAL',
    content: `### MEDICINE WHEN HELP IS NOT COMING
Absolute focus on "Stop the Bleed".

### 1. Massive Hemorrhages
- **Tourniquet**: If blood is bright red and pulsing, use the tourniquet. **RULE**: "High and Tight" on the wounded limb. Note the time.
- **Wound Packing**: In areas where a tourniquet cannot reach (armpit, groin), shove sterile gauze or a clean cloth as deep as possible and apply constant pressure for 10 minutes.

### 2. Scarcity Infections
Without antibiotics, any cut is dangerous.
- **Raw Honey**: Pure, unprocessed honey is a potent antibacterial for dressings.
- **Irrigation**: Wash wounds with pressurized potable water (using a syringe or poked bottle).

### 3. Fatal Mistakes
- Never attempt to remove impaled objects (knives, shards) outside of a hospital environment.`,
    checklist: [
      { id: 'm1', text: 'Have 1 original CAT Gen7 tourniquet per person', completed: false },
      { id: 'm2', text: 'Assemble a tactical IFAK (Individual First Aid Kit)', completed: false },
      { id: 'm3', text: 'Stock 1 quart of Iodine and 1lb of Raw Honey', completed: false },
      { id: 'm4', text: 'Practice the Heimlich maneuver and CPR', completed: false }
    ]
  },
  {
    id: 's11',
    title: 'Food Preservation (Off-Grid)',
    category: 'FOOD',
    content: `### MASTERING TIME AND DECAY
Knowing how to preserve is as vital as knowing how to produce.

### 1. Salting (Curing)
Salt removes moisture where bacteria grow.
- **Dry Curing**: Cover meat (beef/pork) with coarse salt, let drain for 24h, and hang in a ventilated area protected from insects.
- **Fish**: The dry-salting technique guarantees protein for months.

### 2. Solar Dehydration
Build a wooden box with a black bottom and a glass or plastic cover.
- Slice fruits and vegetables thin.
- Ventilation is crucial (holes at top and base for a chimney effect).

### 3. Fermentation (Living Preserves)
- **Sauerkraut (Cabbage)**: Just shredded cabbage, salt, and time. Provides vital probiotics for immunity during high-stress times.`,
    checklist: [
      { id: 'f5', text: 'Stock 50lbs of coarse salt (non-iodized)', completed: false },
      { id: 'f6', text: 'Build a solar dehydrator prototype', completed: false },
      { id: 'f7', text: 'Practice water-bath canning techniques', completed: false },
      { id: 'f8', text: 'Learn to identify spoiled meat (Botulism)', completed: false }
    ]
  },
  {
    id: 's12',
    title: 'Residential Hardening (Fortress)',
    category: 'SECURITY',
    content: `### TRANSFORMING YOUR HOME INTO A FORTRESS
Most modern homes are vulnerable to simple breaches.

### 1. Layers of Protection
- **Layer 1 (Exterior)**: Motion-sensor lighting. **TIP**: Conceal barbed wire within "thorny" landscaping like Bougainvillea or Barberry.
- **Layer 2 (Entry Points)**: Replace hinge and strike plate screws with 3-inch (10cm) screws that reach the structural framing.
- **Layer 3 (Windows)**: Apply 8mil Security Film to prevent glass from shattering upon impact.

### 2. Low-Tech Alarma
- **Aluminum Cans**: A fishing line with cans containing pebbles is the best perimeter alarm—silent to the intruder, loud to you.

### 3. Intel Opacity
"Grey Man" Home Policy: Your home should not look stocked. avoid noisy generators or light leakage when neighbors are in the dark.`,
    checklist: [
      { id: 'sec1', text: 'Replace screws in all exterior door frames', completed: false },
      { id: 'sec2', text: 'Install window security film on all ground floors', completed: false },
      { id: 'sec3', text: 'Designate a "Safe Room" for immediate retreat', completed: false },
      { id: 'sec4', text: 'Remove bushes that provide concealment near doors', completed: false }
    ]
  },
  {
    id: 's13',
    title: 'Faraday Cage DIY (EMP Shield)',
    category: 'ENERGY',
    content: `### PROTECTION AGAINST EMP (ELECTROMAGNETIC PULSE)
A solar flare or nuclear event can fry all modern unprotected circuits.

### 1. What to Protect
- Comms gear (Baofeng, Handhelds).
- LED Flashlights (internal circuits are sensitive).
- USB drives with digital "Bug-out" documents.
- Tablets with offline survival libraries (Kiwix).

### 2. How to Build
Use a metal trash can with a tight-fitting lid.
- **Internal Insulation**: Line the interior with thick cardboard or wood. **CRITICAL**: The device must NOT touch the metal.
- **Seal**: Ensure 360° metal-to-metal contact on the lid. Use aluminum tape for a perfect seal if necessary.

### 3. The "Cell Phone" Test
Place a phone inside and close the cage. Call it. If it goes straight to voicemail, your shield is functional.`,
    checklist: [
      { id: 'e5', text: 'Secure 1 metal trash can or ammo box', completed: false },
      { id: 'e6', text: 'Line the inside with non-conductive cardboard', completed: false },
      { id: 'e7', text: 'Store backup radios and batteries inside', completed: false },
      { id: 'e8', text: 'Perform the reception signal test', completed: false }
    ]
  },
  {
    id: 's14',
    title: 'Solar System (Critical Power)',
    category: 'ENERGY',
    content: `### OFF-GRID CHARGE MAINTENANCE
Lights and radio are crucial for morale and intelligence gathering.

### 1. Minimalist Sizing
Don't try to power a fridge. Focus on essentials:
- **100W Panel**: Sufficient for charging batteries and lights.
- **Charge Controller**: Protects the battery from overcharging.
- **Deep Cycle Battery**: Stores power for night use.

### 2. Salvaged Batteries (Recovery)
If you find old car batteries:
- Clean terminals thoroughly.
- Replace the electrolyte with a solution of Distilled Water and Epsom Salt (Magnesium Sulfate). This can give a "dead" battery a few more months of life.

### 3. Night Lighting
Use 12V LED strips directly from the battery. They are far more efficient than using an inverter for 110/220V bulbs.`,
    checklist: [
      { id: 'e9', text: 'Acquire a 50W or 100W portable solar panel', completed: false },
      { id: 'e10', text: 'Have 1 spare set of MC4 connectors', completed: false },
      { id: 'e11', text: 'Learn to use a Multimeter to test polarity', completed: false },
      { id: 'e12', text: 'Stockpile 12V LED bulbs (automotive bulk)', completed: false }
    ]
  },
  {
    id: 's15',
    title: 'Barter Economy (Trade Assets)',
    category: 'SECURITY',
    content: `### TRADE ASSETS WHEN CURRENCY FAILS
Gold and Silver are good, but immediate utility items hold more value in a collapse.

### 1. Fractional Precious Metals
- **Silver**: Ideal for small, daily transactions (loaves of bread, eggs). Pre-1965 US Junk Silver is world-recognized.
- **Gold**: For major extractions or critical bribes.

### 2. High-Demand Assets
Stockpile extras of:
- **Vices**: Coffee, Cigarettes, Salt, Raw Honey.
- **Utilities**: BIC Lighters, Sewing Needles/Thread, AA/AAA Batteries.
- **Medical**: Antibiotics and Painkillers (the rarest "currencies").

### 3. OpSec in Trading
Never show your full stash. Trade in neutral locations. Revealing you have bulk coffee might invite a raid on your position.`,
    checklist: [
      { id: 'sec5', text: 'Gather 10 spare lighters and 5lbs of sealed coffee', completed: false },
      { id: 'sec6', text: 'Acquire 10x 1oz Silver rounds or coins', completed: false },
      { id: 'sec7', text: 'Stockpile fast-growing vegetable seeds (Radish, Lettuce)', completed: false },
      { id: 'sec8', text: 'Understand the trade value of 1 gallon of Biodiesel', completed: false }
    ]
  },
  {
    id: 's16',
    title: 'Analog Navigation',
    category: 'SKILLS',
    content: `### Analog Navigation
Disasters can disable satellite signals or cellular networks.

### 1. Map and Compass
Learn to "orient the map" to the terrain. Know your local magnetic declination.

### 2. Solar Orientation
The Sun rises in the East and sets in the West. Use the stick shadow method to find true North.

### 3. Landmarks
Identify mountains, towers, or rivers. Create mental maps of your bug-out routes.`,
    checklist: [
      { id: 'sk13', text: 'Print topographical maps of your local area (hard copy)', completed: false },
      { id: 'sk14', text: 'Acquire a baseplate compass (Suunto/Silva)', completed: false },
      { id: 'sk15', text: 'Practice finding North at night (North Star/Southern Cross)', completed: false },
      { id: 'sk16', text: 'Measure your pace count over 100 meters', completed: false }
    ]
  }
];