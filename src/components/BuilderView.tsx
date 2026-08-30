import { useEffect, useMemo, useState } from "react";
import type { Bank, SessionItem, TestSession } from "../lib/types";
import { shuffle, uid } from "../lib/types";
import { Btn, Chip, EmptyState, Field, SectionTitle, inputCls } from "./ui";
import { IconPlay, IconShuffle, IconTimer, IconUpload, IconCheck, IconTarget, IconAlert, IconPulse, IconDoc } from "./icons";

function Toggle({ on, onClick, label, icon }: { on: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-md border text-left transition-all duration-150 cursor-pointer ${
        on ? "border-moss bg-moss-soft/60" : "border-line-2 bg-card hover:border-ink/30"
      }`}
    >
      <span className={`text-lg transition-colors ${on ? "text-moss" : "text-faint"}`}>{icon}</span>
      <span className={`flex-1 text-sm font-semibold ${on ? "text-moss-deep" : "text-mute"}`}>{label}</span>
      <span
        className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${on ? "bg-moss" : "bg-line-2"}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-card shadow transition-all duration-200 ${on ? "left-[18px]" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}

export type BuildMode = "practice" | "exam" | "timed";

export default function BuilderView({
  banks,
  preselected,
  onStart,
  onNav,
}: {
  banks: Bank[];
  preselected: string | null;
  onStart: (session: TestSession) => void;
  onNav: (key: string) => void;
}) {
  const [initBank, initMode] = (preselected ?? "").split(":");
  const [selected, setSelected] = useState<Set<string>>(new Set(initBank ? [initBank] : banks.length === 1 ? [banks[0].id] : []));
  const [count, setCount] = useState(10);
  const [shuffleQ, setShuffleQ] = useState(true);
  const [shuffleO, setShuffleO] = useState(true);
  const [mode, setMode] = useState<BuildMode>(initMode === "practice" || initMode === "timed" ? initMode : "exam");
  const [minutes, setMinutes] = useState(10);
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!preselected) return;
    const [b, m] = preselected.split(":");
    if (b) setSelected(new Set([b]));
    if (m === "practice" || m === "timed") setMode(m);
  }, [preselected]);

  const pool = useMemo(
    () => banks.filter((b) => selected.has(b.id)).reduce((n, b) => n + b.questions.length, 0),
    [banks, selected]
  );

  const safeCount = Math.min(count, Math.max(pool, 1));
  useEffect(() => {
    if (count > pool && pool > 0) setCount(pool);
  }, [pool, count]);

  const toggleBank = (id: string) => {
    setErr(null);
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const start = () => {
    if (pool === 0) return setErr("Pick at least one bank that contains questions.");
    if (mode === "timed" && (minutes < 1 || minutes > 180)) return setErr("Time limit must be between 1 and 180 minutes.");
    const chosen = banks.filter((b) => selected.has(b.id));
    let items: SessionItem[] = [];
    for (const b of chosen) {
      for (const q of b.questions) {
        let options = q.options;
        let correctIndex = q.correctIndex;
        if (shuffleO) {
          const idx = options.map((_, i) => i);
          const shuffledIdx = shuffle(idx);
          options = shuffledIdx.map((i) => options[i]);
          correctIndex = shuffledIdx.indexOf(q.correctIndex);
        }
        items.push({
          key: q.id,
          prompt: q.prompt,
          options,
          correctIndex,
          explanation: q.explanation,
          tags: q.tags,
          bankId: b.id,
        });
      }
    }
    if (shuffleQ) items = shuffle(items);
    items = items.slice(0, safeCount);

    const label = mode === "practice" ? "Practice" : mode === "timed" ? "Timed exam" : "Exam";
    const auto = `${label} — ${chosen.map((b) => b.name).join(" + ").slice(0, 54)}${mode === "timed" ? ` (${minutes} min)` : ""}`;
    onStart({
      id: uid(),
      name: name.trim() || auto,
      bankNames: chosen.map((b) => b.name),
      items,
      startedAt: Date.now(),
      timeLimitSec: mode === "timed" ? minutes * 60 : undefined,
      mode: mode === "practice" ? "practice" : "exam",
    });
  };

  if (banks.length === 0) {
    return (
      <div className="max-w-[760px] mx-auto px-5 sm:px-8 py-16">
        <EmptyState
          icon={<IconTarget />}
          title="Nothing to test yet"
          body="The test builder mixes questions from your banks. Import a CSV first and this page becomes very useful."
          action={
            <Btn onClick={() => onNav("import")}>
              <IconUpload /> Import a CSV
            </Btn>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1060px] mx-auto px-5 sm:px-8 py-7">
      <SectionTitle kicker="Section E" title="Build a test" />

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5 items-start">
        {/* left: banks + options */}
        <div className="space-y-5">
          <div className="bg-card border border-line rounded-md p-5 anim-fade-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-ink">1 · Choose banks</h3>
              <Chip tone={pool > 0 ? "moss" : "neutral"}>{pool} in pool</Chip>
            </div>
            <div className="space-y-2">
              {banks.map((b) => {
                const on = selected.has(b.id);
                return (
                  <button
                    key={b.id}
                    onClick={() => toggleBank(b.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-md border text-left transition-all duration-150 cursor-pointer ${
                      on ? "border-moss bg-moss-soft/50" : "border-line-2 hover:border-ink/30 hover:bg-card"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-colors shrink-0 ${
                        on ? "bg-moss border-moss text-paper" : "border-line-2 bg-card"
                      }`}
                    >
                      {on && <IconCheck className="text-[12px]" />}
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: b.color }} />
                    <span className="flex-1">
                      <span className="block text-sm font-bold text-ink">{b.name}</span>
                      <span className="block font-mono text-[10.5px] text-faint mt-0.5">{b.questions.length} questions</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* mode picker */}
          <div className="bg-card border border-line rounded-md p-5 anim-fade-up">
            <h3 className="font-display font-bold text-ink mb-3">2 · Pick a mode</h3>
            <div className="grid sm:grid-cols-3 gap-2.5">
              {(
                [
                  { key: "practice", label: "Practice", desc: "Instant verdict — the answer and examiner's note appear the moment you submit each question.", icon: <IconPulse /> },
                  { key: "exam", label: "Exam", desc: "Answer the whole paper, submit once, then review the marked script.", icon: <IconDoc /> },
                  { key: "timed", label: "Timed exam", desc: "The full exam, but a clock runs and the paper auto-submits at zero.", icon: <IconTimer /> },
                ] as const
              ).map((m) => {
                const on = mode === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => setMode(m.key)}
                    className={`text-left rounded-md border px-4 py-3.5 transition-all duration-150 cursor-pointer group ${
                      on ? "border-moss bg-moss-soft/60 shadow-[inset_0_0_0_1px_#0e7c6b]" : "border-line-2 bg-card hover:border-moss/50 hover:-translate-y-0.5"
                    }`}
                  >
                    <span className={`flex items-center justify-between text-[19px] ${on ? "text-moss" : "text-faint group-hover:text-moss"}`}>
                      {m.icon}
                      <span
                        className={`w-4 h-4 rounded-full border-2 inline-flex items-center justify-center transition-colors ${
                          on ? "border-moss bg-moss" : "border-line-2"
                        }`}
                      >
                        {on && <span className="w-1.5 h-1.5 rounded-full bg-paper" />}
                      </span>
                    </span>
                    <span className={`block font-display font-bold text-[15px] mt-2 ${on ? "text-moss-deep" : "text-ink"}`}>{m.label}</span>
                    <span className="block text-[12px] text-mute leading-snug mt-1">{m.desc}</span>
                  </button>
                );
              })}
            </div>
            {mode === "timed" && (
              <div className="flex items-center gap-3 mt-4 anim-pop border-t border-dashed border-line-2 pt-4">
                <IconTimer className="text-moss text-lg shrink-0" />
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className={`${inputCls} w-24 text-center font-mono`}
                />
                <span className="text-sm text-mute font-medium">minutes on the clock — roughly {Math.max(1, Math.round((minutes * 60) / Math.max(safeCount, 1)))}s per question</span>
              </div>
            )}
          </div>

          <div className="bg-card border border-line rounded-md p-5 anim-fade-up">
            <h3 className="font-display font-bold text-ink mb-3">3 · Shape it</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-mute font-medium">Questions</span>
                  <span className="font-display font-extrabold text-xl text-moss tabular-nums">
                    {pool === 0 ? 0 : safeCount}
                    <span className="text-[13px] font-body font-medium text-faint"> / {pool} available</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={Math.max(pool, 1)}
                  value={pool === 0 ? 1 : safeCount}
                  onChange={(e) => setCount(Number(e.target.value))}
                  disabled={pool === 0}
                  className="w-full disabled:opacity-40"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5">
                <Toggle on={shuffleQ} onClick={() => setShuffleQ((v) => !v)} label="Shuffle question order" icon={<IconShuffle />} />
                <Toggle on={shuffleO} onClick={() => setShuffleO((v) => !v)} label="Shuffle A/B/C options" icon={<IconShuffle />} />
              </div>
            </div>
          </div>
        </div>

        {/* right: summary + launch */}
        <div className="space-y-4 lg:sticky lg:top-6">
          <div className="bg-ink text-paper rounded-md p-5 anim-fade-up">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/45 mb-3">Test ticket</div>
            <Field label="Test name" hint="optional">
              <input
                className="w-full bg-paper/10 border border-paper/15 rounded-md px-3 py-2.5 text-sm text-paper placeholder:text-paper/35 focus:outline-none focus:border-[#7fc8a8] transition-colors"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Friday pop quiz"
              />
            </Field>
            <dl className="mt-4 space-y-2 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-paper/50">Banks</dt>
                <dd className="text-right font-medium max-w-[60%]">
                  {banks.filter((b) => selected.has(b.id)).map((b) => b.name).join(", ") || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-paper/50">Mode</dt>
                <dd className="font-mono">{mode === "practice" ? "practice · instant" : mode === "timed" ? "timed exam" : "exam"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-paper/50">Length</dt>
                <dd className="font-mono">{pool === 0 ? 0 : safeCount} questions</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-paper/50">Time</dt>
                <dd className="font-mono">{mode === "timed" ? `${minutes} min` : "untimed"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-paper/50">Shuffle</dt>
                <dd className="font-mono">
                  {[shuffleQ && "order", shuffleO && "options"].filter(Boolean).join(" + ") || "none"}
                </dd>
              </div>
            </dl>

            {err && (
              <div className="flex items-center gap-2 text-[12.5px] font-medium text-[#ffb4ab] bg-pen/25 border border-pen/40 rounded px-3 py-2 mt-4 anim-pop">
                <IconAlert /> {err}
              </div>
            )}

            <Btn size="lg" className="w-full mt-5" onClick={start} disabled={pool === 0}>
              <IconPlay /> Start test
            </Btn>
            <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-paper/35 text-center mt-3">
              scored instantly · review with explanations
            </p>
          </div>

          <div className="border border-line bg-card rounded-md p-4 anim-fade-up">
            <p className="text-[12.5px] text-mute leading-relaxed">
              Questions are sampled from the pool in bank order (then shuffled, if asked). Every test result snapshots
              its questions, so later edits to banks never rewrite history.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
