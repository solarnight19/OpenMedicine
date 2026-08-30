import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Bank, LibraryEntry, User } from "../lib/types";
import { EcgTrace, IconLogo, IconGrid, IconUpload, IconDoc, IconTarget, IconClock, IconBank, IconPlus, IconX, IconGlobe, IconLogout, IconHeart } from "./icons";

function Barcode() {
  const bars = [3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 1, 3, 1, 2, 4, 1, 2, 1];
  let x = 0;
  return (
    <svg viewBox="0 0 120 22" className="w-full h-5 opacity-40" preserveAspectRatio="none">
      {bars.map((w, i) => {
        const rect = <rect key={i} x={x} y="0" width={w * 1.4} height="22" fill="#f3f6f5" />;
        x += w * 1.4 + 2.2;
        return rect;
      })}
    </svg>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

interface ShellProps {
  activeKey: string;
  onNav: (key: string) => void;
  banks: Bank[];
  library: LibraryEntry[];
  favorites: string[];
  user: User;
  onLogout: () => void;
  activeBankId?: string;
  resetKey?: string;
  children: ReactNode;
}

export default function Shell({ activeKey, onNav, banks, library, favorites, user, onLogout, activeBankId, resetKey, children }: ShellProps) {
  const [drawer, setDrawer] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [resetKey]);

  const navItems = [
    { key: "overview", label: "Overview", icon: <IconGrid /> },
    { key: "banks", label: "My banks", icon: <IconBank /> },
    { key: "import", label: "Import CSV", icon: <IconUpload /> },
    { key: "format", label: "CSV Format", icon: <IconDoc /> },
    { key: "builder", label: "Test Builder", icon: <IconTarget /> },
    { key: "library", label: "Open Library", icon: <IconGlobe /> },
    { key: "history", label: "Results", icon: <IconClock /> },
  ];

  const favItems = favorites
    .map((ref) => {
      const bank = banks.find((b) => b.id === ref);
      if (bank) return { ref, label: bank.name, key: `bank:${bank.id}`, color: bank.color, count: bank.questions.length };
      const entry = library.find((e) => e.id === ref);
      if (entry) return { ref, label: entry.name, key: "library", color: entry.color, count: entry.questions.length };
      return null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const sidebar = (
    <div className="flex flex-col h-full ink-bg text-paper">
      {/* brand */}
      <button
        onClick={() => onNav("overview")}
        className="flex items-center gap-3 px-5 pt-5 pb-3 text-left cursor-pointer shrink-0"
      >
        <span className="text-[28px] text-[#57c4ae] shrink-0">
          <IconLogo />
        </span>
        <span>
          <span className="block font-display font-bold text-lg leading-none tracking-tight">OpenMedicine</span>
          <span className="block font-mono text-[9px] uppercase tracking-[0.22em] text-paper/45 mt-1">
            Banks in · exams out
          </span>
        </span>
      </button>
      <div className="px-4 text-[#57c4ae]">
        <EcgTrace className="w-full h-8" />
      </div>

      {/* nav */}
      <nav className="px-3 py-4 space-y-1 shrink-0">
        {navItems.map((n) => {
          const active = activeKey === n.key || (n.key === "banks" && activeKey === "banks" && activeBankId);
          return (
            <button
              key={n.key}
              onClick={() => {
                onNav(n.key);
                setDrawer(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-all duration-150 cursor-pointer ${
                active
                  ? "bg-paper/12 text-paper shadow-[inset_2.5px_0_0_#57c4ae]"
                  : "text-paper/60 hover:text-paper hover:bg-paper/6 hover:translate-x-0.5"
              }`}
            >
              <span className="text-[17px]">{n.icon}</span>
              {n.label}
              {n.key === "library" && library.length > 0 && (
                <span className="ml-auto font-mono text-[10px] text-paper/45 tabular-nums">{library.length}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* favourites + banks */}
      <div className="px-3 pb-4 flex-1 overflow-y-auto min-h-0 space-y-4">
        {favItems.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 px-3 mb-2">
              <IconHeart className="text-[12px] text-[#e0a53f]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/40">Favourites</span>
            </div>
            <div className="space-y-1">
              {favItems.map((f) => (
                <button
                  key={f.ref}
                  onClick={() => {
                    onNav(f.key);
                    setDrawer(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-paper/60 hover:text-paper hover:bg-paper/6 transition-all duration-150 cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: f.color }} />
                  <span className="flex-1 text-left truncate">{f.label}</span>
                  <span className="font-mono text-[10px] text-paper/40 tabular-nums">{f.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="px-3 mb-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/40">Question banks</span>
          </div>
          <div className="space-y-1">
            {banks.map((b) => {
              const active = activeKey === "banks" && activeBankId === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    onNav(`bank:${b.id}`);
                    setDrawer(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 cursor-pointer group ${
                    active ? "bg-paper/12 text-paper" : "text-paper/60 hover:text-paper hover:bg-paper/6"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-paper/10" style={{ background: b.color }} />
                  <span className="flex-1 text-left truncate">{b.name}</span>
                  {b.publishedEntryId && <IconGlobe className="text-[12px] text-[#57c4ae]" />}
                  <span className="font-mono text-[10px] text-paper/40 group-hover:text-paper/70 tabular-nums">
                    {b.questions.length}
                  </span>
                </button>
              );
            })}
            {banks.length === 0 && (
              <p className="px-3 text-[12px] text-paper/40 leading-relaxed">No banks yet — import a CSV to begin.</p>
            )}
          </div>
          <button
            onClick={() => {
              onNav("banks:new");
              setDrawer(false);
            }}
            className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-md text-[12px] font-semibold text-paper/50 border border-dashed border-paper/20 hover:border-paper/45 hover:text-paper transition-colors cursor-pointer"
          >
            <IconPlus /> New empty bank
          </button>
        </div>
      </div>

      {/* account card */}
      <div className="px-3 pt-3 border-t border-paper/10 shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md bg-paper/6 border border-paper/10">
          <span className="w-9 h-9 rounded-md bg-[#57c4ae] text-ink font-display font-bold text-[13px] flex items-center justify-center shrink-0">
            {initials(user.name)}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] font-bold leading-tight truncate">{user.name}</span>
            <span className="block font-mono text-[9.5px] text-paper/45 truncate">{user.email}</span>
          </span>
          <button
            onClick={onLogout}
            className="p-2 rounded-md text-paper/50 hover:text-paper hover:bg-paper/10 transition-colors cursor-pointer"
            aria-label="Sign out"
            title="Sign out"
          >
            <IconLogout />
          </button>
        </div>
      </div>

      {/* footer stamp */}
      <div className="px-5 py-3.5 shrink-0">
        <Barcode />
        <div className="flex items-center justify-between mt-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-paper/35">Form OM-01 · Rev A</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-paper/35">Local demo</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden">
      <aside className="hidden lg:block w-[256px] shrink-0">{sidebar}</aside>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/60 anim-fade-in" onClick={() => setDrawer(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[276px] anim-pop">{sidebar}</div>
          <button
            onClick={() => setDrawer(false)}
            className="absolute top-4 left-[288px] text-paper bg-ink/70 rounded-md p-2 cursor-pointer"
            aria-label="Close menu"
          >
            <IconX />
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 bg-ink text-paper shrink-0">
          <button onClick={() => setDrawer(true)} className="p-1.5 rounded hover:bg-paper/10 cursor-pointer" aria-label="Open menu">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <span className="text-[#57c4ae]"><IconLogo /></span>
          <span className="font-display font-bold tracking-tight">OpenMedicine</span>
          <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.2em] text-paper/40 flex items-center gap-1.5">
            <IconBank /> {banks.length} banks
          </span>
        </div>

        <main ref={mainRef} className="flex-1 overflow-y-auto paper-bg">{children}</main>
      </div>
    </div>
  );
}
