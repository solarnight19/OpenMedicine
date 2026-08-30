import type { Difficulty, ParseOutcome, ParsedRow } from "./types";

/**
 * OpenMedicine CSV format
 * -------------------
 * Header row (case-insensitive, order-free):
 *   prompt | question | q                      required
 *   answer | correct | correct_answer          required
 *   wrong_1 / incorrect_1 ... wrong_5          at least two required
 *   explanation | rationale                    optional
 *   tags                                       optional, split on ; | or ,
 *   difficulty                                 optional: easy | medium | hard
 *
 * Separator is auto-detected from the header line: tab (paste straight from
 * Excel / Google Sheets / Numbers), comma (classic CSV) or semicolon.
 */

const ALIASES: Record<string, string> = {
  prompt: "prompt",
  question: "prompt",
  q: "prompt",
  answer: "answer",
  correct: "answer",
  correct_answer: "answer",
  explanation: "explanation",
  rationale: "explanation",
  tags: "tags",
  topic: "tags",
  difficulty: "difficulty",
  level: "difficulty",
};

function normalizeHeader(h: string): string {
  const key = h.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (ALIASES[key]) return ALIASES[key];
  const m = key.match(/^(wrong|incorrect|distractor|wrong_answer)_(\d)$/);
  if (m) return `wrong_${m[2]}`;
  return key;
}

/**
 * Detect the column separator from the header line: tab (pasted straight from
 * Excel / Google Sheets / Numbers), comma (classic CSV) or semicolon (EU exports).
 */
export function detectDelimiter(text: string): string {
  const firstLine = text.replace(/^\uFEFF/, "").split(/\r?\n/).find((l) => l.trim().length > 0) ?? "";
  if (firstLine.includes("\t")) return "\t";
  if (firstLine.includes(",")) return ",";
  if (firstLine.includes(";")) return ";";
  return ",";
}

/** Quote-aware tokenizer: handles quoted separators, newlines and "" escapes. */
export function tokenizeCSV(text: string, delim: string = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delim) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  rows.push(row);
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

const DIFF_SET = new Set(["easy", "medium", "hard"]);

export function parseCSV(text: string): ParseOutcome {
  const clean = text.replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(clean);
  const grid = tokenizeCSV(clean, delimiter);
  if (grid.length === 0) {
    return { headers: [], unknownColumns: [], rows: [], rawCount: 0, delimiter };
  }

  const headers = grid[0].map(normalizeHeader);
  const known = new Set(Object.values(ALIASES).concat(["prompt", "answer", "explanation", "tags", "difficulty"]));
  const unknownColumns = grid[0]
    .map((h, i) => ({ h: h.trim(), n: headers[i] }))
    .filter(({ n }) => !known.has(n) && !/^wrong_\d$/.test(n))
    .map(({ h }) => h)
    .filter((h) => h.length > 0);

  const colOf = (name: string) => headers.indexOf(name);
  const promptCol = colOf("prompt");
  const answerCol = colOf("answer");
  const wrongCols = headers.map((h, i) => ({ h, i })).filter(({ h }) => /^wrong_\d$/.test(h)).map(({ i }) => i);
  const explCol = colOf("explanation");
  const tagsCol = colOf("tags");
  const diffCol = colOf("difficulty");

  const rows: ParsedRow[] = [];
  for (let r = 1; r < grid.length; r++) {
    const g = grid[r];
    const at = (c: number) => (c >= 0 && c < g.length ? g[c].trim() : "");

    const prompt = at(promptCol);
    const answer = at(answerCol);
    const wrongs = wrongCols.map(at).filter((w) => w.length > 0);

    const parsed: ParsedRow = {
      line: r + 1,
      prompt,
      answer,
      wrongs,
      explanation: explCol >= 0 ? at(explCol) || undefined : undefined,
      tags: tagsCol >= 0 ? at(tagsCol).split(/[;|,]/).map((t) => t.trim()).filter(Boolean) : [],
      difficulty: "medium",
    };

    if (diffCol >= 0) {
      const d = at(diffCol).toLowerCase();
      if (d && DIFF_SET.has(d)) parsed.difficulty = d as Difficulty;
    }

    if (!prompt) parsed.error = "Missing prompt";
    else if (!answer) parsed.error = "Missing correct answer";
    else if (wrongs.length < 2) parsed.error = "Needs at least 2 wrong options";
    else {
      const all = [answer, ...wrongs].map((o) => o.toLowerCase());
      if (new Set(all).size !== all.length) parsed.error = "Duplicate option text";
    }

    rows.push(parsed);
  }

  return { headers: grid[0].map((h) => h.trim()), unknownColumns, rows, rawCount: grid.length - 1, delimiter };
}

export const SAMPLE_CSV = `prompt,answer,wrong_1,wrong_2,wrong_3,explanation,tags,difficulty
"Which carpal bone is most commonly fractured?",Scaphoid,Lunate,Triquetrum,Pisiform,"Tenderness in the anatomical snuffbox after a fall on an outstretched hand should raise suspicion — the scaphoid's tenuous blood supply risks avascular necrosis.",anatomy;ortho,easy
"Which dermatome supplies the skin over the umbilicus?",T10,T4,T7,L1,"The classic landmarks: T4 at the nipples, T10 at the belly button — 'T10 for the bellybutton'.",anatomy;neuro,easy
"Which rotator cuff muscle initiates shoulder abduction?",Supraspinatus,Infraspinatus,Subscapularis,Teres minor,"Supraspinatus abducts the first ~15 degrees; the deltoid then takes over. Infraspinatus and teres minor externally rotate, subscapularis internally rotates.",anatomy;ortho,medium
"Which enzyme is the target of statins?",HMG-CoA reductase,Cyclooxygenase,Angiotensin-converting enzyme,Xanthine oxidase,"Blocking HMG-CoA reductase cuts hepatic cholesterol synthesis, up-regulating LDL receptors.",pharmacology;cardio,easy
"Which drug is the antidote for paracetamol (acetaminophen) overdose?",N-acetylcysteine,Naloxone,Flumazenil,Atropine,"NAC replenishes glutathione so the toxic metabolite NAPQI can be detoxified — most effective within 8 hours.",pharmacology;tox,easy
"Which antibiotic class acts by inhibiting bacterial cell wall synthesis?",Penicillins,Macrolides,Tetracyclines,Fluoroquinolones,"Beta-lactams bind penicillin-binding proteins and weaken peptidoglycan. Macrolides and tetracyclines hit ribosomes; fluoroquinolones hit DNA gyrase.",pharmacology;micro,medium`;

export function downloadSampleCSV() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "openmedicine-sample.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadTemplateCSV() {
  const template = `prompt,answer,wrong_1,wrong_2,wrong_3,explanation,tags,difficulty
"Your question text here?",Correct option,First wrong option,Second wrong option,Third wrong option,"Optional explanation shown after the test.","tag1;tag2",medium`;
  const blob = new Blob([template], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "openmedicine-template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
