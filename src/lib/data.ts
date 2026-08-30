import type { Bank, BankStats, LibraryEntry, Question, TestResult, User } from "./types";
import { uid } from "./types";

const USERS_KEY = "openmedicine.users.v1";
const SESSION_KEY = "openmedicine.session.v1";
const LIBRARY_KEY = "openmedicine.library.v1";
const accountKey = (userId: string) => `openmedicine.account.${userId}.v1`;

export interface AccountData {
  banks: Bank[];
  results: TestResult[];
  favorites: string[];
  /** Lifetime practice/exam tallies per bank id. */
  bankStats: Record<string, BankStats>;
}

/** Demo-grade hash — accounts live only in this browser. */
export function hashPw(pw: string): string {
  let h = 5381;
  for (let i = 0; i < pw.length; i++) h = ((h << 5) + h + pw.charCodeAt(i)) | 0;
  return "om$" + (h >>> 0).toString(36) + "$" + pw.length.toString(36);
}

/* ================= users & session ================= */

export function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw) as User[];
  } catch { /* ignore */ }
  return [];
}

export function saveUsers(users: User[]) {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch { /* ignore */ }
}

export function loadSession(): string | null {
  try { return localStorage.getItem(SESSION_KEY); } catch { return null; }
}

export function saveSession(userId: string | null) {
  try {
    if (userId) localStorage.setItem(SESSION_KEY, userId);
    else localStorage.removeItem(SESSION_KEY);
  } catch { /* ignore */ }
}

/* ================= per-account data ================= */

export function loadAccount(userId: string): AccountData {
  try {
    const raw = localStorage.getItem(accountKey(userId));
    if (raw) {
      const d = JSON.parse(raw) as Partial<AccountData>;
      return {
        banks: d.banks ?? [],
        results: (d.results ?? []).map((r) => (r.mode ? r : { ...r, mode: "exam" as const })),
        favorites: d.favorites ?? [],
        bankStats: d.bankStats ?? {},
      };
    }
  } catch { /* ignore */ }
  return { banks: [], results: [], favorites: [], bankStats: {} };
}

export function saveAccount(userId: string, data: AccountData) {
  try { localStorage.setItem(accountKey(userId), JSON.stringify(data)); } catch { /* ignore */ }
}

/* ================= open library ================= */

export function loadLibrary(): LibraryEntry[] {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (raw) return JSON.parse(raw) as LibraryEntry[];
  } catch { /* ignore */ }
  return [];
}

export function saveLibrary(entries: LibraryEntry[]) {
  try { localStorage.setItem(LIBRARY_KEY, JSON.stringify(entries)); } catch { /* ignore */ }
}

/** Count favorites per ref (bank id or entry id) across every account in this browser. */
export function favoriteCounts(): Map<string, number> {
  const counts = new Map<string, number>();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("openmedicine.account.")) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const d = JSON.parse(raw) as Partial<AccountData>;
      for (const f of d.favorites ?? []) counts.set(f, (counts.get(f) ?? 0) + 1);
    }
  } catch { /* ignore */ }
  return counts;
}

