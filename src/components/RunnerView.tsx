import { useEffect, useMemo, useState } from "react";
import type { TestResult, TestSession } from "../lib/types";
import { fmtClock, LETTERS } from "../lib/types";
import { Btn, Chip, Modal } from "./ui";
import { IconFlag, IconChevronL, IconChevronR, IconTimer, IconX, IconCheck, IconAlert } from "./icons";

export default function RunnerView({
  session,
  onFinish,
  onAbandon,
}: {
  session: TestSession;
  onFinish: (result: TestResult) => void;
  onAbandon: () => void;
}) {
  const total = session.items.length;
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [abandonOpen, setAbandonOpen] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(
    session.timeLimitSec != null ? session.timeLimitSec : null
  );

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const item = session.items[idx];

  /* countdown */
  useEffect(() => {
    if (session.timeLimitSec == null) return;
    const h = setInterval(() => {
      const left = Math.max(0, session.timeLimitSec! - Math.floor((Date.now() - session.startedAt) / 1000));
      setRemaining(left);
    }, 500);
    return () => clearInterval(h);
  }, [session]);

  const build = (): TestResult => {
    const items = session.items.map((it, i) => ({
      prompt: it.prompt,
      options: it.options,
      correctIndex: it.correctIndex,
      chosenIndex: answers[i] ?? null,
      flagged: flags.has(i),
      explanation: it.explanation,
      tags: it.tags,
    }));
    const correct = items.filter((it) => it.chosenIndex === it.correctIndex).length;
    const skipped = items.filter((it) => it.chosenIndex === null).length;
    return {
      id: session.id,
      name: session.name,
      takenAt: Date.now(),
      bankNames: session.bankNames,
      total,
      correct,
      skipped,
      durationSec: Math.round((Date.now() - session.startedAt) / 1000),
      timeLimitSec: session.timeLimitSec,
      items,
    };
  };

  const submit = () => onFinish(build());

  /* auto-submit when the clock hits zero */
  useEffect(() => {
    if (remaining === 0) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const choose = (i: number) => {
    setAnswers((a) => {
      const n = { ...a };
      if (n[idx] === i) delete n[idx];
      else n[idx] = i;
      return n;
    });
  };

  const toggleFlag = () =>
    setFlags((f) => {
      const n = new Set(f);
      if (n.has(idx)) n.delete(idx);
      else n.add(idx);
      return n;
    });

  const trySubmit = () => {
    if (answeredCount < total) setConfirmOpen(true);
    else submit();
  };

  const low = remaining !== null && remaining <= 60;
  const pct = total > 0 ? (answeredCount / total) * 100 : 0;

  return (
    <div className="max-w-[1060px] mx-auto px-5 sm:px-8 py-7">
      {/* top strip */}
      <header className="anim-fade-up">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">In progress · {session.bankNames.join(" + ")}</div>
            <h1 className="font-display font-extrabold text-[24px] leading-tight text-ink tracking-tight truncate">{session.name}</h1>
          </div>
          {remaining !== null && (
            <span
              className={`flex items-center gap-2 font-mono text-[15px] font-semibold px-3.5 py-2 rounded-md border tabular-nums transition-colors ${
                low ? "text-pen border-pen bg-pen-soft animate-pulse" : "text-ink border-line-2 bg-card"
              }`}
            >
              <IconTimer /> {fmtClock(remaining)}
            </span>
          )}
          <button
            onClick={() => setAbandonOpen(true)}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-mute hover:text-pen transition-colors px-2 py-2 cursor-pointer"
          >
            <IconX /> Abandon
          </button>
        </div>
        {/* progress */}
        <div className="mt-4">
          <div className="h-2 bg-line rounded-full overflow-hidden">
            <div className="h-full bg-moss rounded-full bar-arc" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between mt-1.5 font-mono text-[10px] uppercase tracking-widest text-faint">
            <span>
              question {idx + 1} / {total}
            </span>
            <span>
              {answeredCount} answered{flags.size > 0 ? ` · ${flags.size} flagged` : ""}
            </span>
          </div>
        </div>
      </header>

      <div className="mt-5 grid lg:grid-cols-[1.8fr_1fr] gap-5 items-start">
        {/* question card */}
        <div key={idx} className="bg-card border border-line rounded-md anim-fade-up">
          <div className="flex items-center justify-between px-6 pt-5">
            <span className="font-display font-extrabold text-[44px] leading-none text-line-2 tabular-nums select-none">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <button
              onClick={toggleFlag}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[12.5px] font-semibold transition-all cursor-pointer ${
                flags.has(idx)
                  ? "bg-amber-soft border-amber text-[#8a5a10]"
                  : "border-line-2 text-mute hover:border-amber hover:text-[#8a5a10]"
              }`}
            >
              <IconFlag /> {flags.has(idx) ? "Flagged" : "Flag"}
            </button>
          </div>

          <div className="px-6 pb-6">
            <h2 className="font-display font-bold text-[21px] leading-snug text-ink mt-2">{item.prompt}</h2>

            <div className="mt-5 space-y-2.5">
              {item.options.map((opt, i) => {
                const chosen = answers[idx] === i;
                return (
                  <button
                    key={i}
                    onClick={() => choose(i)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-md border text-left transition-all duration-150 cursor-pointer group ${
                      chosen
                        ? "border-moss bg-moss-soft shadow-[inset_0_0_0_1px_#177e5b]"
                        : "border-line-2 bg-card hover:border-moss/50 hover:translate-x-1 hover:bg-moss-soft/30"
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-display font-bold text-[14px] shrink-0 transition-all duration-150 ${
                        chosen ? "bg-moss border-moss text-paper scale-105" : "border-line-2 text-mute group-hover:border-moss group-hover:text-moss"
                      }`}
                    >
                      {chosen ? <IconCheck className="text-[15px]" /> : LETTERS[i]}
                    </span>
                    <span className={`text-[15px] leading-snug ${chosen ? "font-semibold text-moss-deep" : "text-body"}`}>{opt}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-6">
              <Btn variant="ghost" size="sm" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}>
                <IconChevronL /> Previous
              </Btn>
              {item.tags.length > 0 && (
                <div className="hidden sm:flex gap-1.5">
                  {item.tags.slice(0, 3).map((t) => (
                    <span key={t} className="font-mono text-[10px] text-cobalt bg-cobalt-soft rounded px-1.5 py-0.5">{t}</span>
                  ))}
                </div>
              )}
              {idx < total - 1 ? (
                <Btn size="sm" onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}>
                  Next <IconChevronR />
                </Btn>
              ) : (
                <Btn size="sm" variant="ink" onClick={trySubmit}>
                  <IconCheck /> Finish test
                </Btn>
              )}
            </div>
          </div>
        </div>

        {/* navigator rail */}
        <aside className="bg-card border border-line rounded-md p-5 lg:sticky lg:top-6 anim-fade-up">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute mb-3">Answer sheet</div>
          <div className="grid grid-cols-6 gap-1.5">
            {session.items.map((_, i) => {
              const done = answers[i] !== undefined;
              const flagged = flags.has(i);
              const current = i === idx;
              return (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`aspect-square rounded-md font-mono text-[11.5px] font-semibold border transition-all duration-150 cursor-pointer tabular-nums ${
                    current
                      ? "border-ink text-ink ring-2 ring-ink/15 scale-105"
                      : done
                        ? "bg-moss border-moss text-paper hover:bg-moss-deep"
                        : "border-line-2 text-mute hover:border-moss hover:text-moss"
                  } ${flagged ? "shadow-[inset_0_-4px_0_#c9821d]" : ""}`}
                  aria-label={`Go to question ${i + 1}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 font-mono text-[10px] uppercase tracking-widest text-faint">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-moss inline-block" /> answered</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm border border-line-2 inline-block" /> blank</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber inline-block" /> flag mark</span>
          </div>

          <div className="dash-t mt-4 pt-4">
            <Btn variant="ink" className="w-full" onClick={trySubmit}>
              <IconCheck /> Submit answers
            </Btn>
            <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint text-center mt-2.5">
              click an option again to clear it
            </p>
          </div>
        </aside>
      </div>

      {/* submit confirm */}
      {confirmOpen && (
        <Modal title="Hand it in with blanks?" onClose={() => setConfirmOpen(false)}>
          <p className="text-sm text-mute leading-relaxed">
            <strong className="text-ink">{total - answeredCount}</strong> of {total} questions are still unanswered
            {flags.size > 0 && (
              <>
                {" "}and <strong className="text-[#8a5a10]">{flags.size}</strong> flagged
              </>
            )}
            . Blanks score zero.
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <Btn variant="ghost" onClick={() => setConfirmOpen(false)}>
              <IconChevronL /> Keep working
            </Btn>
            <Btn onClick={submit}>
              <IconCheck /> Submit anyway
            </Btn>
          </div>
        </Modal>
      )}

      {/* abandon confirm */}
      {abandonOpen && (
        <Modal title="Abandon this attempt?" onClose={() => setAbandonOpen(false)}>
          <p className="text-sm text-mute leading-relaxed">
            Your {answeredCount} answered question{answeredCount === 1 ? "" : "s"} will be discarded and nothing will be
            added to your results.
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <Btn variant="ghost" onClick={() => setAbandonOpen(false)}>
              Stay in the test
            </Btn>
            <Btn variant="danger" onClick={onAbandon}>
              <IconAlert /> Abandon
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
