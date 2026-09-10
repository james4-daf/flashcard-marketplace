/** Deck as returned by GET /api/decks. Mirrors the backend DeckSummary. */
export interface DeckSummary {
  readonly id: number;
  readonly creator_id: string;
  readonly creator_email: string;
  readonly title: string;
  readonly topic: string;
  readonly price_cents: number;
  readonly is_public: boolean;
  readonly upvote_count: number;
  readonly card_count: number;
  readonly viewer_upvoted: boolean;
}

/** A single flashcard. */
export interface Card {
  readonly id: number;
  readonly deck_id: number;
  readonly front: string;
  readonly back: string;
}

/** Deck with cards, returned by GET /api/decks/:id. */
export interface DeckWithCards extends DeckSummary {
  readonly cards: readonly Card[];
}

/** Result of POST /api/decks/:id/upvote. */
export interface UpvoteResult {
  readonly deck_id: number;
  readonly upvoted: boolean;
  readonly upvote_count: number;
}

export interface CardInput {
  readonly front: string;
  readonly back: string;
}

export interface DeckDraft {
  readonly title: string;
  readonly topic: string;
  readonly price_cents: number;
  readonly is_public: boolean;
  readonly cards: readonly CardInput[];
}
