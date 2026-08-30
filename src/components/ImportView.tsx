import { useEffect, useMemo, useRef, useState } from "react";
import type { Bank, ParsedRow } from "../lib/types";
import { parseCSV, SAMPLE_CSV, downloadSampleCSV, downloadTemplateCSV } from "../lib/csv";
import { Btn, Chip, Field, SectionTitle, inputCls } from "./ui";
import { IconUpload, IconFile, IconCheck, IconAlert, IconDownload, IconCopy, IconInbox, IconArrowR, IconX, IconPlus } from "./icons";

export type ImportTarget = { kind: "new"; name: string } | { kind: "existing"; id: string };

/* ============ The exact format, shown verbatim ============ */

export const FORMAT_HEADER = "prompt,answer,wrong_1,wrong_2,wrong_3,explanation,tags,difficulty";

function ColoredHeader() {
  const C = ",";
  return (
    <span className="whitespace-pre">
      <span className="text-[#7fc8a8]">prompt</span>
      <span className="text-paper/25">{C}</span>
      <span className="text-[#7fc8a8]">answer</span>
      <span className="text-paper/25">{C}</span>
      <span className="text-[#e8b968]">wrong_1</span>
      <span className="text-paper/25">{C}</span>
      <span className="text-[#e8b968]">wrong_2</span>
      <span className="text-paper/25">{C}</span>
      <span className="text-[#e8b968]">wrong_3</span>
      <span className="text-paper/25">{C}</span>
      <span className="text-paper/40">explanation</span>
      <span className="text-paper/25">{C}</span>
      <span className="text-paper/40">tags</span>
      <span className="text-paper/25">{C}</span>
      <span className="text-paper/40">difficulty</span>
    </span>
  );
}

