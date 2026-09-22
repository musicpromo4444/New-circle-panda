import { useMemo, useState } from "react";
import { Box, CircleDot, Coins, Crown, Dices, Gift, Grid2X2, Puzzle, RotateCcw, Sparkles, Target, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { StandardBannerAd } from "@/components/ads/StandardBannerAd";
import { PlayableVideoAd } from "@/components/ads/PlayableVideoAd";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export type ActivityId = "wheel" | "mystery" | "target" | "cards" | "puzzle" | "coin" | "slots";

const ACTIVITIES: Array<{ id: ActivityId; title: string; icon: string; description: string }> = [
  { id: "wheel", title: "Lucky Wheel", icon: "🎡", description: "Spin for BC and surprise rewards." },
  { id: "mystery", title: "Mystery Box", icon: "🎁", description: "Open a mystery box. Watch an ad for a second box." },
  { id: "target", title: "Target", icon: "🎯", description: "Tap the Panda target before it moves." },
  { id: "cards", title: "Guess the Sponsor", icon: "🃏", description: "Guess the sponsor, then reveal it." },
  { id: "puzzle", title: "Puzzle", icon: "🧩", description: "Solve the quick Panda puzzle. Try Again uses an ad." },
  { id: "coin", title: "Coin Drop", icon: "🪙", description: "Catch falling coins for 10 seconds." },
  { id: "slots", title: "Panda Slots", icon: "🎰", description: "A reward-only Panda reel. No cash-out." },
];

function RewardAd({ onComplete }: { onComplete: () => void }) {
  return <PlayableVideoAd variant="card" onComplete={onComplete} />;
}

export function WeeklyActivitiesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addCoins } = useStore();
  const [active, setActive] = useState<ActivityId | null>(null);
  const [adMode, setAdMode] = useState<"tryAgain" | "secondBox" | "sponsor" | "wheelExtra" | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [coinScore, setCoinScore] = useState(0);
  const [coinRunning, setCoinRunning] = useState(false);
  const [targetReady, setTargetReady] = useState(false);
  const [cardChoice, setCardChoice] = useState<number | null>(null);
  const [wheelUsed, setWheelUsed] = useState(false);

  const current = useMemo(() => ACTIVITIES.find((a) => a.id === active), [active]);

  const closeActivity = () => {
    setActive(null); setResult(null); setAdMode(null); setCoinRunning(false); setTargetReady(false); setCardChoice(null); setWheelUsed(false);
  };

  const award = (amount: number, reason: string) => {
    if (amount > 0) addCoins(amount, reason);
    setResult(amount > 0 ? `+${amount} BC` : "Try again!");
  };

  const startCoinDrop = () => {
    if (coinRunning) return;
    setCoinRunning(true); setCoinScore(0); setResult(null);
    let score = 0;
    const timer = window.setInterval(() => {
      score += Math.random() < 0.15 ? 5 : 1;
      setCoinScore(score);
    }, 700);
    window.setTimeout(() => {
      window.clearInterval(timer); setCoinRunning(false); addCoins(score, "Coin Drop activity"); setResult(`+${score} BC`);
    }, 10000);
  };

  const play = (id: ActivityId) => {
    setActive(id); setResult(null); setAdMode(null); setCardChoice(null); setWheelUsed(false);
    if (id === "target") window.setTimeout(() => setTargetReady(true), 650);
    if (id === "coin") startCoinDrop();
  };

  const activityBody = () => {
    if (!current) return null;
    if (current.id === "wheel") return <div className="space-y-4 text-center"><div className="mx-auto grid size-36 place-items-center rounded-full border-8 border-primary/30 bg-gradient-to-br from-primary/20 to-amber-500/20 text-6xl shadow-lg">🎡</div><Button className="w-full" disabled={wheelUsed} onClick={() => { setWheelUsed(true); award([5,10,20,50][Math.floor(Math.random()*4)]!, "Lucky Wheel activity"); }}>Spin Now</Button>{wheelUsed ? <Button variant="outline" className="w-full" onClick={()=>setAdMode("wheelExtra")}>Extra Spin • Watch Ad</Button> : null}<StandardBannerAd variant="compact" index={21} /></div>;
    if (current.id === "mystery") return <div className="space-y-4 text-center"><div className="grid grid-cols-2 gap-3">{[1,2].map((box) => <button key={box} type="button" onClick={() => box === 2 ? setAdMode("secondBox") : award(5 + Math.floor(Math.random()*16), "Mystery Box activity")} className="panda-panel rounded-2xl p-7 text-5xl">🎁<span className="mt-2 block text-xs font-semibold">Box {box}</span></button>)}</div>{result && <p className="text-2xl font-black text-primary">{result}</p>}<StandardBannerAd variant="compact" index={22} /></div>;
    if (current.id === "target") return <div className="space-y-4 text-center"><div className="relative h-52 rounded-2xl border bg-secondary/20">{targetReady ? <button type="button" onClick={() => { setTargetReady(false); award(10, "Target activity"); }} className="absolute left-[62%] top-[42%] grid size-16 place-items-center rounded-full bg-primary text-4xl shadow-lg">🐼</button> : <p className="pt-20 text-sm text-muted-foreground">Wait for Panda…</p>}</div><Button variant="secondary" onClick={() => { setTargetReady(false); window.setTimeout(()=>setTargetReady(true),650); }}>Start Round</Button><StandardBannerAd variant="compact" index={23} /></div>;
    if (current.id === "cards") return <div className="space-y-4 text-center"><p className="font-semibold">Which sponsor is behind this Panda reward?</p><div className="grid grid-cols-3 gap-2">{["Panda Telecom","Panda Foods","Panda Games"].map((x,i)=><Button key={x} variant={cardChoice===i?"default":"secondary"} onClick={()=>{setCardChoice(i); setResult(i===1?"Correct!":"Not this one");}}>{x}</Button>)}</div>{cardChoice !== null && <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4"><p className="text-sm">Sponsor reveal</p><p className="mt-1 text-xl font-black">Panda Foods 🥳</p><Button className="mt-3 w-full" onClick={()=>setAdMode("sponsor")}>Open Sponsor Ad</Button></div>}</div>;
    if (current.id === "puzzle") return <div className="space-y-4 text-center"><p className="text-lg font-bold">🐼 + 🐼 = ?</p><div className="grid grid-cols-3 gap-2">{[2,3,4].map(x=><Button key={x} onClick={()=>x===4?award(10,"Puzzle activity"):setResult("Try again!")}>{x}</Button>)}</div>{result && <p className="font-bold">{result}</p>}{result === "Try again!" && <Button variant="outline" onClick={()=>setAdMode("tryAgain")}>Try Again • Watch Ad</Button>}<StandardBannerAd variant="compact" index={24} /></div>;
    if (current.id === "coin") return <div className="space-y-4 text-center"><div className="panda-panel rounded-2xl p-8"><p className="text-5xl">🪙</p><p className="mt-3 text-3xl font-black text-primary">{coinScore} BC</p><p className="text-xs text-muted-foreground">{coinRunning ? "Catch the falling coins!" : "10-second round"}</p></div>{!coinRunning && <Button onClick={startCoinDrop}>Start Coin Drop</Button>}<StandardBannerAd variant="compact" index={25} /></div>;
    return <div className="space-y-4 text-center"><div className="grid grid-cols-3 gap-2 text-4xl">{Array.from({length:3},(_,i)=><div key={i} className="rounded-2xl border bg-secondary/30 p-5">{["🐼","🪙","🎁"][Math.floor(Math.random()*3)]}</div>)}</div><Button className="w-full" onClick={()=>award([1,5,10,20][Math.floor(Math.random()*4)]!,"Panda Slots activity")}>Spin Reel</Button><p className="text-xs text-muted-foreground">Reward-only. No cash-out.</p></div>;
  };

  const handleAdComplete = () => {
    if (adMode === "secondBox") award(5 + Math.floor(Math.random()*21), "Mystery Box second box");
    if (adMode === "wheelExtra") { setWheelUsed(false); setResult(null); toast.success("Extra spin unlocked"); }
    if (adMode === "tryAgain") { setResult(null); toast.success("Try Again unlocked"); }
    if (adMode === "sponsor") { award(3, "Guess the Sponsor ad reward"); toast.success("Sponsor ad completed"); }
    setAdMode(null);
  };

  return <Dialog open={open} onOpenChange={(v)=>!v&&onClose()}><DialogContent className="max-h-[92vh] max-w-md overflow-y-auto rounded-3xl p-0"><div className="p-5"><div className="flex items-start justify-between gap-3"><div><DialogTitle className="font-display text-xl">7-Day Panda Activities</DialogTitle><DialogDescription>Claim your daily login first, then choose an activity.</DialogDescription></div><button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-secondary"><X className="size-4"/></button></div>{!active ? <div className="mt-5 space-y-3">{ACTIVITIES.map((a,i)=><button key={a.id} type="button" onClick={()=>play(a.id)} className="panda-panel flex w-full items-center gap-3 rounded-2xl p-4 text-left transition hover:border-primary/50"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-2xl">{a.icon}</span><span className="min-w-0 flex-1"><span className="block font-bold">{i+1}. {a.title}</span><span className="block text-xs text-muted-foreground">{a.description}</span></span><Sparkles className="size-4 text-primary"/></button>)}<div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4"><p className="font-bold">#8 • Playable Ad</p><p className="text-xs text-muted-foreground">Just a playable ad. No activity and no BC reward.</p><div className="mt-3"><RewardAd onComplete={()=>toast.success("Playable ad completed — no activity reward")}/></div></div></div> : <div className="mt-5"><button type="button" onClick={closeActivity} className="mb-4 text-xs font-semibold text-primary">← All activities</button><div className="mb-4 flex items-center gap-2"><span className="text-2xl">{current?.icon}</span><div><h3 className="font-display text-lg font-bold">{current?.title}</h3><p className="text-xs text-muted-foreground">{current?.description}</p></div></div>{activityBody()}{result && current?.id !== "coin" ? <div className="mt-4 rounded-2xl bg-primary/10 p-4 text-center text-2xl font-black text-primary">{result}</div> : null}</div>}{adMode ? <div className="mt-5 space-y-3 rounded-2xl border border-primary/30 bg-secondary/20 p-3"><p className="text-sm font-bold">Sponsored playable ad</p><RewardAd onComplete={handleAdComplete}/></div> : null}</div></DialogContent></Dialog>;
}
