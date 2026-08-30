import { useEffect, useState, type ReactNode } from "react";
import { IconCheck, IconAlert, IconInfo, IconX } from "./icons";

/* ---------- Buttons ---------- */

const btnBase =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-all duration-150 select-none cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss";

const btnVariants: Record<string, string> = {
  primary:
    "bg-moss text-[#f2faf6] hover:bg-moss-deep active:translate-y-px shadow-[0_2px_0_rgba(14,92,66,0.9)] hover:shadow-[0_3px_0_rgba(14,92,66,0.9)] active:shadow-none",
  ink: "bg-ink text-paper hover:bg-ink-3 active:translate-y-px",
  ghost:
    "bg-transparent text-body border border-line-2 hover:border-ink/40 hover:bg-card active:translate-y-px",
  danger:
    "bg-pen text-[#fdf3f1] hover:bg-[#b23529] active:translate-y-px shadow-[0_2px_0_#8f2a20] active:shadow-none",
  soft: "bg-moss-soft text-moss-deep hover:bg-[#d2e7db] active:translate-y-px",
};

export function Btn({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof btnVariants;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "text-[13px] px-3 py-1.5", md: "text-sm px-4 py-2.5", lg: "text-[15px] px-5 py-3" };
  return (
    <button className={`${btnBase} ${btnVariants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

/* ---------- Chips ---------- */

export function Chip({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: "neutral" | "moss" | "pen" | "amber" | "cobalt";
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: "bg-ink/6 text-mute border-ink/10",
    moss: "bg-moss-soft text-moss-deep border-moss/25",
    pen: "bg-pen-soft text-[#a03328] border-pen/25",
    amber: "bg-amber-soft text-[#8a5a10] border-amber/30",
    cobalt: "bg-cobalt-soft text-cobalt border-cobalt/25",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-mono font-medium uppercase tracking-wide ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/* ---------- Section title ---------- */

export function SectionTitle({ kicker, title, right }: { kicker?: string; title: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        {kicker && (
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute mb-1">{kicker}</div>
        )}
        <h2 className="font-display font-bold text-[22px] leading-tight text-ink">{title}</h2>
      </div>
      {right}
    </div>
  );
}

/* ---------- Modal ---------- */

export function Modal({
  title,
  kicker,
  onClose,
  children,
  wide,
}: {
  title: string;
  kicker?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-ink/55 anim-fade-in" onClick={onClose} />
      <div
        className={`relative bg-card rounded-lg shadow-pop border border-line w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[88vh] overflow-y-auto anim-pop`}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 dash-b sticky top-0 bg-card z-10">
          <div>
            {kicker && <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">{kicker}</div>}
            <h3 className="font-display font-bold text-xl text-ink mt-0.5">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-mute hover:text-pen hover:bg-pen-soft transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <IconX className="text-lg" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Toasts ---------- */

export interface ToastMsg {
  id: number;
  kind: "success" | "error" | "info";
  text: string;
}

export function ToastHost({ toasts, dismiss }: { toasts: ToastMsg[]; dismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 w-[min(92vw,360px)]">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} dismiss={dismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, dismiss }: { toast: ToastMsg; dismiss: (id: number) => void }) {
  useEffect(() => {
    const h = setTimeout(() => dismiss(toast.id), 3800);
    return () => clearTimeout(h);
  }, [toast.id, dismiss]);

  const border = { success: "border-l-moss", error: "border-l-pen", info: "border-l-cobalt" }[toast.kind];
  const icon =
    toast.kind === "success" ? (
      <IconCheck className="text-moss shrink-0" />
    ) : toast.kind === "error" ? (
      <IconAlert className="text-pen shrink-0" />
    ) : (
      <IconInfo className="text-cobalt shrink-0" />
    );

  return (
    <div
      className={`anim-toast flex items-start gap-2.5 bg-ink text-paper rounded-md border-l-4 ${border} px-4 py-3 shadow-pop text-sm`}
    >
      <span className="mt-0.5">{icon}</span>
      <span className="flex-1 leading-snug">{toast.text}</span>
      <button onClick={() => dismiss(toast.id)} className="text-paper/50 hover:text-paper transition-colors cursor-pointer" aria-label="Dismiss">
        <IconX />
      </button>
    </div>
  );
}

/* ---------- Empty state ---------- */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-2 border-dashed border-line-2 rounded-lg px-8 py-14 text-center bg-card/60 anim-fade-up">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-md bg-ink text-paper text-2xl mb-4 rotate-[-3deg]">
        {icon}
      </div>
      <h3 className="font-display font-bold text-xl text-ink">{title}</h3>
      <p className="text-mute text-sm max-w-sm mx-auto mt-2 leading-relaxed">{body}</p>
      {action && <div className="mt-5 flex justify-center gap-3">{action}</div>}
    </div>
  );
}

/* ---------- Score ring ---------- */

export function ScoreRing({ pct, size = 132, label }: { pct: number; size?: number; label?: string }) {
  const [drawn, setDrawn] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setDrawn(pct));
    return () => cancelAnimationFrame(raf);
  }, [pct]);

  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const tone = pct >= 70 ? "#177e5b" : pct >= 40 ? "#c9821d" : "#cf4136";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#dde1d3" strokeWidth="9" />
        <circle
          className="ring-arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * drawn) / 100}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-extrabold text-ink" style={{ fontSize: size / 4.4 }}>
          {Math.round(pct)}%
        </span>
        {label && <span className="font-mono text-[10px] uppercase tracking-widest text-mute">{label}</span>}
      </div>
    </div>
  );
}

/* ---------- Form fields ---------- */

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-mute font-medium">{label}</span>
        {hint && <span className="text-[11px] text-faint">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full bg-card border border-line-2 rounded-md px-3 py-2.5 text-sm text-body placeholder:text-faint focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/20 transition-shadow";
