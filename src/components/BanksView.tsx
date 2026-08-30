import { useMemo, useState } from "react";
import type { Bank, Difficulty, LibraryEntry, Question } from "../lib/types";
import { DIFFICULTIES, fmtDate, LETTERS, uid } from "../lib/types";
import { Btn, Chip, EmptyState, Field, Modal, SectionTitle, inputCls } from "./ui";
import {
  IconBank, IconPlus, IconSearch, IconTrash, IconPencil, IconUpload, IconTarget,
  IconChevronL, IconAlert, IconCheck, IconInbox, IconX, IconGlobe, IconHeart,
} from "./icons";

const diffTone: Record<Difficulty, "moss" | "amber" | "pen"> = { easy: "moss", medium: "amber", hard: "pen" };

/* ================= Question editor ================= */

export interface QuestionDraft {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  tags: string[];
  difficulty: Difficulty;
}

function QuestionEditor({
  bank,
  existing,
  onClose,
  onSave,
}: {
  bank: Bank;
  existing?: Question;
  onClose: () => void;
  onSave: (draft: QuestionDraft, id?: string) => void;
}) {
  const [prompt, setPrompt] = useState(existing?.prompt ?? "");
  const [correct, setCorrect] = useState(existing ? existing.options[existing.correctIndex] : "");
  const [wrongs, setWrongs] = useState<string[]>(
    existing ? existing.options.filter((_, i) => i !== existing.correctIndex) : ["", ""]
  );
  const [explanation, setExplanation] = useState(existing?.explanation ?? "");
  const [tags, setTags] = useState(existing ? existing.tags.join(", ") : "");
  const [difficulty, setDifficulty] = useState<Difficulty>(existing?.difficulty ?? "medium");
  const [err, setErr] = useState<string | null>(null);

  const setWrong = (i: number, v: string) => setWrongs((w) => w.map((x, j) => (j === i ? v : x)));

  const submit = () => {
    const filled = wrongs.map((w) => w.trim()).filter(Boolean);
    if (!prompt.trim()) return setErr("The question prompt can't be empty.");
    if (!correct.trim()) return setErr("Enter the correct answer.");
    if (filled.length < 2) return setErr("Provide at least two wrong options.");
    const all = [correct.trim(), ...filled].map((o) => o.toLowerCase());
    if (new Set(all).size !== all.length) return setErr("Two options have the same text — make each option unique.");
    onSave(
      {
        prompt: prompt.trim(),
        options: [correct.trim(), ...filled],
        correctIndex: 0,
        explanation: explanation.trim() || undefined,
        tags: tags.split(/[,;]/).map((t) => t.trim()).filter(Boolean),
        difficulty,
      },
      existing?.id
    );
  };

  return (
    <Modal
      kicker={bank.name}
      title={existing ? "Edit question" : "New question"}
      onClose={onClose}
      wide
    >
      <div className="space-y-4">
        <Field label="Question prompt">
          <textarea
            className={`${inputCls} resize-y min-h-[76px]`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Which strait separates Europe from Africa?"
            autoFocus
          />
        </Field>

        <Field label="Correct answer">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-moss">
              <IconCheck />
            </span>
            <input
              className={`${inputCls} pl-9 border-moss/40 bg-moss-soft/40`}
              value={correct}
              onChange={(e) => setCorrect(e.target.value)}
              placeholder="The option marked right"
            />
          </div>
        </Field>

        <Field label="Wrong options" hint={`${wrongs.filter((w) => w.trim()).length} filled · need ≥ 2`}>
          <div className="space-y-2">
            {wrongs.map((w, i) => (
              <div className="flex gap-2" key={i}>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pen">
                    <IconX />
                  </span>
                  <input
                    className={`${inputCls} pl-9`}
                    value={w}
                    onChange={(e) => setWrong(i, e.target.value)}
                    placeholder={`Distractor ${i + 1}`}
                  />
                </div>
                {wrongs.length > 2 && (
                  <button
                    onClick={() => setWrongs((arr) => arr.filter((_, j) => j !== i))}
                    className="px-2.5 rounded-md border border-line-2 text-mute hover:text-pen hover:border-pen/50 transition-colors cursor-pointer"
                    aria-label="Remove option"
                  >
                    <IconTrash />
                  </button>
                )}
              </div>
            ))}
            {wrongs.length < 5 && (
              <button
                onClick={() => setWrongs((w) => [...w, ""])}
                className="text-[12.5px] font-semibold text-moss hover:text-moss-deep flex items-center gap-1 cursor-pointer"
              >
                <IconPlus /> Add another distractor
              </button>
            )}
          </div>
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Difficulty">
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 px-2 py-2 rounded-md border text-[12.5px] font-semibold capitalize transition-all cursor-pointer ${
                    difficulty === d
                      ? d === "easy"
                        ? "bg-moss-soft border-moss text-moss-deep"
                        : d === "medium"
                          ? "bg-amber-soft border-amber text-[#8a5a10]"
                          : "bg-pen-soft border-pen text-[#a03328]"
                      : "border-line-2 text-mute hover:border-ink/30"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Tags" hint="comma separated">
            <input className={inputCls} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="geography, capitals" />
          </Field>
        </div>

        <Field label="Explanation" hint="optional · shown in review">
          <textarea
            className={`${inputCls} resize-y min-h-[60px]`}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Why is that the right answer?"
          />
        </Field>

        {err && (
          <div className="flex items-center gap-2 text-[13px] font-medium text-[#a03328] bg-pen-soft border border-pen/30 rounded-md px-3 py-2.5 anim-pop">
            <IconAlert /> {err}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={submit}>{existing ? "Save changes" : "Add to bank"}</Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ================= Confirm dialog ================= */

export function Confirm({
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-mute leading-relaxed">{body}</p>
      <div className="flex justify-end gap-2 mt-6">
        <Btn variant="ghost" onClick={onClose}>Keep it</Btn>
        <Btn
          variant="danger"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          <IconTrash /> {confirmLabel}
        </Btn>
      </div>
    </Modal>
  );
}

/* ================= Bank detail ================= */

function BankDetail({
  bank,
  isFav,
  isStale,
  onBack,
  onSaveQuestion,
  onDeleteQuestion,
  onDeleteBank,
  onToggleFavorite,
  onPublishRequest,
  onUnpublishRequest,
  onUpdatePublished,
  onNav,
}: {
  bank: Bank;
  isFav: boolean;
  isStale: boolean;
  onBack: () => void;
  onSaveQuestion: (draft: QuestionDraft, id?: string) => void;
  onDeleteQuestion: (qid: string) => void;
  onDeleteBank: () => void;
  onToggleFavorite: (id: string) => void;
  onPublishRequest: (bank: Bank) => void;
  onUnpublishRequest: (bank: Bank) => void;
  onUpdatePublished: (id: string) => void;
  onNav: (key: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<{ open: boolean; existing?: Question }>({ open: false });
  const [confirmQ, setConfirmQ] = useState<Question | null>(null);
  const [confirmBank, setConfirmBank] = useState(false);

  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return bank.questions;
    return bank.questions.filter(
      (q) =>
        q.prompt.toLowerCase().includes(s) ||
        q.tags.some((t) => t.toLowerCase().includes(s)) ||
        q.options.some((o) => o.toLowerCase().includes(s))
    );
  }, [bank.questions, query]);

  return (
    <div className="max-w-[1060px] mx-auto px-5 sm:px-8 py-7">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[13px] font-semibold text-mute hover:text-ink transition-colors mb-5 cursor-pointer"
      >
        <IconChevronL /> All banks
      </button>

      <header className="anim-fade-up">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span
              className="mt-1 w-11 h-11 rounded-md flex items-center justify-center text-paper text-xl shadow-lift"
              style={{ background: bank.color }}
            >
              <IconBank />
            </span>
            <div>
              <h1 className="font-display font-extrabold text-[28px] leading-tight text-ink tracking-tight">{bank.name}</h1>
              <div className="flex flex-wrap gap-2 mt-1.5">
                <Chip>{bank.questions.length} questions</Chip>
                <Chip tone="neutral">created {fmtDate(bank.createdAt)}</Chip>
                {bank.publishedEntryId && (
                  <Chip tone="moss">
                    <IconGlobe /> published
                  </Chip>
                )}
                {bank.publishedEntryId && isStale && <Chip tone="amber">copy out of date</Chip>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn size="sm" onClick={() => setEditor({ open: true })}>
              <IconPlus /> New question
            </Btn>
            <Btn size="sm" variant="ghost" onClick={() => onNav(`import:${bank.id}`)}>
              <IconUpload className="text-moss" /> Import CSV
            </Btn>
            <Btn size="sm" variant="ghost" onClick={() => onNav(`builder:${bank.id}`)}>
              <IconTarget className="text-cobalt" /> Build test
            </Btn>
            {bank.publishedEntryId ? (
              <>
                {isStale && (
                  <Btn size="sm" variant="soft" onClick={() => onUpdatePublished(bank.id)}>
                    <IconGlobe /> Sync published copy
                  </Btn>
                )}
                <Btn size="sm" variant="ghost" onClick={() => onUnpublishRequest(bank)}>
                  <IconX className="text-pen" /> Withdraw
                </Btn>
              </>
            ) : (
              <Btn size="sm" variant="soft" onClick={() => onPublishRequest(bank)}>
                <IconGlobe /> Publish
              </Btn>
            )}
            <button
              onClick={() => onToggleFavorite(bank.id)}
              className={`px-3 py-2 rounded-md border text-sm font-semibold inline-flex items-center gap-2 transition-all cursor-pointer ${
                isFav
                  ? "bg-amber-soft border-amber/50 text-[#8a5a10]"
                  : "bg-transparent text-body border-line-2 hover:border-amber/50 hover:text-[#8a5a10] hover:bg-amber-soft/50"
              }`}
              title={isFav ? "Remove from favourites" : "Save to favourites"}
            >
              <IconHeart filled={isFav} /> {isFav ? "Favourited" : "Favourite"}
            </button>
          </div>
        </div>
        <div className="dash-b mt-5" />
      </header>

      {/* search + table */}
      <div className="mt-5 anim-fade-up">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="relative w-full sm:w-[300px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-faint">
              <IconSearch />
            </span>
            <input
              className={`${inputCls} pl-9`}
              placeholder="Search prompt, option or tag…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {query && (
            <span className="font-mono text-[11px] uppercase tracking-widest text-mute">
              {filtered.length} of {bank.questions.length} shown
            </span>
          )}
        </div>

        {bank.questions.length === 0 ? (
          <EmptyState
            icon={<IconInbox />}
            title="This bank is empty"
            body="Add questions one by one, or feed it a CSV and let OpenMedicine do the filing."
            action={
              <>
                <Btn onClick={() => setEditor({ open: true })}>
                  <IconPlus /> Write a question
                </Btn>
                <Btn variant="ghost" onClick={() => onNav(`import:${bank.id}`)}>
                  <IconUpload /> Import CSV
                </Btn>
              </>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<IconSearch />}
            title="No matches"
            body={`Nothing in “${bank.name}” matches “${query}”. Try a different word or clear the search.`}
            action={<Btn variant="ghost" onClick={() => setQuery("")}>Clear search</Btn>}
          />
        ) : (
          <div className="bg-card border border-line rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute bg-paper/70 border-b border-line">
                  <th className="text-left font-medium px-4 py-2.5 w-10">#</th>
                  <th className="text-left font-medium px-3 py-2.5">Prompt</th>
                  <th className="text-left font-medium px-3 py-2.5 hidden md:table-cell w-24">Level</th>
                  <th className="text-left font-medium px-3 py-2.5 hidden lg:table-cell w-44">Tags</th>
                  <th className="text-left font-medium px-3 py-2.5 hidden sm:table-cell w-20">Options</th>
                  <th className="w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((q, i) => (
                  <tr key={q.id} className="group hover:bg-moss-soft/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-faint align-top tabular-nums">{i + 1}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-ink leading-snug">{q.prompt}</div>
                      <div className="text-[12px] text-mute mt-0.5">
                        <span className="text-moss-deep font-semibold">{LETTERS[q.correctIndex]}.</span>{" "}
                        {q.options[q.correctIndex]}
                      </div>
                      <div className="flex gap-1.5 mt-1 md:hidden">
                        <Chip tone={diffTone[q.difficulty]}>{q.difficulty}</Chip>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell align-top">
                      <Chip tone={diffTone[q.difficulty]}>{q.difficulty}</Chip>
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell align-top">
                      <div className="flex flex-wrap gap-1">
                        {q.tags.length === 0 && <span className="text-faint text-[12px]">—</span>}
                        {q.tags.slice(0, 3).map((t) => (
                          <span key={t} className="text-[11px] font-mono text-cobalt bg-cobalt-soft rounded px-1.5 py-0.5">
                            {t}
                          </span>
                        ))}
                        {q.tags.length > 3 && <span className="text-[11px] text-faint font-mono">+{q.tags.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell align-top font-mono text-[12px] text-mute tabular-nums">
                      {q.options.length}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap align-top">
                      <button
                        onClick={() => setEditor({ open: true, existing: q })}
                        className="p-1.5 rounded text-mute hover:text-cobalt hover:bg-cobalt-soft transition-colors cursor-pointer"
                        aria-label="Edit question"
                      >
                        <IconPencil />
                      </button>
                      <button
                        onClick={() => setConfirmQ(q)}
                        className="p-1.5 rounded text-mute hover:text-pen hover:bg-pen-soft transition-colors cursor-pointer"
                        aria-label="Delete question"
                      >
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setConfirmBank(true)}
          className="text-[12.5px] font-semibold text-faint hover:text-pen transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <IconTrash /> Delete this bank
        </button>
      </div>

      {editor.open && (
        <QuestionEditor
          bank={bank}
          existing={editor.existing}
          onClose={() => setEditor({ open: false })}
          onSave={(draft, id) => {
            onSaveQuestion(draft, id);
            setEditor({ open: false });
          }}
        />
      )}
      {confirmQ && (
        <Confirm
          title="Delete this question?"
          body={`“${confirmQ.prompt.slice(0, 110)}${confirmQ.prompt.length > 110 ? "…" : ""}” will be removed from “${bank.name}”. Already-taken tests keep their own copy.`}
          confirmLabel="Delete question"
          onConfirm={() => onDeleteQuestion(confirmQ.id)}
          onClose={() => setConfirmQ(null)}
        />
      )}
      {confirmBank && (
        <Confirm
          title={`Delete “${bank.name}”?`}
          body={`All ${bank.questions.length} questions in this bank will be deleted. Past test results are kept because they store their own snapshots.`}
          confirmLabel="Delete bank"
          onConfirm={onDeleteBank}
          onClose={() => setConfirmBank(false)}
        />
      )}
    </div>
  );
}

/* ================= Publish modal ================= */

function PublishModal({
  bank,
  desc,
  setDesc,
  onClose,
  onConfirm,
}: {
  bank: Bank | null;
  desc: string;
  setDesc: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!bank) return null;
  return (
    <Modal kicker="Open Library" title={`Publish “${bank.name}”`} onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-moss-soft/60 border border-moss/25 rounded-md px-4 py-3 text-[13px] text-mute leading-relaxed">
          A <strong className="text-moss-deep">snapshot</strong> of these {bank.questions.length} questions becomes
          visible to every OpenMedicine account in this browser. They can favourite it or clone it — your bank stays
          yours and editable.
        </div>
        <Field label="Listing description" hint="one or two lines, shown on the library card">
          <textarea
            className={`${inputCls} resize-y min-h-[70px]`}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder={`e.g. High-yield ${bank.name.toLowerCase()} questions with explanations.`}
            autoFocus
          />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Btn variant="ghost" onClick={onClose}>Not yet</Btn>
          <Btn onClick={onConfirm}>
            <IconGlobe /> Publish to library
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ================= Banks grid ================= */

export default function BanksView({
  banks,
  openId,
  autoCreate,
  favorites,
  library,
  onOpen,
  onCreate,
  onDeleteBank,
  onSaveQuestion,
  onDeleteQuestion,
  onToggleFavorite,
  onPublish,
  onUnpublish,
  onUpdatePublished,
  onNav,
}: {
  banks: Bank[];
  openId: string | null;
  autoCreate: boolean;
  favorites: string[];
  library: LibraryEntry[];
  onOpen: (id: string | null) => void;
  onCreate: (name: string) => void;
  onDeleteBank: (id: string) => void;
  onSaveQuestion: (bankId: string, draft: QuestionDraft, id?: string) => void;
  onDeleteQuestion: (bankId: string, qid: string) => void;
  onToggleFavorite: (id: string) => void;
  onPublish: (bankId: string, description: string) => void;
  onUnpublish: (bankId: string) => void;
  onUpdatePublished: (bankId: string) => void;
  onNav: (key: string) => void;
}) {
  const [createOpen, setCreateOpen] = useState(autoCreate);
  const [name, setName] = useState("");
  const [nameErr, setNameErr] = useState<string | null>(null);
  const [publishFor, setPublishFor] = useState<Bank | null>(null);
  const [publishDesc, setPublishDesc] = useState("");
  const [unpublishFor, setUnpublishFor] = useState<Bank | null>(null);

  const entryOf = (b: Bank) => (b.publishedEntryId ? library.find((e) => e.id === b.publishedEntryId) : undefined);
  const isStale = (b: Bank) => {
    const e = entryOf(b);
    return !!e && (b.updatedAt ?? 0) > e.updatedAt;
  };

  const open = openId ? banks.find((b) => b.id === openId) : undefined;

  if (open) {
    return (
      <>
        <BankDetail
          bank={open}
          isFav={favorites.includes(open.id)}
          isStale={isStale(open)}
          onBack={() => onOpen(null)}
          onSaveQuestion={(draft, id) => onSaveQuestion(open.id, draft, id)}
          onDeleteQuestion={(qid) => onDeleteQuestion(open.id, qid)}
          onDeleteBank={() => onDeleteBank(open.id)}
          onToggleFavorite={onToggleFavorite}
          onPublishRequest={(b) => {
            setPublishDesc("");
            setPublishFor(b);
          }}
          onUnpublishRequest={setUnpublishFor}
          onUpdatePublished={onUpdatePublished}
          onNav={onNav}
        />
        <PublishModal
          bank={publishFor}
          desc={publishDesc}
          setDesc={setPublishDesc}
          onClose={() => setPublishFor(null)}
          onConfirm={() => {
            if (publishFor) onPublish(publishFor.id, publishDesc);
            setPublishFor(null);
          }}
        />
        {unpublishFor && (
          <Modal title={`Withdraw “${unpublishFor.name}”?`} onClose={() => setUnpublishFor(null)}>
            <p className="text-sm text-mute leading-relaxed">
              The published copy will be removed from the Open Library immediately. Accounts that cloned it keep their
              copies, and your bank itself is untouched.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <Btn variant="ghost" onClick={() => setUnpublishFor(null)}>Keep it published</Btn>
              <Btn
                variant="danger"
                onClick={() => {
                  onUnpublish(unpublishFor.id);
                  setUnpublishFor(null);
                }}
              >
                <IconX /> Withdraw from library
              </Btn>
            </div>
          </Modal>
        )}
      </>
    );
  }

  const submitCreate = () => {
    const n = name.trim();
    if (!n) return setNameErr("Give the bank a name.");
    if (banks.some((b) => b.name.toLowerCase() === n.toLowerCase())) return setNameErr("A bank with that name already exists.");
    onCreate(n);
    setName("");
    setNameErr(null);
    setCreateOpen(false);
  };

  const totalQs = banks.reduce((n, b) => n + b.questions.length, 0);

  return (
    <>
    <div className="max-w-[1060px] mx-auto px-5 sm:px-8 py-7">
      <SectionTitle
        kicker="Section B"
        title="Question banks"
        right={
          <Btn size="sm" onClick={() => setCreateOpen(true)}>
            <IconPlus /> New bank
          </Btn>
        }
      />
      <p className="text-sm text-mute -mt-2 mb-5">
        {banks.length} bank{banks.length === 1 ? "" : "s"} · {totalQs} question{totalQs === 1 ? "" : "s"} on file
      </p>

      {banks.length === 0 ? (
        <EmptyState
          icon={<IconBank />}
          title="No question banks yet"
          body="Banks hold your questions. Start by importing a CSV — or create an empty bank and write questions by hand."
          action={
            <>
              <Btn onClick={() => onNav("import")}>
                <IconUpload /> Import CSV
              </Btn>
              <Btn variant="ghost" onClick={() => setCreateOpen(true)}>
                <IconPlus /> Empty bank
              </Btn>
            </>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {banks.map((b) => {
            const fav = favorites.includes(b.id);
            const published = !!b.publishedEntryId;
            const stale = isStale(b);
            return (
              <div
                key={b.id}
                className="bg-card border border-line rounded-md overflow-hidden group hover:shadow-lift hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                onClick={() => onOpen(b.id)}
              >
                <div className="hatch-band h-2.5" style={{ background: b.color }} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-bold text-lg text-ink leading-snug group-hover:text-moss transition-colors">
                      {b.name}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(b.id);
                        }}
                        className={`p-1.5 rounded-md border transition-all cursor-pointer ${
                          fav
                            ? "text-[#8a5a10] border-amber/50 bg-amber-soft"
                            : "text-faint border-transparent hover:text-[#8a5a10] hover:bg-amber-soft/60"
                        }`}
                        aria-label={fav ? "Remove from favourites" : "Add to favourites"}
                        title={fav ? "Remove from favourites" : "Save to favourites"}
                      >
                        <IconHeart filled={fav} />
                      </button>
                      <span className="font-mono text-[11px] text-faint bg-paper border border-line rounded px-1.5 py-0.5 tabular-nums">
                        {b.questions.length} q
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="font-mono text-[10.5px] uppercase tracking-widest text-faint">since {fmtDate(b.createdAt)}</span>
                    {published && (
                      <Chip tone="moss" className="text-[9.5px]!">
                        <IconGlobe /> live
                      </Chip>
                    )}
                    {published && stale && <Chip tone="amber" className="text-[9.5px]!">stale copy</Chip>}
                  </div>
                  {b.questions[0] && (
                    <p className="text-[13px] text-mute leading-snug mt-3 line-clamp-2 border-l-2 pl-3" style={{ borderColor: b.color }}>
                      {b.questions[0].prompt}
                    </p>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Btn size="sm" variant="soft" onClick={(e) => { e.stopPropagation(); onOpen(b.id); }}>
                      Open bank
                    </Btn>
                    <Btn size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onNav(`builder:${b.id}`); }}>
                      <IconTarget className="text-cobalt" /> Test
                    </Btn>
                    {published ? (
                      <Btn
                        size="sm"
                        variant="ghost"
                        title="Withdraw from the Open Library"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUnpublishFor(b);
                        }}
                      >
                        <IconX className="text-pen" />
                      </Btn>
                    ) : (
                      <Btn
                        size="sm"
                        variant="ghost"
                        title="Publish to the Open Library"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPublishDesc("");
                          setPublishFor(b);
                        }}
                      >
                        <IconGlobe className="text-moss" />
                      </Btn>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <button
            onClick={() => setCreateOpen(true)}
            className="border-2 border-dashed border-line-2 rounded-md p-5 flex flex-col items-center justify-center gap-2 text-mute hover:text-moss hover:border-moss/50 hover:bg-moss-soft/30 transition-all duration-200 min-h-[180px] cursor-pointer"
          >
            <span className="text-2xl"><IconPlus /></span>
            <span className="font-semibold text-sm">Create a bank</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-faint">or feed it a CSV</span>
          </button>
        </div>
      )}

      {createOpen && (
        <Modal kicker="New collection" title="Create a question bank" onClose={() => setCreateOpen(false)}>
          <Field label="Bank name">
            <input
              className={inputCls}
              value={name}
              onChange={(e) => { setName(e.target.value); setNameErr(null); }}
              onKeyDown={(e) => e.key === "Enter" && submitCreate()}
              placeholder="e.g. Biology 101 — Midterm"
              autoFocus
            />
          </Field>
          {nameErr && (
            <div className="flex items-center gap-2 text-[13px] font-medium text-[#a03328] mt-3 anim-pop">
              <IconAlert /> {nameErr}
            </div>
          )}
          <p className="text-[12.5px] text-mute mt-3 leading-relaxed">
            You can fill it by hand afterwards, or point the CSV importer straight at it.
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <Btn variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Btn>
            <Btn onClick={submitCreate}>
              <IconPlus /> Create bank
            </Btn>
          </div>
        </Modal>
      )}
    </div>

    <PublishModal
      bank={publishFor}
      desc={publishDesc}
      setDesc={setPublishDesc}
      onClose={() => setPublishFor(null)}
      onConfirm={() => {
        if (publishFor) onPublish(publishFor.id, publishDesc);
        setPublishFor(null);
      }}
    />
    {unpublishFor && (
      <Modal title={`Withdraw “${unpublishFor.name}”?`} onClose={() => setUnpublishFor(null)}>
        <p className="text-sm text-mute leading-relaxed">
          The published copy will be removed from the Open Library immediately. Accounts that cloned it keep their
          copies, and your bank itself is untouched.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <Btn variant="ghost" onClick={() => setUnpublishFor(null)}>Keep it published</Btn>
          <Btn
            variant="danger"
            onClick={() => {
              onUnpublish(unpublishFor.id);
              setUnpublishFor(null);
            }}
          >
            <IconX /> Withdraw from library
          </Btn>
        </div>
      </Modal>
    )}
    </>
  );
}
