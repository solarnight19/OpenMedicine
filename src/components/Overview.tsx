import type { Bank, TestResult } from "../lib/types";
import { fmtDate } from "../lib/types";
import { Btn, Chip } from "./ui";
import { IconUpload, IconTarget, IconBank, IconArrowR, IconSpark, IconDownload, IconChevronR } from "./icons";
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
          const tone = pct >= 70 ? "#177e5b" : pct >= 40 ? "#c9821d" : "#cf4136";
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
  onNav,
}: {
  banks: Bank[];
  results: TestResult[];
  onNav: (key: string) => void;
}) {
  const totalQs = banks.reduce((n, b) => n + b.questions.length, 0);
  const scored = results.filter((r) => r.total > 0);
  const avg = scored.length ? Math.round(scored.reduce((n, r) => n + r.correct / r.total, 0) / scored.length * 100) : null;
  const best = scored.length ? Math.max(...scored.map((r) => Math.round((r.correct / r.total) * 100))) : null;

  const stats = [
    { label: "Question banks", value: banks.length, sub: banks.length === 1 ? "collection" : "collections" },
    { label: "Questions stored", value: totalQs, sub: "multiple choice" },
    { label: "Tests taken", value: results.length, sub: results.length === 1 ? "attempt" : "attempts" },
    { label: "Average score", value: avg === null ? "—" : `${avg}%`, sub: best === null ? "no tests yet" : `best ${best}%` },
  ];

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="max-w-[1060px] mx-auto px-5 sm:px-8 py-7">
      {/* cover-sheet masthead */}
      <header className="anim-fade-up">
        <div className="flex items-center justify-between gap-4 font-mono text-[10.5px] uppercase tracking-[0.2em] text-mute pb-2">
          <span>FormFeed · Question Bank System</span>
          <span className="hidden sm:block">{today}</span>
        </div>
        <div className="dash-t dash-b py-5 sm:py-6 flex flex-wrap items-center gap-x-8 gap-y-4">
          <div className="min-w-[240px]">
            <h1 className="font-display font-extrabold text-[clamp(30px,4.6vw,46px)] leading-[1.02] tracking-tight text-ink">
              Feed it a CSV.
              <br />
              <span className="text-moss">Hand out the test.</span>
            </h1>
          </div>
          <div className="flex-1 min-w-[220px] max-w-[400px]">
            <p className="text-sm text-mute leading-relaxed">
              Import comma-separated questions with answers, distractors, tags and explanations — FormFeed files them
              into banks and shuffles them into scorable multiple-choice tests.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Btn size="sm" onClick={() => onNav("import")}>
                <IconUpload /> Import CSV
              </Btn>
              <Btn size="sm" variant="ghost" onClick={() => onNav("format")}>
                <IconDownload className="text-moss" /> See the format
              </Btn>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-center justify-center w-[120px] shrink-0">
            <div className="anim-stamp border-[2.5px] border-pen text-pen rounded px-2.5 py-1.5 text-center select-none">
              <div className="font-display font-extrabold text-[13px] tracking-[0.14em]">FORM 01</div>
              <div className="font-mono text-[8px] tracking-[0.2em]">OVERVIEW</div>
            </div>
          </div>
        </div>
      </header>

      {/* stats strip */}
      <section className="mt-7 grid grid-cols-2 lg:grid-cols-4 stagger">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`bg-card border border-line rounded-md px-5 py-4 hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200 ${i > 0 ? "lg:border-l-0" : ""} ${i === 1 ? "border-l-0 lg:border-l" : ""} ${i === 3 ? "border-l-0 lg:border-l" : ""} ${i === 2 ? "border-t-0 lg:border-t sm:border-l-0 lg:border-l" : ""}`}
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">{s.label}</div>
            <div className="font-display font-extrabold text-[30px] leading-none text-ink mt-2 tabular-nums">{s.value}</div>
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
                { icon: <IconTarget />, label: "Assemble a timed test", key: "builder" },
              ].map((a) => (
                <button
                  key={a.key}
                  onClick={() => onNav(a.key)}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-md bg-paper/8 border border-paper/10 hover:bg-paper/15 hover:border-paper/25 hover:translate-x-1 transition-all duration-150 text-left cursor-pointer group"
                >
                  <span className="text-[18px] text-[#7fc8a8]">{a.icon}</span>
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
            <pre className="font-mono text-[10.5px] leading-relaxed bg-ink text-[#a8d8c0] rounded p-3 overflow-x-auto whitespace-pre">
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

      {/* bank strip */}
      <section className="mt-7 mb-2 anim-fade-up">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-lg text-ink">Your banks</h2>
          <button
            onClick={() => onNav("banks")}
            className="flex items-center gap-1 text-[12.5px] font-semibold text-moss hover:text-moss-deep transition-colors cursor-pointer"
          >
            Manage <IconArrowR className="text-sm" />
          </button>
        </div>
        {banks.length === 0 ? (
          <p className="text-sm text-mute">Nothing here yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger">
            {banks.map((b) => (
              <button
                key={b.id}
                onClick={() => onNav(`bank:${b.id}`)}
                className="text-left bg-card border border-line rounded-md px-4 py-3.5 hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full" style={{ background: b.color }} />
                  <span className="font-display font-bold text-[15px] text-ink truncate group-hover:text-moss transition-colors">
                    {b.name}
                  </span>
                </div>
                <div className="font-mono text-[10.5px] text-faint mt-1.5">
                  {b.questions.length} questions · since {fmtDate(b.createdAt)}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
