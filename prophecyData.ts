import { ProphecyEvent } from './types';

/**
 * COMPREHENSIVE BIBLICAL PROPHECY DATABASE
 * Organized by Status: FULFILLED → IN_PROGRESS → PENDING
 * Islamic prophecies separated in dedicated section
 */

export interface ExtendedProphecyEvent extends ProphecyEvent {
    category: ProphecyCategory;
    subCategory?: string;
    relatedEvents?: string[]; // IDs of related events
    modernEvidence?: string[];
    monitoringTips?: string[];
    warningLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export type ProphecyCategory =
    | 'DANIEL'
    | 'ISAIAH'
    | 'EZEKIEL'
    | 'ZECHARIAH'
    | 'JOEL'
    | 'JESUS_OLIVET'
    | 'REVELATION'
    | 'MINOR_PROPHETS';

export type IslamProphecyCategory = 'ISLAM_WARNING';

// ==================== BIBLICAL PROPHECIES ====================
// Organized: FULFILLED → IN_PROGRESS → PENDING

export const BIBLICAL_PROPHECIES: ExtendedProphecyEvent[] = [
    // ==================== FULFILLED PROPHECIES ====================
    {
        id: 'isa_1',
        title: 'Rebirth of Israel in One Day',
        scripture: 'Isaiah 66:8',
        status: 'FULFILLED',
        category: 'ISAIAH',
        subCategory: 'Restoration of Israel',
        description: '"Shall a nation be born in a day?" Israel declared independence on May 14, 1948, becoming a nation in a single day after 2,000 years of dispersion.',
        modernEvidence: [
            'Israel independence declared May 14, 1948 (Ben-Gurion proclamation)',
            'Nation scattered for 2,000 years returned',
            'Statistical probability: impossible without divine intervention'
        ],
        monitoringTips: [],
        warningLevel: 'LOW'
    },
    {
        id: 'isa_2',
        title: 'Desert Will Blossom',
        scripture: 'Isaiah 35:1-2',
        status: 'FULFILLED',
        category: 'ISAIAH',
        subCategory: 'Restoration of Israel',
        description: '"The desert shall rejoice and blossom like the rose." Israel transformed the Negev Desert into fertile agricultural land.',
        modernEvidence: [
            'Israel exports flowers and fruits to Europe',
            'Drip irrigation technology invented in Israel',
            'Negev Desert now has agricultural settlements',
            'Desalination plants provide water from Mediterranean'
        ],
        monitoringTips: [],
        warningLevel: 'LOW'
    },
    {
        id: 'isa_3',
        title: 'Hebrew Language Revived',
        scripture: 'Isaiah 19:18; Zephaniah 3:9',
        status: 'FULFILLED',
        category: 'ISAIAH',
        subCategory: 'Restoration of Israel',
        description: 'Hebrew language (dead for 2,000 years) revived as national language. Only case in history of a dead language being revived.',
        modernEvidence: [
            'Eliezer Ben-Yehuda revived Hebrew (1890s)',
            'Modern Hebrew official language of Israel',
            'No other dead language has ever been revived as national tongue'
        ],
        monitoringTips: [],
        warningLevel: 'LOW'
    },
    {
        id: 'dan_3',
        title: 'Increase of Knowledge',
        scripture: 'Daniel 12:4',
        status: 'FULFILLED',
        category: 'DANIEL',
        subCategory: 'Signs of the Times',
        description: '"Many shall run to and fro, and knowledge shall increase." Explosion of technology and global travel in recent centuries.',
        modernEvidence: [
            'Human knowledge doubled every 100 years in 1900',
            'Today knowledge doubles every 12 HOURS (IBM Study)',
            'Digital revolution, Internet, AI',
            'Global air travel, space tourism',
            'Digital libraries, Wikipedia, ChatGPT'
        ],
        monitoringTips: [],
        warningLevel: 'LOW'
    },
    {
        id: 'eze_2',
        title: 'Valley of Dry Bones',
        scripture: 'Ezekiel 37:1-14',
        status: 'FULFILLED',
        category: 'EZEKIEL',
        subCategory: 'Restoration of Israel',
        description: 'Israel revived as a nation after being "dead" (dispersed). Holocaust = valley of dry bones. 1948 = Israel revived.',
        modernEvidence: [
            'Holocaust (1941-1945) = valley of dry bones',
            'Israel independent in 1948',
            'Rise of Messianic Jews (accepting Yeshua)',
            'Organizations like Jews for Jesus, One For Israel'
        ],
        monitoringTips: [
            'Growth of Messianic Jews',
            'Revival in Israel',
            'Jewish conversions to Christianity'
        ],
        warningLevel: 'LOW'
    },
    {
        id: 'min_2',
        title: 'Restoration of Israel',
        scripture: 'Amos 9:14-15',
        status: 'FULFILLED',
        category: 'MINOR_PROPHETS',
        subCategory: 'Amos',
        description: 'Israel planted in their land and never uprooted again.',
        modernEvidence: [
            'Israel restored 1948',
            'Never dispersed again despite wars (1948, 1967, 1973)'
        ],
        monitoringTips: [],
        warningLevel: 'LOW'
    },
    {
        id: 'min_3',
        title: 'Birth in Bethlehem',
        scripture: 'Micah 5:2',
        status: 'FULFILLED',
        category: 'MINOR_PROPHETS',
        subCategory: 'Micah',
        description: 'Messiah would be born in Bethlehem.',
        modernEvidence: [
            'Jesus born in Bethlehem (~4 BC)'
        ],
        monitoringTips: [],
        warningLevel: 'LOW'
    },
    {
        id: 'min_4',
        title: 'Glory of Second Temple',
        scripture: 'Haggai 2:6-9',
        status: 'FULFILLED',
        category: 'MINOR_PROPHETS',
        subCategory: 'Haggai',
        description: 'Glory of second temple greater than first (Jesus entered it).',
        modernEvidence: [
            'Jesus (Messiah) entered Second Temple, making it more glorious'
        ],
        monitoringTips: [],
        warningLevel: 'LOW'
    },
    {
        id: 'p1',
        title: 'Jerusalem Retaken',
        scripture: 'Luke 21:24',
        status: 'FULFILLED',
        category: 'JESUS_OLIVET',
        subCategory: 'Israel',
        description: 'Jerusalem under Jewish control. Fulfilled in Six-Day War (1967).',
        modernEvidence: [
            'Jerusalem captured June 7, 1967',
            'First time under Jewish control since 70 AD',
            'Western Wall accessible to Jews again'
        ],
        monitoringTips: [],
        warningLevel: 'LOW'
    },
    {
        id: 'joel_1_partial',
        title: 'Outpouring of the Spirit',
        scripture: 'Joel 2:28-32',
        status: 'FULFILLED',
        category: 'JOEL',
        subCategory: 'Holy Spirit',
        description: 'Spirit poured out on all flesh. Initial fulfillment at Pentecost (Acts 2). Full fulfillment during Tribulation.',
        modernEvidence: [
            'Pentecost (Acts 2) - initial fulfillment',
            'Pentecostal/Charismatic movement globally',
            'Christianity exploding in Africa/Asia',
            'Dreams/visions of Jesus in Muslim countries'
        ],
        monitoringTips: [
            'Reports of dreams and visions',
            'Growth of Pentecostal churches',
            'Conversions in closed countries'
        ],
        warningLevel: 'MEDIUM'
    },

    // ==================== IN PROGRESS PROPHECIES ====================
    {
        id: 'dan_1',
        title: 'Four World Empires',
        scripture: 'Daniel 2:31-45; 7:1-28',
        status: 'IN_PROGRESS',
        category: 'DANIEL',
        subCategory: 'Empires',
        description: 'Vision of Nebuchadnezzar\'s statue and 4 beasts. Gold (Babylon), Silver (Medo-Persia), Bronze (Greece), Iron (Rome), Iron+Clay (Revived Rome/EU?).',
        modernEvidence: [
            'European Union formed 1993',
            'Political union attempts (Lisbon Treaty)',
            'European instability (iron + clay = strong + weak)',
            'Brexit showing fragility of union'
        ],
        monitoringTips: [
            'EU expansion or contraction',
            'Rise of charismatic European leader',
            'Political union treaties',
            'Formation of 10-nation confederation'
        ],
        warningLevel: 'MEDIUM'
    },
    {
        id: 'dan_2',
        title: 'Daniel\'s 70 Weeks',
        scripture: 'Daniel 9:24-27',
        status: 'IN_PROGRESS',
        category: 'DANIEL',
        subCategory: '70 Weeks',
        description: '70 weeks (490 years) decreed on Israel. 69 weeks fulfilled until crucifixion. 1 week (7 years) remaining = Tribulation. Middle of week: Antichrist breaks covenant, defiles Temple.',
        modernEvidence: [
            'Decree of Artaxerxes (445 BC) - fulfilled',
            'Crucifixion of Christ (~33 AD) - fulfilled',
            'Growing interest in rebuilding Third Temple',
            'Peace treaties involving Israel (Abraham Accords)'
        ],
        monitoringTips: [
            'Start of 7-year peace treaty with Israel',
            'Rebuilding of Third Temple',
            'European/Mediterranean leader confirming covenant',
            'Breaking of covenant after 3.5 years'
        ],
        warningLevel: 'HIGH'
    },
    {
        id: 'dan_5',
        title: 'King of North vs. King of South',
        scripture: 'Daniel 11:40-45',
        status: 'IN_PROGRESS',
        category: 'DANIEL',
        subCategory: 'Conflicts',
        description: 'Final conflict between King of North (Russia/Turkey/Iran?) and King of South (Egypt/Arabs?) for control of Middle East.',
        modernEvidence: [
            'Russia, Turkey and Iran allied for first time in history (Syria, 2015)',
            'Syrian civil war (proxy war)',
            'Black Sea tensions (Ukraine)',
            'Growing Russian influence in Middle East'
        ],
        monitoringTips: [
            'Russia-Iran-Turkey alliances',
            'Middle East conflicts',
            'Military movements toward Israel',
            'Control of resources (oil, natural gas)'
        ],
        warningLevel: 'HIGH'
    },
    {
        id: 'isa_4',
        title: 'Israel as Burdensome Stone',
        scripture: 'Zechariah 12:3; Isaiah 60:12',
        status: 'IN_PROGRESS',
        category: 'ISAIAH',
        subCategory: 'Israel in Last Days',
        description: 'Jerusalem will be burdensome stone for all nations. Disproportionate global focus on Israel.',
        modernEvidence: [
            'UN: more resolutions against Israel than all other countries combined',
            'Israel-Palestine conflict dominates global politics',
            'Jerusalem most disputed capital in the world',
            'All eyes on Israel (media, politics, religion)'
        ],
        monitoringTips: [
            'UN resolutions',
            'International pressure to divide Jerusalem',
            'Treaties involving Israel',
            'Status of Jerusalem as capital'
        ],
        warningLevel: 'HIGH'
    },
    {
        id: 'isa_5',
        title: 'Judgment of Damascus',
        scripture: 'Isaiah 17:1',
        status: 'IN_PROGRESS',
        category: 'ISAIAH',
        subCategory: 'Judgments',
        description: '"Damascus will cease to be a city and become a heap of ruins." Damascus, oldest continuously inhabited city, will be destroyed.',
        modernEvidence: [
            'Syrian Civil War (2011-present)',
            'Damascus severely damaged',
            'Israeli airstrikes in Damascus',
            'Not yet completely destroyed (pending)'
        ],
        monitoringTips: [
            'Escalation of conflict in Syria',
            'Israeli attacks on Damascus',
            'Presence of chemical/nuclear weapons',
            'Evacuation of Damascus'
        ],
        warningLevel: 'HIGH'
    },
    {
        id: 'isa_6',
        title: 'Destruction and Restoration of Egypt',
        scripture: 'Isaiah 19:1-25',
        status: 'IN_PROGRESS',
        category: 'ISAIAH',
        subCategory: 'Judgments',
        description: 'Egypt will suffer civil war, Nile will dry up, but will later be restored and worship God of Israel.',
        modernEvidence: [
            'Political instability in Egypt (Arab Spring, coups)',
            'Grand Ethiopian Renaissance Dam threatens Nile',
            'Low Nile levels in dry years',
            'Egypt-Ethiopia tensions over water'
        ],
        monitoringTips: [
            'Nile River levels',
            'Conflict with Ethiopia over dam',
            'Egyptian political instability',
            'Conversion of Egyptian Muslims to Christianity'
        ],
        warningLevel: 'MEDIUM'
    },
    {
        id: 'zac_1',
        title: 'Jerusalem - Cup of Trembling',
        scripture: 'Zechariah 12:2-3',
        status: 'IN_PROGRESS',
        category: 'ZECHARIAH',
        subCategory: 'Jerusalem',
        description: 'Jerusalem will be cup of trembling and burdensome stone. Most disputed city and global focus.',
        modernEvidence: [
            'Jerusalem most contested capital',
            'US Embassy moved to Jerusalem (2018)',
            'Conflicts over status of Jerusalem',
            'UNESCO denying Jewish connection to Jerusalem'
        ],
        monitoringTips: [
            'International decisions about Jerusalem',
            'Status of capital disputed',
            'Religious conflicts at the site'
        ],
        warningLevel: 'HIGH'
    },
    {
        id: 'zac_4',
        title: 'All Nations Against Jerusalem',
        scripture: 'Zechariah 14:2',
        status: 'IN_PROGRESS',
        category: 'ZECHARIAH',
        subCategory: 'Armageddon',
        description: 'God will gather all nations to battle against Jerusalem. Armageddon.',
        modernEvidence: [
            'UN resolutions consistently against Israel',
            'International pressure to divide Jerusalem',
            'Growing anti-Israel coalition'
        ],
        monitoringTips: [
            'Formation of military coalitions',
            'Anti-Israel treaties',
            'Preparation for invasion of Israel'
        ],
        warningLevel: 'CRITICAL'
    },
    {
        id: 'joel_2',
        title: 'Signs in Heaven and Earth',
        scripture: 'Joel 2:30-31',
        status: 'IN_PROGRESS',
        category: 'JOEL',
        subCategory: 'Signs',
        description: 'Sun will darken, moon turn to blood, wonders in heaven and earth before the great day of the Lord.',
        modernEvidence: [
            'Blood Moon Tetrads on Jewish feast days (2014-2015)',
            'Increase in rare eclipses',
            'Auroras at unusual latitudes',
            'Intense solar activity'
        ],
        monitoringTips: [
            'Solar and lunar eclipses on Jewish feasts',
            'Rare astronomical events',
            'Unusual celestial phenomena'
        ],
        warningLevel: 'MEDIUM'
    },
    {
        id: 'jesus_1',
        title: 'False Christs and Prophets',
        scripture: 'Matthew 24:4-5, 11, 24',
        status: 'IN_PROGRESS',
        category: 'JESUS_OLIVET',
        subCategory: 'Deceptions',
        description: 'Many will come saying "I am the Christ" and deceive many. False prophets will proliferate.',
        modernEvidence: [
            'Joseph Smith (Mormonism)',
            'Sun Myung Moon (Unification Church)',
            'Jim Jones, David Koresh (cults)',
            'False teachers (prosperity gospel)',
            'Religious syncretism (New Age, "all paths lead to God")'
        ],
        monitoringTips: [
            'Rise of messianic figures',
            'Growth of cults',
            'Popular spiritual leaders with false doctrines'
        ],
        warningLevel: 'HIGH'
    },
    {
        id: 'jesus_2',
        title: 'Wars and Rumors of Wars',
        scripture: 'Matthew 24:6',
        status: 'IN_PROGRESS',
        category: 'JESUS_OLIVET',
        subCategory: 'Conflicts',
        description: 'You will hear of wars and rumors of wars. Nation against nation, kingdom against kingdom.',
        modernEvidence: [
            'Ukraine vs Russia (2022-)',
            'Israel vs Hamas (2023-)',
            'China-Taiwan tensions',
            'India-Pakistan (nuclear)',
            'North Korea vs South Korea'
        ],
        monitoringTips: [
            'Regional conflicts escalating',
            'Arms race',
            'Nuclear threats'
        ],
        warningLevel: 'CRITICAL'
    },
    {
        id: 'jesus_3',
        title: 'Earthquakes in Various Places',
        scripture: 'Matthew 24:7',
        status: 'IN_PROGRESS',
        category: 'JESUS_OLIVET',
        subCategory: 'Natural Disasters',
        description: 'Increase in earthquakes in frequency and intensity in the last days.',
        modernEvidence: [
            'USGS: increase in M6+ earthquakes since 1900',
            'Japan 9.0 (2011)',
            'Turkey/Syria 7.8 (2023) - 50,000+ dead',
            'Ring of Fire hyperactive',
            'Induced earthquakes (fracking) in unusual locations'
        ],
        monitoringTips: [
            'Frequency of M6+ earthquakes',
            'Earthquakes in unusual locations',
            'Earthquake clusters'
        ],
        warningLevel: 'HIGH'
    },
    {
        id: 'jesus_4',
        title: 'Famines and Pestilences',
        scripture: 'Matthew 24:7; Luke 21:11',
        status: 'IN_PROGRESS',
        category: 'JESUS_OLIVET',
        subCategory: 'Health and Food',
        description: 'There will be famines, plagues (pandemics) and earthquakes in the last days.',
        modernEvidence: [
            'COVID-19 (2020-2022) - 7 million deaths',
            'Mpox, Marburg, Bird Flu (H5N1)',
            'Food crisis (Ukraine war)',
            'Record food inflation',
            'Crop failures (extreme weather)'
        ],
        monitoringTips: [
            'Emerging pandemics',
            'Food prices',
            'Grain shortages',
            'Zoonotic diseases'
        ],
        warningLevel: 'HIGH'
    },
    {
        id: 'jesus_5',
        title: 'Increase of Wickedness',
        scripture: 'Matthew 24:12',
        status: 'IN_PROGRESS',
        category: 'JESUS_OLIVET',
        subCategory: 'Moral',
        description: 'Lawlessness will increase, love of many will grow cold.',
        modernEvidence: [
            'Mass shootings (schools, churches)',
            'Human trafficking/modern slavery',
            'Pornography epidemic',
            'Extreme political polarization',
            'Decline of nuclear family',
            'Cancel culture, hate speech'
        ],
        monitoringTips: [
            'Crime statistics',
            'Cultural moral decline',
            'Persecution of Christians'
        ],
        warningLevel: 'HIGH'
    },
    {
        id: 'jesus_6',
        title: 'Gospel to All Nations',
        scripture: 'Matthew 24:14',
        status: 'IN_PROGRESS',
        category: 'JESUS_OLIVET',
        subCategory: 'Great Commission',
        description: 'Gospel will be preached in all the world, then the end will come. Almost complete.',
        modernEvidence: [
            'Bible translated into 3,000+ languages',
            'Internet bringing gospel to closed nations',
            'Radio/satellite (TWR, FEBC)',
            'Joshua Project: ~95% of nations reached',
            '~42 unreached people groups remaining'
        ],
        monitoringTips: [
            'Bible translation progress',
            'Reaching unreached people groups',
            'Missionary technology'
        ],
        warningLevel: 'MEDIUM'
    },
    {
        id: 'jesus_9',
        title: 'Signs in Sun, Moon and Stars',
        scripture: 'Matthew 24:29; Luke 21:25',
        status: 'IN_PROGRESS',
        category: 'JESUS_OLIVET',
        subCategory: 'Cosmic Signs',
        description: 'Sun will darken, moon will not give light, stars will fall. Rare astronomical phenomena.',
        modernEvidence: [
            'Blood Moon Tetrads (2014-2015) on Jewish feasts',
            'Auroras at low latitudes',
            'Intense solar storms',
            'Intense meteor showers'
        ],
        monitoringTips: [
            'Eclipses on Jewish feasts',
            'Extreme solar activity',
            'Rare astronomical events'
        ],
        warningLevel: 'MEDIUM'
    },
    {
        id: 'jesus_10',
        title: 'Generation of the Fig Tree',
        scripture: 'Matthew 24:32-34',
        status: 'IN_PROGRESS',
        category: 'JESUS_OLIVET',
        subCategory: 'Timing',
        description: 'When fig tree (Israel) sprouts, know it is near. This generation will not pass away.',
        modernEvidence: [
            'Fig tree = Israel reborn (1948)',
            'Generation = 70-80 years (Psalm 90:10)',
            '1948 + 80 = 2028 (speculative)'
        ],
        monitoringTips: [
            'WARNING: No one knows the day or hour (Mt 24:36)',
            'Do not set specific dates'
        ],
        warningLevel: 'MEDIUM'
    },
    {
        id: 'jesus_11',
        title: 'As in Days of Noah and Lot',
        scripture: 'Matthew 24:37-39; Luke 17:26-30',
        status: 'IN_PROGRESS',
        category: 'JESUS_OLIVET',
        subCategory: 'Moral Conditions',
        description: 'Days before coming will be like Noah (violence) and Lot (immorality). Normal life until sudden judgment.',
        modernEvidence: [
            'Widespread violence (Genesis 6:11) ✓ Murder rates, wars',
            'Sexual immorality (Sodom) ✓ Hook-up culture, pornography',
            'Materialism, consumerism',
            'Marrying and commerce intense',
            '"Peace and safety" message (1 Thess 5:3)'
        ],
        monitoringTips: [
            'Cultural moral decline',
            'Normalization of sin',
            '"Peace and safety" rhetoric'
        ],
        warningLevel: 'HIGH'
    },
    {
        id: 'rev_1',
        title: 'Lukewarm Laodicean Church',
        scripture: 'Revelation 3:14-22',
        status: 'IN_PROGRESS',
        category: 'REVELATION',
        subCategory: '7 Churches',
        description: 'Last days church: lukewarm, materialistic, self-sufficient. "Rich... have need of nothing."',
        modernEvidence: [
            'Mega-churches focused on entertainment',
            'Prosperity gospel (health and wealth theology)',
            'Self-help Christianity',
            'Western church materialism',
            'Syncretism and relativism'
        ],
        monitoringTips: [
            'Apostasy in denominations',
            'Decline of true church',
            'Persecution purifying church'
        ],
        warningLevel: 'HIGH'
    },
    {
        id: 'rev_2',
        title: 'Four Horsemen of Apocalypse',
        scripture: 'Revelation 6:1-8',
        status: 'IN_PROGRESS',
        category: 'REVELATION',
        subCategory: 'Seals',
        description: 'White (Antichrist/false peace), Red (war), Black (famine/inflation), Pale (death - 1/4 of humanity).',
        modernEvidence: [
            'Fragile peace treaties (Abraham Accords)',
            'Global wars increasing',
            'Record food inflation',
            'Emerging pandemics'
        ],
        monitoringTips: [
            'Rise of charismatic global leader',
            'Escalation of wars',
            'Food crisis',
            'Deadly pandemics'
        ],
        warningLevel: 'CRITICAL'
    },
    {
        id: 'rev_3',
        title: 'Mark of the Beast - 666',
        scripture: 'Revelation 13:16-18',
        status: 'IN_PROGRESS',
        category: 'REVELATION',
        subCategory: 'Antichrist',
        description: 'Mark on right hand or forehead to buy/sell. Number of man: 666. Technology already exists.',
        modernEvidence: [
            'RFID microchips (Verichip, etc.)',
            'Facial biometrics (China Social Credit)',
            'CBDCs (central bank digital currencies)',
            'Neuralink (brain chips)',
            'Cashless society agenda',
            'Digital IDs (EU, India Aadhaar)'
        ],
        monitoringTips: [
            'Implementation of mandatory digital IDs',
            'Cash bans',
            'Integration of biometric payments',
            'Social credit systems'
        ],
        warningLevel: 'CRITICAL'
    },
    {
        id: 'rev_7',
        title: 'Babylon - Religious/Economic System',
        scripture: 'Revelation 17-18',
        status: 'IN_PROGRESS',
        category: 'REVELATION',
        subCategory: 'World System',
        description: 'Ch 17: Great Harlot (apostate religion). Ch 18: Commercial Babylon (global economy).',
        modernEvidence: [
            'Ecumenical movement (union of religions)',
            'Pope + Islam: Document on Human Fraternity (2019)',
            'Economic globalization',
            'Multinational corporations',
            '"Merchants of the earth" (Rev 18:23)'
        ],
        monitoringTips: [
            'Union of world religions',
            'One World Religion',
            'Global government',
            'Global currency (CBDCs)'
        ],
        warningLevel: 'CRITICAL'
    },
    {
        id: 'min_5',
        title: 'Elijah Will Return',
        scripture: 'Malachi 4:5-6',
        status: 'IN_PROGRESS',
        category: 'MINOR_PROPHETS',
        subCategory: 'Malachi',
        description: 'Elijah will come before the great day of the Lord. John Baptist came in spirit of Elijah. Literal Elijah may come as one of 2 witnesses.',
        modernEvidence: [
            'John Baptist (spirit of Elijah) - fulfilled',
            'Literal Elijah - pending'
        ],
        monitoringTips: [
            'Appearance of 2 witnesses',
            'Supernatural signs'
        ],
        warningLevel: 'MEDIUM'
    },

    // ==================== PENDING PROPHECIES ====================
    {
        id: 'dan_4',
        title: 'Time of the End and Great Tribulation',
        scripture: 'Daniel 12:1',
        status: 'PENDING',
        category: 'DANIEL',
        subCategory: 'Tribulation',
        description: 'Time of unprecedented trouble for Israel. Michael (archangel) stands up. Resurrection and judgment.',
        modernEvidence: [
            'Antisemitism rising globally',
            'Terrorist attacks against Jews (Pittsburgh, Halle, Paris)',
            'UN resolutions against Israel',
            'BDS (Boycott, Divestment, Sanctions) movement'
        ],
        monitoringTips: [
            'Escalation of persecution of Jews',
            'Supernatural events involving Israel',
            'Start of 7-year Tribulation'
        ],
        warningLevel: 'MEDIUM'
    },
    {
        id: 'eze_1',
        title: 'War of Gog and Magog',
        scripture: 'Ezekiel 38-39',
        status: 'PENDING',
        category: 'EZEKIEL',
        subCategory: 'War',
        description: 'Coalition led by Russia (Magog) + Iran (Persia) + Turkey (Gomer/Togarmah) + Libya + Sudan will invade Israel "from far north". God will destroy supernaturally.',
        modernEvidence: [
            'Russia-Iran-Turkey alliance (never existed before 2015)',
            'Natural gas discovered in Israel (Leviathan/Tamar fields) = "spoil" (Ez 38:13)',
            'Turkey leaving NATO, allying with Russia',
            'Russian military bases in Syria'
        ],
        monitoringTips: [
            'Russian military movements in Middle East',
            'Russia-Iran joint military exercises',
            'Israel-Iran tensions (nuclear)',
            'Anti-Israel sentiment in these countries'
        ],
        warningLevel: 'CRITICAL'
    },
    {
        id: 'eze_3',
        title: 'Third Temple',
        scripture: 'Ezekiel 40-48',
        status: 'PENDING',
        category: 'EZEKIEL',
        subCategory: 'Temple',
        description: 'Detailed description of Millennial Temple. Third Temple must be rebuilt before (defiled by Antichrist mid-Tribulation).',
        modernEvidence: [
            'Temple Institute has all utensils ready',
            'Kohanim priests identified via DNA',
            'Red heifers born (2022-2023) - required for purification',
            'Stones cut ready for construction',
            'Temple blueprint complete'
        ],
        monitoringTips: [
            'Advances in temple preparation',
            'Tensions at Temple Mount',
            'Destruction or removal of Dome of the Rock',
            'Agreement allowing reconstruction'
        ],
        warningLevel: 'CRITICAL'
    },
    {
        id: 'zac_2',
        title: 'They Will Look on Him Whom They Pierced',
        scripture: 'Zechariah 12:10',
        status: 'PENDING',
        category: 'ZECHARIAH',
        subCategory: 'Second Coming',
        description: 'Israel will recognize Jesus (Yeshua) as Messiah when He returns. They will mourn for having rejected Him.',
        modernEvidence: [],
        monitoringTips: [
            'Increase of Messianic Jews',
            'Openness to Yeshua in Israel',
            'Supernatural events in Israel'
        ],
        warningLevel: 'MEDIUM'
    },
    {
        id: 'zac_3',
        title: 'Mount of Olives Will Split',
        scripture: 'Zechariah 14:4',
        status: 'PENDING',
        category: 'ZECHARIAH',
        subCategory: 'Second Coming',
        description: 'Christ\'s feet will touch Mount of Olives, which will split in half (east-west). Real geological fault exists at location.',
        modernEvidence: [
            'Geologists confirm fault line crossing Mount of Olives',
            'Fault line runs east-west (exactly as prophesied)'
        ],
        monitoringTips: [
            'Seismic activity at Mount of Olives',
            'Signs before Second Coming'
        ],
        warningLevel: 'LOW'
    },
    {
        id: 'zac_5',
        title: 'Living Waters from Jerusalem',
        scripture: 'Zechariah 14:8',
        status: 'PENDING',
        category: 'ZECHARIAH',
        subCategory: 'Millennium',
        description: 'River will flow from Jerusalem to Dead Sea and Mediterranean during Millennium. Dead Sea will be healed.',
        modernEvidence: [],
        monitoringTips: [],
        warningLevel: 'LOW'
    },
    {
        id: 'joel_3',
        title: 'Valley of Jehoshaphat - Judgment of Nations',
        scripture: 'Joel 3:2, 12',
        status: 'PENDING',
        category: 'JOEL',
        subCategory: 'Judgment',
        description: 'Nations judged for how they treated Israel and divided the land. Valley of Jehoshaphat (Kidron Valley).',
        modernEvidence: [
            'Oslo Accords (land division)',
            '2-state solution plan',
            'International pressure to divide Jerusalem'
        ],
        monitoringTips: [
            'Land division agreements for Israel',
            '2-state treaties',
            'International pressure on Israel'
        ],
        warningLevel: 'HIGH'
    },
    {
        id: 'jesus_7',
        title: 'Abomination of Desolation',
        scripture: 'Matthew 24:15; Daniel 9:27',
        status: 'PENDING',
        category: 'JESUS_OLIVET',
        subCategory: 'Tribulation',
        description: 'Antichrist will defile the Temple in middle of Tribulation (after 3.5 years).',
        modernEvidence: [
            'Third Temple must be rebuilt first'
        ],
        monitoringTips: [
            'Temple reconstruction',
            'Start of sacrifices',
            'Revelation of Antichrist',
            '7-year covenant with Israel'
        ],
        warningLevel: 'CRITICAL'
    },
    {
        id: 'jesus_8',
        title: 'Great Tribulation',
        scripture: 'Matthew 24:21-22',
        status: 'PENDING',
        category: 'JESUS_OLIVET',
        subCategory: 'Tribulation',
        description: 'Affliction never seen since beginning of world. 7 years of divine judgments.',
        modernEvidence: [],
        monitoringTips: [
            'Start of Tribulation',
            'Seal judgments (Revelation 6)',
            'Trumpet judgments (Revelation 8-9)',
            'Bowl judgments (Revelation 16)'
        ],
        warningLevel: 'CRITICAL'
    },
    {
        id: 'rev_4',
        title: 'Two Witnesses',
        scripture: 'Revelation 11:3-12',
        status: 'PENDING',
        category: 'REVELATION',
        subCategory: 'Tribulation',
        description: 'Two witnesses prophesy 1,260 days (3.5 years) in Jerusalem. Supernatural powers. Resurrected after 3.5 days.',
        modernEvidence: [],
        monitoringTips: [
            'Start of Tribulation',
            'Appearance of 2 witnesses in Jerusalem',
            'Public miracles'
        ],
        warningLevel: 'MEDIUM'
    },
    {
        id: 'rev_5',
        title: '144,000 Sealed from Israel',
        scripture: 'Revelation 7:1-8; 14:1-5',
        status: 'PENDING',
        category: 'REVELATION',
        subCategory: 'Tribulation',
        description: '12,000 from each tribe of Israel sealed and protected. Evangelists during Tribulation.',
        modernEvidence: [],
        monitoringTips: [
            'Revival among Jews',
            'Start of Tribulation'
        ],
        warningLevel: 'MEDIUM'
    },
    {
        id: 'rev_6',
        title: 'Great Multitude of Martyrs',
        scripture: 'Revelation 7:9-17',
        status: 'PENDING',
        category: 'REVELATION',
        subCategory: 'Tribulation',
        description: 'Countless multitude from all nations coming out of Great Tribulation. Martyrs who refused the mark.',
        modernEvidence: [],
        monitoringTips: [
            'Persecution during Tribulation',
            'Refusal of mark of beast'
        ],
        warningLevel: 'HIGH'
    },
    {
        id: 'rev_8',
        title: 'Armageddon',
        scripture: 'Revelation 16:16; 19:11-21',
        status: 'PENDING',
        category: 'REVELATION',
        subCategory: 'Final Battle',
        description: 'Final battle in Valley of Megiddo. Nations gathered against Israel. Christ returns and defeats Antichrist.',
        modernEvidence: [],
        monitoringTips: [
            'Military movements toward Israel',
            'Global anti-Israel coalition',
            'End of Tribulation'
        ],
        warningLevel: 'CRITICAL'
    },
    {
        id: 'rev_9',
        title: 'Millennium - 1000 Year Reign',
        scripture: 'Revelation 20:1-6',
        status: 'PENDING',
        category: 'REVELATION',
        subCategory: 'Kingdom',
        description: 'Christ reigns 1000 years. Satan bound. Global peace. Extended longevity.',
        modernEvidence: [],
        monitoringTips: [],
        warningLevel: 'LOW'
    },
    {
        id: 'rev_10',
        title: 'New Jerusalem',
        scripture: 'Revelation 21-22',
        status: 'PENDING',
        category: 'REVELATION',
        subCategory: 'Eternity',
        description: 'New heavens, new earth. Celestial city descends. No death, pain or tears.',
        modernEvidence: [],
        monitoringTips: [],
        warningLevel: 'LOW'
    },
    {
        id: 'min_1',
        title: 'Day of the Lord',
        scripture: 'Zephaniah 1:14-18',
        status: 'PENDING',
        category: 'MINOR_PROPHETS',
        subCategory: 'Zephaniah',
        description: 'Great day of the Lord is near. Day of wrath, trouble and desolation.',
        modernEvidence: [],
        monitoringTips: [],
        warningLevel: 'MEDIUM'
    }
];

// ==================== ISLAMIC PROPHECIES (DECEPTION WARNING) ====================
export interface IslamProphecyEvent extends ExtendedProphecyEvent {
    category: IslamProphecyCategory;
}

export const ISLAMIC_PROPHECIES: IslamProphecyEvent[] = [
    {
        id: 'islam_1',
        title: '⚠️ MAHDI (Likely Antichrist in Disguise)',
        scripture: 'Daniel 9:27; 2 Thess 2:3-4; Revelation 13',
        status: 'PENDING',
        category: 'ISLAM_WARNING',
        subCategory: 'Great Deception',
        description: 'WARNING: Islamic Mahdi has ALL characteristics of biblical Antichrist. Will emerge in chaos, make 7-year covenant, rule from Jerusalem, unify religions, demand worship.',
        modernEvidence: [
            'Russia-Iran-Turkey alliances (Ezekiel 38)',
            'Ecumenical movement',
            '1.8 billion Muslims prepared to receive "savior"',
            'Growing hatred of Israel (preparation for Armageddon)'
        ],
        monitoringTips: [
            'Rise of charismatic leader from Middle East',
            'Messianic claims',
            'Unification of religions',
            '7-year treaty with Israel'
        ],
        warningLevel: 'CRITICAL'
    },
    {
        id: 'islam_2',
        title: '⚠️ ISA (Islamic "Jesus" - Likely False Prophet)',
        scripture: '1 John 2:22; Revelation 13:11-15',
        status: 'PENDING',
        category: 'ISLAM_WARNING',
        subCategory: 'Great Deception',
        description: 'WARNING: Islamic "Jesus" DENIES deity of Christ, crucifixion, resurrection. Forces conversion to Islam. Serves Mahdi. = FALSE PROPHET.',
        modernEvidence: [
            'Quran already prepared ground (Surah 4:157 - Jesus not crucified)',
            '1.8 billion ready to receive "Isa"',
            'Denial of Trinity = spirit of antichrist (1 John 4:3)'
        ],
        monitoringTips: [
            'Figure performing miracles, supporting political leader',
            'Denying deity of Christ',
            'Forcing conversion',
            'Killing "infidels" (true Christians)'
        ],
        warningLevel: 'CRITICAL'
    },
    {
        id: 'islam_3',
        title: '⚠️ DAJJAL (Actually Christ Returning)',
        scripture: 'Revelation 19:11-21; Zechariah 14:4',
        status: 'PENDING',
        category: 'ISLAM_WARNING',
        subCategory: 'Great Deception',
        description: 'SATANIC DECEPTION: Islamic "Dajjal" (antichrist) has characteristics of TRUE Christ: Jewish, from Israel, Jews follow him, defeats armies. 1.8 billion will FIGHT AGAINST Jesus at Armageddon.',
        modernEvidence: [
            'Hadith prepared Muslims to fight "Dajjal"',
            'Preparation for Armageddon (all nations against Jerusalem)',
            'Satan prepared 1/4 of humanity to resist Christ'
        ],
        monitoringTips: [
            'Christ\'s return to Mount of Olives',
            'Nations gathered against Jerusalem',
            'Armageddon'
        ],
        warningLevel: 'CRITICAL'
    },
    {
        id: 'islam_4',
        title: '⚠️ Destruction of Damascus Trigger',
        scripture: 'Isaiah 17:1',
        status: 'IN_PROGRESS',
        category: 'ISLAM_WARNING',
        subCategory: 'Prophetic Triggers',
        description: 'Hadith: Mahdi will appear after destruction of Damascus. Isaiah 17:1: Damascus will cease to be a city. Prophetic trigger for deception.',
        modernEvidence: [
            'Syrian Civil War',
            'Damascus damaged but still inhabited',
            'Israeli strikes increasing'
        ],
        monitoringTips: [
            'Escalation of conflict in Damascus',
            'Possible nuclear/chemical attack',
            'Evacuation of Damascus'
        ],
        warningLevel: 'CRITICAL'
    },
    {
        id: 'islam_5',
        title: '⚠️ Black Flags from Khorasan',
        scripture: 'Revelation 9:14-19 (context)',
        status: 'IN_PROGRESS',
        category: 'ISLAM_WARNING',
        subCategory: 'Armies',
        description: 'Hadith: Armies with black flags from east (Khorasan/Afghanistan) will support Mahdi. ISIS, Taliban use black flags.',
        modernEvidence: [
            'ISIS (Islamic State) - black flags',
            'Taliban (Afghanistan) - black flags',
            'Shiite militias - black flags',
            'Khorasan historically = Iran/Afghanistan'
        ],
        monitoringTips: [
            'Movements of extremist groups',
            'Unification under single leadership',
            'March toward Jerusalem'
        ],
        warningLevel: 'HIGH'
    },
    {
        id: 'islam_6',
        title: '⚠️ Conflict over Temple Mount',
        scripture: '2 Thessalonians 2:4',
        status: 'IN_PROGRESS',
        category: 'ISLAM_WARNING',
        subCategory: 'Jerusalem',
        description: 'Mahdi will rule from Jerusalem (Hadith). Antichrist will sit in Temple of God (Bible). Temple Mount has Dome of Rock. INEVITABLE CONFLICT.',
        modernEvidence: [
            'Constant tensions at Temple Mount',
            'Jews want to rebuild Temple IN SAME location',
            'Muslims see Al-Aqsa as 3rd holiest site',
            'Third Temple preparations advancing'
        ],
        monitoringTips: [
            'Violence at Temple Mount',
            'Destruction of Dome of the Rock',
            'Agreement allowing Jewish Temple',
            'Sharing of site'
        ],
        warningLevel: 'CRITICAL'
    },
    {
        id: 'islam_7',
        title: '⚠️ Beheading of "Infidels"',
        scripture: 'Revelation 20:4',
        status: 'IN_PROGRESS',
        category: 'ISLAM_WARNING',
        subCategory: 'Persecution',
        description: 'Hadith: Mahdi/Isa will execute by beheading. Revelation 20:4: "souls beheaded for testimony of Jesus". ISIS already beheaded Christians.',
        modernEvidence: [
            'ISIS beheaded Christians (2014-2016)',
            'Sharia law prescribes beheading',
            'Videos of beheading executions'
        ],
        monitoringTips: [
            'Increase in persecution of Christians',
            'Implementation of Sharia',
            'Public executions'
        ],
        warningLevel: 'HIGH'
    },
    {
        id: 'islam_8',
        title: '⚠️ Iranian Nuclear Program',
        scripture: 'Ezekiel 38-39',
        status: 'IN_PROGRESS',
        category: 'ISLAM_WARNING',
        subCategory: 'Iran',
        description: 'Iranian Shiites want to "hasten" return of 12th Imam Mahdi. Nuclear program may be used against Israel. Iran = Persia (Ezekiel 38).',
        modernEvidence: [
            'Iran enriching uranium (>60%)',
            'Supreme Leader Khamenei talks of destroying Israel',
            'Proxies: Hezbollah, Hamas, Houthis',
            'Alliance with Russia (Magog)'
        ],
        monitoringTips: [
            'Iranian nuclear progress',
            'Israeli preemptive strikes',
            'Activation of proxies against Israel',
            'Preparation for Ezekiel 38'
        ],
        warningLevel: 'CRITICAL'
    }
];

// ==================== COMBINED EXPORTS ====================
export const COMPREHENSIVE_PROPHECIES: ExtendedProphecyEvent[] = BIBLICAL_PROPHECIES;

// Statistics
export const PROPHECY_STATS = {
    biblical: {
        total: BIBLICAL_PROPHECIES.length,
        fulfilled: BIBLICAL_PROPHECIES.filter(p => p.status === 'FULFILLED').length,
        inProgress: BIBLICAL_PROPHECIES.filter(p => p.status === 'IN_PROGRESS').length,
        pending: BIBLICAL_PROPHECIES.filter(p => p.status === 'PENDING').length,
        critical: BIBLICAL_PROPHECIES.filter(p => p.warningLevel === 'CRITICAL').length,
        high: BIBLICAL_PROPHECIES.filter(p => p.warningLevel === 'HIGH').length,
        medium: BIBLICAL_PROPHECIES.filter(p => p.warningLevel === 'MEDIUM').length,
        low: BIBLICAL_PROPHECIES.filter(p => p.warningLevel === 'LOW').length,
    },
    islamic: {
        total: ISLAMIC_PROPHECIES.length,
        fulfilled: ISLAMIC_PROPHECIES.filter(p => p.status === 'FULFILLED').length,
        inProgress: ISLAMIC_PROPHECIES.filter(p => p.status === 'IN_PROGRESS').length,
        pending: ISLAMIC_PROPHECIES.filter(p => p.status === 'PENDING').length,
        critical: ISLAMIC_PROPHECIES.filter(p => p.warningLevel === 'CRITICAL').length,
        high: ISLAMIC_PROPHECIES.filter(p => p.warningLevel === 'HIGH').length,
    },
    total: BIBLICAL_PROPHECIES.length + ISLAMIC_PROPHECIES.length
};

// Category counts
export const PROPHECY_CATEGORIES = {
    DANIEL: BIBLICAL_PROPHECIES.filter(p => p.category === 'DANIEL').length,
    ISAIAH: BIBLICAL_PROPHECIES.filter(p => p.category === 'ISAIAH').length,
    EZEKIEL: BIBLICAL_PROPHECIES.filter(p => p.category === 'EZEKIEL').length,
    ZECHARIAH: BIBLICAL_PROPHECIES.filter(p => p.category === 'ZECHARIAH').length,
    JOEL: BIBLICAL_PROPHECIES.filter(p => p.category === 'JOEL').length,
    JESUS_OLIVET: BIBLICAL_PROPHECIES.filter(p => p.category === 'JESUS_OLIVET').length,
    REVELATION: BIBLICAL_PROPHECIES.filter(p => p.category === 'REVELATION').length,
    MINOR_PROPHETS: BIBLICAL_PROPHECIES.filter(p => p.category === 'MINOR_PROPHETS').length,
    ISLAM_WARNING: ISLAMIC_PROPHECIES.length,
};

// Utility functions
export const getPropheciesByCategory = (category: ProphecyCategory): ExtendedProphecyEvent[] => {
    return BIBLICAL_PROPHECIES.filter(p => p.category === category);
};

export const getPropheciesByStatus = (status: 'FULFILLED' | 'IN_PROGRESS' | 'PENDING'): ExtendedProphecyEvent[] => {
    return BIBLICAL_PROPHECIES.filter(p => p.status === status);
};

export const getPropheciesByWarningLevel = (level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): ExtendedProphecyEvent[] => {
    return BIBLICAL_PROPHECIES.filter(p => p.warningLevel === level);
};

export const getIslamicPropheciesByStatus = (status: 'FULFILLED' | 'IN_PROGRESS' | 'PENDING'): IslamProphecyEvent[] => {
    return ISLAMIC_PROPHECIES.filter(p => p.status === status);
};
