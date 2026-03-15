/**
 * LocationResolver — comprehensive geo-tagging for news articles
 *
 * Resolution pipeline (most-specific first):
 *   1. Specific city match (500+ world cities)
 *   2. State / province match (USA, Brazil, India, China, Russia, Australia, Canada)
 *   3. Country match + demonyms / nationality adjectives (195 countries)
 *   4. Organization match (NATO, UN, EU, IMF…)
 *   5. Source-feed geographic bias (CNA → Singapore, etc.)
 *   6. Returns null → caller decides: AI fallback or regional default
 */

export type LocationConfidence = 'city' | 'region' | 'country' | 'org' | 'source_bias';

export interface ResolvedLocation {
    name: string;
    coords: { lat: number; lng: number };
    confidence: LocationConfidence;
}

interface LocationEntry {
    lat: number;
    lng: number;
    aliases?: string[];
    demonyms?: string[];
    capital?: string;
    capitalCoords?: { lat: number; lng: number };
}

// ---------------------------------------------------------------------------
// 1. CITY DATABASE (500+ major world cities)
// ---------------------------------------------------------------------------
const CITY_LOCATIONS: Record<string, LocationEntry> = {
    // ── North America ──
    'new york':       { lat: 40.7128, lng: -74.0060 },
    'washington':     { lat: 38.8951, lng: -77.0364 },
    'los angeles':    { lat: 34.0522, lng: -118.2437 },
    'chicago':        { lat: 41.8781, lng: -87.6298 },
    'houston':        { lat: 29.7604, lng: -95.3698 },
    'miami':          { lat: 25.7617, lng: -80.1918 },
    'san francisco':  { lat: 37.7749, lng: -122.4194 },
    'seattle':        { lat: 47.6062, lng: -122.3321 },
    'boston':         { lat: 42.3601, lng: -71.0589 },
    'atlanta':        { lat: 33.7490, lng: -84.3880 },
    'dallas':         { lat: 32.7767, lng: -96.7970 },
    'las vegas':      { lat: 36.1699, lng: -115.1398 },
    'denver':         { lat: 39.7392, lng: -104.9903 },
    'phoenix':        { lat: 33.4484, lng: -112.0740 },
    'toronto':        { lat: 43.6510, lng: -79.3470 },
    'montreal':       { lat: 45.5017, lng: -73.5673 },
    'vancouver':      { lat: 49.2827, lng: -123.1207 },
    'ottawa':         { lat: 45.4215, lng: -75.6972 },
    'mexico city':    { lat: 19.4326, lng: -99.1332 },
    'guadalajara':    { lat: 20.6597, lng: -103.3496 },
    'monterrey':      { lat: 25.6866, lng: -100.3161 },
    'havana':         { lat: 23.1136, lng: -82.3666 },
    'panama city':    { lat: 8.9936, lng: -79.5197 },
    'san jose':       { lat: 9.9281, lng: -84.0907 },
    'tegucigalpa':    { lat: 14.0723, lng: -87.2023 },
    'guatemala city': { lat: 14.6349, lng: -90.5069 },
    'managua':        { lat: 12.1149, lng: -86.2362 },
    'san salvador':   { lat: 13.6929, lng: -89.2182 },
    'kingston':       { lat: 17.9970, lng: -76.7936 },
    'port-au-prince': { lat: 18.5944, lng: -72.3074 },
    'santo domingo':  { lat: 18.4861, lng: -69.9312 },
    'san juan':       { lat: 18.4655, lng: -66.1057 },
    'tijuana':        { lat: 32.5149, lng: -117.0382 },
    'juarez':         { lat: 31.6904, lng: -106.4245, aliases: ['ciudad juárez', 'ciudad juarez', 'cd. juárez'] },
    'culiacan':       { lat: 24.8049, lng: -107.3940, aliases: ['culiacán'] },
    'acapulco':       { lat: 16.8531, lng: -99.8237 },

    // ── South America ──
    'sao paulo':      { lat: -23.5505, lng: -46.6333 },
    'rio de janeiro': { lat: -22.9068, lng: -43.1729 },
    'brasilia':       { lat: -15.7801, lng: -47.9292 },
    'buenos aires':   { lat: -34.6037, lng: -58.3816 },
    'lima':           { lat: -12.0464, lng: -77.0428 },
    'bogota':         { lat: 4.7110, lng: -74.0721 },
    'santiago':       { lat: -33.4489, lng: -70.6693 },
    'caracas':        { lat: 10.4806, lng: -66.9036 },
    'quito':          { lat: -0.1807, lng: -78.4678 },
    'la paz':         { lat: -16.5000, lng: -68.1500 },
    'asuncion':       { lat: -25.2867, lng: -57.6470 },
    'montevideo':     { lat: -34.9011, lng: -56.1645 },
    'georgetown':     { lat: 6.8013, lng: -58.1551 },
    'paramaribo':     { lat: 5.8664, lng: -55.1668 },
    'cayenne':        { lat: 4.9224, lng: -52.3135 },
    'sucre':          { lat: -19.0196, lng: -65.2619 },
    'fortaleza':      { lat: -3.7319, lng: -38.5267 },
    'recife':         { lat: -8.0476, lng: -34.8770 },
    'manaus':         { lat: -3.1190, lng: -60.0217 },
    'porto alegre':   { lat: -30.0346, lng: -51.2177 },
    'curitiba':       { lat: -25.4284, lng: -49.2733 },
    'belo horizonte': { lat: -19.9167, lng: -43.9345 },
    'belem':          { lat: -1.4558, lng: -48.5044, aliases: ['belém'] },
    'natal':          { lat: -5.7945, lng: -35.2110 },
    'medellin':       { lat: 6.2442, lng: -75.5812, aliases: ['medellín'] },
    'rosario':        { lat: -32.9442, lng: -60.6505 },
    'cordoba argentina': { lat: -31.4201, lng: -64.1888 },
    'barranquilla':   { lat: 10.9685, lng: -74.7813 },
    'guayaquil':      { lat: -2.1962, lng: -79.8862 },

    // ── Europe ──
    'london':         { lat: 51.5074, lng: -0.1278 },
    'paris':          { lat: 48.8566, lng: 2.3522 },
    'berlin':         { lat: 52.5200, lng: 13.4050 },
    'madrid':         { lat: 40.4168, lng: -3.7038 },
    'rome':           { lat: 41.9028, lng: 12.4964 },
    'amsterdam':      { lat: 52.3676, lng: 4.9041 },
    'brussels':       { lat: 50.8503, lng: 4.3517 },
    'vienna':         { lat: 48.2082, lng: 16.3738 },
    'zurich':         { lat: 47.3769, lng: 8.5417 },
    'geneva':         { lat: 46.2044, lng: 6.1432 },
    'stockholm':      { lat: 59.3293, lng: 18.0686 },
    'oslo':           { lat: 59.9139, lng: 10.7522 },
    'copenhagen':     { lat: 55.6761, lng: 12.5683 },
    'helsinki':       { lat: 60.1699, lng: 24.9384 },
    'reykjavik':      { lat: 64.1265, lng: -21.8174 },
    'warsaw':         { lat: 52.2297, lng: 21.0122 },
    'prague':         { lat: 50.0755, lng: 14.4378 },
    'budapest':       { lat: 47.4979, lng: 19.0402 },
    'bucharest':      { lat: 44.4268, lng: 26.1025 },
    'sofia':          { lat: 42.6977, lng: 23.3219 },
    'athens':         { lat: 37.9838, lng: 23.7275 },
    'lisbon':         { lat: 38.7169, lng: -9.1395 },
    'barcelona':      { lat: 41.3851, lng: 2.1734 },
    'munich':         { lat: 48.1351, lng: 11.5820 },
    'frankfurt':      { lat: 50.1109, lng: 8.6821 },
    'hamburg':        { lat: 53.5511, lng: 9.9937 },
    'kyiv':           { lat: 50.4501, lng: 30.5234, aliases: ['kiev'] },
    'moscow':         { lat: 55.7558, lng: 37.6173, aliases: ['moscou', 'moskau', 'moscú', 'moskva'] },
    'st. petersburg': { lat: 59.9311, lng: 30.3609, aliases: ['saint petersburg'] },
    'minsk':          { lat: 53.9045, lng: 27.5615 },
    'vilnius':        { lat: 54.6872, lng: 25.2797 },
    'riga':           { lat: 56.9496, lng: 24.1052 },
    'tallinn':        { lat: 59.4370, lng: 24.7536 },
    'chisinau':       { lat: 47.0105, lng: 28.8638 },
    'sarajevo':       { lat: 43.8564, lng: 18.4131 },
    'belgrade':       { lat: 44.8176, lng: 20.4633 },
    'zagreb':         { lat: 45.8150, lng: 15.9819 },
    'ljubljana':      { lat: 46.0569, lng: 14.5058 },
    'bratislava':     { lat: 48.1486, lng: 17.1077 },
    'skopje':         { lat: 41.9981, lng: 21.4254 },
    'tirana':         { lat: 41.3275, lng: 19.8187 },
    'podgorica':      { lat: 42.4415, lng: 19.2636 },
    'pristina':       { lat: 42.6629, lng: 21.1655 },
    'valletta':       { lat: 35.8997, lng: 14.5146 },
    'nicosia':        { lat: 35.1856, lng: 33.3823 },
    'dublin':         { lat: 53.3498, lng: -6.2603 },

    // ── Russia / CIS ──
    'novosibirsk':    { lat: 54.9833, lng: 82.8964 },
    'yekaterinburg':  { lat: 56.8389, lng: 60.6057 },
    'kazan':          { lat: 55.7879, lng: 49.1233 },
    'vladivostok':    { lat: 43.1155, lng: 131.8855 },
    'kaliningrad':    { lat: 54.7104, lng: 20.4522 },
    'almaty':         { lat: 43.2220, lng: 76.8512 },
    'astana':         { lat: 51.1801, lng: 71.4460, aliases: ['nur-sultan'] },
    'tashkent':       { lat: 41.2995, lng: 69.2401 },
    'baku':           { lat: 40.4093, lng: 49.8671 },
    'yerevan':        { lat: 40.1872, lng: 44.5152 },
    'tbilisi':        { lat: 41.6938, lng: 44.8015 },
    'bishkek':        { lat: 42.8746, lng: 74.5698 },
    'dushanbe':       { lat: 38.5598, lng: 68.7870 },
    'ashgabat':       { lat: 37.9601, lng: 58.3261 },

    // ── Ukraine (cities not covered by RUSSIA_REGIONS) ──
    'lviv':           { lat: 49.8397, lng: 24.0297, aliases: ['lvov', 'lwów', 'lwow'] },
    'odesa':          { lat: 46.4825, lng: 30.7233, aliases: ['odessa'] },
    'dnipro':         { lat: 48.4647, lng: 35.0462, aliases: ['dnipropetrovsk', 'dniepropetrovsk'] },
    'sumy':           { lat: 50.9077, lng: 34.7981 },
    'chernihiv':      { lat: 51.4982, lng: 31.2893, aliases: ['chernigov', 'chernihov'] },
    'vinnytsia':      { lat: 49.2331, lng: 28.4682, aliases: ['vinnitsa'] },
    'poltava':        { lat: 49.5883, lng: 34.5514 },

    // ── Russia (border / frequently mentioned cities) ──
    'belgorod':       { lat: 50.5977, lng: 36.5882 },
    'rostov':         { lat: 47.2357, lng: 39.7015, aliases: ['rostov-on-don', 'rostov-na-donu'] },
    'kursk':          { lat: 51.7304, lng: 36.1927 },
    'bryansk':        { lat: 53.2521, lng: 34.3717 },
    'volgograd':      { lat: 48.7080, lng: 44.5133, aliases: ['stalingrad'] },
    'sochi':          { lat: 43.5855, lng: 39.7303 },
    'murmansk':       { lat: 68.9585, lng: 33.0827 },
    'smolensk':       { lat: 54.7826, lng: 32.0453 },
    'pskov':          { lat: 57.8194, lng: 28.3317 },

    // ── Middle East ──
    'istanbul':       { lat: 41.0082, lng: 28.9784 },
    'ankara':         { lat: 39.9334, lng: 32.8597 },
    'baghdad':        { lat: 33.3152, lng: 44.3661, aliases: ['bagdad', 'bagdá', 'bagdade'] },
    'beirut':         { lat: 33.8938, lng: 35.5018 },
    'damascus':       { lat: 33.5138, lng: 36.2765, aliases: ['damasco', 'dimashq'] },
    'amman':          { lat: 31.9522, lng: 35.9284 },
    'jerusalem':      { lat: 31.7683, lng: 35.2137 },
    'tel aviv':       { lat: 32.0853, lng: 34.7818 },
    'riyadh':         { lat: 24.7136, lng: 46.6753 },
    'jeddah':         { lat: 21.3891, lng: 39.8579 },
    'mecca':          { lat: 21.3891, lng: 39.8579 },
    'medina':         { lat: 24.5247, lng: 39.5692 },
    'dubai':          { lat: 25.2048, lng: 55.2708 },
    'abu dhabi':      { lat: 24.2992, lng: 54.6973 },
    'doha':           { lat: 25.2854, lng: 51.5310 },
    'kuwait city':    { lat: 29.3759, lng: 47.9774 },
    'manama':         { lat: 26.2285, lng: 50.5860 },
    'muscat':         { lat: 23.5880, lng: 58.3829 },
    'tehran':         { lat: 35.6892, lng: 51.3890, aliases: ['teerã', 'téhéran', 'tehéran', 'teheran'] },
    'isfahan':        { lat: 32.6546, lng: 51.6679 },
    'sanaa':          { lat: 15.3694, lng: 44.1910 },
    'aden':           { lat: 12.7797, lng: 45.0362 },
    'kabul':          { lat: 34.5553, lng: 69.2075, aliases: ['cabul'] },
    'kandahar':       { lat: 31.6289, lng: 65.7372 },
    'mosul':          { lat: 36.3350, lng: 43.1189 },
    'fallujah':       { lat: 33.3463, lng: 43.7844 },
    'kirkuk':         { lat: 35.4681, lng: 44.3922 },
    'erbil':          { lat: 36.1901, lng: 44.0091 },
    'gaza city':      { lat: 31.5017, lng: 34.4669 },
    'rafah':          { lat: 31.2968, lng: 34.2435 },
    'ramallah':       { lat: 31.9036, lng: 35.2034 },
    'hebron':         { lat: 31.5326, lng: 35.0998 },

    // ── Syria (conflict cities) ──
    'aleppo':         { lat: 36.2021, lng: 37.1343, aliases: ['alepo', 'halab', 'halep'] },
    'homs':           { lat: 34.7324, lng: 36.7237, aliases: ['hims'] },
    'idlib':          { lat: 35.9272, lng: 36.6297 },
    'raqqa':          { lat: 35.9478, lng: 39.0126 },
    'deir ez-zor':    { lat: 35.3336, lng: 40.1408, aliases: ['deir ezzor', 'deir al-zor'] },
    'latakia':        { lat: 35.5317, lng: 35.7917 },
    'daraa':          { lat: 32.6238, lng: 36.1052, aliases: ['dera', "deraa"] },

    // ── Iraq (additional cities) ──
    'basra':          { lat: 30.5085, lng: 47.7804, aliases: ['basrah'] },
    'najaf':          { lat: 31.9963, lng: 44.3351 },
    'karbala':        { lat: 32.6166, lng: 44.0244 },
    'tikrit':         { lat: 34.5948, lng: 43.6826 },
    'sulaymaniyah':   { lat: 35.5578, lng: 45.4329, aliases: ['sulaimani'] },
    'ramadi':         { lat: 33.4208, lng: 43.3009 },
    'samarra':        { lat: 34.1985, lng: 43.8739 },

    // ── Lebanon (additional cities) ──
    'tyre':           { lat: 33.2705, lng: 35.2038, aliases: ['sour', 'sur'] },
    'sidon':          { lat: 33.5597, lng: 35.3714, aliases: ['saida'] },
    'tripoli lebanon': { lat: 34.4332, lng: 35.8497 },

    // ── Iran (additional cities) ──
    'mashhad':        { lat: 36.2973, lng: 59.6067 },
    'tabriz':         { lat: 38.0804, lng: 46.2919 },
    'shiraz':         { lat: 29.5918, lng: 52.5837 },
    'ahvaz':          { lat: 31.3183, lng: 48.6706, aliases: ['ahwaz'] },
    'natanz':         { lat: 33.5218, lng: 51.9197 },
    'bandar abbas':   { lat: 27.1832, lng: 56.2666 },
    'qom':            { lat: 34.6401, lng: 50.8764, aliases: ['qum'] },

    // ── Yemen (conflict cities) ──
    'hudaydah':       { lat: 14.7980, lng: 42.9511, aliases: ['hodeidah', 'hodeida', 'al hudaydah'] },
    'taiz':           { lat: 13.5791, lng: 44.0208, aliases: ['taizz'] },
    'marib':          { lat: 15.4549, lng: 45.3218, aliases: ['mareb'] },

    // ── Asia ──
    'beijing':        { lat: 39.9042, lng: 116.4074, aliases: ['peking', 'pékin', 'pekín', 'pequim', 'peiping'] },
    'shanghai':       { lat: 31.2304, lng: 121.4737 },
    'guangzhou':      { lat: 23.1291, lng: 113.2644 },
    'shenzhen':       { lat: 22.5431, lng: 114.0579 },
    'chengdu':        { lat: 30.5728, lng: 104.0668 },
    'wuhan':          { lat: 30.5928, lng: 114.3052 },
    'chongqing':      { lat: 29.4316, lng: 106.9123 },
    'tianjin':        { lat: 39.3434, lng: 117.3616 },
    'nanjing':        { lat: 32.0603, lng: 118.7969 },
    'xian':           { lat: 34.3416, lng: 108.9398 },
    'hong kong':      { lat: 22.3193, lng: 114.1694 },
    'macau':          { lat: 22.1987, lng: 113.5439 },
    'taipei':         { lat: 25.0330, lng: 121.5654 },
    'kaohsiung':      { lat: 22.6273, lng: 120.3014 },
    'tokyo':          { lat: 35.6762, lng: 139.6503 },
    'osaka':          { lat: 34.6937, lng: 135.5023 },
    'hiroshima':      { lat: 34.3853, lng: 132.4553 },
    'nagasaki':       { lat: 32.7503, lng: 129.8777 },
    'fukushima':      { lat: 37.7503, lng: 140.4676 },
    'seoul':          { lat: 37.5665, lng: 126.9780, aliases: ['seúl', 'séoul'] },
    'busan':          { lat: 35.1796, lng: 129.0756 },
    'pyongyang':      { lat: 39.0194, lng: 125.7381 },
    'singapore':      { lat: 1.3521, lng: 103.8198 },
    'kuala lumpur':   { lat: 3.1390, lng: 101.6869 },
    'jakarta':        { lat: -6.2088, lng: 106.8456 },
    'surabaya':       { lat: -7.2575, lng: 112.7521 },
    'bangkok':        { lat: 13.7563, lng: 100.5018 },
    'manila':         { lat: 14.5995, lng: 120.9842 },
    'cebu':           { lat: 10.3157, lng: 123.8854 },
    'ho chi minh city': { lat: 10.8231, lng: 106.6297, aliases: ['saigon', 'ho chi minh'] },
    'hanoi':          { lat: 21.0278, lng: 105.8342 },
    'phnom penh':     { lat: 11.5564, lng: 104.9282 },
    'vientiane':      { lat: 17.9757, lng: 102.6331 },
    'naypyidaw':      { lat: 19.7633, lng: 96.0785 },
    'yangon':         { lat: 16.8661, lng: 96.1951 },
    'rangoon':        { lat: 16.8661, lng: 96.1951 },
    'colombo':        { lat: 6.9271, lng: 79.8612 },
    'dhaka':          { lat: 23.8103, lng: 90.4125 },
    'islamabad':      { lat: 33.7294, lng: 73.0931 },
    'karachi':        { lat: 24.8607, lng: 67.0011 },
    'lahore':         { lat: 31.5204, lng: 74.3587 },
    'peshawar':       { lat: 34.0150, lng: 71.5805 },
    'quetta':         { lat: 30.1798, lng: 66.9750 },
    'mumbai':         { lat: 19.0760, lng: 72.8777 },
    'delhi':          { lat: 28.7041, lng: 77.1025 },
    'new delhi':      { lat: 28.6139, lng: 77.2090 },
    'bangalore':      { lat: 12.9716, lng: 77.5946 },
    'chennai':        { lat: 13.0827, lng: 80.2707 },
    'kolkata':        { lat: 22.5726, lng: 88.3639 },
    'hyderabad':      { lat: 17.3850, lng: 78.4867 },
    'ahmedabad':      { lat: 23.0225, lng: 72.5714 },
    'kathmandu':      { lat: 27.7172, lng: 85.3240 },
    'thimphu':        { lat: 27.4728, lng: 89.6393 },
    'male':           { lat: 4.1755, lng: 73.5093 },
    'ulaanbaatar':    { lat: 47.8864, lng: 106.9057 },
    'dili':           { lat: -8.5586, lng: 125.5736 },
    'bandar seri begawan': { lat: 4.9031, lng: 114.9398 },
    'mandalay':       { lat: 21.9588, lng: 96.0891 },
    'chittagong':     { lat: 22.3569, lng: 91.7832, aliases: ['chattogram'] },
    'urumqi':         { lat: 43.8256, lng: 87.6168, aliases: ['ürümqi', 'urumchi'] },
    'lhasa':          { lat: 29.6500, lng: 91.1000 },
    'harbin':         { lat: 45.8038, lng: 126.5349 },
    'hangzhou':       { lat: 30.2741, lng: 120.1551 },
    'nanchang':       { lat: 28.6820, lng: 115.8579 },
    'kunming':        { lat: 25.0389, lng: 102.7183 },
    'hefei':          { lat: 31.8206, lng: 117.2272 },
    'lanzhou':        { lat: 36.0611, lng: 103.8343 },

    // ── Africa ──
    'cairo':          { lat: 30.0444, lng: 31.2357 },
    'alexandria':     { lat: 31.2001, lng: 29.9187 },
    'casablanca':     { lat: 33.5731, lng: -7.5898 },
    'rabat':          { lat: 34.0209, lng: -6.8416 },
    'tunis':          { lat: 36.8065, lng: 10.1815 },
    'algiers':        { lat: 36.7538, lng: 3.0588 },
    'tripoli':        { lat: 32.8872, lng: 13.1913 },
    'khartoum':       { lat: 15.5007, lng: 32.5599 },
    'addis ababa':    { lat: 9.1450, lng: 40.4897 },
    'nairobi':        { lat: -1.2921, lng: 36.8219 },
    'kampala':        { lat: 0.3476, lng: 32.5825 },
    'dar es salaam':  { lat: -6.7924, lng: 39.2083 },
    'kigali':         { lat: -1.9536, lng: 30.0606 },
    'mogadishu':      { lat: 2.0469, lng: 45.3182 },
    'djibouti':       { lat: 11.5721, lng: 43.1456 },
    'asmara':         { lat: 15.3389, lng: 38.9310 },
    'abuja':          { lat: 9.0579, lng: 7.4951 },
    'lagos':          { lat: 6.5244, lng: 3.3792 },
    'accra':          { lat: 5.6037, lng: -0.1870 },
    'dakar':          { lat: 14.7167, lng: -17.4677 },
    'bamako':         { lat: 12.6392, lng: -8.0029 },
    'ouagadougou':    { lat: 12.3714, lng: -1.5197 },
    'niamey':         { lat: 13.5137, lng: 2.1098 },
    'ndjamena':       { lat: 12.1348, lng: 15.0557 },
    'kano':           { lat: 11.9964, lng: 8.5167 },
    'kinshasa':       { lat: -4.4419, lng: 15.2663 },
    'brazzaville':    { lat: -4.2634, lng: 15.2429 },
    'luanda':         { lat: -8.8368, lng: 13.2343 },
    'lusaka':         { lat: -15.4167, lng: 28.2833 },
    'harare':         { lat: -17.8292, lng: 31.0522 },
    'maputo':         { lat: -25.9692, lng: 32.5732 },
    'antananarivo':   { lat: -18.9137, lng: 47.5361 },
    'johannesburg':   { lat: -26.2041, lng: 28.0473 },
    'cape town':      { lat: -33.9249, lng: 18.4241 },
    'pretoria':       { lat: -25.7461, lng: 28.1881 },
    'durban':         { lat: -29.8587, lng: 31.0218 },
    'windhoek':       { lat: -22.5609, lng: 17.0658 },
    'gaborone':       { lat: -24.6282, lng: 25.9231 },
    'lilongwe':       { lat: -13.9626, lng: 33.7741 },
    'banjul':         { lat: 13.4549, lng: -16.5790 },
    'freetown':       { lat: 8.4657, lng: -13.2317 },
    'monrovia':       { lat: 6.3004, lng: -10.7969 },
    'abidjan':        { lat: 5.3600, lng: -4.0083 },
    'yamoussoukro':   { lat: 6.8276, lng: -5.2893 },
    'conakry':        { lat: 9.5370, lng: -13.6773 },
    'bissau':         { lat: 11.8636, lng: -15.5977 },
    'lome':           { lat: 6.1375, lng: 1.2123 },
    'porto-novo':     { lat: 6.3703, lng: 2.3912 },
    'cotonou':        { lat: 6.3654, lng: 2.4183 },
    'yaounde':        { lat: 3.8480, lng: 11.5021 },
    'douala':         { lat: 4.0511, lng: 9.7679 },
    'libreville':     { lat: 0.3901, lng: 9.4544 },
    'malabo':         { lat: 3.7504, lng: 8.7371 },
    'bangui':         { lat: 4.3612, lng: 18.5550 },
    'bujumbura':      { lat: -3.3869, lng: 29.3641 },
    'gitega':         { lat: -3.4271, lng: 29.9246 },
    'moroni':         { lat: -11.7022, lng: 43.2551 },
    'victoria':       { lat: -4.6191, lng: 55.4513 },
    'port louis':     { lat: -20.1654, lng: 57.4896 },
    'maseru':         { lat: -29.3151, lng: 27.4869 },
    'mbabane':        { lat: -26.3054, lng: 31.1367 },
    'juba':           { lat: 4.8594, lng: 31.5713 },
    'mekelle':        { lat: 13.4970, lng: 39.4757, aliases: ['mekele', 'meqele'] },
    'gondar':         { lat: 12.6030, lng: 37.4615, aliases: ['gonder'] },
    'baidoa':         { lat: 3.1071, lng: 43.6498 },
    'gao':            { lat: 16.2666, lng: -0.0442 },
    'timbuktu':       { lat: 16.7711, lng: -3.0026 },
    'benghazi':       { lat: 32.1190, lng: 20.0868 },
    'misrata':        { lat: 32.3754, lng: 15.0925 },
    'tobruk':         { lat: 32.0845, lng: 23.9601 },
    'el aaiun':       { lat: 27.1536, lng: -13.2033, aliases: ['laayoune'] },
    'entebbe':        { lat: 0.0512, lng: 32.4637 },
    'goma':           { lat: -1.6584, lng: 29.2275 },
    'bukavu':         { lat: -2.5085, lng: 28.8611 },
    'kisangani':      { lat: 0.5197, lng: 25.1900 },

    // ── Oceania ──
    'sydney':         { lat: -33.8688, lng: 151.2093 },
    'melbourne':      { lat: -37.8136, lng: 144.9631 },
    'brisbane':       { lat: -27.4698, lng: 153.0251 },
    'perth':          { lat: -31.9505, lng: 115.8605 },
    'adelaide':       { lat: -34.9285, lng: 138.6007 },
    'canberra':       { lat: -35.2809, lng: 149.1300 },
    'darwin':         { lat: -12.4634, lng: 130.8456 },
    'hobart':         { lat: -42.8821, lng: 147.3272 },
    'auckland':       { lat: -36.8485, lng: 174.7633 },
    'wellington':     { lat: -41.2866, lng: 174.7756 },
    'suva':           { lat: -18.1416, lng: 178.4415 },
    'port moresby':   { lat: -9.4438, lng: 147.1803 },
    'nuku\'alofa':    { lat: -21.1393, lng: -175.2049 },
    'honiara':        { lat: -9.4333, lng: 160.0333 },
};