/* ================= medical content ================= */

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
  const anatomy: Bank = {
    id: uid(),
    name: "Clinical Anatomy Core",
    color: "#0e7c6b",
    createdAt: now - 1000 * 60 * 60 * 24 * 12,
    updatedAt: now - 1000 * 60 * 60 * 24 * 2,
    questions: [
      q("Which nerve is most at risk during a thyroidectomy?", "Recurrent laryngeal nerve", ["Vagus nerve", "Hypoglossal nerve", "Phrenic nerve"], "hard", ["anatomy", "surgery"], "It runs beside the inferior thyroid artery; injury causes hoarseness from vocal cord palsy."),
      q("Which structure passes through the foramen ovale?", "Mandibular nerve (V3)", ["Maxillary nerve (V2)", "Oculomotor nerve (III)", "Facial nerve (VII)"], "medium", ["anatomy", "neuro"], "Remember OVALE: Otic ganglion, V3, Accessory meningeal artery, Lesser petrosal nerve, Emissary vein."),
      q("Which rotator cuff muscle initiates shoulder abduction?", "Supraspinatus", ["Infraspinatus", "Subscapularis", "Teres minor"], "medium", ["anatomy", "ortho"], "Supraspinatus abducts the first ~15°; the deltoid then takes over to 90°."),
      q("Which chamber of the heart forms the apex?", "Left ventricle", ["Right ventricle", "Left atrium", "Right atrium"], "easy", ["anatomy", "cardio"], "The apex beat is palpable in the 5th intercostal space, mid-clavicular line — left ventricle."),
      q("Which carpal bone is most commonly fractured?", "Scaphoid", ["Lunate", "Triquetrum", "Pisiform"], "easy", ["anatomy", "ortho"], "Snuffbox tenderness after a FOOSH injury — beware avascular necrosis from its retrograde blood supply."),
      q("Which dermatome supplies the skin over the umbilicus?", "T10", ["T4", "T7", "L1"], "easy", ["anatomy", "neuro"], "Landmarks: T4 at the nipples, T10 at the umbilicus."),
      q("Which plexus is the most common source of anterior epistaxis?", "Kiesselbach's plexus", ["Woodruff's plexus", "Pterygoid plexus", "Cavernous sinus"], "medium", ["anatomy", "ent"], "Little's area on the anterior septum hosts Kiesselbach's plexus — the source of ~90% of nosebleeds."),
      q("In the femoral sheath, what lies immediately medial to the femoral artery?", "Femoral vein", ["Femoral nerve", "Saphenous nerve", "Deep inguinal lymph node"], "hard", ["anatomy", "vascular"], "Lateral to medial: Nerve, Artery, Vein, Empty space, Lymphatics — NAVeL. The nerve sits outside the sheath."),
    ],
  };
  const pharm: Bank = {
    id: uid(),
    name: "Pharmacology Essentials",
    color: "#bd7c16",
    createdAt: now - 1000 * 60 * 60 * 24 * 5,
    updatedAt: now - 1000 * 60 * 60 * 24,
    questions: [
      q("Which antibiotic class inhibits bacterial cell wall synthesis?", "Penicillins", ["Macrolides", "Tetracyclines", "Fluoroquinolones"], "easy", ["pharm", "antibiotics"], "Beta-lactams bind penicillin-binding proteins; macrolides and tetracyclines hit ribosomes, quinolones hit DNA gyrase."),
      q("Which enzyme is the target of statins?", "HMG-CoA reductase", ["Cyclooxygenase", "Angiotensin-converting enzyme", "Xanthine oxidase"], "easy", ["pharm", "cardio"], "Blocking HMG-CoA reductase lowers hepatic cholesterol and up-regulates LDL receptors."),
      q("Rapid IV infusion of which antibiotic causes 'red man syndrome'?", "Vancomycin", ["Ceftriaxone", "Gentamicin", "Metronidazole"], "medium", ["pharm", "antibiotics"], "Direct mast-cell histamine release — not IgE-mediated. Slow the infusion and pre-treat with antihistamines."),
      q("Which drug is the antidote for paracetamol (acetaminophen) overdose?", "N-acetylcysteine", ["Naloxone", "Flumazenil", "Atropine"], "easy", ["pharm", "tox"], "NAC replenishes glutathione to detoxify NAPQI; most effective within 8 hours of ingestion."),
      q("The most common electrolyte disturbance from furosemide is…", "Hypokalaemia", ["Hyperkalaemia", "Hypercalcaemia", "Hypermagnesaemia"], "easy", ["pharm", "renal"], "Loop diuretics waste K⁺, Ca²⁺, Mg²⁺ and H⁺ — think hypokalaemic metabolic alkalosis."),
      q("Idarucizumab is the specific reversal agent for which anticoagulant?", "Dabigatran", ["Rivaroxaban", "Heparin", "Warfarin"], "hard", ["pharm", "cardio"], "A monoclonal antibody fragment for dabigatran; andexanet alfa reverses factor-Xa inhibitors, vitamin K/PCC reverse warfarin."),
      q("Which receptor do beta-blockers antagonise to slow the heart?", "Beta-1 adrenoceptors", ["Beta-2 adrenoceptors", "Alpha-1 adrenoceptors", "Muscarinic M2 receptors"], "easy", ["pharm", "cardio"], "Beta-1 is cardiac ('1 heart'); beta-2 dilates bronchi and vessels ('2 lungs')."),
      q("Warfarin overdose with life-threatening bleeding is best reversed with…", "Prothrombin complex concentrate + IV vitamin K", ["Protamine sulfate", "Desmopressin", "Fresh frozen plasma alone"], "hard", ["pharm", "haem"], "PCC replaces factors II, VII, IX, X immediately; vitamin K sustains the reversal. Protamine reverses heparin."),
    ],
  };
  return [anatomy, pharm];
}

