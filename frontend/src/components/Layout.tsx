import { useEffect, type ReactNode, type RefObject } from 'react';
import { CURRENT_USER, formatPrice } from '../constants';

interface LayoutProps {
  readonly children: ReactNode;
  readonly walletCents: number;
  readonly search: string;
  readonly onSearchChange: (value: string) => void;
  readonly searchRef: RefObject<HTMLInputElement | null>;
  readonly topics: readonly string[];
  readonly topic: string;
  readonly onTopicChange: (topic: string) => void;
  readonly page: 'marketplace' | 'library';
  readonly onPageChange: (page: 'marketplace' | 'library') => void;
}

export function Layout({
  children,
  walletCents,
  search,
  onSearchChange,
  searchRef,
  topics = [],
  topic,
  onTopicChange,
  page,
  onPageChange,
}: LayoutProps): ReactNode {
  const wallet = formatPrice(walletCents);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchRef]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface antialiased selection:bg-primary-fixed selection:text-primary">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 shadow-[0_1px_4px_rgba(0,0,0,0.03)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1280px] flex-col justify-center px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[24px]">
                  terminal
                </span>
                <span className="text-base font-semibold tracking-tight text-on-surface">
                  flashcards<span className="text-primary">.dev</span>
                </span>
              </div>
              <nav className="hidden items-center gap-1 sm:flex">
                {(
                  [
                    ['marketplace', 'Marketplace'],
                    ['library', 'Library'],
                  ] as const
                ).map(([id, label]) => {
                  const active = page === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-current={active ? 'page' : undefined}
                      onClick={() => onPageChange(id)}
                      className={`rounded-lg px-3 py-1.5 text-[13px] transition-colors ${
                        active
                          ? 'bg-primary font-medium text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </nav>
              <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium tracking-wide text-slate-500">
                v2.4
              </span>
            </div>

            <div className="hidden max-w-md flex-1 md:flex">
              <label className="relative flex w-full items-center">
                <span className="sr-only">Search decks, tags, creators</span>
                <span className="material-symbols-outlined pointer-events-none absolute left-3 text-[18px] text-slate-400">
                  search
                </span>
                <input
                  ref={searchRef}
                  type="search"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search decks, tags, creators..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-16 pl-10 text-sm text-slate-700 placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 focus:outline-none"
                />
                <kbd className="pointer-events-none absolute right-2 flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500 shadow-sm">
                  <span>⌘</span>
                  <span>K</span>
                </kbd>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50 px-3 py-1.5 font-mono text-[12px]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <span className="font-semibold text-emerald-700">{wallet}</span>
              </div>
              <button
                type="button"
                aria-label="Notifications"
                className="flex items-center justify-center rounded-lg border border-transparent p-2 text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-100 hover:text-slate-800"
              >
                <span className="material-symbols-outlined text-[20px]">
                  notifications
                </span>
              </button>
              <div className="flex cursor-default items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-0.5 pr-3 pl-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary shadow-xs">
                  <span className="material-symbols-outlined text-[16px] text-white">
                    person
                  </span>
                </div>
                <span className="hidden font-mono text-[12px] font-medium text-slate-600 lg:inline">
                  {CURRENT_USER.email}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center overflow-x-auto md:hidden">
            <label className="relative flex w-full items-center">
              <span className="sr-only">Search decks, tags, creators</span>
              <span className="material-symbols-outlined pointer-events-none absolute left-3 text-[18px] text-slate-400">
                search
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search decks, tags, creators..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-3 pl-10 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
              />
            </label>
          </div>

          <nav className="mt-2 flex items-center gap-2 overflow-x-auto py-0.5 sm:hidden">
            {(
              [
                ['marketplace', 'Marketplace'],
                ['library', 'Library'],
              ] as const
            ).map(([id, label]) => {
              const active = page === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => onPageChange(id)}
                  className={`whitespace-nowrap rounded-full px-3 py-1 text-[14px] transition-colors ${
                    active
                      ? 'bg-primary font-medium text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          {page === 'marketplace' ? (
          <nav className="mt-2 flex items-center gap-2 overflow-x-auto py-0.5">
            {topics.map((item) => {
              const active = item === topic;
              return (
                <button
                  key={item}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => onTopicChange(item)}
                  className={`whitespace-nowrap rounded-full px-3 py-1 text-[14px] transition-colors ${
                    active
                      ? 'bg-primary font-medium text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </nav>
          ) : null}
        </div>
      </header>

      <main className="w-full flex-1">{children}</main>

      <footer className="mt-12 w-full border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 px-4 sm:px-6 md:flex-row">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
            <span className="text-base font-bold text-slate-900">
              flashcards<span className="text-primary">.dev</span>
            </span>
            <span className="font-mono text-[12px] text-slate-500">
              Built for technical mastery &amp; spaced retention
            </span>
          </div>
          <div className="flex items-center gap-6 text-[14px] text-slate-500">
            <span>Terms</span>
            <span>Privacy</span>
            <span>API Docs</span>
            <span>Monetization</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
