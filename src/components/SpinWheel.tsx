import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { RewardQualificationFlow } from "@/components/RewardQualificationFlow";

type Prize={id:string;name:string;description:string|null;image_url:string;emoji:string;prize_type:string;value:number;qualification_label:string;fulfilment_type:string;fulfilment_config:Record<string,unknown>};
type Result=Prize & {attempt_id:string;qualification_id:string|null;window_no:number;spin_number:number};

function remaining(next:string|null){if(!next)return "00:00:00";const ms=Math.max(0,new Date(next).getTime()-Date.now());const h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),s=Math.floor(ms%60000/1000);return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");}

export function SpinWheel({open,onOpenChange}:{open:boolean;onOpenChange:(o:boolean)=>void}){
 const [campaignId,setCampaignId]=useState<string|null>(null); const [prizes,setPrizes]=useState<Prize[]>([]); const [result,setResult]=useState<Result|null>(null);
 const [spinning,setSpinning]=useState(false); const [angle,setAngle]=useState(0); const [nextSpin,setNextSpin]=useState<string|null>(null);
 useEffect(()=>{let alive=true;(async()=>{const {data:c}=await supabase.from("cp_reward_campaigns").select("id").eq("enabled",true).order("created_at").limit(1).maybeSingle();if(!alive)return;if(c){setCampaignId(c.id);const {data:p}=await supabase.from("cp_reward_prizes").select("*").eq("campaign_id",c.id).eq("enabled",true).order("sort_order");setPrizes((p??[]) as Prize[]);const {data:s}=await supabase.rpc("cp_get_reward_status",{p_campaign_id:c.id});if(s)setNextSpin((s as {next_spin_at:string|null}).next_spin_at)}})();return()=>{alive=false}},[open]);
 const spin=async()=>{if(!campaignId||spinning)return;setSpinning(true);setResult(null);const {data,error}=await supabase.rpc("cp_spin_reward",{p_campaign_id:campaignId});if(error){setSpinning(false);return;}const r=data as Result;const idx=Math.max(0,prizes.findIndex(p=>p.id===r.prize_id));const n=Math.max(1,prizes.length);const slice=360/n;setAngle(v=>v+2160+(360-(idx*slice+slice/2)));setTimeout(async()=>{setResult(r);setSpinning(false);const {data:status}=await supabase.rpc("cp_get_reward_status",{p_campaign_id:campaignId});if(status)setNextSpin((status as {next_spin_at:string|null}).next_spin_at)},4200);};
 return <Dialog open={open} onOpenChange={o=>!spinning&&onOpenChange(o)}><DialogContent className="sm:max-w-sm">
  <DialogTitle className="flex items-center gap-2 font-display text-xl"><Sparkles className="size-5 text-[var(--coin)]"/> Spin the Wheel</DialogTitle>
  <DialogDescription>{result ? result.qualification_label : "Your result is decided securely by Circle Panda before the wheel animation finishes."}</DialogDescription>
  {prizes.length===0?<div className="py-8 text-center text-sm text-muted-foreground">The wheel is currently unavailable.</div>:<>
   <div className="relative mx-auto grid size-[250px] place-items-center"><span className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 border-x-8 border-t-[14px] border-x-transparent border-t-[var(--coin)]"/>
    <div className="relative size-full rounded-full border-4 border-[var(--coin)]" style={{transform:"rotate("+angle+"deg)",transition:spinning?"transform 4.2s cubic-bezier(0.16,1,0.3,1)":undefined,background:"conic-gradient("+prizes.map((_,i)=>{const a=i*360/prizes.length;return "var(--primary) "+a+"deg "+(a+360/prizes.length)+"deg"}).join(",")+")"}}>{prizes.map((p,i)=><span key={p.id} className="absolute left-1/2 top-1/2 origin-left text-lg" style={{transform:"rotate("+(i*360/prizes.length+180/prizes.length)+"deg) translateX(62px) rotate(90deg)"}}>{p.emoji}</span>)}</div>
   </div>
   {result?<div className="space-y-3 text-center"><div className="text-4xl">{result.emoji}</div><h3 className="font-display text-xl font-bold">{result.title}</h3>{result.prize_type==="try_again"?<p className="text-sm text-muted-foreground">No qualification this time.</p>:result.qualification_id?<p className="text-sm text-muted-foreground">Your qualification is saved. Continue below to complete the next step.</p>:<p className="text-sm text-primary font-semibold">Reward processed automatically.</p>}{result.qualification_id && result.fulfilment_type!=="automatic_bc" && result.fulfilment_type!=="automatic_vip"?<RewardQualificationFlow qualificationId={result.qualification_id} prize={result} onClose={()=>onOpenChange(false)}/>:null}</div>:<Button className="w-full" onClick={spin} disabled={spinning||Boolean(nextSpin&&new Date(nextSpin).getTime()>Date.now())}>{spinning?<><Loader2 className="mr-2 size-4 animate-spin"/>Spinning…</>:nextSpin&&new Date(nextSpin).getTime()>Date.now()?"Next spin in "+remaining(nextSpin):"Spin free"}</Button>}
  </>}
 </DialogContent></Dialog>;
}