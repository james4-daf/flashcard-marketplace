import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Layout } from './components/Layout';
import { Marketplace } from './components/Marketplace';
import { Library } from './components/Library';
import { StudyModal } from './components/StudyModal';
import {
  createDeck,
  fetchDecks,
  fetchLibrary,
  toggleUpvote,
  updateDeck,
} from './api';
import { CURRENT_USER } from './constants';
import type { DeckDraft, DeckSummary, DeckWithCards } from './types';

const ALL_DECKS = 'All Decks';

export function App(): ReactNode {
  const [page, setPage] = useState<'marketplace' | 'library'>('marketplace');
  const [decks, setDecks] = useState<readonly DeckSummary[]>([]);
  const [mine, setMine] = useState<readonly DeckWithCards[]>([]);
  const [loading, setLoading] = useState(true);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [studying, setStudying] = useState<DeckSummary | null>(null);
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState(ALL_DECKS);
  const searchRef = useRef<HTMLInputElement>(null);

  const topics = useMemo(() => {
    const set = new Set<string>();
    for (const deck of decks) set.add(deck.topic);
    return [ALL_DECKS, ...Array.from(set).sort()];
  }, [decks]);

  const refreshMarketplace = useCallback(async (): Promise<void> => {
    const data = await fetchDecks(CURRENT_USER.id);
    setDecks(data);
    setError(null);
  }, []);

  const refreshLibrary = useCallback(async (): Promise<void> => {
    const data = await fetchLibrary(CURRENT_USER.id);
    setMine(data);
    setLibraryError(null);
  }, []);

  useEffect(() => {
    let active = true;
    fetchDecks(CURRENT_USER.id)
      .then((data) => {
        if (active) {
          setDecks(data);
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
    fetchLibrary(CURRENT_USER.id)
      .then((data) => {
        if (active) {
          setMine(data);
          setLibraryError(null);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setLibraryError(err instanceof Error ? err.message : 'Unknown error');
        }
      })
      .finally(() => {
        if (active) setLibraryLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleUpvote = useCallback(async (deck: DeckSummary): Promise<void> => {
    const result = await toggleUpvote(deck.id, CURRENT_USER.id);
    setDecks((prev) =>
      prev.map((d) =>
        d.id === result.deck_id
          ? {
              ...d,
              upvote_count: result.upvote_count,
              viewer_upvoted: result.upvoted,
            }
          : d,
      ),
    );
  }, []);

  const handleCreate = useCallback(
    async (draft: DeckDraft): Promise<void> => {
      setSaving(true);
      setSaveError(null);
      try {
        await createDeck(CURRENT_USER.id, draft);
        await Promise.all([refreshLibrary(), refreshMarketplace()]);
      } catch (err: unknown) {
        setSaveError(err instanceof Error ? err.message : 'Save failed');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [refreshLibrary, refreshMarketplace],
  );

  const handleUpdate = useCallback(
    async (deckId: number, draft: DeckDraft): Promise<void> => {
      setSaving(true);
      setSaveError(null);
      try {
        await updateDeck(deckId, CURRENT_USER.id, draft);
        await Promise.all([refreshLibrary(), refreshMarketplace()]);
      } catch (err: unknown) {
        setSaveError(err instanceof Error ? err.message : 'Save failed');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [refreshLibrary, refreshMarketplace],
  );

  return (
    <>
      <Layout
        walletCents={1500}
        search={search}
        onSearchChange={setSearch}
        searchRef={searchRef}
        topics={topics}
        topic={topic}
        onTopicChange={setTopic}
        page={page}
        onPageChange={setPage}
      >
        {page === 'library' ? (
          <Library
            decks={mine}
            loading={libraryLoading}
            error={libraryError}
            search={search}
            saving={saving}
            saveError={saveError}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
            onStudy={setStudying}
          />
        ) : (
          <Marketplace
            decks={decks}
            loading={loading}
            error={error}
            search={search}
            topic={topic}
            onUpvote={handleUpvote}
            onStudy={setStudying}
          />
        )}
      </Layout>
      {studying !== null ? (
        <StudyModal deck={studying} onClose={() => setStudying(null)} />
      ) : null}
    </>
  );
}