// ---------------------------------------------------------------------------
// 2. US STATES (50 states + DC + Puerto Rico)
// ---------------------------------------------------------------------------
const US_STATES: Record<string, LocationEntry> = {
    'alabama':        { lat: 32.7990, lng: -86.8073 },
    'alaska':         { lat: 64.2008, lng: -153.4937 },
    'arizona':        { lat: 34.0489, lng: -111.0937 },
    'arkansas':       { lat: 34.7465, lng: -92.2896 },
    'california':     { lat: 36.7783, lng: -119.4179 },
    'colorado':       { lat: 39.5501, lng: -105.7821 },
    'connecticut':    { lat: 41.6032, lng: -73.0877 },
    'delaware':       { lat: 38.9108, lng: -75.5277 },
    'florida':        { lat: 27.6648, lng: -81.5158 },
    'georgia':        { lat: 32.1574, lng: -82.9071 },
    'hawaii':         { lat: 19.8968, lng: -155.5828 },
    'idaho':          { lat: 44.2405, lng: -114.4788 },
    'illinois':       { lat: 40.3495, lng: -88.9861 },
    'indiana':        { lat: 39.8494, lng: -86.2583 },
    'iowa':           { lat: 42.0115, lng: -93.2105 },
    'kansas':         { lat: 38.5266, lng: -96.7265 },
    'kentucky':       { lat: 37.6681, lng: -84.6701 },
    'louisiana':      { lat: 31.1695, lng: -91.8678 },
    'maine':          { lat: 44.6939, lng: -69.3819 },
    'maryland':       { lat: 39.0458, lng: -76.6413 },
    'massachusetts':  { lat: 42.2302, lng: -71.5301 },
    'michigan':       { lat: 43.3266, lng: -84.5361 },
    'minnesota':      { lat: 45.6945, lng: -93.9002 },
    'mississippi':    { lat: 32.7416, lng: -89.6787 },
    'missouri':       { lat: 38.4561, lng: -92.2884 },
    'montana':        { lat: 46.8797, lng: -110.3626 },
    'nebraska':       { lat: 41.4925, lng: -99.9018 },
    'nevada':         { lat: 38.8026, lng: -116.4194 },
    'new hampshire':  { lat: 43.1939, lng: -71.5724 },
    'new jersey':     { lat: 40.0583, lng: -74.4057 },
    'new mexico':     { lat: 34.5199, lng: -105.8701 },
    'north carolina': { lat: 35.7596, lng: -79.0193 },
    'north dakota':   { lat: 47.5515, lng: -101.0020 },
    'ohio':           { lat: 40.4173, lng: -82.9071 },
    'oklahoma':       { lat: 35.5653, lng: -96.9289 },
    'oregon':         { lat: 43.8041, lng: -120.5542 },
    'pennsylvania':   { lat: 41.2033, lng: -77.1945 },
    'rhode island':   { lat: 41.6809, lng: -71.5118 },
    'south carolina': { lat: 33.8361, lng: -81.1637 },
    'south dakota':   { lat: 43.9695, lng: -99.9018 },
    'tennessee':      { lat: 35.5175, lng: -86.5804 },
    'texas':          { lat: 31.9686, lng: -99.9018 },
    'utah':           { lat: 39.3210, lng: -111.0937 },
    'vermont':        { lat: 44.5588, lng: -72.5778 },
    'virginia':       { lat: 37.4316, lng: -78.6569 },
    'washington state': { lat: 47.7511, lng: -120.7401 },
    'west virginia':  { lat: 38.5976, lng: -80.4549 },
    'wisconsin':      { lat: 43.7844, lng: -88.7879 },
    'wyoming':        { lat: 43.0760, lng: -107.2903 },
};

