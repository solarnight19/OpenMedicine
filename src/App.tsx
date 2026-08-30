import { useEffect, useMemo, useState } from "react";
import type { Bank, LibraryEntry, ParsedRow, Question, SessionItem, TestResult, TestSession, User } from "./lib/types";
import { BANK_COLORS, shuffle, uid } from "./lib/types";
import type { AccountData } from "./lib/data";
import {
  favoriteCounts,
  hashPw,
  loadAccount,
  loadLibrary,
  loadSession,
  loadUsers,
  sampleBanks,
  saveAccount,
  saveLibrary,
  saveSession,
  saveUsers,
  seedLibraryIfNeeded,
} from "./lib/data";
import Shell from "./components/Shell";
import AuthView from "./components/AuthView";
import Overview from "./components/Overview";
import BanksView, { type QuestionDraft } from "./components/BanksView";
import ImportView, { FormatGuide, type ImportTarget } from "./components/ImportView";
import BuilderView from "./components/BuilderView";
import RunnerView from "./components/RunnerView";
import ResultsView, { HistoryView } from "./components/ResultsView";
import LibraryView from "./components/LibraryView";
import { ToastHost, type ToastMsg } from "./components/ui";

export default function App() {
  const [users, setUsers] = useState<User[]>(() => loadUsers());
  const [userId, setUserId] = useState<string | null>(() => {
    seedLibraryIfNeeded();
    return loadSession();
  });
  const [account, setAccount] = useState<AccountData | null>(() => {
    const sid = loadSession();
    return sid ? loadAccount(sid) : null;
  });
  const [library, setLibrary] = useState<LibraryEntry[]>(() => loadLibrary());
  const [session, setSession] = useState<TestSession | null>(null);
  const [viewKey, setViewKey] = useState("overview");
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const user = useMemo(() => users.find((u) => u.id === userId) ?? null, [users, userId]);

  useEffect(() => {
    if (user && account) saveAccount(user.id, account);
  }, [account, user]);
  useEffect(() => saveLibrary(library), [library]);

  const patch = (fn: (a: AccountData) => AccountData) => setAccount((a) => (a ? fn(a) : a));

  const toast = (kind: ToastMsg["kind"], text: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((t) => [...t.slice(-3), { id, kind, text }]);
  };
  const dismissToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));
  const nav = (key: string) => setViewKey(key);

  /* ---------- auth ---------- */

  const enter = (u: User, data: AccountData, greeting: string) => {
    saveSession(u.id);
    setUserId(u.id);
    setAccount(data);
    setViewKey("overview");
    toast("success", greeting);
  };

  const handleLogin = (email: string, pw: string): string | null => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return "That email doesn't look valid.";
    const u = users.find((x) => x.email.toLowerCase() === email.toLowerCase());
    if (!u) return "No account matches that email — try creating one.";
    if (u.pw !== hashPw(pw)) return "Incorrect password for that account.";
    enter(u, loadAccount(u.id), `Welcome back, ${u.name.split(" ")[0]} — chart reopened.`);
    return null;
  };

  const handleSignup = (name: string, email: string, pw: string, seedSamples: boolean): string | null => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return "That email doesn't look valid.";
    if (users.some((x) => x.email.toLowerCase() === email.toLowerCase()))
      return "An account with that email already exists — sign in instead.";
    const u: User = { id: uid(), name, email, pw: hashPw(pw), createdAt: Date.now() };
    const data: AccountData = {
      banks: seedSamples ? sampleBanks() : [],
      results: [],
      favorites: [],
    };
    setUsers((all) => {
      const next = [...all, u];
      saveUsers(next);
      return next;
    });
    enter(u, data, `Account created — welcome to OpenMedicine, ${name.split(" ")[0]}.`);
    return null;
  };

  const handleDemo = () => {
    const email = "demo@openmedicine.local";
    let u = users.find((x) => x.email === email);
    let data: AccountData;
    if (u) {
      data = loadAccount(u.id);
    } else {
      u = { id: uid(), name: "Demo Resident", email, pw: hashPw("demo-demo"), createdAt: Date.now() };
      data = { banks: sampleBanks(), results: [], favorites: [library[0]?.id].filter(Boolean) as string[] };
      setUsers((all) => {
        const next = [...all, u!];
        saveUsers(next);
        return next;
      });
      saveAccount(u.id, data);
    }
    enter(u, data, "Signed into the demo ward — two sample banks are on file.");
  };

  const handleLogout = () => {
    saveSession(null);
    setUserId(null);
    setAccount(null);
    setSession(null);
    setViewKey("overview");
    toast("info", "Signed out — the chart is closed.");
  };

  /* ---------- banks & questions ---------- */

  const createBank = (name: string) => {
    const bank: Bank = {
      id: uid(),
      name,
      color: BANK_COLORS[(account?.banks.length ?? 0) % BANK_COLORS.length],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      questions: [],
    };
    patch((a) => ({ ...a, banks: [bank, ...a.banks] }));
    setViewKey(`bank:${bank.id}`);
    toast("success", `Bank “${name}” created — it's ready for questions.`);
  };

  const deleteBank = (id: string) => {
    const b = account?.banks.find((x) => x.id === id);
    // unpublish alongside deletion so the library never points at a ghost
    if (b?.publishedEntryId) {
      setLibrary((l) => l.filter((e) => e.id !== b.publishedEntryId));
    }
    patch((a) => ({
      ...a,
      banks: a.banks.filter((x) => x.id !== id),
      favorites: a.favorites.filter((f) => f !== id),
    }));
    setViewKey("banks");
    toast("info", b ? `“${b.name}” and its ${b.questions.length} questions were deleted.` : "Bank deleted.");
  };

  const saveQuestion = (bankId: string, draft: QuestionDraft, existingId?: string) => {
    patch((a) => ({
      ...a,
      banks: a.banks.map((b) => {
        if (b.id !== bankId) return b;
        if (existingId) {
          return { ...b, updatedAt: Date.now(), questions: b.questions.map((q) => (q.id === existingId ? { ...q, ...draft } : q)) };
        }
        const q: Question = { id: uid(), ...draft };
        return { ...b, updatedAt: Date.now(), questions: [...b.questions, q] };
      }),
    }));
    toast("success", existingId ? "Question updated." : "Question filed into the bank.");
  };

  const deleteQuestion = (bankId: string, qid: string) => {
    patch((a) => ({
      ...a,
      banks: a.banks.map((b) =>
        b.id === bankId ? { ...b, updatedAt: Date.now(), questions: b.questions.filter((q) => q.id !== qid) } : b
      ),
    }));
    toast("info", "Question deleted.");
  };

  /* ---------- favourites ---------- */

  const toggleFavorite = (ref: string) => {
    const already = account?.favorites.includes(ref);
    patch((a) => ({
      ...a,
      favorites: already ? a.favorites.filter((f) => f !== ref) : [...a.favorites, ref],
    }));
    if (already) toast("info", "Removed from your favourites.");
    else toast("success", "Saved to your favourites — it now sits in the sidebar.");
  };

  /* ---------- publishing ---------- */

  const publishBank = (bankId: string, description: string) => {
    const bank = account?.banks.find((b) => b.id === bankId);
    if (!bank || !user) return;
    if (bank.questions.length === 0) {
      toast("error", "Add at least one question before publishing.");
      return;
    }
    const entry: LibraryEntry = {
      id: uid(),
      bankId: bank.id,
      ownerId: user.id,
      authorName: user.name,
      name: bank.name,
      description: description.trim() || `A ${bank.questions.length}-question bank shared from OpenMedicine.`,
      color: bank.color,
      publishedAt: Date.now(),
      updatedAt: Date.now(),
      questions: bank.questions.map((q) => ({ ...q })),
    };
    setLibrary((l) => [entry, ...l]);
    patch((a) => ({
      ...a,
      banks: a.banks.map((b) => (b.id === bankId ? { ...b, publishedEntryId: entry.id, updatedAt: Date.now() } : b)),
    }));
    toast("success", `“${bank.name}” is live in the Open Library.`);
  };

  const unpublishBank = (bankId: string) => {
    const bank = account?.banks.find((b) => b.id === bankId);
    if (!bank?.publishedEntryId) return;
    setLibrary((l) => l.filter((e) => e.id !== bank.publishedEntryId));
    patch((a) => ({
      ...a,
      banks: a.banks.map((b) => (b.id === bankId ? { ...b, publishedEntryId: undefined } : b)),
    }));
    toast("info", `“${bank.name}” was withdrawn from the Open Library.`);
  };

  const updatePublished = (bankId: string) => {
    const bank = account?.banks.find((b) => b.id === bankId);
    if (!bank?.publishedEntryId) return;
    setLibrary((l) =>
      l.map((e) =>
        e.id === bank.publishedEntryId
          ? { ...e, name: bank.name, color: bank.color, questions: bank.questions.map((q) => ({ ...q })), updatedAt: Date.now() }
          : e
      )
    );
    toast("success", "The published copy now matches your bank.");
  };

  const cloneFromLibrary = (entry: LibraryEntry) => {
    if (!account) return;
    let name = entry.name;
    if (account.banks.some((b) => b.name.toLowerCase() === name.toLowerCase())) name = `${name} (copy)`;
    const bank: Bank = {
      id: uid(),
      name,
      color: entry.color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      questions: entry.questions.map((q) => ({ ...q, id: uid() })),
    };
    patch((a) => ({ ...a, banks: [bank, ...a.banks] }));
    setViewKey(`bank:${bank.id}`);
    toast("success", `“${entry.name}” cloned into your banks — ${bank.questions.length} questions copied.`);
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
        color: BANK_COLORS[(account?.banks.length ?? 0) % BANK_COLORS.length],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        questions,
      };
      patch((a) => ({ ...a, banks: [bank, ...a.banks] }));
      setViewKey(`bank:${bank.id}`);
      toast("success", `Imported ${questions.length} question${questions.length === 1 ? "" : "s"} into new bank “${target.name}”.`);
    } else {
      const existing = account?.banks.find((b) => b.id === target.id);
      patch((a) => ({
        ...a,
        banks: a.banks.map((b) =>
          b.id === target.id ? { ...b, updatedAt: Date.now(), questions: [...b.questions, ...questions] } : b
        ),
      }));
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
    patch((a) => ({ ...a, results: [result, ...a.results] }));
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
    patch((a) => ({ ...a, results: a.results.filter((x) => x.id !== id) }));
    if (viewKey === `result:${id}`) setViewKey("history");
    toast("info", "Result removed from the ledger.");
  };

  const favCounts = useMemo(() => favoriteCounts(), [account?.favorites, library]);

  const [kind, param] = useMemo(() => {
    const i = viewKey.indexOf(":");
    return i === -1 ? [viewKey, null as string | null] : [viewKey.slice(0, i), viewKey.slice(i + 1)];
  }, [viewKey]);

  /* ---------- gate: not signed in ---------- */

  if (!user || !account) {
    return (
      <>
        <AuthView onLogin={handleLogin} onSignup={handleSignup} onDemo={handleDemo} />
        <ToastHost toasts={toasts} dismiss={dismissToast} />
      </>
    );
  }

  /* ---------- routing ---------- */

  const banks = account.banks;
  const results = account.results;
  const favorites = account.favorites;

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
        favorites={favorites}
        library={library}
        onToggleFavorite={toggleFavorite}
        onPublish={publishBank}
        onUnpublish={unpublishBank}
        onUpdatePublished={updatePublished}
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
        favorites={favorites}
        library={library}
        onToggleFavorite={toggleFavorite}
        onPublish={publishBank}
        onUnpublish={unpublishBank}
        onUpdatePublished={updatePublished}
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
  } else if (kind === "library") {
    view = (
      <LibraryView
        library={library}
        user={user}
        favorites={favorites}
        favCounts={favCounts}
        onToggleFavorite={toggleFavorite}
        onClone={cloneFromLibrary}
        onNav={nav}
      />
    );
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
    view = (
      <Overview
        banks={banks}
        results={results}
        favorites={favorites}
        library={library}
        favCounts={favCounts}
        user={user}
        onToggleFavorite={toggleFavorite}
        onNav={nav}
      />
    );
  }

  return (
    <>
      <Shell
        activeKey={shellKey}
        onNav={nav}
        banks={banks}
        library={library}
        favorites={favorites}
        user={user}
        onLogout={handleLogout}
        activeBankId={activeBankId ?? undefined}
        resetKey={viewKey}
      >
        <div key={viewKey}>{view}</div>
      </Shell>
      <ToastHost toasts={toasts} dismiss={dismissToast} />
    </>
  );
}
