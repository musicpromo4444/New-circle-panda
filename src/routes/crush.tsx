import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Crown, Heart, Sparkles, Timer, Trophy, X, Share2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PlayableVideoAd } from "@/components/ads/PlayableVideoAd";
import { useAdPreloader } from "@/components/ads/useAdPreloader";
import { VIDEO_ADS } from "@/components/ads/AdTypes";
import { cn } from "@/lib/utils";
import { loadCrushRemote, uploadCrushRemote, voteCrushRemote, reactCrushRemote, shareCrushRemote } from "@/lib/crushSupabase";
import {
  useStore,
  EXTRA_VOTE_COST,
  FREE_DAILY_VOTES,
  WINNER_REWARD,
  type CrushKind,
  type CrushReaction,
} from "@/lib/store";

export const Route = createFileRoute("/crush")({
  head: () => ({
    meta: [
      { title: "WCW & MCM Voting — Circle Panda" },
      {
        name: "description",
        content:
          "Upload your Panda entry, swipe through this week's Woman Crush Wednesday and Man Crush Monday nominees, and crown the Spotlight King and Queen.",
      },
      { property: "og:title", content: "WCW & MCM Voting — Circle Panda" },
      {
        property: "og:description",
        content:
          "3 free votes a day, 1 BC after that. Weekly winners get a Spotlight badge and 100 BC.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CrushPage,
});

function countdown(until: number) {
  const left = Math.max(0, until - Date.now());
  const d = Math.floor(left / 86400000);
  const h = Math.floor((left % 86400000) / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return `${d}d ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function CrushPage() {
  const { nominees, voteFor, uploadCrushEntry, reactToNominee, shareNominee, freeVotesLeft, weekEndsAt, spotlights, crushReactions, crushShares } = useStore();
  const [kind, setKind] = useState<CrushKind>("wcw");
  const [index, setIndex] = useState(0);
  const [swipe, setSwipe] = useState<"left" | "right" | null>(null);
  const [swipeCount, setSwipeCount] = useState(0);
  const [showInlineAd, setShowInlineAd] = useState(false);
  const [videoAdIndex, setVideoAdIndex] = useState(0);
  const [openNominate, setOpenNominate] = useState(false);
  const [openLeaderboard, setOpenLeaderboard] = useState(false);
  const [form, setForm] = useState({ name: "", blurb: "", emoji: "🐼" });
  const [crushEnabled, setCrushEnabled] = useState(true);
  const [, setTick] = useState(0);
  const [remoteEntries, setRemoteEntries] = useState<any[] | null>(null);
  const [remoteConfig, setRemoteConfig] = useState<any | null>(null);

  // Pre-cache video ad units
  useAdPreloader({ videoUrls: VIDEO_ADS.map((ad) => ad.videoUrl) });

  useEffect(() => {
    const i = setInterval(() => setTick((v) => v + 1), 1000);
    const sync = () => {
      try {
        const saved = JSON.parse(window.localStorage.getItem("circle-panda-crush-admin-v1") || "null");
        setCrushEnabled(saved?.enabled !== false);
      } catch { setCrushEnabled(true); }
    };
    sync();
    void loadCrushRemote().then((remote) => {
      if (!remote) return;
      setRemoteEntries(remote.nominees.map((n: any) => ({
        id: n.id, name: n.display_name, kind: n.kind, emoji: n.emoji || "🐼", blurb: n.blurb || "",
        votes: remote.votes.filter((v: any) => v.nominee_id === n.id).length,
      })));
      setRemoteConfig(remote.config ?? null);
    });
    window.addEventListener("circle-panda-crush-config", sync);
    return () => {
      clearInterval(i);
      window.removeEventListener("circle-panda-crush-config", sync);
    };
  }, []);

  const scheduleRelease = (target: CrushKind) => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    const daysFromMonday = (day + 6) % 7;
    monday.setDate(now.getDate() - daysFromMonday);
    let mcmHour = 10;
    let wcwHour = 10;
    try {
      const saved = JSON.parse(window.localStorage.getItem("circle-panda-crush-admin-v1") || "null");
      mcmHour = Number(remoteConfig?.mcm_release_hour ?? saved?.mcmReleaseHour ?? 10);
      wcwHour = Number(remoteConfig?.wcw_release_hour ?? saved?.wcwReleaseHour ?? 10);
    } catch {}
    monday.setHours(target === "mcm" ? mcmHour : wcwHour, 0, 0, 0);
    if (target === "wcw") monday.setDate(monday.getDate() + 2);
    return monday;
  };

  const mcmRelease = scheduleRelease("mcm");
  const wcwRelease = scheduleRelease("wcw");
  const released = Date.now() >= (kind === "mcm" ? mcmRelease.getTime() : wcwRelease.getTime());

  const activeEntries = remoteEntries?.length ? remoteEntries : nominees;
  const pool = activeEntries.filter((n) => n.kind === kind);
  const ranked = [...pool].sort((a, b) => b.votes - a.votes);
  const card = pool[index % Math.max(pool.length, 1)] ?? null;

  const advance = (dir: "left" | "right") => {
    setSwipe(dir);
    const nextCount = swipeCount + 1;
    setSwipeCount(nextCount);

    setTimeout(() => {
      setSwipe(null);
      setIndex((v) => v + 1);

      // Sponsored content occupies the exact same Snapchat-style picture frame.
      const adEvery = Number(remoteConfig?.ad_every_swipes ?? 5);
      if (nextCount > 0 && nextCount % adEvery === 0) {
        setVideoAdIndex(Math.floor(nextCount / 5) - 1);
        setShowInlineAd(true);
      }
    }, 220);
  };

  const vote = () => {
    if (!card) return;
    voteFor(card.id);
    void voteCrushRemote(card.id);
    advance("right");
  };

  const submit = () => {
    if (!form.name.trim()) return;
    const ok = !!uploadCrushEntry(
      form.name.trim(),
      kind,
      form.blurb.trim() || "Uploaded anonymously.",
      form.emoji,
    );
    if (ok) {
      void uploadCrushRemote(form.name.trim(), kind, form.blurb.trim() || "Uploaded anonymously.", form.emoji);
      setOpenNominate(false);
      setForm({ name: "", blurb: "", emoji: "🐼" });
    }
  };

  return (
    <AppShell title="WCW & MCM" hidePageHeader={true}>
      {/* Top Toggle Tabs: WCW / MCM only */}
      <div className="mx-auto mb-3.5 flex w-full max-w-sm items-center rounded-full border border-border/70 bg-secondary/80 p-1 shadow-inner backdrop-blur-md">
        {(["wcw", "mcm"] as CrushKind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setKind(k);
              setIndex(0);
            }}
            className={cn(
              "flex-1 rounded-full py-2 text-center text-xs font-bold tracking-wider uppercase transition-all duration-200",
              kind === k
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {k.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Main Immersive Picture Container */}
      {!crushEnabled ? (
        <div className="panda-panel mx-auto max-w-sm rounded-2xl p-8 text-center text-sm text-muted-foreground">WCW & MCM is currently paused by Admin.</div>
      ) : !released ? (
        <div className="panda-panel mx-auto max-w-sm rounded-2xl p-8 text-center text-sm text-muted-foreground">
          {kind.toUpperCase()} opens {kind === "mcm" ? "Monday" : "Wednesday"} at {String(kind === "mcm" ? mcmRelease.getHours() : wcwRelease.getHours()).padStart(2, "0")}:00 local time.
        </div>
      ) : showInlineAd ? (
        <div className="flex flex-col items-center">
          <div className="relative aspect-[3/4] w-full max-w-sm overflow-hidden rounded-3xl border border-border/40 bg-zinc-950 shadow-2xl sm:aspect-[4/5]">
            <div className="absolute inset-0 flex flex-col">
              <div className="flex items-center justify-between bg-black/70 px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-white">
                <span>Sponsored</span><span>Ad</span>
              </div>
              <div className="min-h-0 flex-1 p-3 sm:p-4">
                <PlayableVideoAd index={videoAdIndex} onSkipped={() => setShowInlineAd(false)} onComplete={() => setShowInlineAd(false)} />
              </div>
            </div>
          </div>
        </div>
      ) : card ? (
        <div className="flex flex-col items-center">
          <div
            className={cn(
              "relative aspect-[3/4] w-full max-w-sm overflow-hidden rounded-3xl border border-border/40 bg-zinc-950 shadow-2xl transition-all duration-200 sm:aspect-[4/5]",
              swipe === "right"
                ? "translate-x-16 rotate-6 opacity-0"
                : swipe === "left"
                  ? "-translate-x-16 -rotate-6 opacity-0"
                  : "translate-x-0 rotate-0 opacity-100",
            )}
          >
            <div className="pointer-events-none grid size-full select-none place-items-center bg-gradient-to-b from-primary/25 via-primary/10 to-black">
              <span className="text-8xl">{card.emoji}</span>
            </div>

            {/* Overlaid at bottom-left corner of the picture itself: User's Name ONLY */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 pt-24">
              <h2 className="font-display text-2xl font-bold tracking-tight text-white drop-shadow-md sm:text-3xl">
                {card.name}
              </h2>
            </div>
          </div>

          {/* Action buttons: Skip and Vote free */}
          <div className="mt-3.5 grid w-full max-w-sm grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="lg"
              className="h-12 gap-2 rounded-2xl border-border/80 bg-background/90 text-sm font-semibold shadow-sm hover:bg-secondary active:scale-95"
              onClick={() => advance("left")}
            >
              <X className="size-5 text-muted-foreground" /> Skip
            </Button>
            <Button
              size="lg"
              className="h-12 gap-2 rounded-2xl bg-[var(--dating)] text-sm font-semibold text-[var(--dating-foreground)] shadow-md shadow-[var(--dating)]/25 hover:bg-[var(--dating)]/90 active:scale-95"
              onClick={vote}
            >
              <Heart className="size-5 fill-current" />{" "}
              {freeVotesLeft > 0 ? "Vote free" : `Vote · ${EXTRA_VOTE_COST} BC`}
            </Button>
          </div>

          {/* Reactions + sharing */}
          <div className="mt-3 w-full max-w-sm rounded-2xl border border-border/70 bg-secondary/40 p-3">
            <div className="mb-2 text-[11px] font-semibold text-muted-foreground">React to {card.name}</div>
            <div className="flex items-center justify-between gap-1">
              {([["panda","🐼"],["love","❤️"],["like","👍"],["thunder","⚡"],["rain","🌧️"]] as [CrushReaction,string][]).map(([reaction, icon]) => (
                <button key={reaction} type="button" onClick={() => { reactToNominee(card.id, reaction); void reactCrushRemote(card.id, reaction); }} className="grid min-h-10 min-w-10 place-items-center rounded-xl bg-background/70 text-lg active:scale-95">
                  {icon}
                </button>
              ))}
              <button type="button" onClick={() => { shareNominee(card.id); void shareCrushRemote(card.id); toast.success("Share counted"); }} className="grid min-h-10 min-w-10 place-items-center rounded-xl bg-primary/10 text-primary active:scale-95" aria-label="Share">
                <Share2 className="size-4" />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{Object.values(crushReactions[card.id] ?? { panda: 0, love: 0, like: 0, thunder: 0, rain: 0 }).reduce((a, b) => a + b, 0)} reactions</span>
              <span>{crushShares[card.id] ?? 0} shares</span>
            </div>
          </div>
          {/* Discreet secondary utility actions */}
          <div className="mt-3 flex w-full max-w-sm items-center justify-between px-2 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => setOpenLeaderboard(true)}
              className="flex items-center gap-1 transition-colors hover:text-foreground"
            >
              <Trophy className="size-3.5 text-primary" /> Leaderboard
            </button>
            <button
              type="button"
              onClick={() => setOpenNominate(true)}
              className="flex items-center gap-1 transition-colors hover:text-foreground"
            >
              <Sparkles className="size-3.5 text-primary" /> Upload
            </button>
          </div>
        </div>
      ) : (
        <div className="panda-panel mx-auto max-w-sm rounded-2xl p-8 text-center text-sm text-muted-foreground">
          No nominees yet in this category.
        </div>
      )}

      {/* Leaderboard modal */}
      <Dialog open={openLeaderboard} onOpenChange={setOpenLeaderboard}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Trophy className="size-5 text-primary" /> Live {kind.toUpperCase()} Leaderboard
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Timer className="size-3.5 text-primary" /> {countdown(weekEndsAt)} until weekly crown
          </DialogDescription>

          <div className="mt-3 max-h-[50vh] space-y-2 overflow-y-auto pr-1">
            {ranked.map((n, i) => (
              <div
                key={n.id}
                className="flex items-center gap-3 rounded-xl bg-secondary/50 px-3 py-2"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-background text-sm font-semibold tabular-nums">
                  {i === 0 ? "👑" : i + 1}
                </span>
                <span className="text-lg" aria-hidden>
                  {n.emoji}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{n.name}</span>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  {n.votes} votes
                </span>
              </div>
            ))}
          </div>

          {spotlights.length ? (
            <div className="mt-4 border-t border-border pt-3">
              <h3 className="flex items-center gap-1.5 font-display text-xs font-semibold text-muted-foreground uppercase">
                <Crown className="size-3.5 text-[var(--coin)]" /> Past Spotlights
              </h3>
              <div className="mt-1.5 space-y-1">
                {spotlights.map((w, i) => (
                  <p key={`${w.name}-${w.wonAt}-${i}`} className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{w.name}</span> — Spotlight{" "}
                    {w.kind === "wcw" ? "Queen" : "King"}
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-2 text-center">
            <p className="text-[11px] text-muted-foreground">
              Weekly winners receive {WINNER_REWARD} free BC and the Spotlight badge. Daily free
              votes reset every midnight ({FREE_DAILY_VOTES} free/day).
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nomination Dialog */}
      <Dialog open={openNominate} onOpenChange={setOpenNominate}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle className="font-display text-xl">
            Upload for {kind.toUpperCase()}
          </DialogTitle>
          <DialogDescription>
            Upload your Panda entry. Your built-in Panda avatar is used — no profile photo is required.
          </DialogDescription>

          <div className="space-y-3">
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Anonymous handle"
            />
            <Input
              value={form.blurb}
              onChange={(e) => setForm((f) => ({ ...f, blurb: e.target.value }))}
              placeholder="One line about them"
            />
            <div className="flex gap-2">
              {["🐼", "🌙", "🎋", "🔥", "🍫", "⛈️"].map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                  className={`grid size-9 place-items-center rounded-full border text-lg ${
                    form.emoji === e
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/50"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <Button
              className="w-full"
              onClick={() => {
                setForm((f) => ({ ...f, name: f.name || "You (anonymous)" }));
                submit();
              }}
            >
              Upload to {kind.toUpperCase()}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                if (nominate("You (anonymous)", kind, "Opted in anonymously.", "🐼")) {
                  setOpenNominate(false);
                }
              }}
            >
              Opt myself in anonymously
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