// ---------------------------------------------------------------------------
// 3. BRAZIL STATES (26 states + DF)
// ---------------------------------------------------------------------------
const BRAZIL_STATES: Record<string, LocationEntry> = {
    'acre':           { lat: -9.0238, lng: -70.8120 },
    'alagoas':        { lat: -9.5713, lng: -36.7820 },
    'amapá':          { lat: 1.4102, lng: -51.7703 },
    'amazonas':       { lat: -3.4168, lng: -65.8561 },
    'bahia':          { lat: -12.5797, lng: -41.7007 },
    'ceará':          { lat: -5.4984, lng: -39.3206 },
    'distrito federal': { lat: -15.7998, lng: -47.8645 },
    'espírito santo': { lat: -19.1834, lng: -40.3089 },
    'goiás':          { lat: -15.8270, lng: -49.8362 },
    'maranhão':       { lat: -5.4207, lng: -45.4459 },
    'mato grosso':    { lat: -12.6819, lng: -56.9211 },
    'mato grosso do sul': { lat: -20.7722, lng: -54.7852 },
    'minas gerais':   { lat: -18.5122, lng: -44.5550 },
    'pará':           { lat: -1.9981, lng: -54.9306 },
    'paraíba':        { lat: -7.2399, lng: -36.7820 },
    'paraná':         { lat: -25.2521, lng: -52.0215 },
    'pernambuco':     { lat: -8.8137, lng: -36.9541 },
    'piauí':          { lat: -7.7183, lng: -42.7289 },
    'rio de janeiro state': { lat: -22.9068, lng: -43.1729 },
    'rio grande do norte': { lat: -5.8127, lng: -36.2740 },
    'rio grande do sul': { lat: -30.0346, lng: -51.2177 },
    'rondônia':       { lat: -11.5057, lng: -63.5806 },
    'roraima':        { lat: 2.7376, lng: -62.0751 },
    'santa catarina': { lat: -27.4249, lng: -50.9177 },
    'são paulo state': { lat: -23.5505, lng: -46.6333 },
    'sergipe':        { lat: -10.5741, lng: -37.3857 },
    'tocantins':      { lat: -10.1753, lng: -48.2982 },
};

