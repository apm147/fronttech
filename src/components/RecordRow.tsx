import type { Badge, Record as PolicyRecord, RecordBadge } from '@prisma/client';
import { badgeClassFor } from '@/config/sectors';

type RowRecord = PolicyRecord & {
  recordBadges: (RecordBadge & { badge: Badge })[];
  sector?: { sectorId: string; label: string };
};

// Ported from the prototype's rowHtml()/badgeHtml() — same shape, same
// fields, same "no link verified" treatment for records without a url.
export function RecordRow({ record, showSector = false }: { record: RowRecord; showSector?: boolean }) {
  const sectorId = record.sector?.sectorId ?? record.sectorId;

  return (
    <div className="row">
      <div className="row-body">
        <div className="row-head">
          {record.dateLabel ? <span className="row-date">{record.dateLabel}</span> : null}
          <span className="row-title">{record.title}</span>
          {record.status !== 'active' ? <span className="status-pill">{record.status}</span> : null}
          {record.recordBadges.length ? (
            <span className="badges">
              {record.recordBadges.map(({ badge }) => (
                <span key={badge.badgeId} className={`badge ${badgeClassFor(sectorId, badge.label)}`}>
                  {badge.label}
                </span>
              ))}
            </span>
          ) : null}
        </div>
        {record.subtitle ? <p className="row-sub">{record.subtitle}</p> : null}
        {showSector && record.sector ? (
          <p className="row-sector">
            <a href={`/sector/${record.sector.sectorId}`}>{record.sector.label}</a>
          </p>
        ) : null}
        <p className="row-desc">{record.description}</p>
        {record.caveat ? (
          <p className="row-caveat">
            <i className="ti ti-alert-triangle" aria-hidden="true" />
            <span>{record.caveat}</span>
          </p>
        ) : null}
      </div>
      <div className="row-action">
        {record.url ? (
          <a href={record.url} target="_blank" rel="noopener noreferrer" className="visit">
            Visit <i className="ti ti-external-link" aria-hidden="true" />
          </a>
        ) : (
          <span className="no-link">no link verified</span>
        )}
      </div>
    </div>
  );
}
