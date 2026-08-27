// Presentation-only metadata per sector — icon, accent colour, landscape-grid
// blurb, and badge→CSS-class mapping. Deliberately not in the database (see
// docs/DESIGN.md, "What's deliberately not in this schema" → Presentation
// metadata) — ported 1:1 from the HTML prototype's SECTOR_META/BC_* objects.
// Any real `sectors` row without an entry here (i.e. a placeholder sector
// like `tbd-seventh`) falls back to DEFAULT_ICON/no accent/no badge map.

export type BadgeClass = 'b-direct' | 'b-indirect' | 'b-q' | 'b-corp' | 'b-alert';

export type SectorPresentation = {
  icon: string; // tabler-icons webfont class, e.g. 'ti-atom-2'
  accent: string; // CSS color value
  blurb: string;
  badgeClass: Record<string, BadgeClass>;
};

export const DEFAULT_ICON = 'ti-hexagon-letter-question';

export const SECTOR_PRESENTATION: Record<string, SectorPresentation> = {
  quantum: {
    icon: 'ti-atom-2',
    accent: 'var(--acc-quantum)',
    blurb:
      'Quantum computing, communications and sensing — from NQCC testbeds to trapped-ion world records.',
    badgeClass: {
      dissolved: 'b-alert',
      paused: 'b-alert',
      unresolved: 'b-alert',
      'quantum computing': 'b-q',
      'quantum communications': 'b-indirect',
      'quantum sensing': 'b-direct',
      'error correction': 'b-corp',
    },
  },
  engbio: {
    icon: 'ti-dna',
    accent: 'var(--acc-engbio)',
    blurb:
      'Synthetic biology tools applied to medicine, agriculture, materials and industrial manufacturing.',
    badgeClass: {
      dissolved: 'b-alert',
      paused: 'b-alert',
      unresolved: 'b-alert',
      'genome engineering': 'b-q',
      'cell & gene therapy': 'b-direct',
      'industrial biotech': 'b-indirect',
      'tools & manufacturing': 'b-corp',
    },
  },
  ai: {
    icon: 'ti-brain',
    accent: 'var(--acc-ai)',
    blurb:
      'AI services, products and infrastructure spanning drug discovery to legal document automation.',
    badgeClass: {
      dissolved: 'b-alert',
      paused: 'b-alert',
      unresolved: 'b-alert',
      'research breakthroughs': 'b-q',
      'commercial scale-ups': 'b-direct',
      'tools & infrastructure': 'b-indirect',
    },
  },
  semiconductors: {
    icon: 'ti-cpu',
    accent: 'var(--acc-semi)',
    blurb:
      "Chip design and IP, compound semiconductors and photonics — from Arm's architecture to the South Wales cluster.",
    badgeClass: {
      dissolved: 'b-alert',
      paused: 'b-alert',
      unresolved: 'b-alert',
      'materials & 2D': 'b-q',
      'design & IP': 'b-direct',
      photonics: 'b-indirect',
      'manufacturing & tools': 'b-corp',
      export: 'b-q',
      nsi: 'b-direct',
      standards: 'b-indirect',
      ipsec: 'b-corp',
    },
  },
  cyber: {
    icon: 'ti-shield-lock',
    accent: 'var(--acc-cyber)',
    blurb:
      'Technologies protecting critical infrastructure, personal data and financial institutions from digital threats.',
    badgeClass: {
      dissolved: 'b-alert',
      paused: 'b-alert',
      unresolved: 'b-alert',
      'codebreaking-heritage': 'b-q',
      'threat-detection-ai': 'b-direct',
      cryptography: 'b-indirect',
      'policy-diplomacy': 'b-corp',
      'crit-infra': 'b-q',
      cybercrime: 'b-direct',
      'consumer-telecoms': 'b-indirect',
      'codes-standards': 'b-corp',
      export: 'b-q',
    },
  },
  connectivity: {
    icon: 'ti-antenna-bars-5',
    accent: 'var(--acc-connect)',
    blurb:
      '5G/6G, non-terrestrial networks and advanced optical networks for next-generation data transmission.',
    badgeClass: {
      dissolved: 'b-alert',
      paused: 'b-alert',
      unresolved: 'b-alert',
      '5g-milestone': 'b-direct',
      'speed-record': 'b-q',
      'non-terrestrial-first': 'b-indirect',
      'open-ran-first': 'b-corp',
      'regulatory-first': 'b-alert',
      spectrum: 'b-q',
      'infra-access': 'b-direct',
      satellite: 'b-indirect',
      'consumer-telecoms': 'b-corp',
    },
  },
};

export function sectorPresentation(sectorId: string): SectorPresentation | undefined {
  return SECTOR_PRESENTATION[sectorId];
}

export function badgeClassFor(sectorId: string, label: string): BadgeClass {
  return sectorPresentation(sectorId)?.badgeClass[label] ?? 'b-corp';
}