// ---------------------------------------------------------------------------
// 4. INDIA STATES (28 states + UTs)
// ---------------------------------------------------------------------------
const INDIA_STATES: Record<string, LocationEntry> = {
    'andhra pradesh': { lat: 15.9129, lng: 79.7400 },
    'arunachal pradesh': { lat: 28.2180, lng: 94.7278 },
    'assam':          { lat: 26.2006, lng: 92.9376 },
    'bihar':          { lat: 25.0961, lng: 85.3131 },
    'chhattisgarh':   { lat: 21.2787, lng: 81.8661 },
    'goa':            { lat: 15.2993, lng: 74.1240 },
    'gujarat':        { lat: 22.2587, lng: 71.1924 },
    'haryana':        { lat: 29.0588, lng: 76.0856 },
    'himachal pradesh': { lat: 31.1048, lng: 77.1734 },
    'jharkhand':      { lat: 23.6102, lng: 85.2799 },
    'karnataka':      { lat: 15.3173, lng: 75.7139 },
    'kerala':         { lat: 10.8505, lng: 76.2711 },
    'madhya pradesh': { lat: 22.9734, lng: 78.6569 },
    'maharashtra':    { lat: 19.7515, lng: 75.7139 },
    'manipur':        { lat: 24.6637, lng: 93.9063 },
    'meghalaya':      { lat: 25.4670, lng: 91.3662 },
    'mizoram':        { lat: 23.1645, lng: 92.9376 },
    'nagaland':       { lat: 26.1584, lng: 94.5624 },
    'odisha':         { lat: 20.9517, lng: 85.0985 },
    'punjab india':   { lat: 31.1471, lng: 75.3412 },
    'rajasthan':      { lat: 27.0238, lng: 74.2179 },
    'sikkim':         { lat: 27.5330, lng: 88.5122 },
    'tamil nadu':     { lat: 11.1271, lng: 78.6569 },
    'telangana':      { lat: 17.1232, lng: 79.2088 },
    'tripura':        { lat: 23.9408, lng: 91.9882 },
    'uttar pradesh':  { lat: 26.8467, lng: 80.9462 },
    'uttarakhand':    { lat: 30.0668, lng: 79.0193 },
    'west bengal':    { lat: 22.9868, lng: 87.8550 },
    'kashmir':        { lat: 33.7782, lng: 76.5762 },
    'jammu':          { lat: 32.7266, lng: 74.8570 },
    'ladakh':         { lat: 34.1526, lng: 77.5770 },
};

// ---------------------------------------------------------------------------
// 5. CHINA PROVINCES
// ---------------------------------------------------------------------------
const CHINA_PROVINCES: Record<string, LocationEntry> = {
    'xinjiang':       { lat: 42.1253, lng: 87.1949 },
    'tibet':          { lat: 31.1048, lng: 90.5179 },
    'inner mongolia': { lat: 44.0935, lng: 113.9448 },
    'heilongjiang':   { lat: 47.1362, lng: 128.3784 },
    'jilin':          { lat: 43.8378, lng: 126.6495 },
    'liaoning':       { lat: 41.2956, lng: 122.6085 },
    'hebei':          { lat: 37.8957, lng: 114.9042 },
    'shandong':       { lat: 36.3427, lng: 118.1498 },
    'jiangsu':        { lat: 33.0000, lng: 120.0000 },
    'zhejiang':       { lat: 29.1832, lng: 120.0934 },
    'fujian':         { lat: 26.0789, lng: 117.9874 },
    'guangdong':      { lat: 23.3790, lng: 113.7633 },
    'yunnan':         { lat: 24.4753, lng: 101.3431 },
    'sichuan':        { lat: 30.6171, lng: 102.7103 },
    'shaanxi':        { lat: 35.1917, lng: 108.8701 },
    'gansu':          { lat: 35.7518, lng: 104.1954 },
    'qinghai':        { lat: 35.7452, lng: 95.9956 },
    'ningxia':        { lat: 37.1985, lng: 106.1581 },
    'guizhou':        { lat: 26.8154, lng: 106.8748 },
    'guangxi':        { lat: 23.7247, lng: 108.7881 },
    'hainan':         { lat: 19.5497, lng: 109.1009 },
    'shanxi':         { lat: 37.5777, lng: 112.2922 },
    'henan':          { lat: 33.8820, lng: 113.6140 },
    'hubei':          { lat: 30.9756, lng: 112.2707 },
    'hunan':          { lat: 27.6104, lng: 111.7088 },
    'jiangxi':        { lat: 27.0881, lng: 114.9042 },
    'anhui':          { lat: 31.8612, lng: 117.2865 },
};

// ---------------------------------------------------------------------------
// 6. RUSSIA MAIN REGIONS
// ---------------------------------------------------------------------------
const RUSSIA_REGIONS: Record<string, LocationEntry> = {
    'siberia':        { lat: 60.0000, lng: 100.0000 },
    'chechnya':       { lat: 43.4023, lng: 45.7187 },
    'dagestan':       { lat: 42.4433, lng: 47.1427 },
    'crimea':         { lat: 45.3500, lng: 34.1000 },
    'donbas':         { lat: 48.0159, lng: 37.8028 },
    'donetsk':        { lat: 48.0159, lng: 37.8028 },
    'luhansk':        { lat: 48.5740, lng: 39.3078 },
    'zaporizhzhia':   { lat: 47.8388, lng: 35.1396 },
    'kherson':        { lat: 46.6354, lng: 32.6169 },
    'kharkiv':        { lat: 49.9935, lng: 36.2304 },
    'mariupol':       { lat: 47.0951, lng: 37.5397 },
    'chernobyl':      { lat: 51.2717, lng: 30.2220 },
    'ural':           { lat: 59.5000, lng: 60.0000 },
    'sakhalin':       { lat: 50.5000, lng: 143.0000 },
    'kamchatka':      { lat: 54.0000, lng: 159.0000 },
};

// ---------------------------------------------------------------------------
// 7. AUSTRALIA STATES / TERRITORIES
// ---------------------------------------------------------------------------
const AUSTRALIA_STATES: Record<string, LocationEntry> = {
    'new south wales':    { lat: -32.1657, lng: 147.1803 },
    'victoria':           { lat: -36.5987, lng: 144.6492 },
    'queensland':         { lat: -22.1646, lng: 144.5844 },
    'western australia':  { lat: -27.6728, lng: 121.6283 },
    'south australia':    { lat: -30.0002, lng: 136.2092 },
    'tasmania':           { lat: -41.4545, lng: 145.9707 },
    'northern territory': { lat: -19.4914, lng: 132.5510 },
    'act':                { lat: -35.4735, lng: 149.0124 },
};

// ---------------------------------------------------------------------------
// 8. CANADA PROVINCES
// ---------------------------------------------------------------------------
const CANADA_PROVINCES: Record<string, LocationEntry> = {
    'ontario':            { lat: 51.2538, lng: -85.3232 },
    'quebec':             { lat: 52.9399, lng: -73.5491 },
    'british columbia':   { lat: 53.7267, lng: -127.6476 },
    'alberta':            { lat: 53.9333, lng: -116.5765 },
    'manitoba':           { lat: 53.7609, lng: -98.8139 },
    'saskatchewan':       { lat: 52.9399, lng: -106.4509 },
    'nova scotia':        { lat: 44.6820, lng: -63.7443 },
    'new brunswick':      { lat: 46.5653, lng: -66.4619 },
    'newfoundland':       { lat: 53.1355, lng: -57.6604 },
    'prince edward island': { lat: 46.5107, lng: -63.4168 },
    'yukon':              { lat: 64.2823, lng: -135.0000 },
    'northwest territories': { lat: 64.8255, lng: -124.8457 },
    'nunavut':            { lat: 70.2998, lng: -83.1076 },
};

