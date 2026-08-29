import { useEffect, useMemo, useState } from "react";
import type { Bank, ParsedRow, Question, SessionItem, TestResult, TestSession } from "./lib/types";
import { BANK_COLORS, shuffle, uid } from "./lib/types";
import { loadBanks, loadResults, saveBanks, saveResults } from "./lib/data";
import Shell from "./components/Shell";
import Overview from "./components/Overview";
import BanksView, { type QuestionDraft } from "./components/BanksView";
import ImportView, { FormatGuide, type ImportTarget } from "./components/ImportView";
import BuilderView from "./components/BuilderView";
import RunnerView from "./components/RunnerView";
import ResultsView, { HistoryView } from "./components/ResultsView";
import { ToastHost, type ToastMsg } from "./components/ui";

export default function App() {
  const [banks, setBanks] = useState<Bank[]>(() => loadBanks());
  const [results, setResults] = useState<TestResult[]>(() => loadResults());
  const [session, setSession] = useState<TestSession | null>(null);
  const [viewKey, setViewKey] = useState("overview");
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  useEffect(() => saveBanks(banks), [banks]);
  useEffect(() => saveResults(results), [results]);

  const nav = (key: string) => setViewKey(key);

  const toast = (kind: ToastMsg["kind"], text: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((t) => [...t.slice(-3), { id, kind, text }]);
  };
  const dismissToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  /* ---------- banks & questions ---------- */

  const createBank = (name: string) => {
    const bank: Bank = {
      id: uid(),
      name,
      color: BANK_COLORS[banks.length % BANK_COLORS.length],
      createdAt: Date.now(),
      questions: [],
    };
    setBanks((b) => [bank, ...b]);
    setViewKey(`bank:${bank.id}`);
    toast("success", `Bank “${name}” created — it's ready for questions.`);
  };

  const deleteBank = (id: string) => {
    const b = banks.find((x) => x.id === id);
    setBanks((all) => all.filter((x) => x.id !== id));
    setViewKey("banks");
    toast("info", b ? `“${b.name}” and its ${b.questions.length} questions were deleted.` : "Bank deleted.");
  };

  const saveQuestion = (bankId: string, draft: QuestionDraft, existingId?: string) => {
    setBanks((all) =>
      all.map((b) => {
        if (b.id !== bankId) return b;
        if (existingId) {
          return { ...b, questions: b.questions.map((q) => (q.id === existingId ? { ...q, ...draft } : q)) };
        }
        const q: Question = { id: uid(), ...draft };
        return { ...b, questions: [...b.questions, q] };
      })
    );
    toast("success", existingId ? "Question updated." : "Question filed into the bank.");
  };

  const deleteQuestion = (bankId: string, qid: string) => {
    setBanks((all) => all.map((b) => (b.id === bankId ? { ...b, questions: b.questions.filter((q) => q.id !== qid) } : b)));
    toast("info", "Question deleted.");
  };

  /* ---------- import ---------- */

  const runImport = (target: ImportTarget, rows: ParsedRow[]) => {
    const questions: Question[] = rows.map((r) => ({
      id: uid(),
      prompt: r.prompt,
      options: [r.answer, ...r.wrongs],
      correctIndex: 0,
      explanation: r.explanation,
      tags: r.tags,
      difficulty: r.difficulty,
    }));

    if (target.kind === "new") {
      const bank: Bank = {
        id: uid(),
        name: target.name,
        color: BANK_COLORS[banks.length % BANK_COLORS.length],
        createdAt: Date.now(),
        questions,
      };
      setBanks((b) => [bank, ...b]);
      setViewKey(`bank:${bank.id}`);
      toast("success", `Imported ${questions.length} question${questions.length === 1 ? "" : "s"} into new bank “${target.name}”.`);
    } else {
      const existing = banks.find((b) => b.id === target.id);
      setBanks((all) => all.map((b) => (b.id === target.id ? { ...b, questions: [...b.questions, ...questions] } : b)));
      setViewKey(`bank:${target.id}`);
      toast(
        "success",
        `Added ${questions.length} question${questions.length === 1 ? "" : "s"} to “${existing?.name ?? "bank"}” — now holding ${
          (existing?.questions.length ?? 0) + questions.length
        }.`
      );
    }
  };

  /* ---------- tests ---------- */

  const startTest = (s: TestSession) => {
    setSession(s);
    setViewKey("run");
    toast("info", `“${s.name}” started — ${s.items.length} questions${s.timeLimitSec ? ", clock running" : ""}.`);
  };

  const finishTest = (result: TestResult) => {
    setResults((r) => [result, ...r]);
    setSession(null);
    setViewKey(`result:${result.id}`);
    const pct = result.total ? Math.round((result.correct / result.total) * 100) : 0;
    toast(pct >= 70 ? "success" : "info", `Test scored: ${result.correct}/${result.total} (${pct}%).`);
  };

  const retake = (result: TestResult) => {
    const items: SessionItem[] = result.items.map((it) => {
      const idx = it.options.map((_, i) => i);
      const order = shuffle(idx);
      return {
        key: uid(),
        prompt: it.prompt,
        options: order.map((i) => it.options[i]),
        correctIndex: order.indexOf(it.correctIndex),
        explanation: it.explanation,
        tags: it.tags,
      };
    });
    setSession({
      id: uid(),
      name: result.name,
      bankNames: result.bankNames,
      items: shuffle(items),
      startedAt: Date.now(),
      timeLimitSec: result.timeLimitSec,
    });
    setViewKey("run");
  };

  const abandon = () => {
    setSession(null);
    setViewKey("builder");
    toast("info", "Attempt abandoned — nothing was recorded.");
  };

  const deleteResult = (id: string) => {
    setResults((r) => r.filter((x) => x.id !== id));
    if (viewKey === `result:${id}`) setViewKey("history");
    toast("info", "Result removed from the ledger.");
  };

  /* ---------- routing ---------- */

  const [kind, param] = useMemo(() => {
    const i = viewKey.indexOf(":");
    return i === -1 ? [viewKey, null as string | null] : [viewKey.slice(0, i), viewKey.slice(i + 1)];
  }, [viewKey]);

  const shellKey = kind === "bank" ? "banks" : kind === "result" ? "history" : kind === "run" ? "builder" : kind;
  const activeBankId = kind === "bank" ? param : undefined;

  const activeResult = kind === "result" && param ? results.find((r) => r.id === param) : undefined;
  const activeBank = kind === "bank" && param ? banks.find((b) => b.id === param) : undefined;

  let view: React.ReactNode;
  if (kind === "run" && session) {
    view = <RunnerView session={session} onFinish={finishTest} onAbandon={abandon} />;
  } else if (kind === "result" && activeResult) {
    view = <ResultsView result={activeResult} onRetake={() => retake(activeResult)} onBack={() => nav("history")} />;
  } else if (kind === "bank" && activeBank) {
    view = (
      <BanksView
        banks={banks}
        openId={activeBank.id}
        autoCreate={false}
        onOpen={(id) => nav(id ? `bank:${id}` : "banks")}
        onCreate={createBank}
        onDeleteBank={deleteBank}
        onSaveQuestion={saveQuestion}
        onDeleteQuestion={deleteQuestion}
        onNav={nav}
      />
    );
  } else if (kind === "banks") {
    view = (
      <BanksView
        banks={banks}
        openId={null}
        autoCreate={param === "new"}
        onOpen={(id) => nav(id ? `bank:${id}` : "banks")}
        onCreate={createBank}
        onDeleteBank={deleteBank}
        onSaveQuestion={saveQuestion}
        onDeleteQuestion={deleteQuestion}
        onNav={nav}
      />
    );
  } else if (kind === "import") {
    view = <ImportView banks={banks} preselected={param} onImport={runImport} onNav={nav} />;
  } else if (kind === "format") {
    view = <FormatGuide onNav={nav} />;
  } else if (kind === "builder") {
    view = <BuilderView banks={banks} preselected={param} onStart={startTest} onNav={nav} />;
  } else if (kind === "history") {
    view = (
      <HistoryView
        results={results}
        onOpen={(id) => nav(`result:${id}`)}
        onRetake={retake}
        onDelete={deleteResult}
        onNav={nav}
      />
    );
  } else {
    view = <Overview banks={banks} results={results} onNav={nav} />;
  }

  return (
    <>
      <Shell activeKey={shellKey} onNav={nav} banks={banks} activeBankId={activeBankId ?? undefined} resetKey={viewKey}>
        <div key={viewKey}>{view}</div>
      </Shell>
      <ToastHost toasts={toasts} dismiss={dismissToast} />
    </>
  );
}
