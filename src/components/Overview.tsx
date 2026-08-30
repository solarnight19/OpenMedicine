import type { Bank, LibraryEntry, TestResult, User } from "../lib/types";
import { fmtDate } from "../lib/types";
import { Btn, Chip } from "./ui";
import { EcgTrace, IconUpload, IconTarget, IconBank, IconArrowR, IconSpark, IconDownload, IconChevronR, IconGlobe, IconHeart, IconStar } from "./icons";
import { downloadSampleCSV } from "../lib/csv";

function ScoreBars({ results }: { results: TestResult[] }) {
  const last = results.slice(0, 10).reverse();
  if (last.length === 0) return null;
  const w = 100 / last.length;
  return (
    <div>
      <div className="flex items-end gap-[3px] h-[72px]">
        {last.map((r, i) => {
          const pct = r.total > 0 ? (r.correct / r.total) * 100 : 0;
          const tone = pct >= 70 ? "#0e7c6b" : pct >= 40 ? "#bd7c16" : "#cd3d3d";
          return (
            <div
              key={r.id}
              className="group relative flex-1 rounded-t-[3px] transition-all duration-300 hover:opacity-80 cursor-default"
              style={{
                height: `${Math.max(pct, 4)}%`,
                background: tone,
                marginLeft: i === 0 ? 0 : 3,
                width: `calc(${w}% - 3px)`,
              }}
              title={`${r.name} — ${r.correct}/${r.total}`}
            >
              <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 bg-ink text-paper text-[10px] font-mono px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {Math.round(pct)}%
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="font-mono text-[9px] uppercase tracking-widest text-faint">oldest</span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-faint">latest</span>
      </div>
    </div>
  );
}

export default function Overview({
  banks,
  results,
  favorites,
  library,
  favCounts,
  user,
  onToggleFavorite,
  onNav,
}: {
  banks: Bank[];
  results: TestResult[];
  favorites: string[];
  library: LibraryEntry[];
  favCounts: Map<string, number>;
  user: User;
  onToggleFavorite: (ref: string) => void;
  onNav: (key: string) => void;
}) {
  const totalQs = banks.reduce((n, b) => n + b.questions.length, 0);
  const scored = results.filter((r) => r.total > 0);
  const avg = scored.length ? Math.round((scored.reduce((n, r) => n + r.correct / r.total, 0) / scored.length) * 100) : null;
  const best = scored.length ? Math.max(...scored.map((r) => Math.round((r.correct / r.total) * 100))) : null;
  const firstName = user.name.split(" ")[0];

  const vitals = [
    { label: "Question banks", value: banks.length, sub: banks.length === 1 ? "collection" : "collections" },
    { label: "Questions stored", value: totalQs, sub: "multiple choice" },
    { label: "Tests taken", value: results.length, sub: results.length === 1 ? "attempt" : "attempts" },
    { label: "Average score", value: avg === null ? "—" : `${avg}%`, sub: best === null ? "no tests yet" : `best ${best}%` },
    { label: "Favourites", value: favorites.length, sub: "saved banks" },
  ];

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Morning rounds" : hour < 18 ? "Afternoon rounds" : "Night rounds";

  return (
    <div className="max-w-[1060px] mx-auto px-5 sm:px-8 py-7">
      {/* chart masthead */}
      <header className="anim-fade-up">
        <div className="flex items-center justify-between gap-4 font-mono text-[10.5px] uppercase tracking-[0.2em] text-mute pb-2">
          <span>OpenMedicine · Candidate chart — {user.name}</span>
          <span className="hidden sm:block">{today}</span>
        </div>
        <div className="dash-t py-5 sm:py-6 flex flex-wrap items-center gap-x-8 gap-y-4">
          <div className="min-w-[240px]">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-moss mb-2">{greeting}</div>
            <h1 className="font-display font-bold text-[clamp(28px,4.4vw,44px)] leading-[1.04] tracking-tight text-ink">
              Welcome back,
              <br />
              <span className="text-moss">{firstName}.</span>
            </h1>
          </div>
          <div className="flex-1 min-w-[220px] max-w-[400px]">
            <p className="text-sm text-mute leading-relaxed">
              Import comma-separated questions into banks, favourite the keepers, publish your own to the open library —
              then drill everything into timed, scored multiple-choice tests.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Btn size="sm" onClick={() => onNav("import")}>
                <IconUpload /> Import CSV
              </Btn>
              <Btn size="sm" variant="ghost" onClick={() => onNav("library")}>
                <IconGlobe className="text-moss" /> Open library
              </Btn>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-center justify-center w-[120px] shrink-0">
            <div className="anim-stamp border-[2.5px] border-pen text-pen rounded px-2.5 py-1.5 text-center select-none">
              <div className="font-display font-bold text-[13px] tracking-[0.14em]">OM-01</div>
              <div className="font-mono text-[8px] tracking-[0.2em]">ADMITTED</div>
            </div>
          </div>
        </div>
        <div className="text-moss dash-b pb-1">
          <EcgTrace className="w-full h-9" />
        </div>
      </header>

      {/* vitals strip */}
      <section className="mt-7 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 stagger">
        {vitals.map((s) => (
          <div
            key={s.label}
            className="bg-card border border-line rounded-md px-5 py-4 hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">{s.label}</div>
            <div className="font-display font-bold text-[28px] leading-none text-ink mt-2 tabular-nums">{s.value}</div>
            <div className="text-[11.5px] text-faint mt-1">{s.sub}</div>
          </div>
        ))}
      </section>

      {/* main grid */}
      <section className="mt-7 grid lg:grid-cols-[1.6fr_1fr] gap-5 items-start">
        {/* recent results */}
        <div className="bg-card border border-line rounded-md anim-fade-up">
          <div className="flex items-center justify-between px-5 py-3.5 dash-b">
            <h2 className="font-display font-bold text-lg text-ink">Recent tests</h2>
            <button
              onClick={() => onNav("history")}
              className="flex items-center gap-1 text-[12.5px] font-semibold text-moss hover:text-moss-deep transition-colors cursor-pointer"
            >
              All results <IconArrowR className="text-sm" />
            </button>
          </div>
          {results.length === 0 ? (
            <div className="px-5 py-9 text-center">
              <p className="text-sm text-mute">No tests on record yet.</p>
              <p className="text-[12.5px] text-faint mt-1">
                You have {totalQs} question{totalQs === 1 ? "" : "s"} ready —{" "}
                <button onClick={() => onNav("builder")} className="font-semibold text-moss hover:underline cursor-pointer">
                  sit your first one
                </button>
                .
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {results.slice(0, 5).map((r) => {
                const pct = r.total ? Math.round((r.correct / r.total) * 100) : 0;
                const tone = pct >= 70 ? "text-moss-deep" : pct >= 40 ? "text-amber" : "text-pen";
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => onNav(`result:${r.id}`)}
                      className="w-full flex items-center gap-4 px-5 py-3 text-left hover:bg-moss-soft/40 transition-colors group cursor-pointer"
                    >
                      <span
                        className={`w-11 h-11 rounded-full border-2 flex items-center justify-center font-display font-bold text-[13px] shrink-0 ${tone} ${
                          pct >= 70 ? "border-moss bg-moss-soft" : pct >= 40 ? "border-amber bg-amber-soft" : "border-pen bg-pen-soft"
                        }`}
                      >
                        {pct}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-semibold text-[14px] text-ink truncate">{r.name}</span>
                        <span className="block font-mono text-[10.5px] text-faint mt-0.5">
                          {fmtDate(r.takenAt)} · {r.correct}/{r.total} correct
                        </span>
                      </span>
                      <IconChevronR className="text-mute group-hover:text-moss group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-5">
          {/* quick start */}
          <div className="bg-ink text-paper rounded-md p-5 anim-fade-up hover:shadow-pop transition-shadow">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/45 mb-3">Quick start</div>
            <div className="space-y-2">
              {[
                { icon: <IconUpload />, label: "Import a CSV of questions", key: "import" },
                { icon: <IconBank />, label: "Browse your question banks", key: "banks" },
                { icon: <IconGlobe />, label: "Clone a bank from the library", key: "library" },
                { icon: <IconTarget />, label: "Assemble a timed test", key: "builder" },
              ].map((a) => (
                <button
                  key={a.key}
                  onClick={() => onNav(a.key)}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-md bg-paper/8 border border-paper/10 hover:bg-paper/15 hover:border-paper/25 hover:translate-x-1 transition-all duration-150 text-left cursor-pointer group"
                >
                  <span className="text-[18px] text-[#57c4ae]">{a.icon}</span>
                  <span className="flex-1 text-sm font-semibold">{a.label}</span>
                  <IconArrowR className="text-paper/40 group-hover:text-paper group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>

          {/* score trend */}
          <div className="bg-card border border-line rounded-md p-5 anim-fade-up">
            <div className="flex items-center justify-between mb-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Score trend</div>
              <IconSpark className="text-amber" />
            </div>
            {results.length === 0 ? (
              <div className="h-[72px] flex items-center justify-center border border-dashed border-line-2 rounded">
                <span className="font-mono text-[10.5px] uppercase tracking-widest text-faint">awaiting first attempt</span>
              </div>
            ) : (
              <ScoreBars results={results} />
            )}
          </div>

          {/* csv teaser */}
          <div className="bg-card border border-line rounded-md p-5 anim-fade-up">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute mb-2.5">The shape of an import</div>
            <pre className="font-mono text-[10.5px] leading-relaxed bg-ink text-[#9fd6c6] rounded p-3 overflow-x-auto whitespace-pre">
{`prompt,answer,wrong_1,wrong_2,
wrong_3,explanation,tags,
difficulty`}
            </pre>
            <div className="flex gap-2 mt-3">
              <Btn size="sm" variant="soft" onClick={() => onNav("format")}>
                Full spec
              </Btn>
              <Btn size="sm" variant="ghost" onClick={downloadSampleCSV}>
                <IconDownload /> Sample .csv
              </Btn>
            </div>
            <div className="mt-3">
              <Chip tone="moss">header row required</Chip>
            </div>
          </div>
        </div>
      </section>

      {/* open library teaser */}
      <section className="mt-7 anim-fade-up">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-mute">From the Open Library</div>
            <h2 className="font-display font-bold text-xl text-ink mt-0.5">Published by the community</h2>
          </div>
          <Btn size="sm" variant="ghost" onClick={() => onNav("library")}>
            Browse all <IconArrowR />
          </Btn>
        </div>
        {library.length === 0 ? (
          <div className="border-2 border-dashed border-line-2 rounded-md px-6 py-8 text-center text-sm text-mute bg-card/60">
            Nothing published yet — your bank could be the first in the library.
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-3">
            {library.slice(0, 3).map((e) => {
              const fav = favorites.includes(e.id);
              return (
                <button
                  key={e.id}
                  onClick={() => onNav("library")}
                  className="text-left bg-card border border-line rounded-md p-4 hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="w-8 h-8 rounded-md flex items-center justify-center text-paper shrink-0" style={{ background: e.color }}>
                      <IconStar filled className="text-[13px]" />
                    </span>
                    <span
                      className={`flex items-center gap-1 font-mono text-[10.5px] tabular-nums ${fav ? "text-[#8a5a10]" : "text-faint"}`}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onToggleFavorite(e.id);
                      }}
                    >
                      <IconHeart filled={fav} /> {favCounts.get(e.id) ?? 0}
                    </span>
                  </div>
                  <div className="font-display font-bold text-[15px] text-ink leading-snug mt-2.5 group-hover:text-moss transition-colors">
                    {e.name}
                  </div>
                  <div className="text-[12px] text-mute mt-1">
                    {e.authorName} · {e.questions.length} questions
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* bank strip */}
      <section className="mt-7 mb-2 anim-fade-up">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-xl text-ink">Your banks</h2>
          <button
            onClick={() => onNav("banks")}
            className="flex items-center gap-1 text-[12.5px] font-semibold text-moss hover:text-moss-deep transition-colors cursor-pointer"
          >
            Manage <IconArrowR className="text-sm" />
          </button>
        </div>
        {banks.length === 0 ? (
          <div className="border-2 border-dashed border-line-2 rounded-md px-6 py-8 text-center text-sm text-mute bg-card/60">
            No banks on file — <button onClick={() => onNav("import")} className="font-semibold text-moss hover:underline cursor-pointer">import a CSV</button> or pull one from the library.
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {banks.map((b) => (
              <button
                key={b.id}
                onClick={() => onNav(`bank:${b.id}`)}
                className="shrink-0 w-[210px] text-left bg-card border border-line rounded-md overflow-hidden hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                <div className="hatch-band h-2" style={{ background: b.color }} />
                <div className="p-3.5">
                  <div className="font-display font-bold text-[14px] text-ink leading-snug truncate">{b.name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-faint mt-1">
                    {b.questions.length} q {b.publishedEntryId ? "· published" : ""}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
