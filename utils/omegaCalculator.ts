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
 * OMEGA INDEX — nomes e cores dos 5 níveis.
 *
 * O nível em si é calculado pelo worker em lib/signs (06/10/2026): convergência de
 * sinais medidos contra o próprio histórico — terremotos, guerras, fome, pestes,
 * sinais no sol, mar, angústia das nações. A versão anterior, que somava contagens
 * e palavras-chave do feed de notícias, ficava travada em MARANATHA.
 *
 *  1 — WATCHMAN    nenhum sinal anômalo
 *  2 — SIGNS       1 sinal anômalo
 *  3 — BIRTH PANGS 2 sinais anômalos — Matthew 24:8
 *  4 — TRIBULATION 3 ou mais
 *  5 — MARANATHA   ≥ 70% dos sinais anômalos e a maioria em alta (Rev 22:20)
 */

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
