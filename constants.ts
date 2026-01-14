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
    notes: 'Also 7.850 MHz, 14.670 MHz.'
  },
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