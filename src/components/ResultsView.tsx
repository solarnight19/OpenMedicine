import { useState } from "react";
import type { TestResult } from "../lib/types";
import { fmtDate, fmtDuration, LETTERS } from "../lib/types";
import { Btn, Chip, EmptyState, ScoreRing } from "./ui";
import { IconCheck, IconX, IconFlag, IconChevronL, IconShuffle, IconTrash, IconArrowR, IconAlert, IconInbox, IconInfo, IconPulse, IconTimer, IconDoc } from "./icons";
import { Confirm } from "./BanksView";

/* ================= Results / review ================= */

export default function ResultsView({
  result,
  onRetake,
  onBack,
}: {
  result: TestResult;
  onRetake: () => void;
  onBack: () => void;
}) {
  const pct = result.total ? (result.correct / result.total) * 100 : 0;
  const wrong = result.total - result.correct - result.skipped;
  const flagged = result.items.filter((i) => i.flagged).length;
  const [filter, setFilter] = useState<"all" | "wrong" | "skipped">("all");

  const shown = result.items
    .map((it, i) => ({ it, i }))
    .filter(({ it }) =>
      filter === "all" ? true : filter === "wrong" ? it.chosenIndex !== null && it.chosenIndex !== it.correctIndex : it.chosenIndex === null
    );

  const verdict =
    pct >= 90 ? "Outstanding." : pct >= 70 ? "Solid paper." : pct >= 50 ? "Passable — review below." : "Back to the books.";

  return (
    <div className="max-w-[1060px] mx-auto px-5 sm:px-8 py-7">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[13px] font-semibold text-mute hover:text-ink transition-colors mb-5 cursor-pointer"
      >
        <IconChevronL /> All results
      </button>

      {/* score header */}
      <header className="bg-card border border-line rounded-md overflow-hidden anim-fade-up">
        <div className="hatch-band h-2.5 bg-ink" />
        <div className="p-6 sm:p-7 flex flex-col sm:flex-row items-center gap-7">
          <ScoreRing pct={pct} label="score" />
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">
              {fmtDate(result.takenAt)} · {fmtDuration(result.durationSec)}
              {result.timeLimitSec ? ` of ${fmtDuration(result.timeLimitSec)} limit` : ""}
            </div>
            <h1 className="font-display font-extrabold text-[28px] leading-tight text-ink tracking-tight mt-1 truncate">
              {result.name}
            </h1>
            <p className="font-display font-bold text-moss mt-1">{verdict}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
              <Chip tone={result.mode === "practice" ? "cobalt" : "amber"}>
                {result.mode === "practice" ? (
                  <><IconPulse /> practice session</>
                ) : result.timeLimitSec != null ? (
                  <><IconTimer /> timed exam</>
                ) : (
                  <><IconDoc /> exam</>
                )}
              </Chip>
              <Chip tone="moss"><IconCheck /> {result.correct} correct</Chip>
              <Chip tone="pen"><IconX /> {wrong} wrong</Chip>
              {result.mode !== "practice" && <Chip tone="amber">{result.skipped} skipped</Chip>}
              {flagged > 0 && <Chip><IconFlag /> {flagged} flagged</Chip>}
            </div>
          </div>
          <div className="flex sm:flex-col gap-2 shrink-0">
            <Btn onClick={onRetake}>
              <IconShuffle /> Retake
            </Btn>
            <Btn variant="ghost" onClick={onBack}>
              History <IconArrowR />
            </Btn>
          </div>
        </div>
        <div className="px-6 sm:px-7 pb-5 font-mono text-[10.5px] uppercase tracking-widest text-faint">
          banks: {result.bankNames.join(" + ")}
        </div>
      </header>

      {/* review */}
      <div className="mt-7">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-display font-bold text-xl text-ink">Answer review</h2>
          <div className="flex gap-1.5">
            {(
              [
                ["all", `All ${result.total}`],
                ["wrong", `Wrong ${wrong}`],
                ["skipped", `Skipped ${result.skipped}`],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-3 py-1.5 rounded-md text-[12.5px] font-semibold border transition-all cursor-pointer ${
                  filter === k ? "bg-ink text-paper border-ink" : "border-line-2 text-mute hover:border-ink/40"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <EmptyState
            icon={<IconInfo />}
            title={filter === "wrong" ? "Nothing missed" : "Nothing skipped"}
            body={filter === "wrong" ? "Every answered question was correct. Clean sheet." : "You had a go at every single question."}
          />
        ) : (
          <div className="space-y-4 stagger">
            {shown.map(({ it, i }) => {
              const isCorrect = it.chosenIndex === it.correctIndex;
              const skipped = it.chosenIndex === null;
              return (
                <article key={i} className="bg-card border border-line rounded-md overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-line bg-paper/60">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] shrink-0 ${
                        skipped ? "bg-amber-soft text-[#8a5a10] border border-amber" : isCorrect ? "bg-moss text-paper" : "bg-pen text-paper"
                      }`}
                    >
                      {skipped ? "–" : isCorrect ? <IconCheck /> : <IconX />}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-mute">Question {i + 1}</span>
                    {it.flagged && (
                      <Chip tone="amber"><IconFlag /> flagged</Chip>
                    )}
                    {it.tags.length > 0 && (
                      <span className="ml-auto hidden sm:flex gap-1.5">
                        {it.tags.slice(0, 3).map((t) => (
                          <span key={t} className="font-mono text-[10px] text-cobalt bg-cobalt-soft rounded px-1.5 py-0.5">{t}</span>
                        ))}
                      </span>
                    )}
                  </div>
                  <div className="px-5 py-4">
                    <h3 className="font-display font-bold text-[17px] text-ink leading-snug">{it.prompt}</h3>
                    <div className="mt-4 grid sm:grid-cols-2 gap-2">
                      {it.options.map((opt, oi) => {
                        const isAns = oi === it.correctIndex;
                        const isChosen = oi === it.chosenIndex;
                        return (
                          <div
                            key={oi}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md border text-[13.5px] ${
                              isAns
                                ? "border-moss bg-moss-soft text-moss-deep font-semibold"
                                : isChosen
                                  ? "border-pen bg-pen-soft text-[#a03328]"
                                  : "border-line text-mute"
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-full border flex items-center justify-center font-display font-bold text-[11.5px] shrink-0 ${
                                isAns ? "border-moss bg-moss text-paper" : isChosen ? "border-pen bg-pen text-paper" : "border-line-2"
                              }`}
                            >
                              {LETTERS[oi]}
                            </span>
                            <span className="flex-1 leading-snug">{opt}</span>
                            {isAns && <IconCheck className="shrink-0" />}
                            {isChosen && !isAns && <IconX className="shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                    {skipped && (
                      <p className="mt-3 text-[12.5px] font-medium text-[#8a5a10] flex items-center gap-1.5">
                        <IconAlert /> Left blank — the correct answer is highlighted above.
                      </p>
                    )}
                    {it.explanation && (
                      <div className="mt-3.5 border-l-[3px] border-cobalt bg-cobalt-soft/60 rounded-r-md px-3.5 py-2.5 text-[13px] text-body leading-relaxed">
                        <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-cobalt block mb-0.5">Examiner's note</span>
                        {it.explanation}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= History ================= */

export function HistoryView({
  results,
  onOpen,
  onRetake,
  onDelete,
  onNav,
}: {
  results: TestResult[];
  onOpen: (id: string) => void;
  onRetake: (r: TestResult) => void;
  onDelete: (id: string) => void;
  onNav: (key: string) => void;
}) {
  const [confirm, setConfirm] = useState<TestResult | null>(null);

  if (results.length === 0) {
    return (
      <div className="max-w-[760px] mx-auto px-5 sm:px-8 py-16">
        <EmptyState
          icon={<IconInbox />}
          title="No results on file"
          body="Every finished test lands here with its full answer review — and can be retaken from its own snapshot."
          action={
            <Btn onClick={() => onNav("builder")}>
              <IconShuffle /> Take a test
            </Btn>
          }
        />
      </div>
    );
  }

  const avg = Math.round(results.reduce((n, r) => n + (r.total ? r.correct / r.total : 0), 0) / results.length * 100);

  return (
    <div className="max-w-[1060px] mx-auto px-5 sm:px-8 py-7">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute mb-1">Section F</div>
          <h2 className="font-display font-bold text-[22px] leading-tight text-ink">Results ledger</h2>
        </div>
        <Chip tone="moss">{results.length} attempt{results.length === 1 ? "" : "s"} · avg {avg}%</Chip>
      </div>

      <div className="space-y-3 stagger">
        {results.map((r) => {
          const pct = r.total ? Math.round((r.correct / r.total) * 100) : 0;
          const tone = pct >= 70 ? "#177e5b" : pct >= 40 ? "#c9821d" : "#cf4136";
          return (
            <div
              key={r.id}
              className="bg-card border border-line rounded-md px-5 py-4 hover:shadow-lift transition-all duration-200 group cursor-pointer"
              onClick={() => onOpen(r.id)}
            >
              <div className="flex items-center gap-4">
                <span
                  className="w-12 h-12 rounded-md flex items-center justify-center font-display font-extrabold text-[16px] text-paper shrink-0 tabular-nums"
                  style={{ background: tone }}
                >
                  {pct}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="font-display font-bold text-[15.5px] text-ink truncate group-hover:text-moss transition-colors">{r.name}</div>
                    {r.mode === "practice" ? (
                      <Chip tone="cobalt" className="text-[9.5px]! shrink-0"><IconPulse /> practice</Chip>
                    ) : r.timeLimitSec != null ? (
                      <Chip tone="amber" className="text-[9.5px]! shrink-0"><IconTimer /> timed</Chip>
                    ) : (
                      <Chip className="text-[9.5px]! shrink-0"><IconDoc /> exam</Chip>
                    )}
                  </div>
                  <div className="font-mono text-[10.5px] text-faint mt-0.5">
                    {fmtDate(r.takenAt)} · {r.correct}/{r.total} correct · {fmtDuration(r.durationSec)}
                    {r.timeLimitSec ? ` / ${fmtDuration(r.timeLimitSec)}` : ""} · {r.bankNames.join(" + ").slice(0, 48)}
                  </div>
                  <div className="mt-2 h-1.5 bg-line rounded-full overflow-hidden max-w-[360px]">
                    <div className="h-full rounded-full bar-arc" style={{ width: `${pct}%`, background: tone }} />
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Btn size="sm" variant="soft" onClick={() => onRetake(r)}>
                    <IconShuffle /> Retake
                  </Btn>
                  <button
                    onClick={() => setConfirm(r)}
                    className="p-2 rounded-md text-mute hover:text-pen hover:bg-pen-soft transition-colors cursor-pointer"
                    aria-label="Delete result"
                  >
                    <IconTrash />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {confirm && (
        <Confirm
          title="Delete this result?"
          body={`“${confirm.name}” (${fmtDate(confirm.takenAt)}) will be removed from the ledger permanently.`}
          confirmLabel="Delete result"
          onConfirm={() => onDelete(confirm.id)}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
