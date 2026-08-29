import type { Bank, Question, TestResult } from "./types";
import { uid } from "./types";

const BANKS_KEY = "formfeed.banks.v1";
const RESULTS_KEY = "formfeed.results.v1";

function q(
  prompt: string,
  correct: string,
  wrongs: string[],
  difficulty: Question["difficulty"],
  tags: string[],
  explanation?: string
): Question {
  return {
    id: uid(),
    prompt,
    options: [correct, ...wrongs],
    correctIndex: 0,
    difficulty,
    tags,
    explanation,
  };
}

export function sampleBanks(): Bank[] {
  const now = Date.now();
  const geography: Bank = {
    id: uid(),
    name: "World Geography",
    color: "#177e5b",
    createdAt: now - 1000 * 60 * 60 * 24 * 12,
    questions: [
      q("What is the capital city of Australia?", "Canberra", ["Sydney", "Melbourne", "Perth"], "medium", ["capitals", "oceania"], "Canberra was purpose-built as a compromise between rivals Sydney and Melbourne."),
      q("Which is the largest hot desert on Earth?", "Sahara", ["Gobi", "Kalahari", "Mojave"], "easy", ["deserts"]),
      q("Mount Kilimanjaro rises in which country?", "Tanzania", ["Kenya", "Ethiopia", "Uganda"], "easy", ["mountains", "africa"], "Its summit, Uhuru Peak, is the highest point in Africa at 5,895 m."),
      q("Which country spans two continents?", "Turkey", ["Iran", "Greece", "Spain"], "medium", ["borders"], "A small slice of Turkey (East Thrace) sits in Europe; the rest lies in Asia."),
      q("The smallest country in the world is…", "Vatican City", ["Monaco", "San Marino", "Liechtenstein"], "easy", ["countries"], "At about 0.49 km², it fits inside a city — literally inside Rome."),
      q("The Great Barrier Reef lies off which Australian state?", "Queensland", ["New South Wales", "Western Australia", "Victoria"], "hard", ["oceania", "oceans"]),
      q("Lake Baikal, the world's deepest lake, is in…", "Russia", ["Mongolia", "Canada", "Kazakhstan"], "medium", ["lakes"], "Baikal holds roughly 20% of the world's unfrozen fresh water."),
      q("Which strait separates Europe from Africa?", "Strait of Gibraltar", ["Strait of Hormuz", "Bosphorus", "Bering Strait"], "medium", ["borders", "oceans"]),
    ],
  };
  const js: Bank = {
    id: uid(),
    name: "JavaScript Fundamentals",
    color: "#c9821d",
    createdAt: now - 1000 * 60 * 60 * 24 * 5,
    questions: [
      q("Which of these is NOT a JavaScript primitive type?", "object", ["string", "boolean", "symbol"], "easy", ["types"], "Primitives are string, number, bigint, boolean, undefined, symbol and null. Everything else is an object."),
      q("What does '2' + 1 evaluate to?", "'21'", ["3", "NaN", "TypeError"], "easy", ["coercion"], "The + operator sees a string and concatenates instead of adding."),
      q("Which method appends an element to the end of an array?", "push()", ["pop()", "shift()", "unshift()"], "easy", ["arrays"]),
      q("What does NaN === NaN return?", "false", ["true", "TypeError", "0"], "medium", ["numbers"], "NaN is the only JS value not equal to itself. Use Number.isNaN() instead."),
      q("Which declaration is block-scoped?", "let", ["var", "both let and var", "neither"], "easy", ["scope"]),
      q("What is the result of typeof null?", "\"object\"", ["\"null\"", "\"undefined\"", "\"none\""], "medium", ["types"], "A bug from 1995 that can never be fixed without breaking the web."),
      q("Which array method always returns a new array?", "map()", ["forEach()", "push()", "sort()"], "medium", ["arrays"], "forEach returns undefined; push returns a length; sort mutates in place."),
      q("What does 0.1 + 0.2 === 0.3 evaluate to?", "false", ["true", "NaN", "undefined"], "hard", ["numbers"], "Binary floating point: 0.1 + 0.2 is actually 0.30000000000000004."),
      q("A closure gives a function access to…", "variables from its outer scope", ["only its own parameters", "the global object only", "nothing outside itself"], "medium", ["scope", "functions"]),
      q("What does JSON.parse() do?", "Turns a JSON string into a value", ["Turns a value into a JSON string", "Validates a JSON schema", "Fetches JSON from a URL"], "easy", ["json"]),
    ],
  };
  return [geography, js];
}

export function loadBanks(): Bank[] {
  try {
    const raw = localStorage.getItem(BANKS_KEY);
    if (raw) return JSON.parse(raw) as Bank[];
  } catch {
    /* fall through to samples */
  }
  return sampleBanks();
}

export function loadResults(): TestResult[] {
  try {
    const raw = localStorage.getItem(RESULTS_KEY);
    if (raw) return JSON.parse(raw) as TestResult[];
  } catch {
    /* ignore */
  }
  return [];
}

export function saveBanks(banks: Bank[]) {
  try {
    localStorage.setItem(BANKS_KEY, JSON.stringify(banks));
  } catch {
    /* storage full or unavailable */
  }
}

export function saveResults(results: TestResult[]) {
  try {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
  } catch {
    /* ignore */
  }
}
