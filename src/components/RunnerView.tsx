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
  const practice = session.mode === "practice";
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [checkHint, setCheckHint] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [abandonOpen, setAbandonOpen] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(
    session.timeLimitSec != null ? session.timeLimitSec : null
  );

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const item = session.items[idx];
  const isRevealed = revealed.has(idx);
  const chose = answers[idx];
  const gotIt = isRevealed && chose === item.correctIndex;
  const practiceCorrect = useMemo(
    () => [...revealed].filter((i) => answers[i] === session.items[i].correctIndex).length,
    [revealed, answers, session.items]
  );

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
      bankId: it.bankId,
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
      mode: session.mode,
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
    if (practice && isRevealed) return;
    setCheckHint(false);
    setAnswers((a) => {
      const n = { ...a };
      if (n[idx] === i) delete n[idx];
      else n[idx] = i;
      return n;
    });
  };

  const checkAnswer = () => {
    if (answers[idx] === undefined) {
      setCheckHint(true);
      return;
    }
    setRevealed((r) => new Set(r).add(idx));
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
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">
              {practice ? "Practice session" : "Exam in progress"} · {session.bankNames.join(" + ")}
            </div>
            <h1 className="font-display font-extrabold text-[24px] leading-tight text-ink tracking-tight truncate">{session.name}</h1>
          </div>
          {practice && (
            <span className="flex items-center gap-2 font-mono text-[12px] font-semibold px-3 py-2 rounded-md border border-line-2 bg-card tabular-nums">
              <span className="text-moss-deep">✓ {practiceCorrect}</span>
              <span className="text-line-2">·</span>
              <span className="text-pen">✗ {revealed.size - practiceCorrect}</span>
              <span className="text-line-2">·</span>
              <span className="text-faint">{total - revealed.size} left</span>
            </span>
          )}
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
          <div className="h-2 bg-line rounded-full overflow-hidden flex">
            {practice ? (
              <>
                <div className="h-full bg-moss bar-arc" style={{ width: `${total ? (practiceCorrect / total) * 100 : 0}%` }} />
                <div className="h-full bg-pen bar-arc" style={{ width: `${total ? ((revealed.size - practiceCorrect) / total) * 100 : 0}%` }} />
              </>
            ) : (
              <div className="h-full bg-moss rounded-full bar-arc" style={{ width: `${pct}%` }} />
            )}
          </div>
          <div className="flex justify-between mt-1.5 font-mono text-[10px] uppercase tracking-widest text-faint">
            <span>
              question {idx + 1} / {total}
            </span>
            <span>
              {practice
                ? `${revealed.size} checked · ${practiceCorrect} right`
                : `${answeredCount} answered${flags.size > 0 ? ` · ${flags.size} flagged` : ""}`}
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
            {!practice ? (
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
            ) : (
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                instant feedback on
              </span>
            )}
          </div>

          <div className="px-6 pb-6">
            <h2 className="font-display font-bold text-[21px] leading-snug text-ink mt-2">{item.prompt}</h2>

            <div className="mt-5 space-y-2.5">
              {item.options.map((opt, i) => {
                const chosen = answers[idx] === i;
                const isAnswer = i === item.correctIndex;
                /* practice reveal styling */
                const showRight = practice && isRevealed && isAnswer;
                const showWrong = practice && isRevealed && chosen && !isAnswer;
                const dimmed = practice && isRevealed && !isAnswer && !chosen;
                const locked = practice && isRevealed;
                return (
                  <button
                    key={i}
                    onClick={() => choose(i)}
                    disabled={locked}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-md border text-left transition-all duration-200 group ${
                      locked ? "cursor-default" : "cursor-pointer"
                    } ${
                      showRight
                        ? "border-moss bg-moss-soft shadow-[inset_0_0_0_1px_#0e7c6b]"
                        : showWrong
                          ? "border-pen bg-pen-soft shadow-[inset_0_0_0_1px_#cd3d3d]"
                          : dimmed
                            ? "border-line bg-card opacity-50"
                            : chosen
                              ? "border-moss bg-moss-soft shadow-[inset_0_0_0_1px_#0e7c6b]"
                              : "border-line-2 bg-card hover:border-moss/50 hover:translate-x-1 hover:bg-moss-soft/30"
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-display font-bold text-[14px] shrink-0 transition-all duration-150 ${
                        showRight
                          ? "bg-moss border-moss text-paper scale-105"
                          : showWrong
                            ? "bg-pen border-pen text-paper"
                            : chosen
                              ? "bg-moss border-moss text-paper scale-105"
                              : "border-line-2 text-mute group-hover:border-moss group-hover:text-moss"
                      }`}
                    >
                      {showRight ? <IconCheck className="text-[15px]" /> : showWrong ? <IconX className="text-[15px]" /> : chosen && !locked ? <IconCheck className="text-[15px]" /> : LETTERS[i]}
                    </span>
                    <span
                      className={`text-[15px] leading-snug ${
                        showRight ? "font-semibold text-moss-deep" : showWrong ? "font-semibold text-[#a03328]" : chosen ? "font-semibold text-moss-deep" : "text-body"
                      }`}
                    >
                      {opt}
                      {showRight && <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-moss">correct answer</span>}
                      {showWrong && <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-pen">your pick</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* instant verdict in practice mode */}
            {practice && isRevealed && (
              <div
                className={`mt-5 rounded-md border px-4 py-3.5 anim-pop ${
                  gotIt ? "border-moss/40 bg-moss-soft/60" : "border-pen/40 bg-pen-soft/60"
                }`}
              >
                <div className={`flex items-center gap-2 font-display font-bold text-[15px] ${gotIt ? "text-moss-deep" : "text-[#a03328]"}`}>
                  {gotIt ? <IconCheck /> : <IconX />}
                  {gotIt ? "Correct — nicely done." : `Not quite — the answer is ${LETTERS[item.correctIndex]}.`}
                </div>
                {item.explanation && (
                  <p className="text-[13.5px] text-body leading-relaxed mt-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-faint mr-2">Examiner's note</span>
                    {item.explanation}
                  </p>
                )}
              </div>
            )}
            {practice && checkHint && !isRevealed && (
              <div className="mt-4 flex items-center gap-2 text-[13px] font-medium text-[#8a5a10] bg-amber-soft border border-amber/35 rounded-md px-3 py-2.5 anim-pop">
                <IconAlert /> Pick an option first — then submit to see the verdict.
              </div>
            )}

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
              {practice ? (
                !isRevealed ? (
                  <Btn size="sm" onClick={checkAnswer}>
                    <IconCheck /> Submit answer
                  </Btn>
                ) : idx < total - 1 ? (
                  <Btn size="sm" onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}>
                    Next question <IconChevronR />
                  </Btn>
                ) : (
                  <Btn size="sm" variant="ink" onClick={submit}>
                    <IconCheck /> Finish practice
                  </Btn>
                )
              ) : idx < total - 1 ? (
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
              const rev = revealed.has(i);
              const revRight = rev && answers[i] === session.items[i].correctIndex;
              return (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`aspect-square rounded-md font-mono text-[11.5px] font-semibold border transition-all duration-150 cursor-pointer tabular-nums ${
                    current
                      ? "border-ink text-ink ring-2 ring-ink/15 scale-105"
                      : practice && rev
                        ? revRight
                          ? "bg-moss border-moss text-paper hover:bg-moss-deep"
                          : "bg-pen border-pen text-paper hover:bg-[#b23529]"
                        : done
                          ? "bg-moss border-moss text-paper hover:bg-moss-deep"
                          : "border-line-2 text-mute hover:border-moss hover:text-moss"
                  } ${!practice && flagged ? "shadow-[inset_0_-4px_0_#bd7c16]" : ""}`}
                  aria-label={`Go to question ${i + 1}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 font-mono text-[10px] uppercase tracking-widest text-faint">
            {practice ? (
              <>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-moss inline-block" /> correct</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-pen inline-block" /> missed</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm border border-line-2 inline-block" /> unseen</span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-moss inline-block" /> answered</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm border border-line-2 inline-block" /> blank</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber inline-block" /> flag mark</span>
              </>
            )}
          </div>

          <div className="dash-t mt-4 pt-4">
            {practice ? (
              <>
                <Btn variant="ink" className="w-full" onClick={submit} disabled={revealed.size < total}>
                  <IconCheck /> Finish practice ({revealed.size}/{total})
                </Btn>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint text-center mt-2.5">
                  check every question to finish
                </p>
              </>
            ) : (
              <>
                <Btn variant="ink" className="w-full" onClick={trySubmit}>
                  <IconCheck /> Submit answers
                </Btn>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint text-center mt-2.5">
                  click an option again to clear it
                </p>
              </>
            )}
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
