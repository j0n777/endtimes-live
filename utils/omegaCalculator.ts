import { MonitorEvent, EventCategory } from '../types';

export type OmegaLevel = 1 | 2 | 3 | 4 | 5;

export interface OmegaMeta {
  level: OmegaLevel;
  codename: string;
  desc: string;
  textColor: string;
  borderColor: string;
  dotColor: string;
  pulse: boolean;
}

/**
 * OMEGA INDEX — End Times Indicator
 *
 * A prophetically-weighted composite score derived from live global events.
 * Inspired by Matthew 24 ("birth pangs"), the Seals of Revelation, and Daniel.
 *
 * Levels:
 *  1 — WATCHMAN    Standard vigilance. History as normal.
 *  2 — SIGNS       Increasing frequency of notable events.
 *  3 — BIRTH PANGS Wars, famines, earthquakes — Matthew 24:8.
 *  4 — TRIBULATION Great Tribulation signs converging.
 *  5 — MARANATHA   All signs aligning. Come, Lord Jesus. (Rev 22:20)
 *
 * Score factors:
 *  ● Conflict density         — active wars, skirmishes, military operations
 *  ● Natural disaster count   — earthquakes, floods, wildfires
 *  ● Severity concentration   — HIGH / CRITICAL event share
 *  ● Prophetic keywords       — nuclear, Israel, famine, plague, etc.
 *  ● Persecution & epidemic   — PERSECUTION + EPIDEMIC category events
 */

const PROPHETIC_KEYWORDS: string[] = [
  // Nuclear / WMD
  'nuclear', 'warhead', 'icbm', 'ballistic', 'atomic', 'radiation', 'dirty bomb',
  // Active flashpoints
  'israel', 'jerusalem', 'gaza', 'iran', 'russia', 'ukraine', 'china', 'taiwan',
  'world war', 'ww3', 'global war', 'third world war', 'nato escalation',
  // Biblical signs of the end
  'earthquake', 'famine', 'plague', 'locust', 'drought', 'volcano', 'tsunami',
  'pestilence', 'pandemic', 'outbreak', 'flood', 'wildfire', 'fire',
  // Persecution
  'martyr', 'persecution', 'genocide', 'ethnic cleansing', 'beheading',
  // Economic collapse
  'collapse', 'hyperinflation', 'bank run', 'sovereign default', 'depression',
  'currency crisis', 'debt crisis',
  // Prophetic / Apocalyptic
  'armageddon', 'tribulation', 'antichrist', 'false prophet', 'temple',
  'rapture', 'mark of the beast', '666', 'apocalypse', 'end times',
];

export function calculateOmegaIndex(events: MonitorEvent[]): OmegaLevel {
  if (!events || events.length === 0) return 1;

  let score = 0;

  // ── Factor 1: Active conflict events (max 28 pts) ───────────────────────
  const conflictCount = events.filter(e => e.category === EventCategory.CONFLICT).length;
  score += Math.min(conflictCount * 0.7, 28);

  // ── Factor 2: Natural disasters + fires (max 14 pts) ────────────────────
  const disasterCount = events.filter(
    e => e.category === EventCategory.NATURAL_DISASTER ||
         e.category === EventCategory.FIRES ||
         e.category === EventCategory.ENVIRONMENTAL
  ).length;
  score += Math.min(disasterCount * 0.5, 14);

  // ── Factor 3: HIGH / CRITICAL severity density (max 20 pts) ─────────────
  const severeCount = events.filter(e => e.severity === 'CRITICAL' || e.severity === 'HIGH').length;
  const severityRatio = events.length > 0 ? severeCount / events.length : 0;
  score += Math.min(severeCount * 0.4 + severityRatio * 10, 20);

  // ── Factor 4: Prophetic keyword hits (max 28 pts) ───────────────────────
  const sampleText = events
    .slice(0, 80)
    .map(e => `${e.title} ${e.description || ''}`)
    .join(' ')
    .toLowerCase();
  let kwScore = 0;
  for (const kw of PROPHETIC_KEYWORDS) {
    if (sampleText.includes(kw)) kwScore += 1.4;
  }
  score += Math.min(kwScore, 28);

  // ── Factor 5: Persecution + epidemic events (max 10 pts) ────────────────
  const watchCount = events.filter(
    e => e.category === EventCategory.EPIDEMIC ||
         e.category === EventCategory.PERSECUTION
  ).length;
  score += Math.min(watchCount * 1.0, 10);

  // ── Map score (0–100) to level (1–5) ────────────────────────────────────
  if (score >= 68) return 5;
  if (score >= 48) return 4;
  if (score >= 28) return 3;
  if (score >= 12) return 2;
  return 1;
}

export const OMEGA_META: Record<OmegaLevel, OmegaMeta> = {
  1: {
    level: 1,
    codename: 'WATCHMAN',
    desc: 'Standard vigilance — no unusual prophetic convergence',
    textColor:   'text-gray-400',
    borderColor: 'border-gray-600/40',
    dotColor:    'bg-gray-500',
    pulse: false,
  },
  2: {
    level: 2,
    codename: 'SIGNS',
    desc: 'Notable signs increasing — Matthew 24:6',
    textColor:   'text-sky-400',
    borderColor: 'border-sky-600/40',
    dotColor:    'bg-sky-500',
    pulse: false,
  },
  3: {
    level: 3,
    codename: 'BIRTH PANGS',
    desc: 'Wars, famines, earthquakes — Matthew 24:8',
    textColor:   'text-yellow-400',
    borderColor: 'border-yellow-500/50',
    dotColor:    'bg-yellow-500',
    pulse: false,
  },
  4: {
    level: 4,
    codename: 'TRIBULATION',
    desc: 'Great Tribulation signs converging — Revelation 6',
    textColor:   'text-orange-400',
    borderColor: 'border-orange-500/60',
    dotColor:    'bg-orange-500',
    pulse: true,
  },
  5: {
    level: 5,
    codename: 'MARANATHA',
    desc: 'All signs aligning — Come, Lord Jesus (Rev 22:20)',
    textColor:   'text-red-400',
    borderColor: 'border-red-500/70',
    dotColor:    'bg-red-500',
    pulse: true,
  },
};
