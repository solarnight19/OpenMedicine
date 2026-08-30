import { useMemo, useState } from "react";
import type { Difficulty, LibraryEntry, User } from "../lib/types";
import { fmtDate } from "../lib/types";
import { Btn, Chip, EmptyState, SectionTitle, inputCls } from "./ui";
import { IconBookOpen, IconGlobe, IconHeart, IconPlus, IconSearch, IconStar, IconUser } from "./icons";

const diffTone: Record<Difficulty, "moss" | "amber" | "pen"> = { easy: "moss", medium: "amber", hard: "pen" };

function mix(entry: LibraryEntry): Record<Difficulty, number> {
  const m: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
  for (const q of entry.questions) m[q.difficulty]++;
  return m;
}

export default function LibraryView({
  library,
  user,
  favorites,
  favCounts,
  onToggleFavorite,
  onClone,
  onNav,
}: {
  library: LibraryEntry[];
  user: User;
  favorites: string[];
  favCounts: Map<string, number>;
  onToggleFavorite: (id: string) => void;
  onClone: (entry: LibraryEntry) => void;
  onNav: (key: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "loved" | "name">("newest");

  const entries = useMemo(() => {
    const s = query.trim().toLowerCase();
    let list = library.filter(
      (e) =>
        !s ||
        e.name.toLowerCase().includes(s) ||
        e.authorName.toLowerCase().includes(s) ||
        e.description.toLowerCase().includes(s) ||
        e.questions.some((q) => q.tags.some((t) => t.toLowerCase().includes(s)))
    );
    if (sort === "newest") list = [...list].sort((a, b) => b.updatedAt - a.updatedAt);
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "loved") list = [...list].sort((a, b) => (favCounts.get(b.id) ?? 0) - (favCounts.get(a.id) ?? 0));
    return list;
  }, [library, query, sort, favCounts]);

  return (
    <div className="max-w-[1060px] mx-auto px-5 sm:px-8 py-7">
      <SectionTitle
        kicker="Section E · Open library"
        title="Published question banks"
        right={
          <div className="hidden sm:flex items-center gap-2">
            <Btn size="sm" variant="ghost" onClick={() => onNav("banks")}>
              <IconBookOpen className="text-moss" /> My banks
            </Btn>
          </div>
        }
      />
      <p className="text-sm text-mute -mt-2 mb-5 max-w-[64ch]">
        Banks published by OpenMedicine accounts. Favourite the keepers, or clone one into your own banks to edit it and
        sit tests against it.
      </p>

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5 anim-fade-up">
        <div className="relative flex-1 min-w-[220px] max-w-[340px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-faint"><IconSearch /></span>
          <input
            className={`${inputCls} pl-9`}
            placeholder="Search title, author, tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1 p-1 bg-card border border-line rounded-md text-[12.5px] font-semibold">
          {([["newest", "Newest"], ["loved", "Most loved"], ["name", "A–Z"]] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer ${sort === k ? "bg-ink text-paper" : "text-mute hover:text-ink"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <span className="font-mono text-[11px] uppercase tracking-widest text-faint ml-auto">
          {entries.length} bank{entries.length === 1 ? "" : "s"}
        </span>
      </div>

      {library.length === 0 ? (
        <EmptyState
          icon={<IconGlobe />}
          title="The library is empty"
          body="Publish one of your banks and it will appear here for every account in this browser to favourite and clone."
          action={<Btn onClick={() => onNav("banks")}>Go to my banks</Btn>}
        />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<IconSearch />}
          title="No matches"
          body={`Nothing in the library matches “${query}”. Try another word or clear the search.`}
          action={<Btn variant="ghost" onClick={() => setQuery("")}>Clear search</Btn>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 stagger">
          {entries.map((e) => {
            const m = mix(e);
            const fav = favorites.includes(e.id);
            const mine = e.ownerId === user.id;
            const count = favCounts.get(e.id) ?? 0;
            return (
              <article
                key={e.id}
                className="bg-card border border-line rounded-md overflow-hidden flex flex-col group hover:shadow-lift hover:-translate-y-1 transition-all duration-200"
              >
                <div className="hatch-band h-2.5" style={{ background: e.color }} />
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display font-bold text-lg text-ink leading-snug">{e.name}</h3>
                      <div className="flex items-center gap-1.5 text-[12px] text-mute mt-1">
                        <IconUser className="text-faint" />
                        <span className="font-semibold text-body">{e.authorName}</span>
                        {mine && <Chip tone="moss" className="ml-1">yours</Chip>}
                      </div>
                    </div>
                    <button
                      onClick={() => onToggleFavorite(e.id)}
                      className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-all cursor-pointer ${
                        fav
                          ? "bg-amber-soft border-amber/50 text-[#8a5a10]"
                          : "border-line-2 text-faint hover:text-[#8a5a10] hover:border-amber/50 hover:bg-amber-soft/50"
                      }`}
                      aria-label={fav ? "Remove from favourites" : "Add to favourites"}
                      title={fav ? "Remove from favourites" : "Favourite this bank"}
                    >
                      <IconHeart filled={fav} />
                      <span className="font-mono text-[11px] tabular-nums">{count}</span>
                    </button>
                  </div>

                  <p className="text-[13px] text-mute leading-relaxed mt-3 line-clamp-2">{e.description}</p>

                  <div className="flex flex-wrap items-center gap-1.5 mt-4">
                    <Chip>{e.questions.length} questions</Chip>
                    {(Object.keys(m) as Difficulty[]).filter((d) => m[d] > 0).map((d) => (
                      <Chip key={d} tone={diffTone[d]}>
                        {m[d]} {d}
                      </Chip>
                    ))}
                  </div>

                  <div className="font-mono text-[10.5px] uppercase tracking-widest text-faint mt-3">
                    published {fmtDate(e.publishedAt)}
                    {e.updatedAt > e.publishedAt ? ` · updated ${fmtDate(e.updatedAt)}` : ""}
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-line mt-auto">
                    <Btn size="sm" onClick={() => onClone(e)}>
                      <IconPlus /> Add to my banks
                    </Btn>
                    <Btn size="sm" variant="ghost" onClick={() => onToggleFavorite(e.id)}>
                      <IconStar filled={fav} className={fav ? "text-[#bd7c16]" : "text-faint"} /> {fav ? "Favourited" : "Favourite"}
                    </Btn>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* publish callout */}
      <div className="mt-8 dash-t pt-6 flex flex-wrap items-center gap-4 anim-fade-up">
        <span className="w-11 h-11 rounded-md bg-ink text-[#57c4ae] flex items-center justify-center text-xl shrink-0">
          <IconGlobe />
        </span>
        <div className="flex-1 min-w-[240px]">
          <h3 className="font-display font-bold text-ink">Have a bank worth sharing?</h3>
          <p className="text-[13px] text-mute mt-0.5">
            Open any of your banks and press <strong className="text-body">Publish</strong> — it lands here under your name,
            and others can favourite or clone it.
          </p>
        </div>
        <Btn variant="soft" onClick={() => onNav("banks")}>
          <IconBookOpen /> Go to my banks
        </Btn>
      </div>
    </div>
  );
}
