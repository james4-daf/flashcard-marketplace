import type { ReactNode } from 'react';
import { CURRENT_USER } from '../constants';

interface LayoutProps {
  readonly children: ReactNode;
  readonly walletCents: number;
}

const NAV_ITEMS = [
  { label: 'Marketplace', icon: '🛒', active: true },
  { label: 'My Library', icon: '📚', active: false },
  { label: 'Creator Studio', icon: '🎨', active: false },
  { label: 'Wallet', icon: '💳', active: false },
] as const;

export function Layout({ children, walletCents }: LayoutProps): ReactNode {
  const wallet = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(walletCents / 100);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-slate-900/60 p-6 backdrop-blur lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-lg font-black shadow-lg">
            F
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Flashcard</p>
            <p className="text-sm font-semibold leading-tight text-indigo-400">
              Marketplace
            </p>
          </div>
        </div>

        <nav className="mt-10 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                item.active
                  ? 'bg-indigo-500/15 text-indigo-300'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Wallet balance
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{wallet}</p>
          <p className="mt-1 text-xs text-slate-500">Credits bypass card fees</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-slate-950/80 px-6 py-4 backdrop-blur">
          <div>
            <h1 className="text-lg font-semibold">Marketplace</h1>
            <p className="text-sm text-slate-400">
              Discover community-ranked decks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300 lg:hidden">
              {wallet}
            </span>
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold">
                {CURRENT_USER.email.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-slate-300">{CURRENT_USER.email}</span>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
