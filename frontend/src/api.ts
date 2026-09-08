import type { DeckSummary, DeckWithCards, UpvoteResult } from './types';

// Empty by default: requests are same-origin ("/api/...") and go through the
// Vite dev proxy to the worker. Set VITE_API_URL to the deployed Worker URL in
// production.
const API_URL: string = import.meta.env.VITE_API_URL ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  if (!response.ok) {
    const message = await response
      .json()
      .then((body: unknown) =>
        typeof body === 'object' && body !== null && 'error' in body
          ? String((body as { error: unknown }).error)
          : response.statusText,
      )
      .catch(() => response.statusText);
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export async function fetchDecks(
  userId: string,
): Promise<readonly DeckSummary[]> {
  const query = new URLSearchParams({ user_id: userId });
  const data = await request<{ decks: DeckSummary[] }>(`/api/decks?${query}`);
  return data.decks;
}

export async function fetchDeck(id: number): Promise<DeckWithCards> {
  const data = await request<{ deck: DeckWithCards }>(`/api/decks/${id}`);
  return data.deck;
}

export async function toggleUpvote(
  deckId: number,
  userId: string,
): Promise<UpvoteResult> {
  return request<UpvoteResult>(`/api/decks/${deckId}/upvote`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });
}
