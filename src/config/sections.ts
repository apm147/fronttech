// Section/sub-tab config shared across every sector — ported from the HTML
// prototype's SECTIONS array. A sector only ever shows the sub-tabs it has
// records for (see getVisibleSubtabs in src/lib/data.ts), so Regulation can
// carry more than one sector-specific taxonomy (Semiconductors' four vs.
// Cybersecurity's five vs. Advanced Connectivity's three-plus-shared) from
// one combined list without any sector seeing another's empty sub-tabs.

export type SectionKey =
  | 'timeline'
  | 'institution'
  | 'initiative'
  | 'regulation'
  | 'breakthrough'
  | 'evolving';

// Matches @prisma/client's generated SubtabKey enum member names exactly
// (the Prisma schema identifier, not the @map'd DB string — e.g. Postgres
// stores 'crit-infra' but Prisma Client exposes it as 'crit_infra').
export type SubtabKey =
  | 'domestic'
  | 'international'
  | 'export'
  | 'nsi'
  | 'standards'
  | 'ipsec'
  | 'crit_infra'
  | 'cybercrime'
  | 'consumer_telecoms'
  | 'codes_standards'
  | 'spectrum'
  | 'infra_access'
  | 'satellite';

export type SectionConfig = {
  key: SectionKey;
  label: string;
  icon: string;
  subs: { key: SubtabKey; label: string }[] | null;
};

export const SECTIONS: SectionConfig[] = [
  { key: 'timeline', label: 'Timeline', icon: 'ti-calendar', subs: null },
  { key: 'institution', label: 'Institutions', icon: 'ti-building-bank', subs: null },
  {
    key: 'initiative',
    label: 'Initiatives',
    icon: 'ti-rocket',
    subs: [
      { key: 'domestic', label: 'Domestic' },
      { key: 'international', label: 'International' },
    ],
  },
  {
    key: 'regulation',
    label: 'Regulation',
    icon: 'ti-gavel',
    subs: [
      { key: 'export', label: 'Export Controls' },
      { key: 'nsi', label: 'National Security Screening' },
      { key: 'standards', label: 'Standards' },
      { key: 'ipsec', label: 'IP & Security Policy' },
      { key: 'crit_infra', label: 'Critical Infrastructure & Essential Services' },
      { key: 'cybercrime', label: 'Cybercrime Law' },
      { key: 'consumer_telecoms', label: 'Consumer, Product & Telecoms Security' },
      { key: 'codes_standards', label: 'Codes of Practice & Standards' },
      { key: 'spectrum', label: 'Spectrum Management & Licensing' },
      { key: 'infra_access', label: 'Infrastructure Deployment & Access Rights' },
      { key: 'satellite', label: 'Satellite & Non-Terrestrial Spectrum' },
    ],
  },
  { key: 'breakthrough', label: 'Breakthroughs', icon: 'ti-trophy', subs: null },
  { key: 'evolving', label: 'Evolving', icon: 'ti-refresh', subs: null },
];

export function sectionConfig(key: string): SectionConfig | undefined {
  return SECTIONS.find((s) => s.key === key);
}

// Matches the prototype's `subLabels` map used in the sector-view subheading.
export const SECTION_SUMMARY_LABEL: Record<SectionKey, string> = {
  timeline: 'policy timeline',
  institution: 'institutions',
  initiative: 'initiatives (domestic & international)',
  regulation: 'regulation',
  breakthrough: 'breakthroughs',
  evolving: 'evolving developments',
};
