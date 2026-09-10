import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DeckSummary } from '../types';
import { presentDeck } from '../constants';
import { DeckCard } from './DeckCard';

interface MarketplaceProps {
  readonly decks: readonly DeckSummary[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly search: string;
  readonly topic: string;
  readonly onUpvote: (deck: DeckSummary) => Promise<void>;
  readonly onStudy: (deck: DeckSummary) => void;
}

type Feed = 'popular' | 'top-rated' | 'recent' | 'free';
type SortKey = 'highest' | 'most-cards' | 'price-asc' | 'price-desc';

const PAGE_SIZE = 6;

const FEEDS: readonly { id: Feed; label: string }[] = [
  { id: 'popular', label: 'Popular' },
  { id: 'top-rated', label: 'Top Rated' },
  { id: 'recent', label: 'Recently Added' },
  { id: 'free', label: 'Free Only' },
];

export function Marketplace({
  decks,
  loading,
  error,
  search,
  topic,
  onUpvote,
  onStudy,
}: MarketplaceProps): ReactNode {
  const [feed, setFeed] = useState<Feed>('popular');
  const [sort, setSort] = useState<SortKey>('highest');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = decks.filter((deck) => {
      if (topic !== 'All Decks' && deck.topic !== topic) return false;
      if (feed === 'free' && deck.price_cents > 0) return false;
      if (q === '') return true;
      const extra = presentDeck(deck);
      const haystack = [
        deck.title,
        deck.topic,
        deck.creator_email,
        extra.description,
        ...extra.tags,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    rows = [...rows].sort((a, b) => {
      if (feed === 'recent') return b.id - a.id || b.upvote_count - a.upvote_count;
      if (feed === 'top-rated') {
        const ra = presentDeck(a).rating ?? 0;
        const rb = presentDeck(b).rating ?? 0;
        return rb - ra || b.upvote_count - a.upvote_count;
      }
      if (sort === 'most-cards') return b.card_count - a.card_count || a.id - b.id;
      if (sort === 'price-asc') return a.price_cents - b.price_cents || a.id - b.id;
      if (sort === 'price-desc') return b.price_cents - a.price_cents || a.id - b.id;
      return b.upvote_count - a.upvote_count || a.id - b.id;
    });

    return rows;
  }, [decks, feed, search, sort, topic]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = visible.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );
  const from = visible.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(safePage * PAGE_SIZE, visible.length);

  useEffect(() => {
    setPage(1);
  }, [feed, search, sort, topic]);

  return (
    <div className="flex w-full flex-col">
      <div className="w-full border-b border-slate-200/80 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 py-8 sm:px-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-2xl space-y-1">
              <div className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-wider text-primary uppercase">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Peer-Reviewed Knowledge Repositories
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Marketplace
              </h1>
              <p className="text-sm leading-relaxed text-slate-600">
                Discover peer-reviewed, production-tested flashcard decks built
                by systems architects, staff engineers, and polyglots.
              </p>
            </div>
            <div className="flex items-center gap-3 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-xs md:self-auto">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">
                  layers
                </span>
                <span className="font-mono text-[13px] font-semibold text-slate-900">
                  {decks.length.toLocaleString()}
                </span>
              </div>
              <span className="text-[12px] text-slate-300">•</span>
              <span className="font-mono text-[11px] text-slate-500">
                Verified Decks
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/70 pt-3">
            <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-lg border border-slate-200/60 bg-slate-100 p-1">
              {FEEDS.map((item) => {
                const active = feed === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFeed(item.id)}
                    className={`rounded-md px-3 py-1 font-mono text-[12px] whitespace-nowrap transition-all duration-150 ${
                      active
                        ? 'border border-slate-200/60 bg-white font-semibold text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="ml-auto flex items-center gap-3 md:ml-0">
              <div className="relative inline-flex items-center">
                <label className="sr-only" htmlFor="sort-select">
                  Sort marketplace decks
                </label>
                <select
                  id="sort-select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pr-8 pl-3 font-mono text-[12px] text-slate-700 shadow-xs transition-colors hover:border-slate-300 hover:text-slate-900 focus:border-primary focus:outline-none"
                >
                  <option value="highest">Highest Ranked</option>
                  <option value="most-cards">Card Volume</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-2 text-[16px] text-slate-400">
                  unfold_more
                </span>
              </div>
              <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 text-slate-400 shadow-xs">
                <button
                  type="button"
                  aria-label="Grid layout view"
                  aria-pressed={layout === 'grid'}
                  onClick={() => setLayout('grid')}
                  className={`flex items-center justify-center rounded p-1 transition-colors ${
                    layout === 'grid' ? 'bg-slate-100 text-primary' : 'hover:text-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    grid_view
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="List layout view"
                  aria-pressed={layout === 'list'}
                  onClick={() => setLayout('list')}
                  className={`flex items-center justify-center rounded p-1 transition-colors ${
                    layout === 'list' ? 'bg-slate-100 text-primary' : 'hover:text-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    view_list
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1280px] px-4 py-12 sm:px-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : error !== null ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
            <p className="font-semibold">Could not load the marketplace</p>
            <p className="mt-1 text-sm text-rose-700/80">{error}</p>
            <p className="mt-3 font-mono text-[12px] text-rose-600/70">
              Is the API running on port 8787? Vite proxies <code>/api</code>{' '}
              there in local dev.
            </p>
          </div>
        ) : visible.length === 0 ? (
          <p className="font-mono text-sm text-slate-500">
            No decks found for this filter.
          </p>
        ) : (
          <>
            <div
              className={
                layout === 'grid'
                  ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'
                  : 'flex flex-col gap-4'
              }
            >
              {pageRows.map((deck) => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  layout={layout}
                  upvoted={deck.viewer_upvoted}
                  onUpvote={onUpvote}
                  onStudy={onStudy}
                />
              ))}
            </div>

            <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs md:flex-row">
              <div className="flex items-center gap-3 text-slate-500">
                <span className="material-symbols-outlined text-[20px] text-primary">
                  terminal
                </span>
                <span className="font-mono text-[12px] font-medium">
                  Showing {from}-{to} of {visible.length} community decks
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200/50 bg-slate-100 px-3 py-1.5 font-mono text-[12px] text-slate-400 enabled:cursor-pointer enabled:border-slate-200 enabled:bg-white enabled:text-slate-700 enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Previous
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map(
                  (n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      className={`rounded-lg px-3 py-1.5 font-mono text-[12px] shadow-xs ${
                        n === safePage
                          ? 'bg-primary font-semibold text-white'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {n}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  disabled={safePage >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-[12px] font-medium text-slate-700 shadow-xs enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
