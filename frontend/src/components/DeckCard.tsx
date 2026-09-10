import { useState, type ReactNode } from 'react';
import type { DeckSummary } from '../types';
import { formatPrice, presentDeck } from '../constants';

interface DeckCardProps {
  readonly deck: DeckSummary;
  readonly upvoted: boolean;
  readonly layout: 'grid' | 'list';
  readonly onUpvote: (deck: DeckSummary) => Promise<void>;
  readonly onStudy: (deck: DeckSummary) => void;
}

const TOPIC_THEME: Record<
  string,
  {
    badge: string;
    hoverBorder: string;
    hoverShadow: string;
    titleHover: string;
    voteHover: string;
    studyPaid: string;
  }
> = {
  Engineering: {
    badge:
      'bg-indigo-50 text-indigo-700 border-indigo-200/70',
    hoverBorder: 'hover:border-indigo-300',
    hoverShadow: 'hover:shadow-[0_8px_24px_rgba(79,70,229,0.08)]',
    titleHover: 'group-hover:text-primary',
    voteHover: 'group-hover/vote:text-primary',
    studyPaid: 'bg-primary hover:bg-indigo-700',
  },
  Languages: {
    badge:
      'bg-emerald-50 text-emerald-700 border-emerald-200/70',
    hoverBorder: 'hover:border-emerald-300',
    hoverShadow: 'hover:shadow-[0_8px_24px_rgba(5,150,105,0.08)]',
    titleHover: 'group-hover:text-emerald-600',
    voteHover: 'group-hover/vote:text-emerald-600',
    studyPaid: 'bg-slate-900 hover:bg-slate-800',
  },
  Science: {
    badge: 'bg-sky-50 text-sky-700 border-sky-200/70',
    hoverBorder: 'hover:border-sky-300',
    hoverShadow: 'hover:shadow-[0_8px_24px_rgba(2,132,199,0.08)]',
    titleHover: 'group-hover:text-secondary',
    voteHover: 'group-hover/vote:text-secondary',
    studyPaid: 'bg-slate-900 hover:bg-slate-800',
  },
};

const FALLBACK_THEME = {
  badge: 'bg-slate-100 text-slate-700 border-slate-200',
  hoverBorder: 'hover:border-slate-300',
  hoverShadow: 'hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]',
  titleHover: 'group-hover:text-primary',
  voteHover: 'group-hover/vote:text-primary',
  studyPaid: 'bg-slate-900 hover:bg-slate-800',
};

export function DeckCard({
  deck,
  upvoted,
  layout,
  onUpvote,
  onStudy,
}: DeckCardProps): ReactNode {
  const [busy, setBusy] = useState(false);
  const extra = presentDeck(deck);
  const theme = TOPIC_THEME[deck.topic] ?? FALLBACK_THEME;
  const free = deck.price_cents <= 0;
  const studyClass = free
    ? 'bg-emerald-600 hover:bg-emerald-700'
    : theme.studyPaid;

  const handleUpvote = async (): Promise<void> => {
    setBusy(true);
    try {
      await onUpvote(deck);
    } finally {
      setBusy(false);
    }
  };

  const upvoteButton = (
    <button
      type="button"
      onClick={handleUpvote}
      disabled={busy}
      aria-pressed={upvoted}
      className={`group/vote flex items-center gap-1 rounded-lg border px-3 py-1.5 font-mono text-[12px] font-medium transition-colors disabled:opacity-50 ${
        upvoted
          ? 'border-primary bg-indigo-50 text-primary'
          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
      }`}
    >
      <span
        className={`material-symbols-outlined text-[16px] transition-colors ${
          upvoted ? 'text-primary' : `text-slate-400 ${theme.voteHover}`
        }`}
        style={upvoted ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        stat_1
      </span>
      <span>+{deck.upvote_count}</span>
    </button>
  );

  const studyButton = (
    <button
      type="button"
      onClick={() => onStudy(deck)}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-1.5 font-mono text-[12px] font-semibold text-white shadow-xs transition-all active:scale-[0.98] ${layout === 'grid' ? 'flex-1' : ''} ${studyClass}`}
    >
      <span>{free ? 'Study Free' : 'Study Deck'}</span>
      <span className="material-symbols-outlined text-[16px]">
        {free ? 'play_arrow' : 'arrow_forward'}
      </span>
    </button>
  );

  if (layout === 'list') {
    return (
      <article
        className={`group flex flex-col gap-4 rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 sm:flex-row sm:items-center ${theme.hoverBorder} ${theme.hoverShadow}`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-[0.06em] uppercase ${theme.badge}`}
            >
              {deck.topic}
            </span>
            <span
              className={`font-mono text-[13px] font-bold tracking-tight ${
                free ? 'text-emerald-600' : 'text-slate-900'
              }`}
            >
              {formatPrice(deck.price_cents)}
            </span>
          </div>
          <h2
            className={`mt-2 text-base font-bold leading-snug text-slate-900 transition-colors ${theme.titleHover}`}
          >
            {deck.title}
          </h2>
          <p className="mt-1 font-mono text-[11px] text-slate-500">
            by {deck.creator_email}
            {extra.verified ? (
              <span
                className="material-symbols-outlined ml-1 align-middle text-[14px] text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
                title="Verified Author"
              >
                verified
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {upvoteButton}
          {studyButton}
        </div>
      </article>
    );
  }

  return (
    <article
      className={`group relative flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 ${theme.hoverBorder} ${theme.hoverShadow}`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-[0.06em] uppercase ${theme.badge}`}
          >
            {deck.topic}
          </span>
          <span
            className={`font-mono text-[13px] font-bold tracking-tight ${
              free ? 'text-emerald-600' : 'text-slate-900'
            }`}
          >
            {formatPrice(deck.price_cents)}
          </span>
        </div>

        <div className="space-y-1 pt-1">
          <h2
            className={`text-base font-bold leading-snug text-slate-900 transition-colors ${theme.titleHover}`}
          >
            {deck.title}
          </h2>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
            <span>by {deck.creator_email}</span>
            {extra.verified ? (
              <span
                className="material-symbols-outlined text-[14px] text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
                title="Verified Author"
              >
                verified
              </span>
            ) : null}
          </div>
        </div>

        <p className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-slate-500">
          <span>{deck.card_count} cards</span>
          {extra.feature !== null ? (
            <>
              <span>•</span>
              {extra.feature.toLowerCase().includes('audio') ? (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-slate-400">
                    volume_up
                  </span>
                  {extra.feature}
                </span>
              ) : (
                <span>{extra.feature}</span>
              )}
            </>
          ) : null}
          {extra.rating !== null && extra.reviews !== null ? (
            <>
              <span>•</span>
              <span className="flex items-center font-semibold text-amber-600">
                <span
                  className="material-symbols-outlined mr-0.5 text-[13px] text-amber-500"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                {extra.rating.toFixed(1)} ({extra.reviews})
              </span>
            </>
          ) : null}
        </p>

        <p className="line-clamp-2 text-[12px] leading-relaxed text-slate-600">
          {extra.description}
        </p>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {extra.tags.map((tag) => (
            <span
              key={tag}
              className="rounded border border-slate-200/70 bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        {upvoteButton}
        {studyButton}
      </div>
    </article>
  );
}