export function seedLibraryIfNeeded() {
  if (loadLibrary().length > 0) return;
  const day = 1000 * 60 * 60 * 24;
  const now = Date.now();
  const entries: LibraryEntry[] = [
    {
      id: "lib-cardio-sprint",
      bankId: "ext-cardio",
      ownerId: "ext-osei",
      authorName: "Dr Nadia Osei",
      name: "Cardiology Boards Sprint",
      description: "High-yield cardiology for written boards — ECGs, murmurs, coronary territories and emergency drugs.",
      color: "#a84a6b",
      publishedAt: now - day * 21,
      updatedAt: now - day * 6,
      questions: [
        q("Which coronary artery most commonly occludes in an inferior MI?", "Right coronary artery", ["Left anterior descending", "Left circumflex", "Left main stem"], "medium", ["cardio", "ecg"], "RCA occlusion shows ST elevation in II, III, aVF — always check the right-sided leads too."),
        q("A collapsing ('water-hammer') pulse is the hallmark of…", "Aortic regurgitation", ["Aortic stenosis", "Mitral stenosis", "Cardiac tamponade"], "medium", ["cardio", "murmurs"], "Wide pulse pressure with a rapidly falling diastolic pressure — also look for Quincke's nails and de Musset's sign."),
        q("Which ECG change is the earliest sign of acute pericarditis?", "Diffuse concave ST elevation with PR depression", ["ST elevation localised to one territory", "Tall tented T waves only", "New left bundle branch block"], "hard", ["cardio", "ecg"], "Unlike MI, changes are widespread and concave, with reciprocal PR depression and no reciprocal ST depression."),
        q("First-line rate control for atrial fibrillation with preserved EF is usually…", "A beta-blocker", ["Digoxin", "Adenosine", "Lidocaine"], "easy", ["cardio", "drugs"], "Beta-blockers or non-dihydropyridine calcium-channel blockers; digoxin is second-line, mainly when sedentary or in heart failure."),
        q("Which triad suggests cardiac tamponade?", "Beck's triad: hypotension, muffled heart sounds, raised JVP", ["Cushing's triad", "Charcot's triad", "Virchow's triad"], "medium", ["cardio", "emergency"], "Add pulsus paradoxus and electrical alternans on ECG — treat with urgent pericardiocentesis."),
        q("The murmur of hypertrophic cardiomyopathy becomes louder with…", "Valsalva manoeuvre", ["Squatting", "Handgrip", "Passive leg raise"], "hard", ["cardio", "murmurs"], "Reduced preload worsens outflow obstruction; squatting and handgrip increase preload/afterload and soften it."),
      ],
    },
    {
      id: "lib-micro-rapid",
      bankId: "ext-micro",
      ownerId: "ext-hartmann",
      authorName: "Prof. Emil Hartmann",
      name: "Clinical Microbiology Rapid Review",
      description: "Stains, cultures and the classic exam favourites — a fast circuit through medical microbiology.",
      color: "#38618f",
      publishedAt: now - day * 14,
      updatedAt: now - day * 14,
      questions: [
        q("Which organism is the most common cause of community-acquired pneumonia?", "Streptococcus pneumoniae", ["Staphylococcus aureus", "Mycoplasma pneumoniae", "Klebsiella pneumoniae"], "easy", ["micro", "resp"], "Rust-coloured sputum, lobar consolidation — still king of CAP despite vaccination."),
        q("Acid-fast staining with Ziehl-Neelsen is used to detect…", "Mycobacterium tuberculosis", ["Neisseria meningitidis", "Treponema pallidum", "Candida albicans"], "easy", ["micro", "stains"], "The mycolic-acid-rich cell wall retains carbol fuchsin despite acid-alcohol decolourisation."),
        q("Which malaria species causes relapse from dormant liver hypnozoites?", "Plasmodium vivax", ["Plasmodium falciparum", "Plasmodium malariae", "Plasmodium knowlesi"], "medium", ["micro", "parasitology"], "Vivax and ovale form hypnozoites — add primaquine (after G6PD testing) to clear the liver stage."),
        q("The most common pathogen in uncomplicated urinary tract infection is…", "Escherichia coli", ["Proteus mirabilis", "Enterococcus faecalis", "Pseudomonas aeruginosa"], "easy", ["micro", "uti"], "Uropathogenic E. coli accounts for ~80% of community UTIs."),
        q("Gram-negative diplococci in a CSF sample of a young adult suggest…", "Neisseria meningitidis", ["Streptococcus pneumoniae", "Listeria monocytogenes", "Haemophilus influenzae"], "medium", ["micro", "neuro"], "Think petechial rash and close-contact outbreaks; give ceftriaxone and notify public health."),
      ],
    },
    {
      id: "lib-obg-viva",
      bankId: "ext-obg",
      ownerId: "ext-raman",
      authorName: "Dr Priya Raman",
      name: "Obs & Gynae Viva Prep",
      description: "Classic viva scenarios: early pregnancy emergencies, hypertension and bleeding in late pregnancy.",
      color: "#0f7486",
      publishedAt: now - day * 9,
      updatedAt: now - day * 9,
      questions: [
        q("The classic triad of ectopic pregnancy is…", "Amenorrhoea, abdominal pain, vaginal bleeding", ["Fever, rigors, lochial discharge", "Headache, visual disturbance, epigastric pain", "Pruritus, jaundice, dark urine"], "easy", ["obg", "early-pregnancy"], "A ruptured ectopic adds shoulder-tip pain and collapse — it remains a leading cause of early maternal death."),
        q("Magnesium sulfate in severe pre-eclampsia is given primarily to…", "Prevent eclamptic seizures", ["Lower blood pressure", "Mature fetal lungs", "Tocolyse the uterus"], "medium", ["obg", "hypertension"], "It is an anticonvulsant, not an antihypertensive; monitor reflexes, urine output and respiratory rate for toxicity."),
        q("The most common cause of painless antepartum haemorrhage is…", "Placenta praevia", ["Placental abruption", "Uterine rupture", "Vasa praevia"], "medium", ["obg", "bleeding"], "Abruption is classically painful with a tense uterus; praevia bleeds painlessly — no digital exam until placental position is known."),
        q("Which contraceptive method also protects against sexually transmitted infections?", "Condoms", ["Combined oral pill", "Copper IUD", "Implant"], "easy", ["obg", "contraception"], "Only barrier methods reduce STI transmission — worth pairing with LARC in new relationships."),
        q("The second stage of labour is defined as…", "Full cervical dilatation to delivery of the baby", ["Onset of contractions to full dilatation", "Delivery of the baby to delivery of the placenta", "Engagement to full dilatation"], "easy", ["obg", "labour"], "First stage: onset to 10 cm. Second: pushing to birth. Third: delivery of the placenta."),
      ],
    },
  ];
  saveLibrary(entries);
}
