import Link from 'next/link';
import { searchRecords } from '@/lib/data';
import { SearchBar } from '@/components/SearchBar';
import { RecordRow } from '@/components/RecordRow';

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q = '' } = await searchParams;
  const results = q.trim() ? await searchRecords(q) : [];

  return (
    <>
      <Link href="/" className="back-link">
        <i className="ti ti-arrow-left" aria-hidden="true" />
        All frontier technologies
      </Link>

      <header>
        <h1>Search</h1>
        <p>Across every sector — title, subtitle and description.</p>
        <SearchBar defaultValue={q} />
      </header>

      <div className="card">
        <div className="data-bar">
          <span className="bar-info">
            <strong>{q.trim() ? `“${q}”` : 'Results'}</strong>{' '}
            {q.trim() ? `· ${results.length} ${results.length === 1 ? 'match' : 'matches'}` : ''}
          </span>
        </div>
        <div className="panel">
          {!q.trim() ? (
            <p className="empty">Enter a search term above.</p>
          ) : results.length === 0 ? (
            <p className="empty">No entries matched “{q}”.</p>
          ) : (
            results.map((record) => <RecordRow key={record.recordId} record={record} showSector />)
          )}
        </div>
      </div>
    </>
  );
}
