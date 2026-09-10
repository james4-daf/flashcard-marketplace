import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { DeckSummary, DeckWithCards } from '../types';
import { fetchDeck } from '../api';
import { Flashcard } from './Flashcard';

interface StudyModalProps {
  readonly deck: DeckSummary;
  readonly onClose: () => void;
}

const RATINGS = [
  {
    key: '1',
    label: 'Again',
    hover: 'enabled:hover:border-red-500 enabled:hover:text-red-600',
  },
  {
    key: '2',
    label: 'Hard',
    hover: 'enabled:hover:border-orange-500 enabled:hover:text-orange-600',
  },
  {
    key: '3',
    label: 'Good',
    hover: 'enabled:hover:border-primary enabled:hover:text-primary',
  },
  {
    key: '4',
    label: 'Easy',
    hover: 'enabled:hover:border-emerald-500 enabled:hover:text-emerald-600',
  },
] as const;

export function StudyModal({ deck, onClose }: StudyModalProps): ReactNode {
  const [detail, setDetail] = useState<DeckWithCards | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

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

  const cards = detail?.cards ?? [];
  const current = cards[index];
  const total = cards.length;

  const goNext = (): void => {
    if (total === 0) return;
    setFlipped(false);
    setIndex((i) => Math.min(total - 1, i + 1));
  };

  const goPrev = (): void => {
    if (total === 0) return;
    setFlipped(false);
    setIndex((i) => Math.max(0, i - 1));
  };

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const typing =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement;
      if (typing) return;
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        setFlipped((v) => !v);
        return;
      }
      if (['1', '2', '3', '4'].includes(e.key) && flipped) {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipped, onClose, total]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="w-full max-w-[720px] rounded-xl border border-slate-300 bg-white p-6 shadow-[0_12px_24px_-4px_rgba(15,23,42,0.08),0_4px_8px_-2px_rgba(15,23,42,0.04)] outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-semibold tracking-[0.08em] text-primary uppercase">
              {deck.topic}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              {deck.title}
            </h2>
            <p className="font-mono text-[12px] text-slate-500">
              by {deck.creator_email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-200 bg-white px-3 py-1.5 font-mono text-[12px] text-slate-600 hover:bg-slate-50"
          >
            Esc
          </button>
        </div>

        <div className="mt-6">
          {error !== null ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </p>
          ) : detail === null ? (
            <div className="flex h-[360px] items-center justify-center font-mono text-sm text-slate-400">
              Loading cards…
            </div>
          ) : total === 0 ? (
            <div className="flex h-[360px] items-center justify-center font-mono text-sm text-slate-400">
              This deck has no cards yet.
            </div>
          ) : current !== undefined ? (
            <>
              <Flashcard
                key={current.id}
                card={current}
                flipped={flipped}
                index={index}
                total={total}
                onFlip={() => setFlipped((v) => !v)}
              />
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {RATINGS.map((rating) => (
                  <button
                    key={rating.key}
                    type="button"
                    disabled={!flipped}
                    onClick={goNext}
                    className={`flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-[12px] font-medium text-slate-700 transition-colors disabled:opacity-40 ${rating.hover}`}
                  >
                    <span>{rating.label}</span>
                    <kbd className="rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500">
                      {rating.key}
                    </kbd>
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={goPrev}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-[12px] text-slate-600 transition enabled:hover:bg-slate-50 disabled:opacity-40"
                >
                  ← Previous
                </button>
                <span className="font-mono text-[12px] text-slate-500">
                  {index + 1} / {total}
                </span>
                <button
                  type="button"
                  disabled={index >= total - 1}
                  onClick={goNext}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-[12px] text-slate-600 transition enabled:hover:bg-slate-50 disabled:opacity-40"
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
