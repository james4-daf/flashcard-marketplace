/**
 * Idempotent schema + seed for the Flashcard Marketplace libSQL database.
 *
 * By default this targets the local file that `turso dev` serves
 * (`.turso/dev.db`). It can also point at a remote Turso database by setting
 * TURSO_DATABASE_URL / TURSO_AUTH_TOKEN in the environment.
 *
 * Safe to run repeatedly: tables use `IF NOT EXISTS` and seed data is only
 * inserted when the users table is empty.
 */
import { createClient, type Client } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL ?? 'file:.turso/dev.db';
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

async function migrate(db: Client): Promise<void> {
  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        stripe_customer_id TEXT,
        stripe_connect_account_id TEXT,
        wallet_balance_cents INTEGER DEFAULT 0,
        is_premium INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS decks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        creator_id TEXT NOT NULL,
        title TEXT NOT NULL,
        topic TEXT NOT NULL,
        price_cents INTEGER DEFAULT 0,
        is_public INTEGER DEFAULT 1,
        FOREIGN KEY(creator_id) REFERENCES users(id)
      )`,
      // Extension beyond the reference schema: card content is required to
      // power the interactive study component.
      `CREATE TABLE IF NOT EXISTS cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deck_id INTEGER NOT NULL,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        FOREIGN KEY(deck_id) REFERENCES decks(id)
      )`,
      `CREATE TABLE IF NOT EXISTS upvotes (
        user_id TEXT,
        deck_id INTEGER,
        PRIMARY KEY(user_id, deck_id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(deck_id) REFERENCES decks(id)
      )`,
      `CREATE TABLE IF NOT EXISTS purchases (
        id TEXT PRIMARY KEY,
        buyer_id TEXT NOT NULL,
        deck_id INTEGER NOT NULL,
        amount_paid_cents INTEGER NOT NULL,
        purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(buyer_id) REFERENCES users(id),
        FOREIGN KEY(deck_id) REFERENCES decks(id)
      )`,
    ],
    'write',
  );
}

interface SeedCard {
  readonly front: string;
  readonly back: string;
}

interface SeedDeck {
  readonly creatorId: string;
  readonly title: string;
  readonly topic: string;
  readonly priceCents: number;
  readonly upvoters: readonly string[];
  readonly cards: readonly SeedCard[];
}

async function seed(db: Client): Promise<void> {
  const existing = await db.execute('SELECT COUNT(*) AS n FROM users');
  const count = Number(existing.rows[0]?.n ?? 0);
  if (count > 0) {
    console.log(`Seed skipped: ${count} users already present.`);
    return;
  }

  const users = [
    { id: 'user_demo', email: 'you@flashcards.dev', premium: 1, wallet: 1500 },
    { id: 'user_ada', email: 'ada@flashcards.dev', premium: 1, wallet: 4200 },
    { id: 'user_grace', email: 'grace@flashcards.dev', premium: 0, wallet: 800 },
    { id: 'user_linus', email: 'linus@flashcards.dev', premium: 1, wallet: 2600 },
  ];

  await db.batch(
    users.map((u) => ({
      sql: `INSERT INTO users (id, email, is_premium, wallet_balance_cents)
            VALUES (?, ?, ?, ?)`,
      args: [u.id, u.email, u.premium, u.wallet],
    })),
    'write',
  );

  const decks: SeedDeck[] = [
    {
      creatorId: 'user_ada',
      title: 'Spanish Essentials A1',
      topic: 'Languages',
      priceCents: 0,
      upvoters: ['user_demo', 'user_grace', 'user_linus'],
      cards: [
        { front: 'Hola', back: 'Hello' },
        { front: 'Gracias', back: 'Thank you' },
        { front: 'Por favor', back: 'Please' },
        { front: '¿Dónde está el baño?', back: 'Where is the bathroom?' },
      ],
    },
    {
      creatorId: 'user_linus',
      title: 'System Design Interview Pro',
      topic: 'Engineering',
      priceCents: 499,
      upvoters: ['user_demo', 'user_ada'],
      cards: [
        { front: 'What is a CDN?', back: 'A geographically distributed cache of static assets served close to users.' },
        { front: 'CAP theorem?', back: 'Consistency, Availability, Partition tolerance — pick two under partition.' },
        { front: 'Idempotency?', back: 'An operation that produces the same result no matter how many times it runs.' },
      ],
    },
    {
      creatorId: 'user_grace',
      title: 'Cellular Biology 101',
      topic: 'Science',
      priceCents: 299,
      upvoters: ['user_linus'],
      cards: [
        { front: 'Powerhouse of the cell?', back: 'The mitochondria' },
        { front: 'What does DNA stand for?', back: 'Deoxyribonucleic acid' },
        { front: 'Function of ribosomes?', back: 'Protein synthesis' },
      ],
    },
    {
      creatorId: 'user_ada',
      title: 'French Kitchen Vocabulary',
      topic: 'Languages',
      priceCents: 199,
      upvoters: [],
      cards: [
        { front: 'Le couteau', back: 'The knife' },
        { front: 'La fourchette', back: 'The fork' },
        { front: "L'assiette", back: 'The plate' },
      ],
    },
  ];

  for (const deck of decks) {
    const inserted = await db.execute({
      sql: `INSERT INTO decks (creator_id, title, topic, price_cents, is_public)
            VALUES (?, ?, ?, ?, 1)`,
      args: [deck.creatorId, deck.title, deck.topic, deck.priceCents],
    });
    const deckId = Number(inserted.lastInsertRowid);

    await db.batch(
      deck.cards.map((card) => ({
        sql: 'INSERT INTO cards (deck_id, front, back) VALUES (?, ?, ?)',
        args: [deckId, card.front, card.back],
      })),
      'write',
    );

    if (deck.upvoters.length > 0) {
      await db.batch(
        deck.upvoters.map((userId) => ({
          sql: 'INSERT INTO upvotes (user_id, deck_id) VALUES (?, ?)',
          args: [userId, deckId],
        })),
        'write',
      );
    }
  }

  console.log(`Seeded ${users.length} users and ${decks.length} decks.`);
}

async function main(): Promise<void> {
  const db = createClient({ url, authToken });
  console.log(`Setting up database at ${url}`);
  await migrate(db);
  await seed(db);
  db.close();
  console.log('Database setup complete.');
}

main().catch((err: unknown) => {
  console.error('Database setup failed:', err);
  process.exitCode = 1;
});
