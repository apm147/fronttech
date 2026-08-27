import Link from 'next/link';
import { getLandscapeSectors } from '@/lib/data';
import { DEFAULT_ICON, sectorPresentation } from '@/config/sectors';
import { SearchBar } from '@/components/SearchBar';

// Content changes via editorial edits, not deploys — read fresh on every
// request rather than baking sector/record counts into the build.
export const dynamic = 'force-dynamic';

export default async function LandscapePage() {
  const sectors = await getLandscapeSectors();
  const activeSectors = sectors.filter((s) => s.status === 'active');
  const hasPlaceholders = sectors.length > activeSectors.length;

  const subtitle = hasPlaceholders
    ? `${activeSectors.length} of ${sectors.length} frontier technologies built • more on the way`
    : `All ${sectors.length} frontier technologies from the UK’s Modern Industrial Strategy built`;

  return (
    <>
      <header>
        <h1>UK Frontier Technology Landscape</h1>
        <p>{subtitle}</p>
        <SearchBar />
      </header>

      <div className="card">
        <div className="sector-grid">
          {sectors.map((sector) => {
            const presentation = sectorPresentation(sector.sectorId);
            const isActive = sector.status === 'active';
            const count = sector._count.records;

            const cardStyle = presentation
              ? ({ '--sector-accent': presentation.accent } as React.CSSProperties)
              : undefined;

            const inner = (
              <>
                <div className="sector-card-top">
                  <span className="sector-card-icon">
                    <i className={`ti ${presentation?.icon ?? DEFAULT_ICON}`} aria-hidden="true" />
                  </span>
                  {isActive ? (
                    <span className="sector-card-status st-active">{count} entries</span>
                  ) : (
                    <span className="sector-card-status st-placeholder">Coming soon</span>
                  )}
                </div>
                <span className="sector-card-name">{sector.label}</span>
                <span className="sector-card-blurb">
                  {presentation?.blurb ?? 'A frontier technology category expected soon.'}
                </span>
                {!isActive ? (
                  <div className="sector-card-pills">
                    {['Timeline', 'Institutions', 'Initiatives', 'Breakthroughs'].map((p) => (
                      <span key={p} className="sector-card-pill">
                        {p}
                      </span>
                    ))}
                  </div>
                ) : null}
              </>
            );

            return isActive ? (
              <Link
                key={sector.sectorId}
                href={`/sector/${sector.sectorId}`}
                className="sector-card"
                style={cardStyle}
              >
                {inner}
              </Link>
            ) : (
              <div
                key={sector.sectorId}
                className="sector-card is-placeholder"
                style={cardStyle}
                aria-disabled="true"
              >
                {inner}
              </div>
            );
          })}
        </div>
      </div>

      <footer>
        Each active frontier technology follows the same research template (Timeline, Institutions,
        Initiatives, Breakthroughs — plus, for sectors that need it, Regulation), built from primary
        sources with unverified items flagged rather than omitted.
      </footer>
    </>
  );
}
