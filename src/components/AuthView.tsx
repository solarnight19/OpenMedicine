import { useState } from "react";
import { EcgTrace, IconLogo, IconUser, IconAlert, IconPulse, IconArrowR } from "./icons";
import { Btn, Field, inputCls } from "./ui";

export default function AuthView({
  onLogin,
  onSignup,
  onDemo,
}: {
  onLogin: (email: string, pw: string) => string | null;
  onSignup: (name: string, email: string, pw: string, seedSamples: boolean) => string | null;
  onDemo: () => void;
}) {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [seed, setSeed] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [shake, setShake] = useState(0);

  const fail = (msg: string) => {
    setErr(msg);
    setShake((s) => s + 1);
  };

  const submit = () => {
    setErr(null);
    if (tab === "signin") {
      const e = onLogin(email.trim(), pw);
      if (e) fail(e);
    } else {
      if (!name.trim()) return fail("Tell us what to call you on the chart.");
      if (pw.length < 6) return fail("Password needs at least 6 characters.");
      const e = onSignup(name.trim(), email.trim(), pw, seed);
      if (e) fail(e);
    }
  };

  return (
    <div className="min-h-screen ink-bg text-paper flex flex-col">
      {/* top strip */}
      <header className="px-6 sm:px-10 pt-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-[30px] text-[#57c4ae]"><IconLogo /></span>
          <span>
            <span className="block font-display font-bold text-xl leading-none tracking-tight">OpenMedicine</span>
            <span className="block font-mono text-[9.5px] uppercase tracking-[0.24em] text-paper/45 mt-1">
              Open question banks · Clinical education
            </span>
          </span>
        </div>
        <span className="hidden sm:flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-paper/40">
          <span className="w-2 h-2 rounded-full bg-pulse anim-pulse-dot" />
          Demo ward · open
        </span>
      </header>

      <div className="flex-1 grid lg:grid-cols-[1.2fr_1fr] items-center gap-10 px-6 sm:px-10 lg:px-16 py-10 max-w-[1180px] w-full mx-auto">
        {/* left: manifesto + ECG */}
        <div className="anim-fade-up">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#57c4ae] mb-4">
            Candidate intake · Form OM-01
          </div>
          <h1 className="font-display font-bold text-[clamp(34px,5vw,56px)] leading-[1.02] tracking-tight">
            Question banks,
            <br />
            filed like
            <br />
            <span className="text-[#57c4ae]">patient charts.</span>
          </h1>
          <p className="text-paper/65 text-[15px] leading-relaxed max-w-[46ch] mt-5">
            Import comma-separated questions, keep them in banks, favourite the collections worth keeping,
            publish your own to the open library — then drill everything into timed, scored multiple-choice tests.
          </p>

          <div className="mt-7 text-[#57c4ae]">
            <EcgTrace className="w-full max-w-[520px] h-12" />
          </div>

          <ul className="mt-6 space-y-2.5">
            {[
              ["CSV-first", "One recognised header format — prompt, answer, distractors and more."],
              ["Open library", "Publish a bank and every clinician in this browser can favourite or clone it."],
              ["Exam conditions", "Shuffled options, flags, countdown timers and full answer review."],
              ["Installs on your Mac", "Add it to the Dock — its own window, works offline, data never leaves this machine."],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-3 text-[13.5px]">
                <span className="text-[#57c4ae] mt-0.5 shrink-0"><IconPulse /></span>
                <span className="text-paper/60"><strong className="text-paper font-semibold">{t}.</strong> {d}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* right: intake card */}
        <div className="anim-pop" key={shake}>
          <div className={`bg-card text-body rounded-lg shadow-pop border border-line overflow-hidden ${err ? "anim-shake" : ""}`}>
            <div className="hatch-band h-2 bg-ink" />
            <div className="px-6 sm:px-7 pt-6 pb-7">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-[22px] text-ink">
                  {tab === "signin" ? "Sign in" : "Create an account"}
                </h2>
                <span className="w-10 h-10 rounded-md bg-ink text-[#57c4ae] flex items-center justify-center text-xl">
                  <IconUser />
                </span>
              </div>
              <p className="text-[13px] text-mute mt-1">
                {tab === "signin" ? "Pick up your chart where you left off." : "A fresh chart — takes ten seconds."}
              </p>

              {/* tabs */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-paper border border-line rounded-md mt-5 text-[13px] font-semibold">
                {(["signin", "signup"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setErr(null); }}
                    className={`py-2 rounded transition-all cursor-pointer ${
                      tab === t ? "bg-ink text-paper shadow-lift" : "text-mute hover:text-ink"
                    }`}
                  >
                    {t === "signin" ? "Sign in" : "New account"}
                  </button>
                ))}
              </div>

              <div className="space-y-4 mt-5">
                {tab === "signup" && (
                  <Field label="Full name">
                    <input
                      className={inputCls}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Maya Lindqvist"
                      autoFocus
                    />
                  </Field>
                )}
                <Field label="Email">
                  <input
                    className={inputCls}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    placeholder="you@hospital.org"
                    autoFocus={tab === "signin"}
                  />
                </Field>
                <Field label="Password" hint={tab === "signup" ? "minimum 6 characters" : undefined}>
                  <input
                    className={inputCls}
                    type="password"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    placeholder="••••••••"
                  />
                </Field>

                {tab === "signup" && (
                  <label className="flex items-start gap-2.5 bg-moss-soft/60 border border-moss/25 rounded-md px-3.5 py-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={seed}
                      onChange={(e) => setSeed(e.target.checked)}
                      className="mt-1 accent-[#0e7c6b]"
                    />
                    <span className="text-[12.5px] leading-snug text-mute">
                      <strong className="text-moss-deep">Start me with sample banks</strong> — Clinical Anatomy Core and
                      Pharmacology Essentials, ready to test.
                    </span>
                  </label>
                )}

                {err && (
                  <div className="flex items-start gap-2 text-[13px] font-medium text-[#a03328] bg-pen-soft border border-pen/30 rounded-md px-3 py-2.5 anim-pop">
                    <IconAlert className="mt-0.5 shrink-0" /> {err}
                  </div>
                )}

                <Btn size="lg" className="w-full" onClick={submit}>
                  {tab === "signin" ? "Open my chart" : "Register"} <IconArrowR />
                </Btn>

                <div className="dash-t pt-4">
                  <button
                    onClick={onDemo}
                    className="w-full text-[13px] font-semibold text-moss hover:text-moss-deep underline underline-offset-4 cursor-pointer"
                  >
                    Skip the paperwork — enter the demo ward
                  </button>
                  <p className="text-[11px] text-faint mt-3 leading-relaxed">
                    Demo build: accounts, banks and the library live only in this browser's storage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="px-6 sm:px-10 pb-6 flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[0.2em] text-paper/35">
        <span>OpenMedicine · Form OM-01 · Rev A</span>
        <span className="hidden sm:block">Local demo · no data leaves this device</span>
      </footer>
    </div>
  );
}
