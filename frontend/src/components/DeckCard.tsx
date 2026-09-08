import { useState, type ReactNode } from 'react';
import type { DeckSummary } from '../types';
import { formatPrice } from '../constants';

interface DeckCardProps {
  readonly deck: DeckSummary;
  readonly upvoted: boolean;
  readonly onUpvote: (deck: DeckSummary) => Promise<void>;
  readonly onStudy: (deck: DeckSummary) => void;
}

const TOPIC_COLORS: Record<string, string> = {
  Languages: 'bg-sky-500/15 text-sky-300',
  Engineering: 'bg-violet-500/15 text-violet-300',
  Science: 'bg-emerald-500/15 text-emerald-300',
};

export function DeckCard({
  deck,
  upvoted,
  onUpvote,
  onStudy,
}: DeckCardProps): ReactNode {
  const [busy, setBusy] = useState(false);
  const topicClass = TOPIC_COLORS[deck.topic] ?? 'bg-slate-500/15 text-slate-300';

  const handleUpvote = async (): Promise<void> => {
    setBusy(true);
    try {
      await onUpvote(deck);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="group flex flex-col rounded-2xl border border-white/10 bg-slate-900/60 p-5 transition hover:-translate-y-1 hover:border-indigo-400/40 hover:shadow-xl hover:shadow-indigo-500/10">
      <div className="flex items-center justify-between">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${topicClass}`}
        >
          {deck.topic}
        </span>
        <span
          className={`text-sm font-bold ${
            deck.price_cents <= 0 ? 'text-emerald-400' : 'text-slate-100'
          }`}
        >
          {formatPrice(deck.price_cents)}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-semibold text-slate-100">{deck.title}</h3>
      <p className="mt-1 text-sm text-slate-400">by {deck.creator_email}</p>

      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
        <span>{deck.card_count} cards</span>
      </div>

      <div className="mt-5 flex items-center gap-2 border-t border-white/5 pt-4">
        <button
          type="button"
          onClick={handleUpvote}
          disabled={busy}
          aria-pressed={upvoted}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-50 ${
            upvoted
              ? 'bg-indigo-500/20 text-indigo-300'
              : 'bg-white/5 text-slate-300 hover:bg-white/10'
          }`}
        >
          <span aria-hidden>▲</span>
          {deck.upvote_count}
        </button>
        <button
          type="button"
          onClick={() => onStudy(deck)}
          className="ml-auto rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:brightness-110"
        >
          Study
        </button>
      </div>
    </article>
  );
}