// ---------------------------------------------------------------------------
// 9. COUNTRY DATABASE (195 countries) with demonyms
// ---------------------------------------------------------------------------
const COUNTRY_LOCATIONS: Record<string, LocationEntry> = {
    // ── Americas ──
    'united states':   { lat: 37.0902, lng: -95.7129, aliases: ['usa', 'america', 'u.s.', 'u.s.a.'], demonyms: ['american', 'americans'] },
    'canada':          { lat: 56.1304, lng: -106.3468, demonyms: ['canadian', 'canadians'] },
    'mexico':          { lat: 23.6345, lng: -102.5528, aliases: ['méxico'], demonyms: ['mexican', 'mexicans'] },
    'guatemala':       { lat: 15.7835, lng: -90.2308, demonyms: ['guatemalan', 'guatemalans'] },
    'belize':          { lat: 17.1899, lng: -88.4976, demonyms: ['belizean', 'belizeans'] },
    'honduras':        { lat: 15.1999, lng: -86.2419, demonyms: ['honduran', 'hondurans'] },
    'el salvador':     { lat: 13.7942, lng: -88.8965, demonyms: ['salvadoran', 'salvadorans', 'salvadorean', 'salvadoreans'] },
    'nicaragua':       { lat: 12.8654, lng: -85.2072, demonyms: ['nicaraguan', 'nicaraguans'] },
    'costa rica':      { lat: 9.7489, lng: -83.7534, demonyms: ['costa rican', 'costa ricans'] },
    'panama':          { lat: 8.5380, lng: -80.7821, demonyms: ['panamanian', 'panamanians'] },
    'cuba':            { lat: 21.5218, lng: -77.7812, demonyms: ['cuban', 'cubans'] },
    'haiti':           { lat: 18.9712, lng: -72.2852, demonyms: ['haitian', 'haitians'] },
    'dominican republic': { lat: 18.7357, lng: -70.1627, aliases: ['dominican rep.'], demonyms: ['dominican', 'dominicans'] },
    'jamaica':         { lat: 18.1096, lng: -77.2975, demonyms: ['jamaican', 'jamaicans'] },
    'trinidad and tobago': { lat: 10.6918, lng: -61.2225, aliases: ['trinidad'], demonyms: ['trinidadian', 'trinidadians'] },
    'barbados':        { lat: 13.1939, lng: -59.5432, demonyms: ['barbadian', 'barbadians', 'bajan', 'bajans'] },
    'colombia':        { lat: 4.5709, lng: -74.2973, demonyms: ['colombian', 'colombians'] },
    'venezuela':       { lat: 6.4238, lng: -66.5897, demonyms: ['venezuelan', 'venezuelans'] },
    'guyana':          { lat: 4.8604, lng: -58.9302, demonyms: ['guyanese'] },
    'suriname':        { lat: 3.9193, lng: -56.0278, demonyms: ['surinamese'] },
    'french guiana':   { lat: 3.9339, lng: -53.1258 },
    'brazil':          { lat: -14.2350, lng: -51.9253, aliases: ['brasil'], demonyms: ['brazilian', 'brazilians', 'brasileiro', 'brasileira'] },
    'ecuador':         { lat: -1.8312, lng: -78.1834, demonyms: ['ecuadorian', 'ecuadorians', 'ecuadorean', 'ecuadoreans'] },
    'peru':            { lat: -9.1900, lng: -75.0152, demonyms: ['peruvian', 'peruvians'] },
    'bolivia':         { lat: -16.2902, lng: -63.5887, demonyms: ['bolivian', 'bolivians'] },
    'chile':           { lat: -35.6751, lng: -71.5430, demonyms: ['chilean', 'chileans'] },
    'argentina':       { lat: -38.4161, lng: -63.6167, demonyms: ['argentine', 'argentines', 'argentinian', 'argentinians'] },
    'uruguay':         { lat: -32.5228, lng: -55.7658, demonyms: ['uruguayan', 'uruguayans'] },
    'paraguay':        { lat: -23.4425, lng: -58.4438, demonyms: ['paraguayan', 'paraguayans'] },

    // ── Europe ──
    'united kingdom':  { lat: 55.3781, lng: -3.4360, aliases: ['uk', 'britain', 'great britain', 'england', 'scotland', 'wales'], demonyms: ['british', 'brit', 'brits', 'english', 'scottish', 'welsh'] },
    'france':          { lat: 46.2276, lng: 2.2137, demonyms: ['french'] },
    'germany':         { lat: 51.1657, lng: 10.4515, demonyms: ['german', 'germans'] },
    'italy':           { lat: 41.8719, lng: 12.5674, demonyms: ['italian', 'italians'] },
    'spain':           { lat: 40.4637, lng: -3.7492, demonyms: ['spanish', 'spaniard', 'spaniards'] },
    'portugal':        { lat: 39.3999, lng: -8.2245, demonyms: ['portuguese'] },
    'netherlands':     { lat: 52.1326, lng: 5.2913, aliases: ['holland'], demonyms: ['dutch', 'netherlander', 'nederlander'] },
    'belgium':         { lat: 50.5039, lng: 4.4699, demonyms: ['belgian', 'belgians'] },
    'luxembourg':      { lat: 49.8153, lng: 6.1296, demonyms: ['luxembourger', 'luxembourgers'] },
    'switzerland':     { lat: 46.8182, lng: 8.2275, demonyms: ['swiss'] },
    'austria':         { lat: 47.5162, lng: 14.5501, demonyms: ['austrian', 'austrians'] },
    'denmark':         { lat: 56.2639, lng: 9.5018, demonyms: ['danish', 'dane', 'danes'] },
    'sweden':          { lat: 60.1282, lng: 18.6435, demonyms: ['swedish', 'swede', 'swedes'] },
    'norway':          { lat: 60.4720, lng: 8.4689, demonyms: ['norwegian', 'norwegians'] },
    'finland':         { lat: 61.9241, lng: 25.7482, demonyms: ['finnish', 'finn', 'finns'] },
    'iceland':         { lat: 64.9631, lng: -19.0208, demonyms: ['icelandic', 'icelander', 'icelanders'] },
    'ireland':         { lat: 53.1424, lng: -7.6921, demonyms: ['irish'] },
    'poland':          { lat: 51.9194, lng: 19.1451, demonyms: ['polish', 'pole', 'poles'] },
    'czech republic':  { lat: 49.8175, lng: 15.4730, aliases: ['czechia', 'czech'], demonyms: ['czech', 'czechs'] },
    'slovakia':        { lat: 48.6690, lng: 19.6990, demonyms: ['slovak', 'slovaks'] },
    'hungary':         { lat: 47.1625, lng: 19.5033, demonyms: ['hungarian', 'hungarians'] },
    'romania':         { lat: 45.9432, lng: 24.9668, demonyms: ['romanian', 'romanians'] },
    'bulgaria':        { lat: 42.7339, lng: 25.4858, demonyms: ['bulgarian', 'bulgarians'] },
    'serbia':          { lat: 44.0165, lng: 21.0059, demonyms: ['serbian', 'serbians', 'serb', 'serbs'] },
    'croatia':         { lat: 45.1000, lng: 15.2000, demonyms: ['croatian', 'croatians', 'croat', 'croats'] },
    'slovenia':        { lat: 46.1512, lng: 14.9955, demonyms: ['slovenian', 'slovenians', 'slovene', 'slovenes'] },
    'bosnia':          { lat: 43.9159, lng: 17.6791, aliases: ['bosnia and herzegovina', 'bosnia & herzegovina'], demonyms: ['bosnian', 'bosnians'] },
    'montenegro':      { lat: 42.7087, lng: 19.3744, demonyms: ['montenegrin', 'montenegrins'] },
    'north macedonia': { lat: 41.6086, lng: 21.7453, aliases: ['macedonia'], demonyms: ['macedonian', 'macedonians'] },
    'albania':         { lat: 41.1533, lng: 20.1683, demonyms: ['albanian', 'albanians'] },
    'kosovo':          { lat: 42.6026, lng: 20.9030, demonyms: ['kosovar', 'kosovars'] },
    'greece':          { lat: 39.0742, lng: 21.8243, demonyms: ['greek', 'greeks'] },
    'turkey':          { lat: 38.9637, lng: 35.2433, aliases: ['türkiye'], demonyms: ['turkish', 'turk', 'turks'] },
    'ukraine':         { lat: 48.3794, lng: 31.1656, demonyms: ['ukrainian', 'ukrainians'] },
    'russia':          { lat: 61.5240, lng: 105.3188, aliases: ['russian federation'], demonyms: ['russian', 'russians'] },
    'belarus':         { lat: 53.7098, lng: 27.9534, aliases: ['byelorussia'], demonyms: ['belarusian', 'belarusians', 'belarussian'] },
    'moldova':         { lat: 47.4116, lng: 28.3699, demonyms: ['moldovan', 'moldovans'] },
    'estonia':         { lat: 58.5953, lng: 25.0136, demonyms: ['estonian', 'estonians'] },
    'latvia':          { lat: 56.8796, lng: 24.6032, demonyms: ['latvian', 'latvians'] },
    'lithuania':       { lat: 55.1694, lng: 23.8813, demonyms: ['lithuanian', 'lithuanians'] },
    'malta':           { lat: 35.9375, lng: 14.3754, demonyms: ['maltese'] },
    'cyprus':          { lat: 35.1264, lng: 33.4299, demonyms: ['cypriot', 'cypriots'] },

    // ── Middle East ──
    'israel':          { lat: 31.0461, lng: 34.8516, demonyms: ['israeli', 'israelis'] },
    'palestine':       { lat: 31.9522, lng: 35.2332, aliases: ['west bank', 'palestinian territories'], demonyms: ['palestinian', 'palestinians'] },
    'gaza':            { lat: 31.3547, lng: 34.3088, aliases: ['gaza strip'] },
    'lebanon':         { lat: 33.8547, lng: 35.8623, demonyms: ['lebanese'] },
    'syria':           { lat: 34.8021, lng: 38.9968, demonyms: ['syrian', 'syrians'] },
    'jordan':          { lat: 30.5852, lng: 36.2384, demonyms: ['jordanian', 'jordanians'] },
    'iraq':            { lat: 33.2232, lng: 43.6793, demonyms: ['iraqi', 'iraqis'] },
    'iran':            { lat: 32.4279, lng: 53.6880, aliases: ['persia'], demonyms: ['iranian', 'iranians', 'persian', 'persians'] },
    'saudi arabia':    { lat: 23.8859, lng: 45.0792, demonyms: ['saudi', 'saudis', 'saudi arabian', 'saudi arabians'] },
    'yemen':           { lat: 15.5527, lng: 48.5164, demonyms: ['yemeni', 'yemenis'] },
    'oman':            { lat: 21.4735, lng: 55.9754, demonyms: ['omani', 'omanis'] },
    'uae':             { lat: 23.4241, lng: 53.8478, aliases: ['united arab emirates', 'emirates'], demonyms: ['emirati', 'emiratis'] },
    'qatar':           { lat: 25.3548, lng: 51.1839, demonyms: ['qatari', 'qataris'] },
    'bahrain':         { lat: 25.9304, lng: 50.6378, demonyms: ['bahraini', 'bahrainis'] },
    'kuwait':          { lat: 29.3117, lng: 47.4818, demonyms: ['kuwaiti', 'kuwaitis'] },
    'afghanistan':     { lat: 33.9391, lng: 67.7100, demonyms: ['afghan', 'afghans'] },
    'hamas':           { lat: 31.3547, lng: 34.3088 },
    'hezbollah':       { lat: 33.2705, lng: 35.2038 },
    'houthi':          { lat: 15.3694, lng: 44.1910, aliases: ['houthis', 'ansar allah'] },

    // ── Asia ──
    'china':           { lat: 35.8617, lng: 104.1954, aliases: ['prc', "people's republic of china"], demonyms: ['chinese'] },
    'taiwan':          { lat: 23.6978, lng: 120.9605, aliases: ['republic of china'], demonyms: ['taiwanese'] },
    'hong kong':       { lat: 22.3193, lng: 114.1694, demonyms: ['hongkonger', 'hongkongers'] },
    'japan':           { lat: 36.2048, lng: 138.2529, demonyms: ['japanese'] },
    'south korea':     { lat: 35.9078, lng: 127.7669, aliases: ['korea', 'rok'], demonyms: ['south korean', 'south koreans', 'korean', 'koreans'] },
    'north korea':     { lat: 40.3399, lng: 127.5101, aliases: ['dprk'], demonyms: ['north korean', 'north koreans'] },
    'mongolia':        { lat: 46.8625, lng: 103.8467, demonyms: ['mongolian', 'mongolians'] },
    'vietnam':         { lat: 14.0583, lng: 108.2772, demonyms: ['vietnamese'] },
    'cambodia':        { lat: 12.5657, lng: 104.9910, demonyms: ['cambodian', 'cambodians', 'khmer'] },
    'laos':            { lat: 19.8563, lng: 102.4955, demonyms: ['lao', 'laotian', 'laotians'] },
    'thailand':        { lat: 15.8700, lng: 100.9925, demonyms: ['thai', 'thais'] },
    'myanmar':         { lat: 21.9162, lng: 95.9560, aliases: ['burma'], demonyms: ['myanmar', 'burmese'] },
    'malaysia':        { lat: 4.2105, lng: 101.9758, demonyms: ['malaysian', 'malaysians'] },
    'singapore':       { lat: 1.3521, lng: 103.8198, demonyms: ['singaporean', 'singaporeans'] },
    'indonesia':       { lat: -0.7893, lng: 113.9213, demonyms: ['indonesian', 'indonesians'] },
    'philippines':     { lat: 12.8797, lng: 121.7740, demonyms: ['filipino', 'filipinos', 'philippine'] },
    'brunei':          { lat: 4.5353, lng: 114.7277, demonyms: ['bruneian', 'bruneians'] },
    'east timor':      { lat: -8.8742, lng: 125.7275, aliases: ['timor-leste'], demonyms: ['timorese'] },
    'india':           { lat: 20.5937, lng: 78.9629, demonyms: ['indian', 'indians'] },
    'pakistan':        { lat: 30.3753, lng: 69.3451, demonyms: ['pakistani', 'pakistanis'] },
    'bangladesh':      { lat: 23.6850, lng: 90.3563, demonyms: ['bangladeshi', 'bangladeshis'] },
    'sri lanka':       { lat: 7.8731, lng: 80.7718, demonyms: ['sri lankan', 'sri lankans'] },
    'nepal':           { lat: 28.3949, lng: 84.1240, demonyms: ['nepali', 'nepalese'] },
    'bhutan':          { lat: 27.5142, lng: 90.4336, demonyms: ['bhutanese'] },
    'maldives':        { lat: 3.2028, lng: 73.2207, demonyms: ['maldivian', 'maldivians'] },
    'uzbekistan':      { lat: 41.3775, lng: 64.5853, demonyms: ['uzbek', 'uzbeks'] },
    'kazakhstan':      { lat: 48.0196, lng: 66.9237, demonyms: ['kazakh', 'kazakhs', 'kazakhstani', 'kazakhstanis'] },
    'kyrgyzstan':      { lat: 41.2044, lng: 74.7661, demonyms: ['kyrgyz', 'kyrgyzstani'] },
    'tajikistan':      { lat: 38.8610, lng: 71.2761, demonyms: ['tajik', 'tajiks'] },
    'turkmenistan':    { lat: 38.9697, lng: 59.5563, demonyms: ['turkmen', 'turkmens'] },
    'azerbaijan':      { lat: 40.1431, lng: 47.5769, demonyms: ['azerbaijani', 'azerbaijanis', 'azeri', 'azeris'] },
    'armenia':         { lat: 40.0691, lng: 45.0382, demonyms: ['armenian', 'armenians'] },
    'georgia':         { lat: 42.3154, lng: 43.3569, demonyms: ['georgian', 'georgians'] },

    // ── Africa ──
    'nigeria':         { lat: 9.0820, lng: 8.6753, demonyms: ['nigerian', 'nigerians'] },
    'ethiopia':        { lat: 9.1450, lng: 40.4897, demonyms: ['ethiopian', 'ethiopians'] },
    'egypt':           { lat: 26.8206, lng: 30.8025, demonyms: ['egyptian', 'egyptians'] },
    'tanzania':        { lat: -6.3690, lng: 34.8888, demonyms: ['tanzanian', 'tanzanians'] },
    'kenya':           { lat: -0.0236, lng: 37.9062, demonyms: ['kenyan', 'kenyans'] },
    'south africa':    { lat: -30.5595, lng: 22.9375, demonyms: ['south african', 'south africans'] },
    'uganda':          { lat: 1.3733, lng: 32.2903, demonyms: ['ugandan', 'ugandans'] },
    'algeria':         { lat: 28.0339, lng: 1.6596, demonyms: ['algerian', 'algerians'] },
    'morocco':         { lat: 31.7917, lng: -7.0926, demonyms: ['moroccan', 'moroccans'] },
    'ghana':           { lat: 7.9465, lng: -1.0232, demonyms: ['ghanaian', 'ghanaians'] },
    'mozambique':      { lat: -18.6657, lng: 35.5296, demonyms: ['mozambican', 'mozambicans'] },
    'madagascar':      { lat: -18.7669, lng: 46.8691, demonyms: ['malagasy', 'madagascan'] },
    'ivory coast':     { lat: 7.5400, lng: -5.5471, aliases: ["côte d'ivoire", 'cote divoire'], demonyms: ['ivorian', 'ivorians'] },
    'cameroon':        { lat: 3.8480, lng: 11.5021, demonyms: ['cameroonian', 'cameroonians'] },
    'angola':          { lat: -11.2027, lng: 17.8739, demonyms: ['angolan', 'angolans'] },
    'zimbabwe':        { lat: -19.0154, lng: 29.1549, demonyms: ['zimbabwean', 'zimbabweans'] },
    'zambia':          { lat: -13.1339, lng: 27.8493, demonyms: ['zambian', 'zambians'] },
    'malawi':          { lat: -13.2543, lng: 34.3015, demonyms: ['malawian', 'malawians'] },
    'senegal':         { lat: 14.4974, lng: -14.4524, demonyms: ['senegalese'] },
    'mali':            { lat: 17.5707, lng: -3.9962, demonyms: ['malian', 'malians'] },
    'guinea':          { lat: 9.9456, lng: -11.3247, demonyms: ['guinean', 'guineans'] },
    'burkina faso':    { lat: 12.3640, lng: -1.5275, demonyms: ['burkinabé', 'burkinabe'] },
    'niger':           { lat: 17.6078, lng: 8.0817, demonyms: ['nigerien', 'nigeriens'] },
    'chad':            { lat: 15.4542, lng: 18.7322, demonyms: ['chadian', 'chadians'] },
    'sudan':           { lat: 12.8628, lng: 30.2176, demonyms: ['sudanese'] },
    'south sudan':     { lat: 6.8770, lng: 31.3070, demonyms: ['south sudanese'] },
    'somalia':         { lat: 5.1521, lng: 46.1996, demonyms: ['somali', 'somalis'] },
    'democratic republic of congo': { lat: -4.0383, lng: 21.7587, aliases: ['dr congo', 'drc', 'congo-kinshasa', 'zaire'], demonyms: ['congolese'] },
    'republic of congo': { lat: -0.2280, lng: 15.8277, aliases: ['congo', 'congo-brazzaville'], demonyms: ['congolese'] },
    'rwanda':          { lat: -1.9403, lng: 29.8739, demonyms: ['rwandan', 'rwandans'] },
    'burundi':         { lat: -3.3731, lng: 29.9189, demonyms: ['burundian', 'burundians'] },
    'eritrea':         { lat: 15.1794, lng: 39.7823, demonyms: ['eritrean', 'eritreans'] },
    'djibouti':        { lat: 11.8251, lng: 42.5903, demonyms: ['djiboutian', 'djiboutians'] },
    'libya':           { lat: 26.3351, lng: 17.2283, demonyms: ['libyan', 'libyans'] },
    'tunisia':         { lat: 33.8869, lng: 9.5375, demonyms: ['tunisian', 'tunisians'] },
    'togo':            { lat: 8.6195, lng: 0.8248, demonyms: ['togolese'] },
    'benin':           { lat: 9.3077, lng: 2.3158, demonyms: ['beninese'] },
    'gabon':           { lat: -0.8037, lng: 11.6094, demonyms: ['gabonese'] },
    'equatorial guinea': { lat: 1.6508, lng: 10.2679, demonyms: ['equatoguinean', 'equatoguineans'] },
    'central african republic': { lat: 6.6111, lng: 20.9394, aliases: ['car'], demonyms: ['central african', 'central africans'] },
    'namibia':         { lat: -22.9576, lng: 18.4904, demonyms: ['namibian', 'namibians'] },
    'botswana':        { lat: -22.3285, lng: 24.6849, demonyms: ['motswana', 'batswana', 'botswanan', 'botswanans'] },
    'lesotho':         { lat: -29.6100, lng: 28.2336, demonyms: ['mosotho', 'basotho', 'lesothan', 'lesothans'] },
    'eswatini':        { lat: -26.5225, lng: 31.4659, aliases: ['swaziland'], demonyms: ['swazi', 'swazis'] },
    'sierra leone':    { lat: 8.4606, lng: -11.7799, demonyms: ['sierra leonean', 'sierra leoneans'] },
    'liberia':         { lat: 6.4281, lng: -9.4295, demonyms: ['liberian', 'liberians'] },

    // ── Oceania ──
    'australia':       { lat: -25.2744, lng: 133.7751, demonyms: ['australian', 'australians', 'aussie', 'aussies'] },
    'new zealand':     { lat: -40.9006, lng: 174.8860, demonyms: ['new zealander', 'new zealanders', 'kiwi', 'kiwis'] },
    'papua new guinea': { lat: -6.3150, lng: 143.9555, demonyms: ['papua new guinean', 'papua new guineans'] },
    'fiji':            { lat: -17.7134, lng: 178.0650, demonyms: ['fijian', 'fijians'] },
    'solomon islands': { lat: -9.6457, lng: 160.1562, demonyms: ['solomon islander', 'solomon islanders'] },
    'vanuatu':         { lat: -15.3767, lng: 166.9592, demonyms: ['vanuatuan', 'vanuatuans'] },
    'samoa':           { lat: -13.7590, lng: -172.1046, demonyms: ['samoan', 'samoans'] },
    'tonga':           { lat: -21.1789, lng: -175.1982, demonyms: ['tongan', 'tongans'] },
    'kiribati':        { lat: -3.3704, lng: -168.7340, demonyms: ['i-kiribati'] },
    'micronesia':      { lat: 7.4256, lng: 150.5508, demonyms: ['micronesian', 'micronesians'] },
    'palau':           { lat: 7.5150, lng: 134.5825, demonyms: ['palauan', 'palauans'] },
    'marshall islands': { lat: 7.1315, lng: 171.1845, demonyms: ['marshallese'] },
    'nauru':           { lat: -0.5228, lng: 166.9315, demonyms: ['nauruan', 'nauruans'] },
    'tuvalu':          { lat: -7.1095, lng: 179.1940, demonyms: ['tuvaluan', 'tuvaluans'] },
};

