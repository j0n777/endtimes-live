import { getActiveYouTubeLiveUrl } from './youtubeLiveFetcher';

export interface LiveCam {
    id: string;
    name: string;
    location: string;
    coordinates: { lat: number; lng: number };
    embedUrl: string; // The dynamically generated embed link
    type: 'youtube' | 'm3u8';
}

export const CURATED_CAMS: LiveCam[] = [
    {
        id: "cam_ukraine_iran_inquizex",
        name: "Middle East & Ukraine Multi-Cam (Inquizex)",
        location: "Kyiv / Tehran / Gaza",
        coordinates: { lat: 35.6892, lng: 51.3890 }, // Centered on Iran for Intel
        embedUrl: getActiveYouTubeLiveUrl("JboXN7CuKxc", "video"), // Inquizex Static Video ID
        type: 'youtube'
    },
    {
        id: "cam_global_intelcams",
        name: "Global Conflict OSINT Cameras",
        location: "Middle East & Ukraine Frontlines",
        coordinates: { lat: 50.4501, lng: 30.5234 }, // Centered on Kyiv
        embedUrl: getActiveYouTubeLiveUrl("4E-iFtUM2kk", "video"), // intelcamslive Static Video ID
        type: 'youtube'
    },
    {
        id: "cam_usa_earthcam",
        name: "EarthCam Times Square",
        location: "New York, USA",
        coordinates: { lat: 40.7580, lng: -73.9855 },
        embedUrl: getActiveYouTubeLiveUrl("1-iS7LArMPA", "video"), // EarthCam 4K Times Square Static Video ID
        type: 'youtube'
    },
    {
        id: "cam_global_earthtv",
        name: "EarthTV Global Cams",
        location: "Worldwide",
        coordinates: { lat: 51.5072, lng: -0.1276 }, // Centered on London as default for EarthTV
        embedUrl: getActiveYouTubeLiveUrl("Fu8vYoIkaeM", "video"), // earthTV Static Video ID
        type: 'youtube'
    },
    {
        id: "cam_russia_moscow",
        name: "Moscow Red Square View",
        location: "Moscow, Russia",
        coordinates: { lat: 55.7539, lng: 37.6208 },
        embedUrl: getActiveYouTubeLiveUrl("UCczCWKvgMEeH2PihX8nF29w"), // Moscow Live Cam / General RU (Dynamic)
        type: 'youtube'
    },
    {
        id: "cam_taiwan_taipei",
        name: "Taipei Skyline Live (Taiwan)",
        location: "Taipei, Taiwan",
        coordinates: { lat: 25.0330, lng: 121.5654 },
        embedUrl: getActiveYouTubeLiveUrl("UChqhcRabEEq-rIeZp2zEDQA"), // General Taiwan News/Live Channel
        type: 'youtube'
    },
    {
        id: "cam_japan_tokyo",
        name: "Tokyo Shibuya Crossing (Japan)",
        location: "Tokyo, Japan",
        coordinates: { lat: 35.6595, lng: 139.7005 },
        embedUrl: getActiveYouTubeLiveUrl("UCoZ_Iza-mPZq95G0tX7B85w"), // ANN News or static Shibuya cam channel
        type: 'youtube'
    },
    {
        id: "cam_skorea_seoul",
        name: "Seoul City Live (South Korea)",
        location: "Seoul, South Korea",
        coordinates: { lat: 37.5665, lng: 126.9780 },
        embedUrl: getActiveYouTubeLiveUrl("UChSqwgH18Gz0UqAXqX12K2A"), // KBS World or Seoul Live
        type: 'youtube'
    }
];
