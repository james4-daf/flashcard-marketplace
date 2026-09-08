import { useMemo, useState, type ReactNode } from 'react';
import type { DeckSummary } from '../types';
import { DeckCard } from './DeckCard';

interface MarketplaceProps {
  readonly decks: readonly DeckSummary[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly onUpvote: (deck: DeckSummary) => Promise<void>;
  readonly onStudy: (deck: DeckSummary) => void;
}

const ALL_TOPICS = 'All';

export function Marketplace({
  decks,
  loading,
  error,
  onUpvote,
  onStudy,
}: MarketplaceProps): ReactNode {
  const [topic, setTopic] = useState<string>(ALL_TOPICS);

  const topics = useMemo(() => {
    const set = new Set<string>();
    for (const deck of decks) set.add(deck.topic);
    return [ALL_TOPICS, ...Array.from(set).sort()];
  }, [decks]);

  const visible = useMemo(
    () => (topic === ALL_TOPICS ? decks : decks.filter((d) => d.topic === topic)),
    [decks, topic],
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-56 animate-pulse rounded-2xl border border-white/10 bg-slate-900/60"
          />
        ))}
      </div>
    );
  }

  if (error !== null) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200">
        <p className="font-semibold">Could not load the marketplace</p>
        <p className="mt-1 text-sm text-rose-300/80">{error}</p>
        <p className="mt-3 text-sm text-rose-300/60">
          Is the API running on <code>VITE_API_URL</code>?
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {topics.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTopic(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              topic === t
                ? 'bg-indigo-500 text-white'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-slate-400">No decks found for this topic.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              upvoted={deck.viewer_upvoted}
              onUpvote={onUpvote}
              onStudy={onStudy}
            />
          ))}
        </div>
      )}
    </div>
  );
}