// ---------------------------------------------------------------------------
// 10. ORGANIZATIONS
// ---------------------------------------------------------------------------
const ORG_LOCATIONS: Record<string, { lat: number; lng: number }> = {
    'nato':           { lat: 50.879, lng: 4.426 },
    'european union': { lat: 50.8503, lng: 4.3517 },
    'eu ':            { lat: 50.8503, lng: 4.3517 },
    'united nations': { lat: 40.7489, lng: -73.9680 },
    'un ':            { lat: 40.7489, lng: -73.9680 },
    'who ':           { lat: 46.2232, lng: 6.1400 },
    'world health organization': { lat: 46.2232, lng: 6.1400 },
    'world bank':     { lat: 38.8993, lng: -77.0440 },
    'imf ':           { lat: 38.8993, lng: -77.0450 },
    'international monetary fund': { lat: 38.8993, lng: -77.0450 },
    'g7':             { lat: 50.8503, lng: 4.3517 },
    'g20':            { lat: 48.8566, lng: 2.3522 },
    'opec':           { lat: 48.2082, lng: 16.3738 },
    'pentagon':       { lat: 38.8719, lng: -77.0563 },
    'white house':    { lat: 38.8977, lng: -77.0365 },
    'kremlin':        { lat: 55.7520, lng: 37.6175 },
    'iaea':           { lat: 48.2370, lng: 16.4170 },
    'interpol':       { lat: 45.7597, lng: 4.8422 },
    'hamas':          { lat: 31.3547, lng: 34.3088 },
    'hezbollah':      { lat: 33.2705, lng: 35.2038 },
    'isis':           { lat: 33.2232, lng: 43.6793 },
    'isil':           { lat: 33.2232, lng: 43.6793 },
    'al-qaeda':       { lat: 33.9391, lng: 67.7100 },
    'taliban':        { lat: 31.6289, lng: 65.7372 },
    'boko haram':     { lat: 11.9964, lng: 8.5167 },
    'al-shabaab':     { lat: 2.0469, lng: 45.3182 },
    'wagner':         { lat: 61.5240, lng: 105.3188 },
    'idf':            { lat: 31.0461, lng: 34.8516 },
};

