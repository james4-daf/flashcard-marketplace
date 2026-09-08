import { useEffect, useState, type ReactNode } from 'react';
import type { DeckSummary, DeckWithCards } from '../types';
import { fetchDeck } from '../api';
import { Flashcard } from './Flashcard';

interface StudyModalProps {
  readonly deck: DeckSummary;
  readonly onClose: () => void;
}

export function StudyModal({ deck, onClose }: StudyModalProps): ReactNode {
  const [detail, setDetail] = useState<DeckWithCards | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let active = true;
    fetchDeck(deck.id)
      .then((d) => {
        if (active) setDetail(d);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load deck');
      });
    return () => {
      active = false;
    };
  }, [deck.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const cards = detail?.cards ?? [];
  const current = cards[index];
  const total = cards.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
              {deck.topic}
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-100">{deck.title}</h2>
            <p className="text-sm text-slate-400">by {deck.creator_email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="mt-6">
          {error !== null ? (
            <p className="rounded-xl bg-rose-500/10 p-4 text-sm text-rose-300">
              {error}
            </p>
          ) : detail === null ? (
            <div className="flex h-72 items-center justify-center text-slate-400">
              Loading cards…
            </div>
          ) : total === 0 ? (
            <div className="flex h-72 items-center justify-center text-slate-400">
              This deck has no cards yet.
            </div>
          ) : current !== undefined ? (
            <>
              <Flashcard key={current.id} card={current} />
              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition enabled:hover:bg-white/10 disabled:opacity-40"
                >
                  ← Previous
                </button>
                <span className="text-sm text-slate-400">
                  Card {index + 1} of {total}
                </span>
                <button
                  type="button"
                  disabled={index >= total - 1}
                  onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition enabled:hover:bg-white/10 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
