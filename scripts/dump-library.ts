/**
 * Snapshot decks owned by user_demo into scripts/library-seed.json.
 * That file is the portable copy: db:setup upserts it onto local or hosted Turso.
 *
 * Auth later attaches to the same user_demo row — do not change owner_id.
 */
import { createClient } from '@libsql/client';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const url = process.env.TURSO_DATABASE_URL ?? 'file:.turso/dev.db';
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;
const ownerId = process.env.LIBRARY_OWNER_ID ?? 'user_demo';
const outPath = join(dirname(fileURLToPath(import.meta.url)), 'library-seed.json');

function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug === '' ? 'deck' : slug;
}

async function main(): Promise<void> {
  const db = createClient({ url, authToken });
  const decks = await db.execute({
    sql: `SELECT id, title, topic, price_cents, is_public, slug
          FROM decks WHERE creator_id = ? ORDER BY id ASC`,
    args: [ownerId],
  });

  const dumped = [];
  const used = new Set<string>();
  for (const row of decks.rows) {
    const title = String(row.title);
    let slug = typeof row.slug === 'string' && row.slug !== '' ? row.slug : slugify(title);
    if (used.has(slug)) slug = `${slug}-${String(row.id)}`;
    used.add(slug);

    const cards = await db.execute({
      sql: 'SELECT front, back FROM cards WHERE deck_id = ? ORDER BY id ASC',
      args: [row.id],
    });
    dumped.push({
      slug,
      title,
      topic: String(row.topic),
      price_cents: Number(row.price_cents),
      is_public: Number(row.is_public) !== 0,
      cards: cards.rows.map((card) => ({
        front: String(card.front),
        back: String(card.back),
      })),
    });
  }
  db.close();

  const payload = { owner_id: ownerId, decks: dumped };
  writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
  assert.equal(payload.owner_id, ownerId);
  assert.ok(Array.isArray(payload.decks));
  console.log(`Wrote ${dumped.length} deck(s) to ${outPath}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
