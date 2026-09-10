import type { DeckSummary } from './types';

/** You. Auth later attaches to this same row — library decks stay yours. */
export const CURRENT_USER = {
  id: 'user_demo',
  email: 'you@flashcards.dev',
} as const;

/** Format a price in cents as USD, or "Free". */
export function formatPrice(cents: number): string {
  if (cents <= 0) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export interface DeckPresentation {
  readonly description: string;
  readonly tags: readonly string[];
  readonly feature: string | null;
  readonly rating: number | null;
  readonly reviews: number | null;
  readonly verified: boolean;
}

const VERIFIED_CREATORS = new Set([
  'ada@flashcards.dev',
  'linus@flashcards.dev',
]);

const BY_TITLE: Record<string, Omit<DeckPresentation, 'verified'>> = {
  'System Design Interview Pro': {
    description:
      'Targeted spaced-repetition drills covering CAP theorem, distributed storage replication, sharding topologies, and rate-limiter design.',
    tags: ['distributed-systems', 'caching', 'microservices'],
    feature: '18 diagrams',
    rating: 4.9,
    reviews: 184,
  },
  'Spanish Essentials A1': {
    description:
      'CEFR-aligned core lexicon with native phonetics, contextual verb conjugations, and active recall sentence templates.',
    tags: ['cefr-a1', 'grammar', 'conversational'],
    feature: 'Audio',
    rating: 4.8,
    reviews: 92,
  },
  'Cellular Biology 101': {
    description:
      'Mendelian genetics, CRISPR mechanisms, mitotic regulators, and biochemical pathways engineered for premed MCAT retention.',
    tags: ['biochemistry', 'mcat', 'pathology'],
    feature: 'High-res histology',
    rating: 4.7,
    reviews: 45,
  },
  'French Kitchen Vocabulary': {
    description:
      'Professional brigade de cuisine terminology, classical knife techniques, sauces, and culinary French jargon.',
    tags: ['gastronomy', 'vocabulary', 'delf-b1'],
    feature: 'Audio included',
    rating: 4.9,
    reviews: 31,
  },
};

/** Display extras for marketplace cards. Known seed decks match the redesign copy. */
export function presentDeck(deck: DeckSummary): DeckPresentation {
  const known = BY_TITLE[deck.title];
  return {
    description:
      known?.description ??
      `Peer-reviewed ${deck.topic.toLowerCase()} drills built for active recall and spaced retention.`,
    tags: known?.tags ?? [deck.topic.toLowerCase().replace(/\s+/g, '-')],
    feature: known?.feature ?? null,
    rating: known?.rating ?? null,
    reviews: known?.reviews ?? null,
    verified: VERIFIED_CREATORS.has(deck.creator_email),
  };
}
