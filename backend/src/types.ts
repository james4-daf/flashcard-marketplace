/**
 * Cloudflare Worker bindings available on `c.env`.
 * Turso credentials are injected per-request from these bindings.
 */
export interface Env {
  readonly TURSO_DATABASE_URL: string;
  readonly TURSO_AUTH_TOKEN: string;
}

/** A user of the marketplace (subscriber and/or creator). */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly wallet_balance_cents: number;
  readonly is_premium: boolean;
}

/** A deck as returned by the marketplace listing, including aggregates. */
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

/** A single flashcard belonging to a deck. */
export interface Card {
  readonly id: number;
  readonly deck_id: number;
  readonly front: string;
  readonly back: string;
}

/** A deck plus its cards, used to power the study view. */
export interface DeckWithCards extends DeckSummary {
  readonly cards: readonly Card[];
}

/** Payload accepted by POST /api/decks. */
export interface CreateDeckInput {
  readonly creator_id: string;
  readonly title: string;
  readonly topic: string;
  readonly price_cents: number;
  readonly is_public: boolean;
  readonly cards: readonly CardInput[];
}

/** A card supplied when creating a deck. */
export interface CardInput {
  readonly front: string;
  readonly back: string;
}

/** Result of toggling an upvote. */
export interface UpvoteResult {
  readonly deck_id: number;
  readonly upvoted: boolean;
  readonly upvote_count: number;
}
