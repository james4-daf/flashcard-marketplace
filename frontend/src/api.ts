import type {
  DeckDraft,
  DeckSummary,
  DeckWithCards,
  UpvoteResult,
} from './types';

const API_URL: string = (
  import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8787'
).replace(/\/$/, '');

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

export async function fetchLibrary(
  userId: string,
): Promise<readonly DeckWithCards[]> {
  const query = new URLSearchParams({ user_id: userId });
  const data = await request<{ decks: DeckWithCards[] }>(
    `/api/library?${query}`,
  );
  return data.decks;
}

export async function createDeck(
  userId: string,
  draft: DeckDraft,
): Promise<DeckSummary> {
  const data = await request<{ deck: DeckSummary }>('/api/decks', {
    method: 'POST',
    body: JSON.stringify({ creator_id: userId, ...draft }),
  });
  return data.deck;
}

export async function updateDeck(
  deckId: number,
  userId: string,
  draft: DeckDraft,
): Promise<DeckSummary> {
  const data = await request<{ deck: DeckSummary }>(`/api/decks/${deckId}`, {
    method: 'PUT',
    body: JSON.stringify({ user_id: userId, ...draft }),
  });
  return data.deck;
}