// ---------------------------------------------------------------------------
// 11. SOURCE FEED GEOGRAPHIC BIAS
// Used when no location found in text, to bias AI or fallback coordinates
// ---------------------------------------------------------------------------
export const FEED_GEOGRAPHIC_BIAS: Record<string, ResolvedLocation> = {
    'Channel News Asia': { name: 'Singapore', coords: { lat: 1.3521, lng: 103.8198 }, confidence: 'source_bias' },
    'NHK World':         { name: 'Japan', coords: { lat: 36.2048, lng: 138.2529 }, confidence: 'source_bias' },
    'SCMP':              { name: 'Hong Kong', coords: { lat: 22.3193, lng: 114.1694 }, confidence: 'source_bias' },
    'Times of India':    { name: 'India', coords: { lat: 20.5937, lng: 78.9629 }, confidence: 'source_bias' },
    'Al Jazeera':        { name: 'Middle East', coords: { lat: 29.2985, lng: 42.5510 }, confidence: 'source_bias' },
    'Jerusalem Post':    { name: 'Israel', coords: { lat: 31.0461, lng: 34.8516 }, confidence: 'source_bias' },
    'Arab News':         { name: 'Saudi Arabia', coords: { lat: 23.8859, lng: 45.0792 }, confidence: 'source_bias' },
    'Kyiv Independent':  { name: 'Ukraine', coords: { lat: 48.3794, lng: 31.1656 }, confidence: 'source_bias' },
    'The Moscow Times':  { name: 'Russia', coords: { lat: 61.5240, lng: 105.3188 }, confidence: 'source_bias' },
    'BBC Brasil':        { name: 'Brazil', coords: { lat: -14.2350, lng: -51.9253 }, confidence: 'source_bias' },
    'Folha de S.Paulo (Mundo)': { name: 'Brazil', coords: { lat: -14.2350, lng: -51.9253 }, confidence: 'source_bias' },
    'G1 (Mundo)':        { name: 'Brazil', coords: { lat: -14.2350, lng: -51.9253 }, confidence: 'source_bias' },
    'BBC World':         { name: 'Global', coords: { lat: 51.5074, lng: -0.1278 }, confidence: 'source_bias' },
    'AllAfrica':         { name: 'Africa', coords: { lat: -8.7832, lng: 34.5085 }, confidence: 'source_bias' },
    'News24 SA':         { name: 'South Africa', coords: { lat: -30.5595, lng: 22.9375 }, confidence: 'source_bias' },
    'The Star Kenya':    { name: 'Kenya', coords: { lat: -0.0236, lng: 37.9062 }, confidence: 'source_bias' },
    'MercoPress':        { name: 'South America', coords: { lat: -22.0, lng: -60.0 }, confidence: 'source_bias' },
    'Buenos Aires Times': { name: 'Argentina', coords: { lat: -38.4161, lng: -63.6167 }, confidence: 'source_bias' },
};

// ---------------------------------------------------------------------------
// Build a flat search index (key → ResolvedLocation + confidence)
// ---------------------------------------------------------------------------
interface IndexEntry {
    key: string; // lowercase search key
    name: string;
    coords: { lat: number; lng: number };
    confidence: LocationConfidence;
}

function buildIndex(): IndexEntry[] {
    const entries: IndexEntry[] = [];

    const addEntry = (key: string, name: string, coords: { lat: number; lng: number }, confidence: LocationConfidence) => {
        if (key && key.trim().length > 0) {
            entries.push({ key: key.toLowerCase().trim(), name, coords, confidence });
        }
    };

    // Cities (highest confidence)
    for (const [name, data] of Object.entries(CITY_LOCATIONS)) {
        addEntry(name, name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), data, 'city');
        if (data.aliases) data.aliases.forEach(a => addEntry(a, data.aliases![0] || name, data, 'city'));
    }

    // States / Regions
    for (const [name, data] of Object.entries(US_STATES)) {
        addEntry(name, name.charAt(0).toUpperCase() + name.slice(1), data, 'region');
    }
    for (const [name, data] of Object.entries(BRAZIL_STATES)) {
        addEntry(name, name.charAt(0).toUpperCase() + name.slice(1), data, 'region');
    }
    for (const [name, data] of Object.entries(INDIA_STATES)) {
        addEntry(name, name.charAt(0).toUpperCase() + name.slice(1), data, 'region');
    }
    for (const [name, data] of Object.entries(CHINA_PROVINCES)) {
        addEntry(name, name.charAt(0).toUpperCase() + name.slice(1), data, 'region');
    }
    for (const [name, data] of Object.entries(RUSSIA_REGIONS)) {
        addEntry(name, name.charAt(0).toUpperCase() + name.slice(1), data, 'region');
    }
    for (const [name, data] of Object.entries(AUSTRALIA_STATES)) {
        addEntry(name, name.charAt(0).toUpperCase() + name.slice(1), data, 'region');
    }
    for (const [name, data] of Object.entries(CANADA_PROVINCES)) {
        addEntry(name, name.charAt(0).toUpperCase() + name.slice(1), data, 'region');
    }

    // Countries (with aliases + demonyms)
    for (const [name, data] of Object.entries(COUNTRY_LOCATIONS)) {
        const displayName = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        addEntry(name, displayName, data, 'country');
        if (data.aliases) data.aliases.forEach(a => addEntry(a, displayName, data, 'country'));
        if (data.demonyms) data.demonyms.forEach(d => addEntry(d, displayName, data, 'country'));
        if (data.capital) addEntry(data.capital, data.capital.charAt(0).toUpperCase() + data.capital.slice(1), data.capitalCoords || data, 'city');
    }

    // Organizations
    for (const [name, coords] of Object.entries(ORG_LOCATIONS)) {
        addEntry(name, name.toUpperCase().trim(), coords, 'org');
    }

    // Sort by: (1) confidence level first — cities beat regions beat countries beat orgs,
    //         (2) then key length descending within same level (longest match first)
    // This ensures "Rafah" (city, 5) beats "Israeli" (country-demonym, 7)
    const CONFIDENCE_ORDER: Record<LocationConfidence, number> = {
        city: 0, region: 1, country: 2, org: 3, source_bias: 4
    };
    entries.sort((a, b) => {
        const cmpConf = CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence];
        if (cmpConf !== 0) return cmpConf;
        return b.key.length - a.key.length;
    });

    return entries;
}

// Build index once at module load
const LOCATION_INDEX: IndexEntry[] = buildIndex();

// ---------------------------------------------------------------------------
// SPECIFIC OVERRIDES (multi-entity mentions → midpoint logic)
// ---------------------------------------------------------------------------
const OVERRIDES: Array<{ keywords: string[]; result: ResolvedLocation }> = [
    {
        keywords: ['russia', 'nato'],
        result: { name: 'Russia-NATO Border', coords: { lat: 55.0, lng: 30.0 }, confidence: 'region' }
    },
    {
        keywords: ['china', 'taiwan'],
        result: { name: 'Taiwan Strait', coords: { lat: 24.5, lng: 119.5 }, confidence: 'region' }
    },
    {
        keywords: ['israel', 'iran'],
        result: { name: 'Israel-Iran', coords: { lat: 33.0, lng: 38.0 }, confidence: 'region' }
    },
    {
        keywords: ['india', 'pakistan'],
        result: { name: 'India-Pakistan Border', coords: { lat: 30.0, lng: 73.0 }, confidence: 'region' }
    },
    {
        keywords: ['north korea', 'south korea'],
        result: { name: 'Korean Peninsula', coords: { lat: 38.3, lng: 127.5 }, confidence: 'region' }
    },
    {
        keywords: ['ukraine', 'russia'],
        result: { name: 'Ukraine-Russia', coords: { lat: 48.5, lng: 33.0 }, confidence: 'region' }
    },
    {
        keywords: ['gaza', 'israel'],
        result: { name: 'Gaza-Israel', coords: { lat: 31.4, lng: 34.4 }, confidence: 'city' }
    },
    {
        keywords: ['black sea'],
        result: { name: 'Black Sea', coords: { lat: 43.0, lng: 34.0 }, confidence: 'region' }
    },
    {
        keywords: ['red sea'],
        result: { name: 'Red Sea', coords: { lat: 20.0, lng: 38.5 }, confidence: 'region' }
    },
    {
        keywords: ['south china sea'],
        result: { name: 'South China Sea', coords: { lat: 15.0, lng: 115.0 }, confidence: 'region' }
    },
    {
        keywords: ['strait of hormuz'],
        result: { name: 'Strait of Hormuz', coords: { lat: 26.6, lng: 56.3 }, confidence: 'region' }
    },
    {
        keywords: ['suez canal'],
        result: { name: 'Suez Canal', coords: { lat: 30.7, lng: 32.3 }, confidence: 'city' }
    },
];

