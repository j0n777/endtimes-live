import { MonitorEvent } from '../types';

export type DefconLevel = 1 | 2 | 3 | 4 | 5;

export interface DefconMeta {
  level: DefconLevel;
  codename: string;
  desc: string;
  textColor: string;
  borderColor: string;
  dotColor: string;
  pulse: boolean;
}

/**
 * Derives a DEFCON level from the current active events.
 *
 * DEFCON 5 – Peacetime  (no unusual threat)
 * DEFCON 4 – Elevated   (increased intel / minor conflicts)
 * DEFCON 3 – Round House (significant conflicts, multiple HIGH events)
 * DEFCON 2 – Fast Pace  (active interstate war, major escalation)
 * DEFCON 1 – Cocked Pistol (nuclear threat detected – never officially used)
 */
export function calculateDefcon(events: MonitorEvent[]): DefconLevel {
  if (!events || events.length === 0) return 5;

  const highCount     = events.filter(e => e.severity === 'HIGH').length;
  const elevatedCount = events.filter(e => e.severity === 'ELEVATED').length;

  const allText = events.map(e => `${e.title} ${e.description || ''}`).join(' ').toLowerCase();

  // DEFCON 1 – nuclear strike / war imminent signals
  const nuclearWar = /nuclear (war|strike|launch|attack|warhead)|ballistic missile|icbm launch|nuclear detonation/;
  if (nuclearWar.test(allText) && highCount >= 2) return 1;

  // DEFCON 2 – active interstate war or extreme concentration of HIGH events
  const stateWarKeywords = /world war|interstate war|declared war|war between|nuclear standoff|full.?scale invasion/;
  if (highCount >= 12 || stateWarKeywords.test(allText)) return 2;

  // DEFCON 3 – significant conflict activity
  if (highCount >= 5 || (highCount >= 2 && elevatedCount >= 6)) return 3;

  // DEFCON 4 – elevated watch
  if (highCount >= 2 || elevatedCount >= 4) return 4;

  return 5;
}

export const DEFCON_META: Record<DefconLevel, DefconMeta> = {
  1: {
    level: 1,
    codename: 'COCKED PISTOL',
    desc: 'NUCLEAR WAR IMMINENT',
    textColor:   'text-red-400',
    borderColor: 'border-red-600/70',
    dotColor:    'bg-red-500',
    pulse: true,
  },
  2: {
    level: 2,
    codename: 'FAST PACE',
    desc: 'ARMED FORCES READY',
    textColor:   'text-orange-400',
    borderColor: 'border-orange-500/60',
    dotColor:    'bg-orange-500',
    pulse: true,
  },
  3: {
    level: 3,
    codename: 'ROUND HOUSE',
    desc: 'AIR FORCE READINESS',
    textColor:   'text-yellow-400',
    borderColor: 'border-yellow-500/50',
    dotColor:    'bg-yellow-500',
    pulse: false,
  },
  4: {
    level: 4,
    codename: 'DOUBLE TAKE',
    desc: 'INCREASED WATCH',
    textColor:   'text-blue-400',
    borderColor: 'border-blue-500/40',
    dotColor:    'bg-blue-500',
    pulse: false,
  },
  5: {
    level: 5,
    codename: 'FADE OUT',
    desc: 'NORMAL READINESS',
    textColor:   'text-gray-500',
    borderColor: 'border-gray-600/40',
    dotColor:    'bg-gray-600',
    pulse: false,
  },
};
