import { useState, type ReactNode } from 'react';
import type { CardInput, DeckDraft, DeckWithCards } from '../types';

interface DeckEditorProps {
  readonly initial: DeckWithCards | null;
  readonly saving: boolean;
  readonly error: string | null;
  readonly onCancel: () => void;
  readonly onSave: (draft: DeckDraft) => Promise<void>;
}

const EMPTY_CARD: CardInput = { front: '', back: '' };

export function DeckEditor({
  initial,
  saving,
  error,
  onCancel,
  onSave,
}: DeckEditorProps): ReactNode {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [topic, setTopic] = useState(initial?.topic ?? '');
  const [price, setPrice] = useState(
    initial !== null && initial.price_cents > 0
      ? (initial.price_cents / 100).toFixed(2)
      : '',
  );
  const [isPublic, setIsPublic] = useState(initial?.is_public ?? true);
  const [cards, setCards] = useState<CardInput[]>(
    initial !== null && initial.cards.length > 0
      ? initial.cards.map((c) => ({ front: c.front, back: c.back }))
      : [{ ...EMPTY_CARD }, { ...EMPTY_CARD }],
  );

  const updateCard = (index: number, patch: Partial<CardInput>): void => {
    setCards((prev) =>
      prev.map((card, i) => (i === index ? { ...card, ...patch } : card)),
    );
  };

  const handleSubmit = async (): Promise<void> => {
    const filled = cards.filter(
      (c) => c.front.trim() !== '' && c.back.trim() !== '',
    );
    const dollars = Number(price);
    await onSave({
      title: title.trim(),
      topic: topic.trim(),
      price_cents:
        price.trim() === '' || Number.isNaN(dollars)
          ? 0
          : Math.round(dollars * 100),
      is_public: isPublic,
      cards: filled,
    });
  };

  return (
    <form
      className="mx-auto w-full max-w-[720px] space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
    >
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="font-mono text-[11px] font-medium tracking-wide text-slate-500 uppercase">
              Title
            </span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] font-medium tracking-wide text-slate-500 uppercase">
              Topic
            </span>
            <input
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Engineering"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] font-medium tracking-wide text-slate-500 uppercase">
              Price USD (blank = free)
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
            />
          </label>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
          />
          Listed on the marketplace
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Cards</h2>
          <button
            type="button"
            onClick={() => setCards((prev) => [...prev, { ...EMPTY_CARD }])}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-[12px] text-slate-700 hover:bg-slate-50"
          >
            Add card
          </button>
        </div>
        {cards.map((card, i) => (
          <div
            key={i}
            className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
          >
            <label className="block">
              <span className="font-mono text-[11px] text-slate-500">
                Front
              </span>
              <textarea
                rows={3}
                value={card.front}
                onChange={(e) => updateCard(i, { front: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[11px] text-slate-500">Back</span>
              <textarea
                rows={3}
                value={card.back}
                onChange={(e) => updateCard(i, { back: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
              />
            </label>
            {cards.length > 1 ? (
              <button
                type="button"
                onClick={() =>
                  setCards((prev) => prev.filter((_, idx) => idx !== i))
                }
                className="justify-self-start font-mono text-[11px] text-slate-500 hover:text-rose-600 sm:col-span-2"
              >
                Remove
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {error !== null ? (
        <p className="text-sm text-rose-700">{error}</p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 font-mono text-[12px] font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save deck'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-mono text-[12px] text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
