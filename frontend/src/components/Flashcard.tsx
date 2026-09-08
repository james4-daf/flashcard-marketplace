import { useState, type ReactNode } from 'react';
import type { Card } from '../types';

interface FlashcardProps {
  readonly card: Card;
}

/**
 * A single interactive flashcard. Clicking (or pressing Enter/Space) flips the
 * card in 3D to reveal the answer.
 */
export function Flashcard({ card }: FlashcardProps): ReactNode {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="card-scene h-72 w-full cursor-pointer select-none"
      role="button"
      tabIndex={0}
      aria-label={flipped ? 'Show question' : 'Reveal answer'}
      onClick={() => setFlipped((v) => !v)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setFlipped((v) => !v);
        }
      }}
    >
      <div className={`card-inner ${flipped ? 'is-flipped' : ''}`}>
        <div className="card-face rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 p-8 shadow-xl">
          <div className="text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-indigo-400">
              Question
            </p>
            <p className="text-2xl font-semibold text-slate-100">{card.front}</p>
            <p className="mt-6 text-xs text-slate-500">Click to flip</p>
          </div>
        </div>
        <div className="card-face card-face--back rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-600 to-fuchsia-600 p-8 shadow-xl">
          <div className="text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-indigo-100">
              Answer
            </p>
            <p className="text-2xl font-semibold text-white">{card.back}</p>
            <p className="mt-6 text-xs text-indigo-100/70">Click to flip back</p>
          </div>
        </div>
      </div>
    </div>
  );
}
