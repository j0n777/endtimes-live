import { EventCategory, Severity } from '../types';
import { CATEGORY_COLORS } from '../categoryColors';

// SVG Icons as strings for Leaflet DivIcon
// Using robust strokes for map visibility

const ICONS: Record<EventCategory, string> = {
  [EventCategory.CONFLICT]: `<path d="M14.5 17.5L3 6V4h2l11.5 11.5-2 2zM12 2l2 2-7 7-2-2 7-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`, // Sword
  [EventCategory.NATURAL_DISASTER]: `<path d="M12 2L4 20h16L12 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 8v6M12 17h.01" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`, // Warning Triangle
  [EventCategory.FIRES]: `<path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-1.38-1.12-2.5-2.5-2.5-1.38 0-2.5 1.12-2.5 2.5z M12 2c0 0-3 3-3 7 0 2.8 2.2 5 5 5 2.8 0 5-2.2 5-5 0-4-7-7-7-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`, // Flame
  [EventCategory.EPIDEMIC]: `<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`, // Medical
  [EventCategory.PANDEMIC]: `<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  [EventCategory.ECONOMIC]: `<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`, // Dollar
  [EventCategory.PROPHETIC]: `<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`, // Book
  [EventCategory.PERSECUTION]: `<path d="M10 2v14M6 8h8M6 20h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`, // Cross
  [EventCategory.POLITICAL]: `<path d="M3 21h18M5 21V7l8-4 8 4v14M13 11v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`, // Building
  [EventCategory.GOVERNMENT]: `<path d="M3 21h18M5 21V7l8-4 8 4v14M13 11v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  [EventCategory.HUMANITARIAN]: `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`, // Heart
  [EventCategory.CYBER]: `<rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`, // Lock
  [EventCategory.TECHNOLOGY]: `<rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  [EventCategory.AVIATION]: `<path d="M22 12L2 12" stroke="currentColor" stroke-width="2"/><path d="M16 12L22 6M16 12L22 18M7 12L10 8M7 12L10 16" stroke="currentColor" stroke-width="2"/>`, // Plane
  [EventCategory.MARITIME]: `<path d="M12 22V8M5 12H2a10 10 0 0 0 20 0h-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="5" r="3" stroke="currentColor" stroke-width="2"/>`, // Anchor
  [EventCategory.INFRASTRUCTURE]: `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" stroke-width="2"/>`, // Wrench
  [EventCategory.ENVIRONMENTAL]: `<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.48 10-10 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 21c0-3 1.85-5.36 5.08-6" stroke="currentColor" stroke-width="2"/>`, // Leaf
  [EventCategory.INTERNET_BLACKOUT]: `<line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M8.5 16.5a5 5 0 0 1 7 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 12.5c1.5-1.3 3.5-2.2 5.8-2.4M13 10.2c2 .3 3.8 1.1 5 2.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M1.5 8.5C4 6.5 7.9 5 12 5c1.9 0 3.7.3 5.4.8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="20" r="1" fill="currentColor"/>`, // WiFi Off (slash across)
  [EventCategory.SOLAR_ALERT]: `<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`, // Sun with rays
  [EventCategory.OTHER]: `<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 16v-4" stroke="currentColor" stroke-width="2"/><path d="M12 8h.01" stroke="currentColor" stroke-width="2"/>` // Info
};

export const getIconHtml = (category: EventCategory, severity: Severity, isWar: boolean): string => {
  // SPECIAL HANDLING FOR TRANSPORT AND AVIATION (Planes/Ships) - No bubble background, just the icon
  if (category === 'TRANSPORT' || category === 'AVIATION') {
    // Return a clean SVG that points UP (North) by default so rotation applied in SituationMap is accurate.
    return `
      <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #3b82f6; filter: drop-shadow(0 0 3px #000) drop-shadow(0 0 8px #3b82f6);">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" opacity="0.9">
           <path d="M12 2 L14 8 L20 10 L14 12 L15 20 L12 18 L9 20 L10 12 L4 10 L10 8 Z" stroke="#000" stroke-width="0.5"/>
        </svg>
      </div>
    `;
  }

  const color = CATEGORY_COLORS[category] || '#9ca3af';
  // Fallback to OTHER or PROPHETIC if missing
  const iconSvg = ICONS[category] || ICONS[EventCategory.OTHER];

  // Size Logic
  let size = 32; // Standard size
  if (severity === 'HIGH') size = 40;
  if (severity === 'ELEVATED') size = 36;
  if (isWar) size = 48;

  // Animation Logic
  let animation = '';
  if (isWar) animation = 'animate-pulse';

  // NEW DESIGN: "Pinless" - Just the icon with strong contrast shadow, no background bubble.
  // This reduces the "clumped" look and feels more modern/tactical.
  
  // Dynamic color for stroke and fill opacity
  const strokeColor = color;
  const filter = `drop-shadow(0 0 3px #000) drop-shadow(0 0 8px ${color})`; // Double shadow for readability
  
  return `
    <div class="relative flex items-center justify-center ${animation}" style="width: ${size}px; height: ${size}px;">
      ${isWar ? `<div class="absolute inset-0 rounded-full opacity-30 animate-ping" style="background-color: ${color}; transform: scale(0.8);"></div>` : ''}

      <div class="relative z-10 flex items-center justify-center"
           style="width: 100%; height: 100%; color: ${strokeColor}; filter: ${filter};">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          ${iconSvg}
        </svg>
      </div>
    </div>
  `;
};

/**
 * Military aircraft icon — small plane silhouette rotated by heading.
 * Used for the live military aircraft overlay layer (NOT event pins).
 * @param heading degrees (0 = north, 90 = east). Icon default points north (up).
 * @param isEmergency if true, uses red/alert color (squawk 7700 etc.)
 */
export const getMilitaryAircraftIconHtml = (heading: number, isEmergency: boolean): string => {
  const color = isEmergency ? '#ef4444' : '#94a3b8'; // red for emergency, slate for normal
  const glow = isEmergency
    ? 'drop-shadow(0 0 4px #ef4444) drop-shadow(0 0 8px #ef4444)'
    : 'drop-shadow(0 0 3px #000) drop-shadow(0 0 6px #64748b)';

  // Plane SVG pointing upward (north = 0°). Rotation applied via CSS.
  const planeSvg = `
    <polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9"
      fill="${color}" stroke="none" opacity="0.9"/>
  `;
  // Actually a simpler fighter silhouette:
  const fighterSvg = `
    <path d="M12 2 L14 8 L20 10 L14 12 L15 20 L12 18 L9 20 L10 12 L4 10 L10 8 Z"
      fill="${color}" stroke="#000" stroke-width="0.5" opacity="0.92"/>
  `;

  return `
    <div style="
      width: 22px; height: 22px;
      display: flex; align-items: center; justify-content: center;
      transform: rotate(${heading}deg);
      filter: ${glow};
      transition: transform 0.5s ease;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
        ${fighterSvg}
      </svg>
    </div>
  `;
};
