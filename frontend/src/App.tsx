import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Layout } from './components/Layout';
import { Marketplace } from './components/Marketplace';
import { StudyModal } from './components/StudyModal';
import { fetchDecks, toggleUpvote } from './api';
import { CURRENT_USER } from './constants';
import type { DeckSummary } from './types';

function sortByRanking(decks: readonly DeckSummary[]): DeckSummary[] {
  return [...decks].sort(
    (a, b) => b.upvote_count - a.upvote_count || a.id - b.id,
  );
}

export function App(): ReactNode {
  const [decks, setDecks] = useState<readonly DeckSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studying, setStudying] = useState<DeckSummary | null>(null);

  useEffect(() => {
    let active = true;
    fetchDecks(CURRENT_USER.id)
      .then((data) => {
        if (active) {
          setDecks(sortByRanking(data));
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleUpvote = useCallback(async (deck: DeckSummary): Promise<void> => {
    const result = await toggleUpvote(deck.id, CURRENT_USER.id);
    setDecks((prev) =>
      sortByRanking(
        prev.map((d) =>
          d.id === result.deck_id
            ? {
                ...d,
                upvote_count: result.upvote_count,
                viewer_upvoted: result.upvoted,
              }
            : d,
        ),
      ),
    );
  }, []);

  return (
    <>
      <Layout walletCents={1500}>
        <Marketplace
          decks={decks}
          loading={loading}
          error={error}
          onUpvote={handleUpvote}
          onStudy={setStudying}
        />
      </Layout>
      {studying !== null ? (
        <StudyModal deck={studying} onClose={() => setStudying(null)} />
      ) : null}
    </>
  );
}
