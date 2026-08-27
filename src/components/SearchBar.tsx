// Cross-sector search — the one genuinely new capability this Phase 2 app
// has over the HTML prototype's six independent JS arrays (see
// docs/DESIGN.md, "New, enabled by the schema change"). Plain GET form, no
// client JS required: submitting navigates to /search?q=..., which is a
// server component.

export function SearchBar({ defaultValue = '' }: { defaultValue?: string }) {
  return (
    <form className="site-search" action="/search" method="get">
      <div className="site-search-input-wrap">
        <i className="ti ti-search" aria-hidden="true" />
        <input
          type="text"
          name="q"
          placeholder="Search all sectors — title, description..."
          defaultValue={defaultValue}
          aria-label="Search all sectors"
        />
      </div>
    </form>
  );
}
