import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { BannerAd } from "@/components/ads/BannerAd";

type Prize = {
  title: string; description?: string | null; image_url?: string | null; emoji: string;
  prize_type: string; value: number; qualification_label: string; fulfilment_type: string;
  fulfilment_config?: Record<string, unknown>;
};
type Stage = { id: string; stage_number: number; title: string; instructions?: string | null; stage_type: string; sponsor_name?: string | null; action_url?: string | null; released_at?: string | null; form_config?: { fields?: Array<{key:string;label:string;type?:string;required?:boolean;options?:string[]}> } };

export function RewardQualificationFlow({ qualificationId, prize, onClose }: { qualificationId: string; prize: Prize; onClose: () => void }) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [stageIndex, setStageIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(true);
  const [completedStage, setCompletedStage] = useState<Stage | null>(null);
  const [nextStage, setNextStage] = useState<Stage | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: q } = await supabase.from("cp_reward_qualifications").select("campaign_id,current_stage").eq("id", qualificationId).maybeSingle();
      if (!q) { if (alive) setLoading(false); return; }
      const { data } = await supabase.from("cp_reward_stages").select("*").eq("campaign_id", q.campaign_id).eq("enabled", true).order("stage_number");
      if (alive) {
        setStages((data ?? []) as Stage[]);
        setStageIndex(Math.max(0, (q.current_stage ?? 1) - 1));
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [qualificationId]);

  const stage = stages[stageIndex];
  const submit = async () => {
    if (!stage) { setDone(true); return; }
    const fields = stage.form_config?.fields ?? [];
    if (fields.some((f) => f.required && !answers[f.key]?.trim())) return;
    setLoading(true);
    const { error } = await supabase.rpc("cp_submit_reward_stage", {
      p_qualification_id: qualificationId, p_stage_id: stage.id, p_answers: answers,
    });
    if (!error) {
      const next = stages[stageIndex + 1] ?? null;
      setAnswers({});
      setCompletedStage(stage);
      setNextStage(next);
    }
    setLoading(false);
  };

  if (completedStage) {
    if (!nextStage) return <div className="space-y-4 text-center"><CheckCircle2 className="mx-auto size-12 text-primary" /><h3 className="font-display text-xl font-bold">All qualification stages completed</h3><p className="text-sm text-muted-foreground">You are now in the finalist pool. Circle Panda will notify you about the final selection.</p><Button className="w-full" onClick={onClose}>Done for now</Button></div>;
    const released = Boolean(nextStage.released_at);
    return <div className="space-y-4 text-center"><CheckCircle2 className="mx-auto size-12 text-primary" /><h3 className="font-display text-xl font-bold">Stage {completedStage.stage_number} completed</h3><p className="text-sm text-muted-foreground">{released ? "Stage " + nextStage.stage_number + " is ready, but you do not have to complete it now." : "Stage " + nextStage.stage_number + " is not open yet. We will notify you when it is released."}</p>{released ? <Button className="w-full" onClick={()=>{setCompletedStage(null);setStageIndex(stageIndex+1)}}>Continue to Stage {nextStage.stage_number}</Button> : null}<Button className="w-full" variant="outline" onClick={onClose}>Done for now</Button></div>;
  }
  if (loading) return <div className="grid min-h-40 place-items-center"><Loader2 className="animate-spin" /></div>;

  const fields = stage?.form_config?.fields ?? [{key:"contact_method",label:"How would you like to receive updates?",type:"text",required:true}];
  return <div className="space-y-4">
    <div className="flex items-center gap-3"><div className="grid size-12 place-items-center overflow-hidden rounded-xl bg-secondary">{prize.image_url ? <img src={prize.image_url} className="size-full object-cover" alt="" /> : <span className="text-2xl">{prize.emoji}</span>}</div><div><p className="text-xs text-muted-foreground">Qualified prize</p><h3 className="font-display text-lg font-bold">{prize.title}</h3></div></div>
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">{stage?.instructions ?? prize.qualification_label}</div>
    {stage?.action_url && stage.stage_type === "browser" ? <Button className="w-full" variant="outline" onClick={() => window.open(stage.action_url!, "_blank", "noopener,noreferrer")}><ExternalLink className="mr-2 size-4" />Open sponsor activity</Button> : null}
    <div className="space-y-3">
      {fields.map((f) => <div key={f.key}><label className="mb-1 block text-xs font-medium">{f.label}{f.required ? " *" : ""}</label><Input value={answers[f.key] ?? ""} onChange={(e) => setAnswers((a) => ({...a,[f.key]:e.target.value}))} placeholder={f.options?.join(" / ")} /></div>)}
    </div>
    {stage?.ad_enabled ? <BannerAd className="mt-2" /> : null}<Button className="w-full" onClick={submit} disabled={loading}>{loading ? "Saving…" : stage ? (stageIndex + 1 < stages.length ? "Next" : "Submit") : "Continue"}</Button>
    <p className="text-center text-[11px] text-muted-foreground">Sponsor activities and data requests are shown as configured by Circle Panda.</p>
  </div>;
}