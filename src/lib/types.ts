export type Difficulty = "easy" | "medium" | "hard";

export interface Question {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  tags: string[];
  difficulty: Difficulty;
}

export interface Bank {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  updatedAt?: number;
  publishedEntryId?: string;
  questions: Question[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  pw: string; // demo-grade hash, browser-only
  createdAt: number;
}

export interface LibraryEntry {
  id: string;
  bankId: string;
  ownerId: string;
  authorName: string;
  name: string;
  description: string;
  color: string;
  publishedAt: number;
  updatedAt: number;
  questions: Question[];
}

export type TestMode = "practice" | "exam";

export interface ResultItem {
  prompt: string;
  options: string[];
  correctIndex: number;
  chosenIndex: number | null;
  flagged: boolean;
  explanation?: string;
  tags: string[];
  bankId?: string;
}

export interface TestResult {
  id: string;
  name: string;
  takenAt: number;
  bankNames: string[];
  total: number;
  correct: number;
  skipped: number;
  durationSec: number;
  timeLimitSec?: number;
  mode: TestMode;
  items: ResultItem[];
}

export interface SessionItem {
  key: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  tags: string[];
  bankId: string;
}

export interface TestSession {
  id: string;
  name: string;
  bankNames: string[];
  items: SessionItem[];
  startedAt: number;
  timeLimitSec?: number;
  mode: TestMode;
}

export interface BankStats {
  attempted: number;
  correct: number;
  incorrect: number;
  lastAt: number;
}

export interface ParsedRow {
  line: number;
  prompt: string;
  answer: string;
  wrongs: string[];
  explanation?: string;
  tags: string[];
  difficulty: Difficulty;
  error?: string;
}

export interface ParseOutcome {
  headers: string[];
  unknownColumns: string[];
  rows: ParsedRow[];
  rawCount: number;
  /** Separator detected in the source: ",", "\t" or ";". */
  delimiter: string;
}

export const BANK_COLORS = ["#0e7c6b", "#bd7c16", "#38618f", "#0f7486", "#a84a6b", "#5d7a2a"];

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function fmtClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function fmtDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export const LETTERS = ["A", "B", "C", "D", "E", "F"];
