import type { Difficulty, ParseOutcome, ParsedRow } from "./types";

/**
 * FormFeed CSV format
 * -------------------
 * Header row (case-insensitive, order-free):
 *   prompt | question | q                      required
 *   answer | correct | correct_answer          required
 *   wrong_1 / incorrect_1 ... wrong_5          at least two required
 *   explanation | rationale                    optional
 *   tags                                       optional, semicolon-separated
 *   difficulty                                 optional: easy | medium | hard
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

/** Quote-aware CSV tokenizer: handles quoted commas, newlines and "" escapes. */
export function tokenizeCSV(text: string): string[][] {
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
    } else if (ch === ",") {
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
  const grid = tokenizeCSV(text);
  if (grid.length === 0) {
    return { headers: [], unknownColumns: [], rows: [], rawCount: 0 };
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
      tags: tagsCol >= 0 ? at(tagsCol).split(/[;|]/).map((t) => t.trim()).filter(Boolean) : [],
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

  return { headers: grid[0].map((h) => h.trim()), unknownColumns, rows, rawCount: grid.length - 1 };
}

export const SAMPLE_CSV = `prompt,answer,wrong_1,wrong_2,wrong_3,explanation,tags,difficulty
"Which planet has the most confirmed moons, as of recent counts?",Saturn,Jupiter,Uranus,Neptune,"Longnecked Saturn keeps winning the moon census — 146 confirmed at last count.",astronomy;trivia,medium
"What does the HTTP status code 418 mean?",I'm a teapot,Payment required,Too many requests,Not found,"An April Fools' RFC 2324 easter egg that refused to die.",web;http,easy
"In music, how many lines does a standard staff have?",5,4,6,7,"Five lines, four spaces — the same since around the 13th century.",music,easy
"What is the only letter that never appears in a U.S. state name?",Q,X,Z,J,"Scan all fifty: A through Z show up, but never Q.",geography;usa,hard
"Which data structure works on a first-in, first-out basis?",Queue,Stack,Heap,Tree,"A queue is a line at the shop: first in, first out. ""Heaps"" and ""trees"" branch; stacks pile.",computing,medium
"Rounded to the nearest percent, what share of Earth's water is fresh water?",3%,10%,27%,1%,"Roughly 97% is saline; most of the 3% that remains is locked in ice.",science;earth,easy`;

export function downloadSampleCSV() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "formfeed-sample.csv";
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
  a.download = "formfeed-template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
