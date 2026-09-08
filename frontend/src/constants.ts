/** The signed-in user for this Phase 1 foundation (auth arrives in a later phase). */
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
