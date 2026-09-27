import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { StandardBannerAd } from "@/components/ads/StandardBannerAd";
import { PlayableVideoAd } from "@/components/ads/PlayableVideoAd";
import { useStore } from "@/lib/store";
import { useLiveEngagementConfig } from "@/components/ads/adInventoryStorage";
import { DAILY_ACTIVITY_LIBRARY, getDailyActivityForDay, type DailyActivityId } from "./dailyActivities";

interface DailyActivityGateProps { open: boolean; onClose: () => void; }

function useAdGate() {
  const [showAd, setShowAd] = useState(false);
  const [next, setNext] = useState<(() => void) | null>(null);
  const requestAd = (after: () => void) => { setNext(() => after); setShowAd(true); };
  const ad = showAd ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-3xl bg-card p-4 shadow-2xl">
        <PlayableVideoAd
          onComplete={() => { setShowAd(false); const fn = next; setNext(null); fn?.(); }}
          onSkipped={() => { setShowAd(false); const fn = next; setNext(null); fn?.(); }}
        />
      </div>
    </div>
  ) : null;
  return { requestAd, ad };
}

export function DailyActivityGate({ open, onClose }: DailyActivityGateProps) {
  const { addCoins } = useStore();
  const live = useLiveEngagementConfig();
  const config = live.dailyActivities;
  const day = (() => { const d = new Date().getDay(); return d === 0 ? 7 : d; })();
  const activityId = getDailyActivityForDay(day, config);
  const activity = DAILY_ACTIVITY_LIBRARY.find((a) => a.id === activityId) || DAILY_ACTIVITY_LIBRARY[0];
  const [message, setMessage] = useState("");
  const [finished, setFinished] = useState(false);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelResult, setWheelResult] = useState<number | null>(null);
  const [cardPicks, setCardPicks] = useState<number[]>([]);
  const [cupStage, setCupStage] = useState<"prize"|"shuffle"|"pick"|"failed">("prize");
  const [boxStage, setBoxStage] = useState<"pick"|"opening"|"result">("pick");
  const [targetTime, setTargetTime] = useState(30);
  const [targetRound, setTargetRound] = useState(false);
  const [targets, setTargets] = useState<number[]>([]);
  const [puzzlePieces, setPuzzlePieces] = useState([0,1,2,3,4,5,6,7,8]);
  const [slots, setSlots] = useState(["🐼","⭐","🪙"]);
  const { requestAd, ad } = useAdGate();

  useEffect(() => {
    if (!open) return;
    if (!config.enabled) { onClose(); return; }
    setMessage(""); setFinished(false); setWheelResult(null); setCardPicks([]);
    setCupStage("prize"); setBoxStage("pick"); setTargetTime(30); setTargetRound(false);
    setTargets([]); setPuzzlePieces([0,1,2,3,4,5,6,7,8]); setSlots(["🐼","⭐","🪙"]);
  }, [open, activityId]);

  useEffect(() => {
    if (!targetRound || targetTime <= 0) return;
    const timer = window.setInterval(() => setTargetTime((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [targetRound, targetTime]);

  useEffect(() => {
    if (activityId !== "panda-target" || !targetRound || targetTime !== 0) return;
    setTargetRound(false);
    requestAd(() => { setMessage("Round complete."); setFinished(true); });
  }, [activityId, targetRound, targetTime]);

  const reward = (amount: number) => addCoins(amount, "Daily Activity: " + activity.name + " (+" + amount + " BC)");
  const close = () => { setFinished(true); onClose(); };
  const wheelPrizes = config.wheelPrizes?.length ? config.wheelPrizes : [1,2,5,10,20,30];
  const cardPrizes = config.cardPrizes?.length ? config.cardPrizes : [1,20,30];

  const render = () => {
    switch (activityId as DailyActivityId) {
      case "wheel-spin":
        return <div className="space-y-4 text-center">
          <div className="mx-auto grid size-52 place-items-center rounded-full border-8 border-primary/30 bg-[conic-gradient(var(--primary)_0_16%,transparent_16%_33%,var(--primary)_33%_50%,transparent_50%_66%,var(--primary)_66%_83%,transparent_83%)]">
            <div className="grid size-32 place-items-center rounded-full bg-card text-lg font-black">{wheelResult ?? "SPIN"}</div>
          </div>
          <p className="text-xs text-muted-foreground">Visible prizes: {wheelPrizes.join(" · ")} BC</p>
          <StandardBannerAd variant="compact" />
          <Button disabled={wheelSpinning} onClick={() => { setWheelSpinning(true); window.setTimeout(() => { const n=wheelPrizes[Math.floor(Math.random()*wheelPrizes.length)]; setWheelSpinning(false); requestAd(() => { setWheelResult(n); reward(n); }); },1500); }} className="w-full">{wheelSpinning ? "Spinning…" : "Spin Wheel"}</Button>
          {wheelResult !== null ? <><p className="font-bold">You won {wheelResult} BC</p><Button variant="outline" onClick={() => requestAd(() => setWheelResult(null))} className="w-full">Spin Again</Button></> : null}
        </div>;

      case "guess-sponsor":
        return <div className="space-y-4 text-center">
          <p className="font-bold">Guess the sponsor to claim this item.</p>
          <div className="grid grid-cols-3 gap-2">{["Sponsor A","Sponsor B","Sponsor C"].map((x) => <button key={x} onClick={() => requestAd(() => setMessage("Failed — sponsor reveal complete."))} className="min-h-28 rounded-2xl border bg-secondary/40 p-3 font-bold">{x}<span className="mt-2 block text-2xl">🎁</span></button>)}</div>
          {message ? <p className="rounded-xl bg-secondary p-3 text-sm font-bold">{message}</p> : null}
        </div>;

      case "cup-shuffle":
        return <div className="space-y-4 text-center">
          {cupStage === "prize" ? <><p className="font-bold">Pick 1 of 5 prizes.</p><div className="grid grid-cols-5 gap-1">{[1,5,10,20,100].map((p)=><button key={p} onClick={()=>{setMessage(p+" BC is under a cup.");setCupStage("shuffle");window.setTimeout(()=>setCupStage("pick"),1200)}} className="rounded-xl border p-3 text-xs font-bold">{p} BC</button>)}</div></> : null}
          {cupStage === "shuffle" ? <div className="animate-pulse py-10 text-4xl">🐼 🥤 🥤 🥤</div> : null}
          {cupStage === "pick" ? <div className="grid grid-cols-3 gap-3">{[1,2,3].map((c)=><button key={c} onClick={()=>setCupStage("failed")} className="rounded-2xl border p-8 text-4xl">🥤</button>)}</div> : null}
          {cupStage === "failed" ? <><p className="font-bold">Failed.</p><Button onClick={()=>requestAd(()=>{setCupStage("prize");setMessage("")})} className="w-full">Try Again</Button><Button variant="ghost" onClick={close} className="w-full">Give Up</Button></> : null}
          <StandardBannerAd variant="compact" />
        </div>;

      case "cards":
        return <div className="space-y-4 text-center"><StandardBannerAd variant="compact" />
          <div className="grid grid-cols-3 gap-3">{[0,1,2].map(i=><button key={i} disabled={cardPicks.includes(i)||cardPicks.length>=3} onClick={()=>{const n=cardPrizes[i%cardPrizes.length];reward(n);setMessage("You got "+n+" BC — added instantly.");setCardPicks(p=>[...p,i])}} className="aspect-[3/4] rounded-2xl border bg-secondary/50 text-4xl">🃏</button>)}</div>
          {message ? <p className="font-bold">{message}</p> : null}
          {cardPicks.length>=3 ? <><Button onClick={()=>requestAd(()=>{setCardPicks([]);setMessage("")})} className="w-full">Try Again</Button><Button variant="ghost" onClick={close} className="w-full">Give Up</Button></> : null}
        </div>;

      case "secret-reveal":
        return <div className="space-y-4 text-center"><StandardBannerAd variant="compact" /><p className="font-bold">Secret Confession • 9-piece puzzle • 30 seconds</p><div className="grid grid-cols-3 gap-1">{puzzlePieces.map(p=><button key={p} onClick={()=>setPuzzlePieces([...puzzlePieces].sort(()=>Math.random()-.5))} className="aspect-square rounded-lg border bg-secondary/50">{p+1}</button>)}</div><Button onClick={()=>requestAd(()=>{setMessage("You got it — the secret is revealed.");setFinished(true)})} className="w-full">Complete Puzzle</Button></div>;

      case "puzzle":
        return <div className="space-y-4 text-center"><StandardBannerAd variant="compact" /><p className="font-bold">Solve the puzzle in 30 seconds.</p><div className="grid grid-cols-3 gap-1">{puzzlePieces.map(p=><button key={p} onClick={()=>setPuzzlePieces([...puzzlePieces].sort(()=>Math.random()-.5))} className="aspect-square rounded-lg border bg-secondary/50">{p+1}</button>)}</div><Button onClick={()=>requestAd(()=>{setMessage("Puzzle result revealed.");setFinished(true)})} className="w-full">Reveal Result</Button></div>;

      case "just-ads":
        return <div className="space-y-4 text-center"><p className="font-bold">Sponsored access</p><p className="text-sm text-muted-foreground">View the admin-selected ad before entering Circle Panda.</p><Button onClick={()=>requestAd(close)} className="w-full">View Ad & Continue</Button></div>;

      case "coin-drop":
        return <div className="space-y-4 text-center"><StandardBannerAd variant="compact" /><div className="rounded-3xl border p-8 text-5xl">🪙⬇️</div><Button onClick={()=>requestAd(()=>{const n=(config.coinDropPrizes||[1,2,5,10])[Math.floor(Math.random()*(config.coinDropPrizes||[1,2,5,10]).length)];reward(n);setMessage("You got "+n+" BC.")})} className="w-full">Drop Coin</Button>{message?<p className="font-bold">{message}</p>:null}{message?<><Button onClick={()=>requestAd(()=>setMessage(""))} className="w-full">Play Again</Button><Button variant="ghost" onClick={close} className="w-full">Give Up</Button></>:null}<StandardBannerAd variant="compact" /></div>;

      case "slots":
        return <div className="space-y-4 text-center"><StandardBannerAd variant="compact" /><div className="grid grid-cols-3 gap-2">{slots.map((s,i)=><div key={i} className="grid aspect-square place-items-center rounded-2xl border bg-secondary text-4xl">{s}</div>)}</div><Button onClick={()=>{const next=[0,1,2].map(()=>config.slotSymbols[Math.floor(Math.random()*config.slotSymbols.length)]||"🐼");setSlots(next);if(next[0]===next[1]&&next[1]===next[2])reward(30)}} className="w-full">Spin</Button><Button variant="outline" onClick={()=>requestAd(()=>{})} className="w-full">Play Again</Button><Button variant="ghost" onClick={close} className="w-full">Give Up</Button><StandardBannerAd variant="compact" /></div>;

      case "mystery-box":
        return <div className="space-y-4 text-center"><p className="font-bold">Choose 1 of 3 pixel boxes.</p><div className="grid grid-cols-3 gap-3">{[0,1,2].map(i=><button key={i} disabled={boxStage!=="pick"} onClick={()=>{setBoxStage("opening");window.setTimeout(()=>{const n=[1,2,5][i];requestAd(()=>{reward(n);setMessage("You got "+n+" BC.");setBoxStage("result")})},900)}} className="grid aspect-square place-items-center rounded-2xl border bg-secondary text-5xl">📦</button>)}</div>{boxStage==="opening"?<p className="animate-pulse font-bold">Opening…</p>:null}{boxStage==="result"?<><p className="font-bold">{message}</p><Button onClick={()=>requestAd(()=>{setBoxStage("pick");setMessage("")})} className="w-full">Try Again</Button><Button variant="ghost" onClick={close} className="w-full">Give Up</Button></>:null}<StandardBannerAd variant="compact" /></div>;

      case "panda-target":
        return <div className="space-y-4 text-center"><div className="flex justify-between text-xs font-bold"><span>30-second arena</span><span>{targetTime}s</span></div>{!targetRound?<Button onClick={()=>{setTargetRound(true);setTargetTime(30);setTargets([20,50,75])}} className="w-full">Start Target Arena</Button>:<div className="relative h-64 overflow-hidden rounded-3xl border bg-secondary/30">{targets.map((pos,i)=>{const amount=i===2?1000:[10,20][i%2];return <button key={i} onClick={()=>{reward(amount);setMessage(amount>=1000?"Blink target!":amount+" BC added.")}} className="absolute rounded-full border-2 p-2 text-[10px] font-black" style={{left:pos+"%",top:((i*23)+10)+"%"}}>{amount} BC</button>})}</div>}{message?<p className="font-bold">{message}</p>:null}</div>;
    }
  };

  return <>
    <Dialog open={open} onOpenChange={(v)=>!v&&close()}>
      <DialogContent className="max-h-[92vh] w-[92vw] max-w-md overflow-y-auto rounded-3xl border border-border/80 bg-card p-0">
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wider text-primary">Daily Activity · Day {day}</p><h2 className="text-xl font-black">{activity.icon} {activity.name}</h2></div><button onClick={close} className="grid size-9 place-items-center rounded-full hover:bg-secondary"><X className="size-4" /></button></div>
          <div className="mt-3">{render()}</div>
          {finished ? <div className="mt-4 rounded-2xl bg-emerald-500/10 p-3 text-center text-sm font-semibold"><Check className="mx-auto mb-1 size-5 text-emerald-500" />Done. Welcome to Circle Panda.</div> : null}
        </div>
      </DialogContent>
    </Dialog>
    {ad}
  </>;
}
