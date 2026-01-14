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
  [EventCategory.OTHER]: `<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 16v-4" stroke="currentColor" stroke-width="2"/><path d="M12 8h.01" stroke="currentColor" stroke-width="2"/>` // Info
};

export const getIconHtml = (category: EventCategory, severity: Severity, isWar: boolean): string => {
  const color = CATEGORY_COLORS[category] || '#9ca3af';
  // Fallback to OTHER or PROPHETIC if missing
  const iconSvg = ICONS[category] || ICONS[EventCategory.OTHER];

  // Size Logic
  let size = 28; // Slightly larger base
  if (severity === 'HIGH') size = 36;
  if (severity === 'ELEVATED') size = 32;
  if (isWar) size = 42;

  // Animation Logic
  let animation = '';
  if (isWar) animation = 'animate-pulse';

  // Outer glow for high severity
  const glow = (severity === 'HIGH' || isWar) ? `box-shadow: 0 0 15px ${color}80;` : `box-shadow: 0 0 10px ${color}40;`;

  // Background: Same color as icon but with 50% opacity (Hex + 80 = ~50%)
  // If color is #RRGGBB, appending 80 makes it #RRGGBB80 (Level 4 alpha)
  // We want a "lighter" tone feeling, but on dark map, pure color at 50% is good.
  // To make the background "lighter" than the stroke, we rely on the opacity. 
  // If the user wants a technically lighter color mixed with white, we'd need color manipulation.
  // However, "fundo com a mesma cor ... transparency 50%" usually implies just opacity.

  return `
    <div class="relative flex items-center justify-center ${animation}" style="width: ${size}px; height: ${size}px;">
      ${isWar ? `<div class="absolute inset-0 rounded-full opacity-40 animate-ping" style="background-color: ${color}"></div>` : ''}
      
      <div class="relative z-10 flex items-center justify-center rounded-full border" 
           style="width: 100%; height: 100%; background-color: ${color}80; color: #ffffff; ${glow} border-color: ${color}; border-width: 2px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="${size * 0.6}" height="${size * 0.6}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));">
          ${iconSvg}
        </svg>
      </div>
    </div>
  `;
};
