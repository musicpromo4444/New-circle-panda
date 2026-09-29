import { useMemo, useState } from "react";
import { Gift, Play, ShieldCheck, Trophy, TrendingUp, Wallet, Users, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

type Giveaway = { id: number; title: string; prize: string; entries: number; ends: string; status: "Open" | "Ended" };

const seedGiveaways: Giveaway[] = [
  { id: 1, title: "Break Lounge BC Drop", prize: "1,000 BC", entries: 247, ends: "Today • 9:00 PM", status: "Open" },
  { id: 2, title: "Panda VIP Week", prize: "7 days VIP", entries: 128, ends: "Tomorrow • 6:00 PM", status: "Open" },
  { id: 3, title: "Mystery Sponsor Prize", prize: "Sponsored reward", entries: 0, ends: "Scheduled", status: "Open" },
];

const rates = [
  { name: "Safe", returnRate: 4, risk: "Low" },
  { name: "Balanced", returnRate: 9, risk: "Medium" },
  { name: "Bold", returnRate: 18, risk: "High" },
];

export function BreakLounge() {
  const [giveaways, setGiveaways] = useState(seedGiveaways);
  const [entered, setEntered] = useState<number[]>([]);
  const [balance, setBalance] = useState(500);
  const [stake, setStake] = useState("100");
  const [plan, setPlan] = useState("Balanced");
  const [days, setDays] = useState(7);
  const [invested, setInvested] = useState(false);

  const selectedRate = rates.find((r) => r.name === plan) ?? rates[1];
  const projected = useMemo(() => {
    const amount = Number(stake) || 0;
    return Math.round(amount * (1 + (selectedRate.returnRate / 100) * (days / 7)));
  }, [stake, selectedRate.returnRate, days]);

  const enterGiveaway = (id: number) => {
    if (entered.includes(id)) return;
    setEntered((current) => [...current, id]);
    setGiveaways((current) => current.map((g) => g.id === id ? { ...g, entries: g.entries + 1 } : g));
  };

  const invest = () => {
    const amount = Number(stake) || 0;
    if (amount <= 0 || amount > balance || invested) return;
    setBalance((b) => b - amount);
    setInvested(true);
  };

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Break Lounge</p>
            <h1 className="mt-1 text-2xl font-bold">Water Break</h1>
            <p className="text-sm text-muted-foreground">Giveaways, rewards and the investment game.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border px-3 py-2 text-sm">
            <Wallet className="h-4 w-4" /> {balance} BC
          </div>
        </header>

        <Card className="overflow-hidden">
          <CardContent className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <Badge variant="secondary">Live Break Lounge</Badge>
              <h2 className="mt-2 text-xl font-semibold">Take a break. Win something.</h2>
              <p className="mt-1 text-sm text-muted-foreground">Admin can schedule sponsor prizes, BC drops and VIP rewards while the Hot Seat is on water break.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="h-4 w-4" /> Water break active</div>
          </CardContent>
        </Card>

        <Tabs defaultValue="giveaways" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="giveaways"><Gift className="mr-2 h-4 w-4" />Giveaways</TabsTrigger>
            <TabsTrigger value="investment"><TrendingUp className="mr-2 h-4 w-4" />Investment Game</TabsTrigger>
          </TabsList>

          <TabsContent value="giveaways" className="mt-4 space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Break Lounge Giveaways</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {giveaways.map((giveaway) => {
                  const isEntered = entered.includes(giveaway.id);
                  return (
                    <div key={giveaway.id} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2"><Gift className="h-4 w-4" /><p className="font-semibold">{giveaway.title}</p></div>
                          <p className="mt-1 text-sm text-muted-foreground">Prize: {giveaway.prize}</p>
                        </div>
                        <Badge variant={isEntered ? "secondary" : "outline"}>{isEntered ? "Entered" : giveaway.status}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {giveaway.entries} entries</span>
                        <span>{giveaway.ends}</span>
                        <Button size="sm" disabled={isEntered || giveaway.status !== "Open"} onClick={() => enterGiveaway(giveaway.id)}>
                          {isEntered ? "Entry saved" : "Enter giveaway"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-3">
              <Mini icon={<ShieldCheck />} title="Fair draws" text="One controlled draw per giveaway." />
              <Mini icon={<Trophy />} title="Winner history" text="Completed draws stay recorded." />
              <Mini icon={<Play />} title="Sponsor breaks" text="Admin can attach ads or sponsor media." />
            </div>
          </TabsContent>

          <TabsContent value="investment" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Panda Investment Game</CardTitle>
                <p className="text-sm text-muted-foreground">Use BC to choose a risk level, lock the amount, then reveal the result when the round ends.</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  {rates.map((rate) => (
                    <button key={rate.name} onClick={() => setPlan(rate.name)} className={`rounded-xl border p-4 text-left transition ${plan === rate.name ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                      <p className="font-semibold">{rate.name}</p>
                      <p className="mt-1 text-2xl font-bold">+{rate.returnRate}%</p>
                      <p className="text-xs text-muted-foreground">{rate.risk} risk</p>
                    </button>
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">BC to invest</label>
                    <Input inputMode="numeric" value={stake} onChange={(e) => setStake(e.target.value)} disabled={invested} />
                    <p className="text-xs text-muted-foreground">Available: {balance} BC</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Round length</label>
                    <div className="flex gap-2">{[3,7,14].map((d) => <Button key={d} variant={days === d ? "default" : "outline"} onClick={() => setDays(d)} disabled={invested}>{d} days</Button>)}</div>
                  </div>
                </div>

                <div className="rounded-xl border p-4">
                  <div className="flex items-center justify-between text-sm"><span>Projected result</span><span className="font-semibold">{projected} BC</span></div>
                  <Progress className="mt-3" value={invested ? 100 : 35} />
                  <p className="mt-2 text-xs text-muted-foreground">{invested ? "Round locked. Result will be resolved by the game engine." : "Projection is a game display, not a cash investment."}</p>
                </div>

                <Button className="w-full" onClick={invest} disabled={invested || Number(stake) <= 0 || Number(stake) > balance}>
                  {invested ? "Investment locked" : "Invest BC"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function Mini({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-sm font-semibold">{icon}{title}</div><p className="mt-1 text-xs text-muted-foreground">{text}</p></CardContent></Card>;
}
