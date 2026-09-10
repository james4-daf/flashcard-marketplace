import type { ReactNode } from 'react';
import type { Card } from '../types';

interface FlashcardProps {
  readonly card: Card;
  readonly flipped: boolean;
  readonly index: number;
  readonly total: number;
  readonly onFlip: () => void;
}

/**
 * A single interactive flashcard. Clicking (or Space, handled by the study
 * stage) flips the card in 3D to reveal the answer.
 */
export function Flashcard({
  card,
  flipped,
  index,
  total,
  onFlip,
}: FlashcardProps): ReactNode {
  const label = `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;

  return (
    <div
      className="card-scene h-[360px] w-full cursor-pointer select-none"
      role="button"
      tabIndex={0}
      aria-label={flipped ? 'Show question' : 'Reveal answer'}
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onFlip();
        }
      }}
    >
      <div className={`card-inner ${flipped ? 'is-flipped' : ''}`}>
        <div className="card-face rounded-lg border border-slate-200 bg-white p-1">
          <div className="flex h-full flex-col rounded-md border border-slate-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
              <span className="font-medium tracking-wide">{label}</span>
              <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5">
                [Space] to flip
              </span>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <p className="mb-3 font-mono text-[11px] font-semibold tracking-[0.08em] text-primary uppercase">
                Prompt
              </p>
              <p className="max-w-lg text-2xl font-semibold tracking-tight text-slate-900">
                {card.front}
              </p>
            </div>
          </div>
        </div>
        <div className="card-face card-face--back rounded-lg border border-slate-200 bg-white p-1">
          <div className="flex h-full flex-col rounded-md border border-indigo-100 bg-indigo-50/40 px-6 py-4">
            <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
              <span className="font-medium tracking-wide">{label}</span>
              <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5">
                [Space] to flip
              </span>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <p className="mb-3 font-mono text-[11px] font-semibold tracking-[0.08em] text-primary uppercase">
                Recall
              </p>
              <p className="max-w-lg text-2xl font-semibold tracking-tight text-slate-900">
                {card.back}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
