import { useMemo, useState, type ReactNode } from 'react';
import type { DeckDraft, DeckSummary, DeckWithCards } from '../types';
import { formatPrice } from '../constants';
import { DeckEditor } from './DeckEditor';

interface LibraryProps {
  readonly decks: readonly DeckWithCards[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly search: string;
  readonly saving: boolean;
  readonly saveError: string | null;
  readonly onCreate: (draft: DeckDraft) => Promise<void>;
  readonly onUpdate: (deckId: number, draft: DeckDraft) => Promise<void>;
  readonly onStudy: (deck: DeckSummary) => void;
}

export function Library({
  decks,
  loading,
  error,
  search,
  saving,
  saveError,
  onCreate,
  onUpdate,
  onStudy,
}: LibraryProps): ReactNode {
  const [editing, setEditing] = useState<DeckWithCards | 'new' | null>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q === '') return decks;
    return decks.filter((deck) =>
      [deck.title, deck.topic].join(' ').toLowerCase().includes(q),
    );
  }, [decks, search]);

  const exportJson = (): void => {
    const payload = {
      owner_id: 'user_demo',
      decks: decks.map((deck) => ({
        slug: deck.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
        title: deck.title,
        topic: deck.topic,
        price_cents: deck.price_cents,
        is_public: deck.is_public,
        cards: deck.cards.map((c) => ({ front: c.front, back: c.back })),
      })),
    };
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'library-seed.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex w-full flex-col">
      <div className="w-full border-b border-slate-200/80 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 py-8 sm:px-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-2xl space-y-1">
              <div className="font-mono text-[11px] font-semibold tracking-wider text-primary uppercase">
                Your decks
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Library
              </h1>
              <p className="text-sm leading-relaxed text-slate-600">
                Owned by you@flashcards.dev. Auth and hosting reuse this same
                user — make the deck once.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={exportJson}
                disabled={decks.length === 0}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-[12px] text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50"
              >
                Export JSON
              </button>
              <button
                type="button"
                onClick={() => setEditing('new')}
                className="rounded-lg bg-primary px-3 py-2 font-mono text-[12px] font-semibold text-white shadow-xs hover:bg-indigo-700"
              >
                New deck
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1280px] px-4 py-12 sm:px-6">
        {editing !== null ? (
          <DeckEditor
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? null : editing}
            saving={saving}
            error={saveError}
            onCancel={() => setEditing(null)}
            onSave={async (draft) => {
              try {
                if (editing === 'new') await onCreate(draft);
                else await onUpdate(editing.id, draft);
                setEditing(null);
              } catch {
                /* saveError is shown in the editor */
              }
            }}
          />
        ) : loading ? (
          <div className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white" />
        ) : error !== null ? (
          <p className="text-sm text-rose-700">{error}</p>
        ) : visible.length === 0 ? (
          <p className="font-mono text-sm text-slate-500">
            No decks yet. Create one — it stays yours after auth and hosting.
          </p>
        ) : (
          <ul className="space-y-3">
            {visible.map((deck) => (
              <li
                key={deck.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      {deck.title}
                    </h2>
                    <span className="font-mono text-[11px] text-slate-500">
                      {deck.topic}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {deck.card_count} cards
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {formatPrice(deck.price_cents)}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {deck.is_public ? 'public' : 'private'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(deck)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-[12px] text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onStudy(deck)}
                    className="rounded-lg bg-primary px-3 py-1.5 font-mono text-[12px] font-semibold text-white hover:bg-indigo-700"
                  >
                    Study
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
