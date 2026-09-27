import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DAILY_ACTIVITY_LIBRARY, type DailyActivityConfig, type DailyActivityId } from "@/components/daily-bonus/dailyActivities";

interface Props {
  config: DailyActivityConfig;
  onUpdate: (partial: Partial<DailyActivityConfig>) => void;
}

export function AdminDailyActivitiesManager({ config, onUpdate }: Props) {
  const [slots, setSlots] = useState<DailyActivityId[]>(config.slots);
  const [wheel, setWheel] = useState(config.wheelPrizes.join(", "));
  const [cards, setCards] = useState(config.cardPrizes.join(", "));
  const [coinDrop, setCoinDrop] = useState(config.coinDropPrizes.join(", "));

  const save = () => {
    const parse = (v: string, fallback: number[]) => {
      const values = v.split(",").map((x) => Number(x.trim())).filter((x) => Number.isFinite(x) && x >= 0);
      return values.length ? values : fallback;
    };
    onUpdate({
      slots,
      wheelPrizes: parse(wheel, config.wheelPrizes),
      cardPrizes: parse(cards, config.cardPrizes),
      coinDropPrizes: parse(coinDrop, config.coinDropPrizes),
    });
    toast.success("Daily Activities settings saved.");
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold">Daily Activities Library</h2>
        <p className="text-xs text-muted-foreground">11 activities. Choose which one appears on each day after the daily BC reward.</p>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-card p-4">
        <div>
          <p className="font-semibold text-sm">Daily Activity Gate</p>
          <p className="text-xs text-muted-foreground">When enabled, users complete the selected daily activity before entering Circle Panda.</p>
        </div>
        <Switch checked={config.enabled} onCheckedChange={(enabled) => onUpdate({ enabled })} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {slots.map((selected, index) => (
          <div key={index} className="rounded-2xl border border-border/80 bg-card p-3">
            <label className="mb-2 block text-xs font-bold">Day {index + 1}</label>
            <select
              value={selected}
              onChange={(e) => {
                const next = [...slots];
                next[index] = e.target.value as DailyActivityId;
                setSlots(next);
              }}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
            >
              {DAILY_ACTIVITY_LIBRARY.map((activity) => (
                <option key={activity.id} value={activity.id}>{activity.icon} {activity.name}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3">
        <p className="text-sm font-bold">Prize Settings</p>
        <p className="text-[11px] text-muted-foreground">Comma-separated BC values used by the games.</p>
        <input value={wheel} onChange={(e) => setWheel(e.target.value)} className="h-10 w-full rounded-xl border bg-background px-3 text-sm" placeholder="Wheel: 1, 2, 5, 10, 20, 30" />
        <input value={cards} onChange={(e) => setCards(e.target.value)} className="h-10 w-full rounded-xl border bg-background px-3 text-sm" placeholder="Cards: 1, 20, 30" />
        <input value={coinDrop} onChange={(e) => setCoinDrop(e.target.value)} className="h-10 w-full rounded-xl border bg-background px-3 text-sm" placeholder="Coin Drop: 1, 2, 5, 10" />
      </div>

      <Button onClick={save} className="w-full rounded-xl"><Save className="mr-2 size-4" />Save Daily Activities</Button>

      <div className="grid gap-2 sm:grid-cols-2">
        {DAILY_ACTIVITY_LIBRARY.map((activity) => (
          <div key={activity.id} className="rounded-xl border border-border/60 bg-secondary/20 p-3">
            <p className="text-sm font-bold">{activity.icon} {activity.name}</p>
            <p className="text-[11px] text-muted-foreground">{activity.shortDescription}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
