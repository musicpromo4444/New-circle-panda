import { useEffect, useState } from "react";
import { Bell, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { RewardQualificationFlow } from "@/components/RewardQualificationFlow";

type Qualification={id:string;campaign_id:string;prize_id:string;current_stage:number;status:string};
type Prize={id:string;name:string;description:string|null;image_url:string|null;emoji:string;prize_type:string;value:number;qualification_label:string;fulfilment_type:string;fulfilment_config:Record<string,unknown>};
type Stage={id:string;stage_number:number;title:string;released_at:string|null};

export function RewardQualificationResume(){
 const [open,setOpen]=useState(false);
 const [qualification,setQualification]=useState<Qualification|null>(null);
 const [prize,setPrize]=useState<Prize|null>(null);
 const [stage,setStage]=useState<Stage|null>(null);
 const [loading,setLoading]=useState(true);

 useEffect(()=>{let alive=true;(async()=>{
   const {data:user}=await supabase.auth.getUser();
   if(!user.user){if(alive)setLoading(false);return;}
   const {data:qs}=await supabase.from("cp_reward_qualifications").select("id,campaign_id,prize_id,current_stage,status").eq("user_id",user.user.id).in("status",["qualified","stage_1","stage_2","stage_3"]).order("updated_at",{ascending:false}).limit(10);
   if(!qs?.length){if(alive)setLoading(false);return;}
   const q=qs[0] as Qualification;
   const [{data:p},{data:s}]=await Promise.all([
     supabase.from("cp_reward_prizes").select("id,name,description,image_url,emoji,prize_type,value,qualification_label,fulfilment_type,fulfilment_config").eq("id",q.prize_id).maybeSingle(),
     supabase.from("cp_reward_stages").select("id,stage_number,title,released_at").eq("campaign_id",q.campaign_id).eq("stage_number",q.current_stage).eq("enabled",true).maybeSingle()
   ]);
   if(alive && p && s && s.released_at){setQualification(q);setPrize(p as Prize);setStage(s as Stage);setOpen(true);}
   if(alive)setLoading(false);
 })();return()=>{alive=false}},[]);

 if(loading||!qualification||!prize||!stage)return null;
 return <Dialog open={open} onOpenChange={setOpen}>
   <DialogContent className="sm:max-w-sm">
     <DialogTitle className="flex items-center gap-2 font-display text-xl"><Bell className="size-5 text-primary"/> Continue your qualification</DialogTitle>
     <DialogDescription>Stage {stage.stage_number} of your {prize.name} qualification is ready. Your previous progress is saved.</DialogDescription>
     <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center gap-3">
       <div className="grid size-12 place-items-center rounded-xl bg-secondary overflow-hidden">{prize.image_url?<img src={prize.image_url} className="size-full object-cover" alt=""/>:<span className="text-2xl">{prize.emoji}</span>}</div>
       <div><p className="text-xs text-muted-foreground">Qualified prize</p><p className="font-semibold">{prize.name}</p><p className="text-[11px] text-muted-foreground">Continue from Stage {stage.stage_number}</p></div>
     </div>
     {open?<RewardQualificationFlow qualificationId={qualification.id} prize={prize} onClose={()=>setOpen(false)}/>:null}
   </DialogContent>
 </Dialog>;
}