// ---------------------------------------------------------------------------
// Portuguese/Spanish keyword aliases → English equivalents
// Allows the resolver to work on non-English articles
// ---------------------------------------------------------------------------
const LOCALIZED_ALIASES: Array<[RegExp, string]> = [
    // Portuguese country names / demonyms
    [/\birã\b/i, 'iran'],
    [/\biraque\b/i, 'iraq'],         // PT: "Iraque" = Iraq
    [/\biranianos?\b/i, 'iranian'],
    [/\bisraelenses?\b/i, 'israeli'],
    [/\brussa?\b/i, 'russia'],
    [/\brussos?\b/i, 'russian'],
    [/\bucrânia\b/i, 'ukraine'],
    [/\bucranianos?\b/i, 'ukrainian'],
    [/\bchineses?\b/i, 'chinese'],
    [/\bfranceses?\b/i, 'french'],
    [/\balemão\b|\balemães\b/i, 'german'],
    [/\binglaterra\b/i, 'united kingdom'],
    [/\bbritânicos?\b/i, 'british'],
    [/\bamericanos?\b/i, 'american'],
    [/\bsirios?\b|\bsírios?\b/i, 'syrian'],
    [/\bpalestinos?\b/i, 'palestinian'],
    [/\blibaneses?\b/i, 'lebanese'],
    [/\biraquianos?\b/i, 'iraqi'],
    [/\byemenitas?\b/i, 'yemeni'],
    [/\bsauditas?\b/i, 'saudi'],
    [/\bturcos?\b|\bturcas?\b/i, 'turkish'],
    [/\bpaquistaneses?\b/i, 'pakistani'],
    [/\bindiano?s?\b/i, 'indian'],
    [/\bnorte-coreanos?\b/i, 'north korean'],
    [/\bsul-coreanos?\b/i, 'south korean'],
    [/\bjaponeses?\b/i, 'japanese'],
    [/\bafegãos?\b|\bafegãos?\b/i, 'afghan'],
    [/\blibianos?\b/i, 'libyan'],
    [/\begípcios?\b/i, 'egyptian'],
    [/\bsudaneses?\b/i, 'sudanese'],
    [/\betiopes?\b|\betiópios?\b/i, 'ethiopian'],
    [/\bsomalis?\b/i, 'somali'],
    [/\bcongoleses?\b/i, 'congolese'],
    [/\bnigeriano?s?\b/i, 'nigerian'],
    [/\bquenianos?\b/i, 'kenyan'],
    [/\bsul-africanos?\b/i, 'south african'],
    [/\bvenezuelanos?\b/i, 'venezuelan'],
    [/\bcolombiano?s?\b/i, 'colombian'],
    [/\bperuan[ao]s?\b/i, 'peruvian'],
    [/\bargentinos?\b/i, 'argentine'],
    [/\bmexicanos?\b/i, 'mexican'],
    // Spanish demonyms
    [/\bisraelíes?\b/i, 'israeli'],
    [/\biraquíes?\b|\biraquís?\b/i, 'iraqi'],
    [/\balemanes?\b/i, 'german'],
    [/\bfranceses?\b/i, 'french'],
    [/\bbritánicos?\b/i, 'british'],
    [/\brusos?\b/i, 'russian'],
    [/\bucraniano?s?\b/i, 'ukrainian'],
    [/\bchinos?\b/i, 'chinese'],

    // ── Portuguese country names (differ from English) ──
    [/\bsíria\b|\bsiria\b/i, 'syria'],                          // PT: Síria
    [/\blíbano\b|\blibano\b/i, 'lebanon'],                      // PT: Líbano
    [/\bturquia\b/i, 'turkey'],                                  // PT: Turquia
    [/\begito\b/i, 'egypt'],                                     // PT: Egito
    [/\betiópia\b|\betiopia\b/i, 'ethiopia'],                   // PT: Etiópia
    [/\blíbia\b/i, 'libya'],                                     // PT: Líbia
    [/\bjapão\b/i, 'japan'],                                     // PT: Japão
    [/\barábia\s+saudita\b/i, 'saudi arabia'],                  // PT: Arábia Saudita
    [/\biêmen\b/i, 'yemen'],                                     // PT: Iêmen
    [/\bcoreia\s+do\s+norte\b/i, 'north korea'],                // PT: Coreia do Norte
    [/\bcoreia\s+do\s+sul\b/i, 'south korea'],                  // PT: Coreia do Sul
    [/\bsudão\b/i, 'sudan'],                                     // PT: Sudão
    [/\bargélia\b|\bargelia\b/i, 'algeria'],                    // PT: Argélia
    [/\bmarrocos\b/i, 'morocco'],                               // PT: Marrocos
    [/\bmianmar\b/i, 'myanmar'],                                 // PT: Mianmar
    [/\btailândia\b|\btailandia\b/i, 'thailand'],               // PT: Tailândia
    [/\bfilipinas\b/i, 'philippines'],                          // PT: Filipinas
    [/\bpaquistão\b|\bpaquistao\b/i, 'pakistan'],               // PT: Paquistão
    [/\bafeganistão\b|\bafeganistao\b/i, 'afghanistan'],        // PT: Afeganistão
    [/\bcazaquistão\b|\bcazaquistao\b/i, 'kazakhstan'],         // PT: Cazaquistão
    [/\bazerbeijão\b|\bazerbaijão\b|\bazerbeijao\b/i, 'azerbaijan'], // PT: Azerbaijão
    [/\barmênia\b/i, 'armenia'],                                // PT: Armênia
    [/\bcolômbia\b/i, 'colombia'],                              // PT: Colômbia
    [/\bbolívia\b/i, 'bolivia'],                                // PT: Bolívia
    [/\bparaguai\b/i, 'paraguay'],                              // PT: Paraguai
    [/\buruguai\b/i, 'uruguay'],                                // PT: Uruguai
    [/\bpalestina\b/i, 'palestine'],                            // PT/ES/FR: Palestina
    [/\bmoçambique\b/i, 'mozambique'],                          // PT: Moçambique
    [/\btanzânia\b|\btanzania\b/i, 'tanzania'],                 // PT: Tanzânia
    [/\bruanda\b/i, 'rwanda'],                                  // PT: Ruanda
    [/\bzimbábue\b|\bzimbabue\b/i, 'zimbabwe'],                 // PT: Zimbábue
    [/\bquênia\b|\bquenia\b/i, 'kenya'],                        // PT: Quênia
    [/\bcoréia\b|\bcoreia\b/i, 'korea'],                        // PT: Coréia (generic)

    // ── Portuguese city/place names ──
    [/\bbagdá\b|\bbagdade\b/i, 'baghdad'],                      // PT: Bagdá / Bagdade
    [/\bmoscou\b/i, 'moscow'],                                   // PT/FR: Moscou
    [/\bpequim\b/i, 'beijing'],                                  // PT: Pequim
    [/\bteerã\b|\bteerao\b/i, 'tehran'],                        // PT: Teerã
    [/\bdamasco\b/i, 'damascus'],                               // PT/ES: Damasco
    [/\bcabul\b/i, 'kabul'],                                     // PT: Cabul
    [/\balepo\b/i, 'aleppo'],                                    // PT/ES: Alepo

    // ── Spanish country names ──
    [/\bturquía\b/i, 'turkey'],                                  // ES: Turquía
    [/\blibia\b/i, 'libya'],                                     // ES: Libia
    [/\bargelia\b/i, 'algeria'],                                  // ES: Argelia
    [/\bmarruecos\b/i, 'morocco'],                              // ES: Marruecos
    [/\betiopía\b/i, 'ethiopia'],                               // ES: Etiopía
    [/\bafganistán\b|\bafganistan\b/i, 'afghanistan'],          // ES: Afganistán
    [/\bpakistán\b/i, 'pakistan'],                               // ES: Pakistán
    [/\bcorea\s+del\s+norte\b/i, 'north korea'],                // ES: Corea del Norte
    [/\bcorea\s+del\s+sur\b/i, 'south korea'],                  // ES: Corea del Sur
    [/\bsudán\b/i, 'sudan'],                                     // ES: Sudán
    [/\bkenia\b/i, 'kenya'],                                     // ES: Kenia
    [/\birán\b/i, 'iran'],                                       // ES: Irán

    // ── Spanish city names ──
    [/\bmoscú\b|\bmoscu\b/i, 'moscow'],                         // ES: Moscú
    [/\bpekín\b|\bpekin\b/i, 'beijing'],                        // ES: Pekín
    [/\bseúl\b|\bseul\b/i, 'seoul'],                            // ES: Seúl

    // ── French country names ──
    [/\brussie\b/i, 'russia'],                                   // FR: Russie
    [/\bchine\b/i, 'china'],                                     // FR: Chine
    [/\bsyrie\b/i, 'syria'],                                     // FR: Syrie
    [/\bturquie\b/i, 'turkey'],                                  // FR: Turquie
    [/\bégypte\b|\begypte\b/i, 'egypt'],                        // FR: Égypte
    [/\bliban\b/i, 'lebanon'],                                   // FR: Liban
    [/\byémen\b/i, 'yemen'],                                     // FR: Yémen
    [/\barabie\s+saoudite\b/i, 'saudi arabia'],                 // FR: Arabie saoudite
    [/\blibye\b/i, 'libya'],                                     // FR: Libye
    [/\balgérie\b|\balgerie\b/i, 'algeria'],                    // FR: Algérie
    [/\bmaroc\b/i, 'morocco'],                                   // FR: Maroc
    [/\bcoree\s+du\s+nord\b/i, 'north korea'],                  // FR: Corée du Nord
    [/\bcoree\s+du\s+sud\b/i, 'south korea'],                   // FR: Corée du Sud
    [/\bsoudan\b/i, 'sudan'],                                    // FR: Soudan

    // ── French city names ──
    [/\bpékin\b/i, 'beijing'],                                   // FR: Pékin
    [/\bséoul\b/i, 'seoul'],                                     // FR: Séoul
    [/\btéhéran\b|\btehéran\b/i, 'tehran'],                     // FR: Téhéran

    // ── German country names ──
    [/\brussland\b/i, 'russia'],                                 // DE: Russland
    [/\bsyrien\b/i, 'syria'],                                    // DE: Syrien
    [/\btürkei\b|\bturkei\b/i, 'turkey'],                       // DE: Türkei
    [/\bägypten\b|\bagypten\b/i, 'egypt'],                      // DE: Ägypten
    [/\bjemen\b/i, 'yemen'],                                     // DE: Jemen
    [/\blibanon\b/i, 'lebanon'],                                 // DE: Libanon
    [/\bsudán\b|\bsudan\b/i, 'sudan'],                          // DE: Sudan

    // ── German city names ──
    [/\bmoskau\b/i, 'moscow'],                                   // DE: Moskau
    [/\bpeking\b/i, 'beijing'],                                  // DE: Peking
    [/\bteheran\b/i, 'tehran'],                                  // DE: Teheran
];

/**
 * Apply localized aliases to a text, translating PT/ES country mentions to English.
 * This allows the English-based keyword index to match non-English articles.
 */
function normalizeToEnglish(text: string): string {
    let result = text;
    for (const [pattern, replacement] of LOCALIZED_ALIASES) {
        result = result.replace(pattern, replacement);
    }
    return result;
}

// ---------------------------------------------------------------------------
// Core single-text search (internal helper)
// ---------------------------------------------------------------------------
function searchSingleText(raw: string): ResolvedLocation | null {
    if (!raw || !raw.trim()) return null;
    const q = normalizeToEnglish(raw).toLowerCase();

    // Check specific overrides (multi-entity conflicts)
    for (const override of OVERRIDES) {
        if (override.keywords.every(kw => q.includes(kw))) {
            return override.result;
        }
    }

    // Search the index (sorted: city > region > country > org, then length desc)
    for (const entry of LOCATION_INDEX) {
        const kLen = entry.key.length;

        if (kLen <= 3) {
            // Word boundary check for short keys (avoids "us" in "virus", "uk" in "duke")
            const regex = new RegExp(`\\b${escapeRegex(entry.key)}\\b`, 'i');
            if (regex.test(q)) {
                return { name: entry.name, coords: entry.coords, confidence: entry.confidence };
            }
        } else {
            if (q.includes(entry.key)) {
                return { name: entry.name, coords: entry.coords, confidence: entry.confidence };
            }
        }
    }

    return null;
}

// ---------------------------------------------------------------------------
// Main resolver function
// ---------------------------------------------------------------------------

/**
 * Resolve a location from news title + description text.
 *
 * Resolution priority:
 *   Phase 1 — TITLE ONLY   (most authoritative: the headline is the primary subject)
 *   Phase 2 — DESCRIPTION  (body text may have incidental location mentions)
 *   Phase 3 — SOURCE BIAS  (feed-level geographic hint as last resort)
 *
 * Why title-first matters:
 *   "Israel ataca assembleia do Irã... [desc mentions Roma]"
 *   → Should return Israel/Iran, NOT Rome (a city in the description)
 *
 * @param title      Article headline
 * @param description Article body snippet
 * @param sourceName  RSS feed name (optional, used for source bias)
 * @returns Resolved location or null
 */
export function resolveLocation(
    title: string,
    description: string,
    sourceName?: string
): ResolvedLocation | null {
    if (!title && !description) return null;

    // PHASE 1: Search title only — cities+regions+countries in the HEADLINE are authoritative
    const titleResult = searchSingleText(title);
    if (titleResult) return titleResult;

    // PHASE 2: Search description — cities still beat regions/countries here
    const descResult = searchSingleText(description);
    if (descResult) return descResult;

    // PHASE 3: Source feed bias (weakest signal — only if text gave nothing)
    if (sourceName && FEED_GEOGRAPHIC_BIAS[sourceName]) {
        return FEED_GEOGRAPHIC_BIAS[sourceName];
    }

    return null;
}

// ---------------------------------------------------------------------------
// Backwards-compatible wrapper (drop-in for extractStaticLocation)
// ---------------------------------------------------------------------------
export function extractStaticLocation(text: string): { name: string; coords: { lat: number; lng: number } } | null {
    const result = resolveLocation(text, '');
    if (!result) return null;
    return { name: result.name, coords: result.coords };
}

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
