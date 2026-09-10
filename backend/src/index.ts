import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import {
  colBoolean,
  colNumber,
  colString,
  createDbClient,
} from './db';
import type {
  Card,
  CardInput,
  CreateDeckInput,
  DeckSummary,
  DeckWithCards,
  Env,
  UpvoteResult,
} from './types';
import type { Client, Row } from '@libsql/client/web';

const app = new Hono<{ Bindings: Env }>();

app.use('/api/*', cors());

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

app.get('/', (c) =>
  c.json({ service: 'flashcard-marketplace-api', status: 'ok' }),
);

app.get('/api/health', async (c) => {
  const db = createDbClient(c.env);
  const result = await db.execute('SELECT 1 AS ok');
  return c.json({ ok: result.rows.length === 1 });
});

/**
 * GET /api/decks
 * Returns public decks sorted by total upvote count (desc).
 */
app.get('/api/decks', async (c) => {
  const db = createDbClient(c.env);
  const viewerId = c.req.query('user_id') ?? '';
  const result = await db.execute({
    sql: `
      SELECT
        d.id            AS id,
        d.creator_id    AS creator_id,
        u.email         AS creator_email,
        d.title         AS title,
        d.topic         AS topic,
        d.price_cents   AS price_cents,
        d.is_public     AS is_public,
        COUNT(DISTINCT uv.user_id) AS upvote_count,
        COUNT(DISTINCT ca.id)      AS card_count,
        MAX(CASE WHEN uv.user_id = ? THEN 1 ELSE 0 END) AS viewer_upvoted
      FROM decks d
      JOIN users u        ON u.id = d.creator_id
      LEFT JOIN upvotes uv ON uv.deck_id = d.id
      LEFT JOIN cards ca   ON ca.deck_id = d.id
      WHERE d.is_public = 1
      GROUP BY d.id
      ORDER BY upvote_count DESC, d.id ASC
    `,
    args: [viewerId],
  });

  return c.json({ decks: result.rows.map(mapDeckSummary) });
});

/**
 * GET /api/library
 * Decks the user created (public or private), each with cards.
 * Durable identity is creator_id (user_demo until auth attaches to that row).
 */
app.get('/api/library', async (c) => {
  const userId = c.req.query('user_id');
  if (userId === undefined || userId.trim() === '') {
    throw new HTTPException(400, { message: 'Missing "user_id"' });
  }
  const db = createDbClient(c.env);

  const result = await db.execute({
    sql: `
      SELECT
        d.id            AS id,
        d.creator_id    AS creator_id,
        u.email         AS creator_email,
        d.title         AS title,
        d.topic         AS topic,
        d.price_cents   AS price_cents,
        d.is_public     AS is_public,
        COUNT(DISTINCT uv.user_id) AS upvote_count,
        COUNT(DISTINCT ca.id)      AS card_count,
        MAX(CASE WHEN uv.user_id = ? THEN 1 ELSE 0 END) AS viewer_upvoted
      FROM decks d
      JOIN users u        ON u.id = d.creator_id
      LEFT JOIN upvotes uv ON uv.deck_id = d.id
      LEFT JOIN cards ca   ON ca.deck_id = d.id
      WHERE d.creator_id = ?
      GROUP BY d.id
      ORDER BY d.id DESC
    `,
    args: [userId, userId],
  });

  const decks: DeckWithCards[] = [];
  // ponytail: N+1 card fetches; ceiling is the owner's deck count. Join/IN if it grows.
  for (const row of result.rows) {
    const summary = mapDeckSummary(row);
    const cardsResult = await db.execute({
      sql: 'SELECT id, deck_id, front, back FROM cards WHERE deck_id = ? ORDER BY id ASC',
      args: [summary.id],
    });
    decks.push({
      ...summary,
      cards: cardsResult.rows.map(mapCard),
    });
  }

  return c.json({ decks });
});

/**
 * GET /api/decks/:id
 * Returns a single deck with its cards (powers the study view).
 */
app.get('/api/decks/:id', async (c) => {
  const deckId = parseId(c.req.param('id'));
  const viewerId = c.req.query('user_id') ?? '';
  const db = createDbClient(c.env);

  const deckResult = await db.execute({
    sql: `
      SELECT
        d.id            AS id,
        d.creator_id    AS creator_id,
        u.email         AS creator_email,
        d.title         AS title,
        d.topic         AS topic,
        d.price_cents   AS price_cents,
        d.is_public     AS is_public,
        COUNT(DISTINCT uv.user_id) AS upvote_count,
        COUNT(DISTINCT ca.id)      AS card_count,
        MAX(CASE WHEN uv.user_id = ? THEN 1 ELSE 0 END) AS viewer_upvoted
      FROM decks d
      JOIN users u        ON u.id = d.creator_id
      LEFT JOIN upvotes uv ON uv.deck_id = d.id
      LEFT JOIN cards ca   ON ca.deck_id = d.id
      WHERE d.id = ?
      GROUP BY d.id
    `,
    args: [viewerId, deckId],
  });

  const deckRow = deckResult.rows[0];
  if (deckRow === undefined) {
    throw new HTTPException(404, { message: `Deck ${deckId} not found` });
  }

  const cardsResult = await db.execute({
    sql: 'SELECT id, deck_id, front, back FROM cards WHERE deck_id = ? ORDER BY id ASC',
    args: [deckId],
  });

  const deck: DeckWithCards = {
    ...mapDeckSummary(deckRow),
    cards: cardsResult.rows.map(mapCard),
  };

  return c.json({ deck });
});

