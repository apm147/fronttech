// Read-side query layer for the public app (Phase 2 — no write path yet;
// see docs/DESIGN.md Phase 3 for the editorial workflow this will grow
// into). Every function here is a thin, purpose-built Prisma query — kept
// separate from route/page files so pages stay about layout, not fetching.

import { prisma } from '@/lib/prisma';
import { SECTIONS, sectionConfig, type SectionKey, type SubtabKey } from '@/config/sections';
import { SECTOR_PRESENTATION } from '@/config/sectors';

const SECTOR_ORDER = Object.keys(SECTOR_PRESENTATION);

export async function getLandscapeSectors() {
  const sectors = await prisma.sector.findMany({
    include: { _count: { select: { records: true } } },
  });
  return sectors.sort((a, b) => {
    const ai = SECTOR_ORDER.indexOf(a.sectorId);
    const bi = SECTOR_ORDER.indexOf(b.sectorId);
    if (ai === -1 && bi === -1) return a.label.localeCompare(b.label);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export async function getSector(sectorId: string) {
  return prisma.sector.findUnique({ where: { sectorId } });
}

export async function getVisibleSections(sectorId: string): Promise<SectionKey[]> {
  const rows = await prisma.record.findMany({
    where: { sectorId },
    select: { sectionKey: true },
    distinct: ['sectionKey'],
  });
  const present = new Set(rows.map((r) => r.sectionKey));
  return SECTIONS.filter((s) => present.has(s.key)).map((s) => s.key);
}

export async function getVisibleSubtabs(sectorId: string, sectionKey: SectionKey) {
  const sec = sectionConfig(sectionKey);
  if (!sec?.subs) return null;

  const rows = await prisma.record.findMany({
    where: { sectorId, sectionKey, subtabKey: { not: null } },
    select: { subtabKey: true },
    distinct: ['subtabKey'],
  });
  const present = new Set(rows.map((r) => r.subtabKey));
  const visible = sec.subs.filter((s) => present.has(s.key));
  return visible.length ? visible : null;
}

export async function getRecords(sectorId: string, sectionKey: SectionKey, subtabKey?: SubtabKey) {
  return prisma.record.findMany({
    where: { sectorId, sectionKey, ...(subtabKey ? { subtabKey } : {}) },
    include: { recordBadges: { include: { badge: true } } },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
}

export type RecordSearchResult = Awaited<ReturnType<typeof searchRecords>>[number];

export async function searchRecords(query: string, limit = 100) {
  const q = query.trim();
  if (!q) return [];
  return prisma.record.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { subtitle: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    },
    include: { sector: true, recordBadges: { include: { badge: true } } },
    take: limit,
    orderBy: [{ sectorId: 'asc' }, { sortOrder: 'asc' }],
  });
}
