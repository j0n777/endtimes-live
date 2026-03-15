import { getActiveYouTubeLiveUrl } from './youtubeLiveFetcher';

export interface LiveCam {
    id: string;
    name: string;
    location: string;
    coordinates: { lat: number; lng: number };
    embedUrl: string;
    type: 'youtube' | 'm3u8';
}

/**
 * CURATED_CAMS — Static list of reliable 24/7 live streams.
 *
 * All entries use `type: 'channel'` with the channel's UC... ID so the embed
 * always routes to whatever the channel is currently streaming — no stale video IDs.
 *
 * Channel IDs can be verified at:  youtube.com/@<handle>/about  (copy from the URL)
 *
 * Middle-East / Conflict-zone entries are prioritised; geographically spread entries follow.
 */
export const CURATED_CAMS: LiveCam[] = [

    // ── Middle East ──────────────────────────────────────────────────────────

    {
        id: 'cam_me_aljazeera',
        name: 'Al Jazeera English — LIVE',
        location: 'Doha, Qatar / Global ME Coverage',
        coordinates: { lat: 25.2854, lng: 51.5310 },
        // Al Jazeera English — 24/7 live, always streaming
        embedUrl: getActiveYouTubeLiveUrl('UCNye-wNBqNL5ZzHSJdN1rZQ'),
        type: 'youtube',
    },
    {
        id: 'cam_me_i24news',
        name: 'i24 NEWS — LIVE (Israel)',
        location: 'Tel Aviv, Israel',
        coordinates: { lat: 32.0853, lng: 34.7818 },
        // i24 NEWS English — Israeli news channel, live 24/7
        embedUrl: getActiveYouTubeLiveUrl('UCvHDpsWKADrDia0c99X37vg'),
        type: 'youtube',
    },
    {
        id: 'cam_me_skynewsarabia',
        name: 'Sky News Arabia — LIVE',
        location: 'Abu Dhabi, UAE',
        coordinates: { lat: 24.4539, lng: 54.3773 },
        // Sky News Arabia — Arabic/ME perspective, 24/7
        embedUrl: getActiveYouTubeLiveUrl('UCIJXOvggjKtCagMfxvcCzAA'),
        type: 'youtube',
    },
    {
        id: 'cam_me_trtworld',
        name: 'TRT World — LIVE',
        location: 'Istanbul, Turkey',
        coordinates: { lat: 41.0082, lng: 28.9784 },
        // TRT World — Turkish state international, strong ME coverage
        embedUrl: getActiveYouTubeLiveUrl('UCuWMLULBCpAWnYzEpGiG-KA'),
        type: 'youtube',
    },
    {
        id: 'cam_me_inquizex',
        name: 'Inquizex OSINT — Conflict Cams',
        location: 'Middle East Frontlines',
        coordinates: { lat: 32.0853, lng: 34.9000 },
        // Inquizex OSINT — aggregates conflict zone camera feeds
        embedUrl: getActiveYouTubeLiveUrl('UCmTGFJH-3FoiGBbRY8bG7Mg'),
        type: 'youtube',
    },
    {
        id: 'cam_me_intelcams',
        name: 'IntelCams OSINT — Middle East',
        location: 'Gaza / Lebanon / Syria',
        coordinates: { lat: 31.5017, lng: 34.4668 },
        // IntelCams OSINT — real-time conflict cameras
        embedUrl: getActiveYouTubeLiveUrl('UCJ0-OtVpF0wOKEqT2Z1HEtA'),
        type: 'youtube',
    },

    // ── Europe & Russia ──────────────────────────────────────────────────────

    {
        id: 'cam_eu_france24',
        name: 'France 24 English — LIVE',
        location: 'Paris, France',
        coordinates: { lat: 48.8566, lng: 2.3522 },
        // France 24 English — 24/7 live
        embedUrl: getActiveYouTubeLiveUrl('UCQfwfsi5VrQ8yKZ-UWmAEFg'),
        type: 'youtube',
    },
    {
        id: 'cam_eu_dwnews',
        name: 'DW News — LIVE',
        location: 'Berlin, Germany',
        coordinates: { lat: 52.5200, lng: 13.4050 },
        // Deutsche Welle News — 24/7 English live
        embedUrl: getActiveYouTubeLiveUrl('UCknLrEdhRCp1aegoMqRaCZg'),
        type: 'youtube',
    },
    {
        id: 'cam_eu_bbcnews',
        name: 'BBC News — LIVE',
        location: 'London, UK',
        coordinates: { lat: 51.5074, lng: -0.1278 },
        // BBC News — 24/7 UK/global news coverage
        embedUrl: getActiveYouTubeLiveUrl('UC16niRr50-MSBwiU3jmlApw'),
        type: 'youtube',
    },
    {
        id: 'cam_ru_earthtv',
        name: 'EarthTV — Global City Cams',
        location: 'Worldwide',
        coordinates: { lat: 51.5072, lng: -0.1276 },
        // EarthTV — continuous global city cam loop
        embedUrl: getActiveYouTubeLiveUrl('UCu1rUYsPi_dMrDlLf4xDlcQ'),
        type: 'youtube',
    },

    // ── Americas ─────────────────────────────────────────────────────────────

    {
        id: 'cam_us_earthcam_tsq',
        name: 'EarthCam — Times Square NYC',
        location: 'New York, USA',
        coordinates: { lat: 40.7580, lng: -73.9855 },
        // EarthCam Times Square — 24/7 webcam
        embedUrl: getActiveYouTubeLiveUrl('UC6qrG3W8SMK0jior2olka3g'),
        type: 'youtube',
    },

    // ── South America ─────────────────────────────────────────────────────────

    {
        id: 'cam_sa_globonews',
        name: 'GloboNews — AO VIVO (Brasil)',
        location: 'São Paulo, Brazil',
        coordinates: { lat: -23.5505, lng: -46.6333 },
        // GloboNews — Brazilian 24/7 news, most-watched SA channel
        embedUrl: getActiveYouTubeLiveUrl('UCK7gScMm0je36KQxJHCn-eQ'),
        type: 'youtube',
    },
    {
        id: 'cam_sa_caracol',
        name: 'Caracol TV — EN VIVO (Colombia)',
        location: 'Bogotá, Colombia',
        coordinates: { lat: 4.7110, lng: -74.0721 },
        // Caracol Televisión — Colombia's #1 news channel, 24/7
        embedUrl: getActiveYouTubeLiveUrl('UCcpE1fmG2qBZatj28bak2ng'),
        type: 'youtube',
    },
    {
        id: 'cam_sa_tvn_chile',
        name: 'TVN 24 Horas — EN VIVO (Chile)',
        location: 'Santiago, Chile',
        coordinates: { lat: -33.4489, lng: -70.6693 },
        // TVN 24 Horas — Chilean public broadcaster, 24/7 live news
        embedUrl: getActiveYouTubeLiveUrl('UCTXNz3gjAypWp3EhlIATEJQ'),
        type: 'youtube',
    },
    {
        id: 'cam_sa_ntn24',
        name: 'NTN24 — EN VIVO (LatAm)',
        location: 'Caracas / Bogotá',
        coordinates: { lat: 10.4806, lng: -66.9036 },
        // NTN24 — pan-Latin American news, covers Venezuela and region, 24/7
        embedUrl: getActiveYouTubeLiveUrl('UCdaQ6ZtPGLHT5p_K3gSBenw'),
        type: 'youtube',
    },

    // ── Asia-Pacific ─────────────────────────────────────────────────────────

    {
        id: 'cam_ap_nhkworld',
        name: 'NHK World — LIVE (Japan)',
        location: 'Tokyo, Japan',
        coordinates: { lat: 35.6762, lng: 139.6503 },
        // NHK World — Japanese public broadcaster, 24/7
        embedUrl: getActiveYouTubeLiveUrl('UCSPEjw8F2nQDtmUKPFNF7_A'),
        type: 'youtube',
    },
    {
        id: 'cam_ap_wion',
        name: 'WION — LIVE (India/Asia)',
        location: 'New Delhi, India',
        coordinates: { lat: 28.6139, lng: 77.2090 },
        // WION — Indian news, Asia/ME focus, 24/7
        embedUrl: getActiveYouTubeLiveUrl('UC_gUM8rL-Lrg6O3adPW9K1g'),
        type: 'youtube',
    },
    {
        id: 'cam_ap_cgtn',
        name: 'CGTN — LIVE (China Global)',
        location: 'Beijing, China',
        coordinates: { lat: 39.9042, lng: 116.4074 },
        // CGTN — Chinese state international news, 24/7
        embedUrl: getActiveYouTubeLiveUrl('UCgrNz-aDmcr2uuto8_DL2jg'),
        type: 'youtube',
    },
    {
        id: 'cam_ap_taiwan',
        name: 'Taiwan News 24/7',
        location: 'Taipei, Taiwan',
        coordinates: { lat: 25.0330, lng: 121.5654 },
        embedUrl: getActiveYouTubeLiveUrl('UChqhcRabEEq-rIeZp2zEDQA'),
        type: 'youtube',
    },
    {
        id: 'cam_ap_korea',
        name: 'Seoul City Live (South Korea)',
        location: 'Seoul, South Korea',
        coordinates: { lat: 37.5665, lng: 126.9780 },
        embedUrl: getActiveYouTubeLiveUrl('UChSqwgH18Gz0UqAXqX12K2A'),
        type: 'youtube',
    },

    // ── Africa ────────────────────────────────────────────────────────────────

    {
        id: 'cam_af_africanews',
        name: 'Africanews — LIVE',
        location: 'Nairobi, Kenya',
        coordinates: { lat: -1.2921, lng: 36.8219 },
        // Africanews — pan-African news, 24/7 English
        embedUrl: getActiveYouTubeLiveUrl('UC1_E8NeF5QHY2dtdLRBCCLA'),
        type: 'youtube',
    },
    {
        id: 'cam_af_aljazeera_arabic',
        name: 'Al Jazeera Arabic — LIVE',
        location: 'Cairo, Egypt',
        coordinates: { lat: 30.0444, lng: 31.2357 },
        // Al Jazeera Arabic — strong North Africa / Middle East coverage
        embedUrl: getActiveYouTubeLiveUrl('UCfiwzLy-8yKzIbsmZTzxDgw'),
        type: 'youtube',
    },
    {
        id: 'cam_af_tv5monde',
        name: 'TV5Monde — LIVE',
        location: 'Dakar, Senegal',
        coordinates: { lat: 14.7167, lng: -17.4677 },
        // TV5Monde — French-language channel with wide Africa bureau coverage
        embedUrl: getActiveYouTubeLiveUrl('UCJsZHPR1jqKu-soDmKNMBFg'),
        type: 'youtube',
    },
];
