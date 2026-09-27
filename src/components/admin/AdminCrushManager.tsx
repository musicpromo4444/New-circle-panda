import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle, Clock3, Megaphone, Save, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export type CrushAdminConfig = {
  enabled: boolean;
  mcmReleaseHour: number;
  wcwReleaseHour: number;
  adEverySwipes: number;
  adSameFrame: boolean;
};

export const DEFAULT_CRUSH_ADMIN_CONFIG: CrushAdminConfig = {
  enabled: true,
  mcmReleaseHour: 10,
  wcwReleaseHour: 10,
  adEverySwipes: 5,
  adSameFrame: true,
};

export const CRUSH_ADMIN_STORAGE_KEY = "circle-panda-crush-admin-v1";

export function readCrushAdminConfig(): CrushAdminConfig {
  if (typeof window === "undefined") return DEFAULT_CRUSH_ADMIN_CONFIG;
  try {
    const saved = JSON.parse(window.localStorage.getItem(CRUSH_ADMIN_STORAGE_KEY) || "null");
    return { ...DEFAULT_CRUSH_ADMIN_CONFIG, ...(saved || {}) };
  } catch {
    return DEFAULT_CRUSH_ADMIN_CONFIG;
  }
}

export function AdminCrushManager() {
  const [config, setConfig] = useState(readCrushAdminConfig);

  useEffect(() => {
    const sync = () => setConfig(readCrushAdminConfig());
    window.addEventListener("circle-panda-crush-config", sync);
    return () => window.removeEventListener("circle-panda-crush-config", sync);
  }, []);

  const save = () => {
    window.localStorage.setItem(CRUSH_ADMIN_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event("circle-panda-crush-config"));
    toast.success("WCW & MCM settings saved");
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold">WCW & MCM Control</h2>
        <p className="text-xs text-muted-foreground">Control release times and the Snapchat-style sponsored card.</p>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><CheckCircle className="size-4 text-primary" /><span className="text-sm font-semibold">WCW & MCM active</span></div>
          <Switch checked={config.enabled} onCheckedChange={(enabled) => setConfig((c) => ({ ...c, enabled }))} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs"><CalendarDays className="mr-1 inline size-3.5" /> MCM Monday release hour</Label>
            <Input type="number" min={0} max={23} value={config.mcmReleaseHour} onChange={(e) => setConfig((c) => ({ ...c, mcmReleaseHour: Math.max(0, Math.min(23, Number(e.target.value))) }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs"><CalendarDays className="mr-1 inline size-3.5" /> WCW Wednesday release hour</Label>
            <Input type="number" min={0} max={23} value={config.wcwReleaseHour} onChange={(e) => setConfig((c) => ({ ...c, wcwReleaseHour: Math.max(0, Math.min(23, Number(e.target.value))) }))} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs"><Megaphone className="mr-1 inline size-3.5" /> Sponsored card after every</Label>
          <Input type="number" min={1} max={20} value={config.adEverySwipes} onChange={(e) => setConfig((c) => ({ ...c, adEverySwipes: Math.max(1, Math.min(20, Number(e.target.value))) }))} />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/30 p-3">
          <div><p className="text-sm font-semibold">Same Snapchat-style frame</p><p className="text-[11px] text-muted-foreground">Ads stay inside the same picture-card frame and swipe flow.</p></div>
          <Switch checked={config.adSameFrame} onCheckedChange={(adSameFrame) => setConfig((c) => ({ ...c, adSameFrame }))} />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="size-3.5" /> MCM: Monday {config.mcmReleaseHour}:00 · WCW: Wednesday {config.wcwReleaseHour}:00</div>
        <Button onClick={save} className="w-full"><Save className="mr-2 size-4" /> Save WCW & MCM</Button>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold"><Trophy className="size-4 text-primary" /> Weekly flow</div>
        <p className="mt-1 text-xs text-muted-foreground">MCM runs from Monday release to Wednesday release. WCW runs from Wednesday release to the next Monday release. The app automatically selects the active weekly lane.</p>
      </div>
    </section>
  );
}
