import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSector, getVisibleSections, getVisibleSubtabs, getRecords } from '@/lib/data';
import { sectionConfig, SECTION_SUMMARY_LABEL, type SectionKey, type SubtabKey } from '@/config/sections';
import { sectorPresentation } from '@/config/sectors';
import { SearchBar } from '@/components/SearchBar';
import { RecordRow } from '@/components/RecordRow';

type Props = {
  params: Promise<{ sectorId: string }>;
  searchParams: Promise<{ section?: string; sub?: string }>;
};

function formatUpdated(date: Date | null) {
  if (!date) return null;
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export default async function SectorPage({ params, searchParams }: Props) {
  const { sectorId } = await params;
  const { section, sub } = await searchParams;

  const sector = await getSector(sectorId);
  if (!sector) notFound();

  const presentation = sectorPresentation(sectorId);
  const headerStyle = presentation ? ({ '--sector-accent': presentation.accent } as React.CSSProperties) : undefined;

  if (sector.status !== 'active') {
    return (
      <>
        <Link href="/" className="back-link">
          <i className="ti ti-arrow-left" aria-hidden="true" />
          All frontier technologies
        </Link>
        <header>
          <h1>{sector.label}</h1>
          <p>Coming soon — not yet built.</p>
        </header>
        <div className="card">
          <p className="empty">This frontier technology category is reserved but not yet populated.</p>
        </div>
      </>
    );
  }

  const visibleSections = await getVisibleSections(sectorId);
  if (visibleSections.length === 0) notFound();

  const activeSection: SectionKey = visibleSections.includes(section as SectionKey)
    ? (section as SectionKey)
    : visibleSections[0];

  const subs = await getVisibleSubtabs(sectorId, activeSection);
  const activeSub: SubtabKey | undefined = subs?.some((s) => s.key === sub) ? (sub as SubtabKey) : subs?.[0]?.key;

  const [allInSection, records] = await Promise.all([
    getRecords(sectorId, activeSection),
    activeSub ? getRecords(sectorId, activeSection, activeSub) : getRecords(sectorId, activeSection),
  ]);

  const sec = sectionConfig(activeSection)!;
  const countLabel =
    activeSub && records.length !== allInSection.length
      ? `${records.length} of ${allInSection.length} entries`
      : `${allInSection.length} ${allInSection.length === 1 ? 'entry' : 'entries'}`;

  const summaryParts = visibleSections.map((key) => SECTION_SUMMARY_LABEL[key]);
  const updated = formatUpdated(sector.lastReviewedDate);

  return (
    <>
      <Link href="/" className="back-link">
        <i className="ti ti-arrow-left" aria-hidden="true" />
        All frontier technologies
      </Link>

      <header>
        <h1>UK {sector.label} Landscape – Key developments</h1>
        <p>
          {summaryParts.join(' • ')}
          {updated ? ` • Updated ${updated}` : ''}
        </p>
        <SearchBar />
      </header>

      {sector.framingText ? (
        <p className="sector-framing" style={headerStyle}>
          {sector.framingText}
        </p>
      ) : null}

      <div className="card">
        <div className="data-bar">
          <span className="bar-info">
            <strong>{sec.label}</strong> · {countLabel}
          </span>
        </div>

        <div className="tabs-wrap">
          <div className="tabs">
            {visibleSections.map((key) => {
              const s = sectionConfig(key)!;
              return (
                <Link
                  key={key}
                  href={`/sector/${sectorId}?section=${key}`}
                  className={key === activeSection ? 'active' : ''}
                >
                  <i className={`ti ${s.icon}`} aria-hidden="true" />
                  {s.label}
                </Link>
              );
            })}
          </div>
        </div>

        {subs ? (
          <div className="subtabs">
            {subs.map((s) => (
              <Link
                key={s.key}
                href={`/sector/${sectorId}?section=${activeSection}&sub=${s.key}`}
                className={s.key === activeSub ? 'active' : ''}
              >
                {s.label}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="panel">
          {records.length === 0 ? (
            <p className="empty">No entries here yet.</p>
          ) : (
            records.map((record) => <RecordRow key={record.recordId} record={record} />)
          )}
        </div>
      </div>

      {sector.methodologyNotes ? <footer>{sector.methodologyNotes}</footer> : null}
    </>
  );
}
