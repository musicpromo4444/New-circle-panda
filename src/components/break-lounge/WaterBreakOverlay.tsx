import { useEffect, useMemo, useState } from "react";
import { Clock3, ExternalLink, Gift, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

type BreakState = {
 session?: { break_number:number; ends_at:string };
 current_item?: { starts_at:string; ends_at:string; duration_seconds:number; content_id:string };
 items?: Array<{sort_order:number;starts_at:string;ends_at:string;duration_seconds:number;content_id:string}>;
};

export function WaterBreakOverlay(){
 const [state,setState]=useState<BreakState|null>(null);
 const [content,setContent]=useState<any>(null);
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{const load=async()=>{const {data}=await supabase.rpc("get_active_water_break");setState(data&&data.session?data:null);if(data?.current_item?.content_id){const {data:c}=await supabase.from("hot_seat_break_content").select("title,description,content_type,media_url,action_url,config").eq("id",data.current_item.content_id).maybeSingle();setContent(c??null);}};void load();const poll=setInterval(load,3000);const tick=setInterval(()=>setNow(Date.now()),1000);return()=>{clearInterval(poll);clearInterval(tick)}},[]);
 const remaining=useMemo(()=>Math.max(0,Math.ceil(((state?.current_item?.ends_at?new Date(state.current_item.ends_at).getTime():0)-now)/1000)),[state,now]);
 if(!state?.session||!state.current_item)return null;
 const mins=Math.floor(remaining/60),secs=remaining%60;
 return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-5 text-white backdrop-blur-md">
   <Card className="w-full max-w-lg overflow-hidden border-white/10 bg-neutral-950 text-white shadow-2xl">
    <CardContent className="p-0">
      {content?.media_url?<div className="aspect-video w-full overflow-hidden bg-black"><img src={content.media_url} alt="" className="h-full w-full object-cover"/></div>:null}
      <div className="space-y-5 p-6 text-center">
       <div className="flex justify-center"><span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300"><PauseCircle className="size-4"/> Water Break {state.session.break_number}</span></div>
       <div><h2 className="text-2xl font-bold">{content?.title??"Water Break"}</h2><p className="mt-2 text-sm text-neutral-400">{content?.description??"Hot Seat is paused while this event runs."}</p></div>
       <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Event ends in</p><p className="mt-2 font-mono text-4xl font-black tabular-nums">{String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}</p></div>
       {content?.content_type==="giveaway"?<Button className="w-full" onClick={()=>window.location.href="/giveaway"}><Gift className="mr-2 size-4"/>Open Giveaway</Button>:content?.action_url?<Button className="w-full" onClick={()=>window.open(content.action_url,"_blank","noopener,noreferrer")}><ExternalLink className="mr-2 size-4"/>Open Event</Button>:null}
      </div>
    </CardContent>
   </Card>
 </div>;
}