/**
 * POST /api/decks
 * Creates a new deck (and optionally its cards).
 */
app.post('/api/decks', async (c) => {
  const input = parseCreateDeckInput(await readJson(c.req.raw));
  const db = createDbClient(c.env);

  const creator = await db.execute({
    sql: 'SELECT email FROM users WHERE id = ?',
    args: [input.creator_id],
  });
  const creatorRow = creator.rows[0];
  if (creatorRow === undefined) {
    throw new HTTPException(400, {
      message: `Unknown creator_id: ${input.creator_id}`,
    });
  }

  const slug = await uniqueSlug(db, slugify(input.title));
  const insertDeck = await db.execute({
    sql: `INSERT INTO decks (creator_id, title, topic, price_cents, is_public, slug)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      input.creator_id,
      input.title,
      input.topic,
      input.price_cents,
      input.is_public ? 1 : 0,
      slug,
    ],
  });

  const newId = insertDeck.lastInsertRowid;
  if (newId === undefined) {
    throw new HTTPException(500, { message: 'Failed to create deck' });
  }
  const deckId = Number(newId);

  if (input.cards.length > 0) {
    await db.batch(
      input.cards.map((card) => ({
        sql: 'INSERT INTO cards (deck_id, front, back) VALUES (?, ?, ?)',
        args: [deckId, card.front, card.back],
      })),
      'write',
    );
  }

  const deck: DeckSummary = {
    id: deckId,
    creator_id: input.creator_id,
    creator_email: colString(creatorRow, 'email'),
    title: input.title,
    topic: input.topic,
    price_cents: input.price_cents,
    is_public: input.is_public,
    upvote_count: 0,
    card_count: input.cards.length,
    viewer_upvoted: false,
  };

  return c.json({ deck }, 201);
});

/**
 * PUT /api/decks/:id
 * Replace title/topic/price/visibility/cards. Owner only.
 * Slug is kept so the same deck survives dump → hosted Turso.
 */
app.put('/api/decks/:id', async (c) => {
  const deckId = parseId(c.req.param('id'));
  const body = await readJson(c.req.raw);
  const userId = requireString(body, 'user_id');
  const title = requireString(body, 'title');
  const topic = requireString(body, 'topic');
  const priceCents = optionalNumber(body, 'price_cents', 0);
  const isPublic = optionalBoolean(body, 'is_public', true);
  const cards = parseCards(body);

  const db = createDbClient(c.env);
  const existing = await db.execute({
    sql: 'SELECT creator_id, slug FROM decks WHERE id = ?',
    args: [deckId],
  });
  const row = existing.rows[0];
  if (row === undefined) {
    throw new HTTPException(404, { message: `Deck ${deckId} not found` });
  }
  if (colString(row, 'creator_id') !== userId) {
    throw new HTTPException(403, { message: 'Not the deck owner' });
  }

  const currentSlug = row.slug;
  const slug =
    typeof currentSlug === 'string' && currentSlug !== ''
      ? currentSlug
      : await uniqueSlug(db, slugify(title));

  await db.execute({
    sql: `UPDATE decks
          SET title = ?, topic = ?, price_cents = ?, is_public = ?, slug = ?
          WHERE id = ?`,
    args: [title, topic, priceCents, isPublic ? 1 : 0, slug, deckId],
  });
  await db.execute({
    sql: 'DELETE FROM cards WHERE deck_id = ?',
    args: [deckId],
  });
  if (cards.length > 0) {
    await db.batch(
      cards.map((card) => ({
        sql: 'INSERT INTO cards (deck_id, front, back) VALUES (?, ?, ?)',
        args: [deckId, card.front, card.back],
      })),
      'write',
    );
  }

  const creator = await db.execute({
    sql: 'SELECT email FROM users WHERE id = ?',
    args: [userId],
  });
  const deck: DeckSummary = {
    id: deckId,
    creator_id: userId,
    creator_email: colString(creator.rows[0]!, 'email'),
    title,
    topic,
    price_cents: priceCents,
    is_public: isPublic,
    upvote_count: 0,
    card_count: cards.length,
    viewer_upvoted: false,
  };
  return c.json({ deck });
});

/**
 * POST /api/decks/:id/upvote
 * Toggles the current user's upvote for a deck.
 */
app.post('/api/decks/:id/upvote', async (c) => {
  const deckId = parseId(c.req.param('id'));
  const body = await readJson(c.req.raw);
  const userId = requireString(body, 'user_id');
  const db = createDbClient(c.env);

  const [deckExists, userExists] = await Promise.all([
    db.execute({ sql: 'SELECT id FROM decks WHERE id = ?', args: [deckId] }),
    db.execute({ sql: 'SELECT id FROM users WHERE id = ?', args: [userId] }),
  ]);
  if (deckExists.rows.length === 0) {
    throw new HTTPException(404, { message: `Deck ${deckId} not found` });
  }
  if (userExists.rows.length === 0) {
    throw new HTTPException(400, { message: `Unknown user_id: ${userId}` });
  }

  const existing = await db.execute({
    sql: 'SELECT 1 FROM upvotes WHERE user_id = ? AND deck_id = ?',
    args: [userId, deckId],
  });

  let upvoted: boolean;
  if (existing.rows.length > 0) {
    await db.execute({
      sql: 'DELETE FROM upvotes WHERE user_id = ? AND deck_id = ?',
      args: [userId, deckId],
    });
    upvoted = false;
  } else {
    await db.execute({
      sql: 'INSERT INTO upvotes (user_id, deck_id) VALUES (?, ?)',
      args: [userId, deckId],
    });
    upvoted = true;
  }

  const countResult = await db.execute({
    sql: 'SELECT COUNT(*) AS upvote_count FROM upvotes WHERE deck_id = ?',
    args: [deckId],
  });

  const result: UpvoteResult = {
    deck_id: deckId,
    upvoted,
    upvote_count: colNumber(countResult.rows[0]!, 'upvote_count'),
  };
  return c.json(result);
});

// ---------------------------------------------------------------------------
// Request parsing / validation helpers (kept dependency-free & strictly typed)
// ---------------------------------------------------------------------------

async function readJson(req: Request): Promise<Record<string, unknown>> {
  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    throw new HTTPException(400, { message: 'Request body must be valid JSON' });
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new HTTPException(400, { message: 'Request body must be a JSON object' });
  }
  return parsed as Record<string, unknown>;
}

function parseId(raw: string | undefined): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HTTPException(400, { message: `Invalid id: ${raw}` });
  }
  return id;
}

function requireString(obj: Record<string, unknown>, key: string): string {
  const value = obj[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new HTTPException(400, { message: `Missing or invalid "${key}"` });
  }
  return value;
}

function optionalNumber(
  obj: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = obj[key];
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new HTTPException(400, { message: `Invalid "${key}"` });
  }
  return value;
}

function optionalBoolean(
  obj: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  const value = obj[key];
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'boolean') {
    throw new HTTPException(400, { message: `Invalid "${key}"` });
  }
  return value;
}

function mapDeckSummary(row: Row): DeckSummary {
  return {
    id: colNumber(row, 'id'),
    creator_id: colString(row, 'creator_id'),
    creator_email: colString(row, 'creator_email'),
    title: colString(row, 'title'),
    topic: colString(row, 'topic'),
    price_cents: colNumber(row, 'price_cents'),
    is_public: colBoolean(row, 'is_public'),
    upvote_count: colNumber(row, 'upvote_count'),
    card_count: colNumber(row, 'card_count'),
    viewer_upvoted: colBoolean(row, 'viewer_upvoted'),
  };
}

function mapCard(row: Row): Card {
  return {
    id: colNumber(row, 'id'),
    deck_id: colNumber(row, 'deck_id'),
    front: colString(row, 'front'),
    back: colString(row, 'back'),
  };
}

function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug === '' ? 'deck' : slug;
}

async function uniqueSlug(db: Client, base: string): Promise<string> {
  let slug = base;
  let n = 2;
  for (;;) {
    const found = await db.execute({
      sql: 'SELECT 1 FROM decks WHERE slug = ?',
      args: [slug],
    });
    if (found.rows.length === 0) return slug;
    slug = `${base}-${n}`;
    n += 1;
  }
}

function parseCards(obj: Record<string, unknown>): CardInput[] {
  const rawCards = obj.cards;
  if (rawCards === undefined || rawCards === null) return [];
  if (!Array.isArray(rawCards)) {
    throw new HTTPException(400, { message: '"cards" must be an array' });
  }
  const cards: CardInput[] = [];
  for (const entry of rawCards) {
    if (typeof entry !== 'object' || entry === null) {
      throw new HTTPException(400, { message: 'Each card must be an object' });
    }
    const card = entry as Record<string, unknown>;
    cards.push({
      front: requireString(card, 'front'),
      back: requireString(card, 'back'),
    });
  }
  return cards;
}

function parseCreateDeckInput(obj: Record<string, unknown>): CreateDeckInput {
  return {
    creator_id: requireString(obj, 'creator_id'),
    title: requireString(obj, 'title'),
    topic: requireString(obj, 'topic'),
    price_cents: optionalNumber(obj, 'price_cents', 0),
    is_public: optionalBoolean(obj, 'is_public', true),
    cards: parseCards(obj),
  };
}

export default app;