export function FormatStrip({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(FORMAT_HEADER);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = FORMAT_HEADER;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-ink rounded-md overflow-hidden anim-fade-up">
      <div className={`grid ${compact ? "" : "lg:grid-cols-[1.65fr_1fr]"}`}>
        <div>
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-paper/10">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/50">
              Exact format · row one of your CSV
            </span>
            <button
              onClick={copy}
              className={`inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-wider px-2.5 py-1.5 rounded-sm border transition-all cursor-pointer ${
                copied
                  ? "border-[#7fc8a8]/60 text-[#7fc8a8] bg-[#7fc8a8]/10"
                  : "border-paper/20 text-paper/70 hover:text-paper hover:border-paper/50"
              }`}
            >
              {copied ? <IconCheck /> : <IconCopy />}
              {copied ? "Copied" : "Copy header"}
            </button>
          </div>
          <pre className="font-mono text-[11.5px] sm:text-[12.5px] leading-[1.8] text-paper px-4 py-3.5 overflow-x-auto">
            <ColoredHeader />
          </pre>
          <div className="border-t border-paper/10 px-4 py-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/45 mb-1.5">
              Smallest file that works
            </div>
            <pre className="font-mono text-[11.5px] leading-[1.7] text-[#cfe6d9] overflow-x-auto">
{`prompt,answer,wrong_1,wrong_2
"What is 2 + 2?",4,3,5`}
            </pre>
          </div>
        </div>
        {!compact && (
          <div className="border-t lg:border-t-0 lg:border-l border-paper/10 px-4 py-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/45 mb-3">Legend</div>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5 text-[12.5px] text-paper/80 leading-snug">
                <span className="mt-1 w-2 h-2 rounded-full bg-[#7fc8a8] shrink-0" />
                <span><strong className="font-mono text-[11.5px] text-[#7fc8a8]">prompt</strong> +{" "}
                <strong className="font-mono text-[11.5px] text-[#7fc8a8]">answer</strong> — required on every row.</span>
              </li>
              <li className="flex items-start gap-2.5 text-[12.5px] text-paper/80 leading-snug">
                <span className="mt-1 w-2 h-2 rounded-full bg-[#e8b968] shrink-0" />
                <span><strong className="font-mono text-[11.5px] text-[#e8b968]">wrong_1…wrong_5</strong> — at least two
                distractors filled; up to five.</span>
              </li>
              <li className="flex items-start gap-2.5 text-[12.5px] text-paper/60 leading-snug">
                <span className="mt-1 w-2 h-2 rounded-full bg-paper/30 shrink-0" />
                <span><strong className="font-mono text-[11.5px]">explanation · tags · difficulty</strong> — optional.
                Tags split on <span className="font-mono text-[11px]">;</span> · difficulty is
                easy&nbsp;/&nbsp;medium&nbsp;/&nbsp;hard.</span>
              </li>
            </ul>
            <p className="text-[11.5px] text-paper/45 leading-relaxed mt-3.5">
              Header names are case-insensitive and order-free; <span className="font-mono text-[10.5px]">question</span>,{" "}
              <span className="font-mono text-[10.5px]">correct</span> and{" "}
              <span className="font-mono text-[10.5px]">incorrect_…</span> are accepted as aliases.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= Import ================= */

export default function ImportView({
  banks,
  preselected,
  onImport,
  onNav,
}: {
  banks: Bank[];
  preselected: string | null;
  onImport: (target: ImportTarget, rows: ParsedRow[]) => void;
  onNav: (key: string) => void;
}) {
  const [raw, setRaw] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [included, setIncluded] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<"new" | "existing">(preselected ? "existing" : banks.length ? "new" : "new");
  const [newName, setNewName] = useState("Imported " + new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }));
  const [targetId, setTargetId] = useState(preselected ?? banks[0]?.id ?? "");
  const [showPaste, setShowPaste] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const outcome = useMemo(() => (raw.trim() ? parseCSV(raw) : null), [raw]);

  useEffect(() => {
    if (!outcome) return setIncluded(new Set());
    setIncluded(new Set(outcome.rows.filter((r) => !r.error).map((r) => r.line)));
  }, [outcome]);

  useEffect(() => {
    if (preselected) {
      setMode("existing");
      setTargetId(preselected);
    }
  }, [preselected]);

  const validCount = outcome ? outcome.rows.filter((r) => !r.error).length : 0;
  const importCount = outcome ? outcome.rows.filter((r) => included.has(r.line) && !r.error).length : 0;

  const readFile = (f: File) => {
    if (!/\.(csv|txt)$/i.test(f.name) && !f.type.includes("csv") && !f.type.includes("text")) {
      setErr("That doesn't look like a CSV file. Use a .csv export.");
      return;
    }
    setErr(null);
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result ?? ""));
    reader.onerror = () => setErr("Couldn't read that file. Try again or paste the text below.");
    reader.readAsText(f);
  };

  const doImport = () => {
    if (!outcome || importCount === 0) {
      setErr("There are no valid, selected rows to import.");
      return;
    }
    if (mode === "new") {
      const n = newName.trim();
      if (!n) return setErr("Name the new bank first.");
      if (banks.some((b) => b.name.toLowerCase() === n.toLowerCase()))
        return setErr("A bank called “" + n + "” already exists — pick another name or add to the existing one.");
      onImport({ kind: "new", name: n }, outcome.rows.filter((r) => included.has(r.line) && !r.error));
    } else {
      onImport({ kind: "existing", id: targetId }, outcome.rows.filter((r) => included.has(r.line) && !r.error));
    }
    setRaw("");
    setFileName(null);
    setErr(null);
  };

  const toggle = (line: number) =>
    setIncluded((s) => {
      const n = new Set(s);
      if (n.has(line)) n.delete(line);
      else n.add(line);
      return n;
    });

  return (
    <div className="max-w-[1060px] mx-auto px-5 sm:px-8 py-7">
      <SectionTitle
        kicker="Section C"
        title="Import a CSV"
        right={
          <div className="flex gap-2">
            <Btn size="sm" variant="ghost" onClick={downloadSampleCSV}>
              <IconDownload /> Sample file
            </Btn>
            <Btn size="sm" variant="ghost" onClick={() => onNav("format")}>
              Format guide
            </Btn>
          </div>
        }
      />

      <div className="mb-5">
        <FormatStrip />
      </div>

      {/* dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) readFile(f);
        }}
        onClick={() => fileRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg px-6 py-10 text-center transition-all duration-200 cursor-pointer anim-fade-up ${
          dragOver ? "border-moss bg-moss-soft scale-[1.005]" : "border-line-2 bg-card/70 hover:border-moss/60 hover:bg-card"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) readFile(f);
            e.target.value = "";
          }}
        />
        <div
          className={`inline-flex items-center justify-center w-14 h-14 rounded-md text-2xl mb-3 transition-all duration-200 ${
            dragOver ? "bg-moss text-paper rotate-[-4deg]" : "bg-ink text-paper"
          }`}
        >
          {fileName ? <IconFile /> : <IconUpload />}
        </div>
        <p className="font-display font-bold text-lg text-ink">
          {fileName ? fileName : dragOver ? "Drop it right here" : "Drop a .csv here, or click to browse"}
        </p>
        <p className="text-[13px] text-mute mt-1">
          Needs a header row with at least <span className="font-mono text-[12px] text-moss-deep">prompt</span>,{" "}
          <span className="font-mono text-[12px] text-moss-deep">answer</span> and two{" "}
          <span className="font-mono text-[12px] text-moss-deep">wrong_…</span> columns.
        </p>
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFileName("sample-questions.csv");
              setErr(null);
              setRaw(SAMPLE_CSV);
            }}
            className="text-[12.5px] font-semibold text-moss hover:text-moss-deep underline underline-offset-2 cursor-pointer"
          >
            Load the built-in sample
          </button>
          <span className="text-line-2">·</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPaste((v) => !v);
            }}
            className="text-[12.5px] font-semibold text-mute hover:text-ink underline underline-offset-2 cursor-pointer"
          >
            {showPaste ? "Hide paste pad" : "Paste CSV text instead"}
          </button>
        </div>
      </div>

      {showPaste && (
        <div className="mt-4 anim-fade-up">
          <Field label="Paste CSV text" hint="header row included">
            <textarea
              className={`${inputCls} font-mono text-[12px] resize-y min-h-[120px]`}
              placeholder={"prompt,answer,wrong_1,wrong_2,explanation,tags,difficulty\n\"…\",\"…\",\"…\",\"…\",\"…\",tag1;tag2,medium"}
              value={raw}
              onChange={(e) => {
                setRaw(e.target.value);
                setFileName(null);
              }}
            />
          </Field>
        </div>
      )}

      {err && (
        <div className="flex items-center gap-2.5 text-sm font-medium text-[#a03328] bg-pen-soft border border-pen/30 rounded-md px-4 py-3 mt-4 anim-pop">
          <IconAlert /> {err}
          <button onClick={() => setErr(null)} className="ml-auto cursor-pointer opacity-60 hover:opacity-100" aria-label="Dismiss">
            <IconX />
          </button>
        </div>
      )}

      {/* parse preview */}
      {outcome && (
        <div className="mt-6 anim-fade-up">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <h3 className="font-display font-bold text-lg text-ink mr-2">Parse report</h3>
            <Chip tone="moss">
              <IconCheck /> {validCount} valid
            </Chip>
            {outcome.rows.length - validCount > 0 && (
              <Chip tone="pen">
                <IconAlert /> {outcome.rows.length - validCount} with errors
              </Chip>
            )}
            {outcome.unknownColumns.length > 0 && (
              <Chip tone="amber">ignored: {outcome.unknownColumns.join(", ")}</Chip>
            )}
          </div>

          {!outcome.headers.includes("prompt") && !outcome.headers.some((h) => /question|prompt/i.test(h)) && (
            <div className="bg-amber-soft border border-amber/40 rounded-md px-4 py-3 text-[13px] text-[#7a5210] mb-3">
              No <span className="font-mono">prompt</span>/<span className="font-mono">question</span> column detected —
              every row will fail. Check the <button onClick={() => onNav("format")} className="font-bold underline cursor-pointer">format guide</button>.
            </div>
          )}

          <div className="bg-card border border-line rounded-md overflow-hidden">
            <div className="max-h-[340px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-paper/95 backdrop-blur-sm">
                  <tr className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute border-b border-line">
                    <th className="text-left font-medium px-3 py-2.5 w-12">
                      <button
                        onClick={() =>
                          setIncluded(
                            included.size === validCount
                              ? new Set()
                              : new Set(outcome.rows.filter((r) => !r.error).map((r) => r.line))
                          )
                        }
                        className="w-4 h-4 rounded-sm border border-line-2 bg-card inline-flex items-center justify-center cursor-pointer hover:border-moss"
                        aria-label="Toggle all rows"
                      >
                        {included.size === validCount && validCount > 0 && <IconCheck className="text-moss text-[11px]" />}
                      </button>
                    </th>
                    <th className="text-left font-medium px-2 py-2.5 w-14">Row</th>
                    <th className="text-left font-medium px-3 py-2.5">Prompt preview</th>
                    <th className="text-left font-medium px-3 py-2.5 w-24 hidden sm:table-cell">Options</th>
                    <th className="text-left font-medium px-3 py-2.5 w-44">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {outcome.rows.map((r) => {
                    const checked = included.has(r.line) && !r.error;
                    return (
                      <tr key={r.line} className={`transition-colors ${r.error ? "bg-pen-soft/40" : checked ? "hover:bg-moss-soft/30" : "opacity-55"}`}>
                        <td className="px-3 py-2.5">
                          <button
                            disabled={!!r.error}
                            onClick={() => toggle(r.line)}
                            className={`w-4 h-4 rounded-sm border inline-flex items-center justify-center transition-colors ${
                              r.error ? "border-line-2 bg-paper cursor-not-allowed" : checked ? "bg-moss border-moss cursor-pointer" : "border-line-2 bg-card cursor-pointer hover:border-moss"
                            }`}
                            aria-label={`Toggle row ${r.line}`}
                          >
                            {checked && <IconCheck className="text-paper text-[11px]" />}
                          </button>
                        </td>
                        <td className="px-2 py-2.5 font-mono text-[11px] text-faint tabular-nums">{r.line}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-ink font-medium">{r.prompt ? r.prompt.slice(0, 80) + (r.prompt.length > 80 ? "…" : "") : <em className="text-faint">empty</em>}</span>
                        </td>
                        <td className="px-3 py-2.5 hidden sm:table-cell font-mono text-[11.5px] text-mute tabular-nums">
                          {1 + r.wrongs.length} <span className="text-faint">(1✓ {r.wrongs.length}✗)</span>
                        </td>
                        <td className="px-3 py-2.5">
                          {r.error ? (
                            <Chip tone="pen">
                              <IconAlert /> {r.error}
                            </Chip>
                          ) : (
                            <Chip tone="moss">ready</Chip>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {outcome.rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-mute">
                        Only a header row was found — add question rows beneath it.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* target + go */}
          <div className="grid md:grid-cols-[1.5fr_auto] gap-4 mt-5 items-end">
            <div className="bg-card border border-line rounded-md p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute mb-3">Destination</div>
              <div className="flex flex-col sm:flex-row gap-3">
                <label
                  className={`flex-1 flex items-start gap-2.5 border rounded-md px-3.5 py-3 cursor-pointer transition-all ${
                    mode === "new" ? "border-moss bg-moss-soft/50" : "border-line-2 hover:border-ink/30"
                  }`}
                >
                  <input type="radio" name="dest" checked={mode === "new"} onChange={() => setMode("new")} className="mt-1 accent-[#177e5b]" />
                  <span className="flex-1">
                    <span className="block text-sm font-bold text-ink">New bank</span>
                    <input
                      className={`${inputCls} mt-1.5 py-1.5 text-[13px]`}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onFocus={() => setMode("new")}
                      placeholder="Bank name"
                    />
                  </span>
                </label>
                <label
                  className={`flex-1 flex items-start gap-2.5 border rounded-md px-3.5 py-3 transition-all ${
                    banks.length === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  } ${mode === "existing" ? "border-moss bg-moss-soft/50" : "border-line-2 hover:border-ink/30"}`}
                >
                  <input
                    type="radio"
                    name="dest"
                    disabled={banks.length === 0}
                    checked={mode === "existing"}
                    onChange={() => setMode("existing")}
                    className="mt-1 accent-[#177e5b]"
                  />
                  <span className="flex-1">
                    <span className="block text-sm font-bold text-ink">Existing bank</span>
                    {banks.length > 0 ? (
                      <select
                        className={`${inputCls} mt-1.5 py-1.5 text-[13px]`}
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        onFocus={() => setMode("existing")}
                      >
                        {banks.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.questions.length})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="block text-[12px] text-faint mt-1.5">No banks yet</span>
                    )}
                  </span>
                </label>
              </div>
            </div>
            <Btn size="lg" onClick={doImport} disabled={importCount === 0}>
              <IconUpload /> Import {importCount} question{importCount === 1 ? "" : "s"}
            </Btn>
          </div>
        </div>
      )}

      {!outcome && (
        <div className="mt-8 grid sm:grid-cols-3 gap-3 stagger">
          {[
            { n: "01", t: "Feed it", d: "Drop a CSV or paste raw text — quoted commas and line breaks are handled." },
            { n: "02", t: "Check it", d: "Every row is validated live. Bad rows are flagged, good rows stay ticked." },
            { n: "03", t: "File it", d: "Send the valid rows to a fresh bank or merge them into an existing one." },
          ].map((s) => (
            <div key={s.n} className="border border-line rounded-md bg-card/70 px-4 py-4 hover:shadow-lift transition-shadow">
              <div className="font-display font-extrabold text-[26px] text-line-2 leading-none">{s.n}</div>
              <div className="font-display font-bold text-ink mt-1.5">{s.t}</div>
              <p className="text-[12.5px] text-mute leading-relaxed mt-1">{s.d}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= Format guide ================= */

export function FormatGuide({ onNav }: { onNav: (key: string) => void }) {
  const copyHeader = () => {
    const text = "prompt,answer,wrong_1,wrong_2,wrong_3,explanation,tags,difficulty";
    navigator.clipboard?.writeText(text).catch(() => undefined);
  };

  const cols = [
    { col: "prompt", also: "question · q", req: true, desc: "The question text shown to the test-taker." },
    { col: "answer", also: "correct · correct_answer", req: true, desc: "The one correct option." },
    { col: "wrong_1 … wrong_5", also: "incorrect_1…5 · distractor_1…5", req: true, desc: "Wrong options. At least two must be filled (wrong_1 and wrong_2)." },
    { col: "explanation", also: "rationale", req: false, desc: "Shown in the review after the test is scored." },
    { col: "tags", also: "topic", req: false, desc: "Labels separated by semicolons, e.g. geography;capitals." },
    { col: "difficulty", also: "level", req: false, desc: "easy, medium or hard. Unrecognised values default to medium." },
  ];

  return (
    <div className="max-w-[1060px] mx-auto px-5 sm:px-8 py-7">
      <SectionTitle
        kicker="Section D"
        title="The CSV FormFeed recognises"
        right={
          <div className="flex gap-2">
            <Btn size="sm" variant="ghost" onClick={copyHeader}>
              <IconCopy /> Copy header
            </Btn>
            <Btn size="sm" variant="soft" onClick={downloadTemplateCSV}>
              <IconDownload /> Template .csv
            </Btn>
          </div>
        }
      />

      <div className="grid lg:grid-cols-[1.7fr_1fr] gap-5 items-start">
        <div className="space-y-5">
          {/* exact format cheat card */}
          <FormatStrip compact />

          {/* spec table */}
          <div className="bg-card border border-line rounded-md overflow-hidden anim-fade-up">
            <table className="w-full text-sm">
              <thead>
                <tr className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute bg-paper/70 border-b border-line">
                  <th className="text-left font-medium px-4 py-2.5">Column</th>
                  <th className="text-left font-medium px-3 py-2.5 hidden md:table-cell">Also accepted</th>
                  <th className="text-left font-medium px-3 py-2.5 w-20">Needed?</th>
                  <th className="text-left font-medium px-3 py-2.5">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {cols.map((c) => (
                  <tr key={c.col} className="hover:bg-moss-soft/25 transition-colors">
                    <td className="px-4 py-3 font-mono text-[12.5px] font-medium text-moss-deep whitespace-nowrap">{c.col}</td>
                    <td className="px-3 py-3 font-mono text-[11.5px] text-faint hidden md:table-cell">{c.also}</td>
                    <td className="px-3 py-3">{c.req ? <Chip tone="pen">required</Chip> : <Chip>optional</Chip>}</td>
                    <td className="px-3 py-3 text-mute text-[13px] leading-relaxed">{c.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* example */}
          <div className="bg-ink rounded-md overflow-hidden anim-fade-up">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-paper/10">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/50">example.csv</span>
              <span className="font-mono text-[10px] text-[#7fc8a8]">utf-8 · header first</span>
            </div>
            <pre className="font-mono text-[11.5px] leading-[1.7] text-[#cfe6d9] p-4 overflow-x-auto">
{`prompt,answer,wrong_1,wrong_2,wrong_3,explanation,tags,difficulty
"Which planet has the most moons?",Saturn,Jupiter,Uranus,Neptune,"146 and counting.",astronomy,medium
"What does HTTP 418 mean?","I'm a teapot",Payment required,Not found,Too many requests,"RFC 2324 folklore.",web;http,easy`}
            </pre>
          </div>

          {/* rules */}
          <div className="bg-card border border-line rounded-md p-5 anim-fade-up">
            <h3 className="font-display font-bold text-ink mb-3">House rules</h3>
            <ul className="space-y-2.5 text-[13.5px] text-mute leading-relaxed">
              {[
                ["One header row", "It must be the very first line. Column order doesn't matter; names are case-insensitive."],
                ["One question per row", "Quotes are your friend — wrap any field containing commas or line breaks in \"…\"."],
                ["Two distractors minimum", "Rows with fewer than two wrong options are flagged and skipped on import."],
                ["No twin options", "If the correct answer and a distractor (or two distractors) match, the row is flagged."],
                ["Extra columns are fine", "Unrecognised columns are ignored with a warning, so wider exports still import cleanly."],
                ["Errors don't sink the file", "Bad rows are listed in the parse report; every valid, ticked row still imports."],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-0.5 text-moss shrink-0"><IconCheck /></span>
                  <span>
                    <strong className="text-ink font-semibold">{t}.</strong> {d}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* aside */}
        <div className="space-y-4">
          <div className="bg-ink text-paper rounded-md p-5 anim-fade-up">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/45 mb-2">Fastest path</div>
            <p className="text-sm leading-relaxed text-paper/80">
              Download the sample, open it in any spreadsheet, swap in your own questions, save as CSV — done.
            </p>
            <div className="flex flex-col gap-2 mt-4">
              <Btn variant="soft" size="sm" onClick={downloadSampleCSV}>
                <IconDownload /> Sample with 6 rows
              </Btn>
              <Btn
                size="sm"
                className="!bg-paper/10 !text-paper !shadow-none hover:!bg-paper/20 border border-paper/15"
                onClick={() => onNav("import")}
              >
                <IconArrowR /> Go to the importer
              </Btn>
            </div>
          </div>

          <div className="border border-line rounded-md bg-card p-5 anim-fade-up">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute mb-3">Where do imports land?</div>
            <div className="flex items-start gap-3 text-[13px] text-mute leading-relaxed">
              <span className="text-xl text-moss shrink-0 mt-0.5"><IconInbox /></span>
              <p>
                The importer asks: a <strong className="text-ink">new bank</strong> or an{" "}
                <strong className="text-ink">existing one</strong>. Merging into an existing bank appends — it never
                overwrites what's already filed.
              </p>
            </div>
          </div>

          <div className="border-2 border-dashed border-line-2 rounded-md p-5 anim-fade-up">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute mb-2">Spreadsheets</div>
            <p className="text-[13px] text-mute leading-relaxed">
              Excel, Numbers and Google Sheets all export compatible CSVs — just keep the header names on row one and
              use <em>File → Download/Export → CSV</em>.
            </p>
          </div>

          <div className="anim-fade-up flex items-center gap-2 px-1">
            <IconPlus className="text-faint" />
            <span className="font-mono text-[10.5px] uppercase tracking-widest text-faint">
              tags split on ; or | · blank rows skipped
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
