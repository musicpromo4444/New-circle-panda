import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Gift, Mail, MessageCircle, Play, Save, ShieldCheck, Smartphone, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";

type Challenge = {
  id:string; title:string; description:string; buttonText:string;
  type:"survey"|"offer"|"action"|"video"; url:string; enabled:boolean;
  verification_mode?: "postback"|"video"; min_seconds?: number; postback_secret?: string;
};
const defaults:Challenge[]=[
 {id:"challenge-1",title:"Complete a short survey",description:"Answer the sponsor's questions to complete this challenge.",buttonText:"Start survey",type:"survey",url:"",enabled:true,verification_mode:"postback"},
 {id:"challenge-2",title:"Complete an offer",description:"Complete the sponsor offer to continue.",buttonText:"Complete offer",type:"offer",url:"",enabled:true,verification_mode:"postback"},
 {id:"challenge-3",title:"Complete the sponsor action",description:"Follow the sponsor instructions and finish the required action.",buttonText:"Start challenge",type:"action",url:"",enabled:true,verification_mode:"postback"},
 {id:"challenge-4",title:"Watch a video ad",description:"Watch the full rewarded video to qualify for this giveaway.",buttonText:"Watch video",type:"video",url:"",enabled:true,verification_mode:"video",min_seconds:15},
];

export function GiveawayExperience({challenges}:{challenges:Challenge[]}) {
 const [stage,setStage]=useState<"loading"|"questions"|"contact"|"ready"|"challenges"|"qualified">("loading");
 const [entryId,setEntryId]=useState<string|null>(null);
 const [contact,setContact]=useState("whatsapp");
 const [contactValue,setContactValue]=useState("");
 const [answers,setAnswers]=useState(["","",""]);
 const [progress,setProgress]=useState<Record<string,string>>({});
 const [activeVideo,setActiveVideo]=useState<string|null>(null);
 const [videoLeft,setVideoLeft]=useState(0);
 const [error,setError]=useState("");

 useEffect(()=>{ (async()=>{ const {data,error}=await supabase.rpc("get_active_giveaway_config"); if(error||!data?.draw){setError(error?.message??"Giveaway is not active.");return;} setStage("questions"); })(); },[]);

 useEffect(()=>{
   if(!entryId) return;
   const timer=setInterval(async()=>{ const {data}=await supabase.rpc("get_giveaway_entry_state",{p_entry_id:entryId}); const rows=data?.progress??[]; const next:Record<string,string>={}; for(const r of rows) next[r.challenge_id]=r.status; setProgress(next); if(data?.entry?.qualified) setStage("qualified"); },3000);
   return ()=>clearInterval(timer);
 },[entryId]);

 useEffect(()=>{
   if(!activeVideo||videoLeft<=0)return;
   const t=setTimeout(()=>setVideoLeft(v=>v-1),1000); return()=>clearTimeout(t);
 },[activeVideo,videoLeft]);

 const enabled=useMemo(()=>challenges.filter(c=>c.enabled),[challenges]);
 const startEntry=async()=>{
   setError("");
   const {data,error}=await supabase.rpc("start_giveaway_entry",{p_draw:"water-break-giveaway",p_contact_method:contact,p_contact_value:contactValue,p_answers:{age:answers[0],ready:answers[1],contactable:answers[2]}});
   if(error){setError(error.message);return;}
   setEntryId(data.entry_id); setStage("ready");
 };
 const startChallenge=async(c:Challenge,slot:number)=>{
   if(!entryId)return;
   setError("");
   const {error}=await supabase.rpc("start_giveaway_challenge",{p_entry_id:entryId,p_challenge_id:c.id,p_slot:slot});
   if(error){setError(error.message);return;}
   if(c.type==="video"){
     setActiveVideo(c.id); setVideoLeft(Math.max(5,c.min_seconds??15)); return;
   }
   if(c.url) window.open(c.url,"_blank","noopener,noreferrer");
 };
 const finishVideo=async(c:Challenge)=>{
   if(!entryId)return;
   const {data,error}=await supabase.rpc("complete_giveaway_video_challenge",{p_entry_id:entryId,p_challenge_id:c.id,p_min_seconds:c.min_seconds??15});
   if(error){setError(error.message);return;}
   setProgress(p=>({...p,[c.id]:"verified"})); setActiveVideo(null); setVideoLeft(0);
   if(data?.qualified)setStage("qualified");
 };
 if(stage==="loading") return <Card><CardContent className="p-7 text-center">Loading giveaway…</CardContent></Card>;
 if(error&&!entryId) return <Card><CardContent className="space-y-4 p-7 text-center"><h2 className="text-xl font-bold">Giveaway unavailable</h2><p className="text-sm text-muted-foreground">{error}</p></CardContent></Card>;
 if(stage==="questions") return <Card><CardHeader><CardTitle>Giveaway qualification</CardTitle><p className="text-sm text-muted-foreground">Answer these quick questions before continuing.</p></CardHeader><CardContent className="space-y-4">{["Are you 18 or older?","Are you ready to complete the giveaway challenge?","Can we contact you if you win?"].map((q,i)=><div key={q} className="space-y-2"><p className="text-sm font-medium">{q}</p><div className="flex gap-2">{["Yes","No"].map(a=><Button key={a} variant={answers[i]===a?"default":"outline"} onClick={()=>setAnswers(v=>v.map((x,j)=>j===i?a:x))}>{a}</Button>)}</div></div>)}<Button className="w-full" disabled={answers.some(x=>!x)||answers[0]==="No"} onClick={()=>setStage("contact")}>Continue</Button></CardContent></Card>;
 if(stage==="contact") return <Card><CardHeader><CardTitle>How do we reach you?</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-3 gap-2">{[["whatsapp","WhatsApp",MessageCircle],["sms","Text",Smartphone],["email","Email",Mail]].map(([id,label,Icon])=><Button key={id as string} variant={contact===id?"default":"outline"} onClick={()=>setContact(id as string)}><Icon className="mr-2 h-4 w-4"/>{label as string}</Button>)}</div><Input value={contactValue} onChange={e=>setContactValue(e.target.value)} placeholder={contact==="email"?"Enter email address":"Enter phone/WhatsApp number"}/><Button className="w-full" disabled={!contactValue.trim()} onClick={startEntry}>Save contact & continue</Button>{error&&<p className="text-sm text-destructive">{error}</p>}</CardContent></Card>;
 if(stage==="ready") return <Card><CardContent className="space-y-5 p-6 text-center"><Gift className="mx-auto h-10 w-10"/><h2 className="text-xl font-bold">Ready for the Giveaway Challenge?</h2><p className="text-sm text-muted-foreground">Complete every challenge. The final challenge is always the video ad.</p><Button className="w-full" onClick={()=>setStage("challenges")}>Yes, start challenge</Button></CardContent></Card>;
 if(stage==="challenges") return <Card><CardHeader><CardTitle>Giveaway Challenge</CardTitle><p className="text-sm text-muted-foreground">Every challenge must be verified before you qualify.</p></CardHeader><CardContent className="space-y-3">{enabled.map((c,i)=>{const status=progress[c.id];const done=status==="completed"||status==="verified";return <div key={c.id} className="rounded-xl border p-4"><div className="flex gap-3"><div className="rounded-full border px-2 py-1 text-xs font-bold">{i+1}</div><div className="flex-1"><p className="font-semibold">{c.title}</p><p className="mt-1 text-xs text-muted-foreground">{c.description}</p>{activeVideo===c.id?<div className="mt-3 space-y-2"><p className="text-sm font-medium">Video requirement: {videoLeft}s remaining</p><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{width:`${Math.max(0,100-(videoLeft/Math.max(1,c.min_seconds??15))*100)}%`}}/></div><Button size="sm" disabled={videoLeft>0} onClick={()=>finishVideo(c)}>{videoLeft>0?"Watch video…":"Verify video"}</Button></div>:<Button className="mt-3" size="sm" disabled={done||!!activeVideo} onClick={()=>startChallenge(c,i+1)}>{done?<><CheckCircle2 className="mr-2 h-4 w-4"/>Verified</>:c.type==="video"?<><Play className="mr-2 h-4 w-4"/>{c.buttonText}</>:<><ExternalLink className="mr-2 h-4 w-4"/>{c.buttonText}</>}</Button>}{c.verification_mode==="postback"&&!done&&<p className="mt-2 text-[11px] text-muted-foreground">Complete the sponsor action. Qualification updates automatically when the sponsor verifies it.</p>}</div></div></div>})}<Button className="w-full" disabled={enabled.some(c=>!["completed","verified"].includes(progress[c.id]??""))} onClick={()=>setStage("qualified")}>Finish & qualify</Button>{error&&<p className="text-sm text-destructive">{error}</p>}</CardContent></Card>;
 return <Card><CardContent className="space-y-4 p-7 text-center"><Trophy className="mx-auto h-12 w-12"/><h2 className="text-2xl font-bold">You're qualified!</h2><p className="text-sm text-muted-foreground">Your verified giveaway qualification is saved.</p><Badge><ShieldCheck className="mr-1 h-3 w-3"/> Qualified entry</Badge></CardContent></Card>;
}

export function BreakLoungeAdmin(){
 const [selected,setSelected]=useState<Record<number,string[]>>({});
 const [challenges,setChallenges]=useState(defaults);
 const [status,setStatus]=useState("Loading…"); const [saving,setSaving]=useState(false);
 const events=[["giveaway","Giveaway"],["investment","Investment Game"],["music","Music Event"],["movie","Movie / Comedy"],["poll","Poll"],["video","Sponsor Video"]];
 useEffect(()=>{(async()=>{const {data,error}=await supabase.rpc("get_water_break_admin_config");if(error){setStatus(error.message);return;}const grouped:Record<number,string[]>={};for(const row of (data?.events??[])){if(row.enabled)(grouped[row.water_break_number]??=[]).push(row.content_type);}setSelected(grouped);const saved=data?.giveaway?.qualification_config?.challenges;if(Array.isArray(saved))setChallenges(saved.map((x:any,i:number)=>({...defaults[i],...x,type:i===3?"video":x.type,enabled:i===3?true:Boolean(x.enabled),verification_mode:i===3?"video":(x.verification_mode??"postback")})));setStatus("Saved settings loaded.");})();},[]);
 const toggle=(n:number,id:string)=>setSelected(s=>({...s,[n]:(s[n]||[]).includes(id)?s[n].filter(x=>x!==id):[...(s[n]||[]),id]}));
 const edit=(id:string,key:keyof Challenge,value:string|boolean|number)=>setChallenges(cs=>cs.map(c=>c.id===id?{...c,[key]:value}:c));
 const save=async()=>{setSaving(true);setStatus("Saving…");const breaks=[1,2,3].map(n=>(selected[n]||[]).map((id,idx)=>({content_type:id,title:events.find(e=>e[0]===id)?.[1]??id,sort_order:idx,duration_minutes:60,allocation_mode:"equal",config:{}})));const payload={breaks,giveaway:{qualification_config:{challenges}}};const {error}=await supabase.rpc("save_water_break_admin_config",{p_payload:payload});setSaving(false);setStatus(error?error.message:"Saved successfully.");};
 return <main className="min-h-screen bg-background px-4 py-6 text-foreground"><div className="mx-auto max-w-5xl space-y-5"><header><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin Dashboard</p><h1 className="text-2xl font-bold">Water Break</h1><Badge variant="secondary">{status}</Badge></header>
 {[1,2,3].map(n=><Card key={n}><CardHeader><CardTitle>Water Break {n}</CardTitle><p className="text-sm text-muted-foreground">Choose one or more items. The scheduler will divide the break time automatically.</p></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{events.map(([id,label])=><label key={id} className="flex cursor-pointer items-center gap-3 rounded-xl border p-3"><Checkbox checked={(selected[n]||[]).includes(id)} onCheckedChange={()=>toggle(n,id)}/><span>{label}</span></label>)}<Button className="sm:col-span-2" disabled={saving} onClick={save}><Save className="mr-2 h-4 w-4"/>Save Water Break {n}</Button></CardContent></Card>)}
 <Card><CardHeader><CardTitle>Giveaway Challenge Builder</CardTitle><p className="text-sm text-muted-foreground">Challenges 1–3 use sponsor verification. Challenge 4 is always the final video.</p></CardHeader><CardContent className="space-y-5">{challenges.map((c,i)=><div key={c.id} className="space-y-3 rounded-xl border p-4"><div className="flex items-center justify-between"><p className="font-semibold">Challenge {i+1}{i===3?" • Always video ad":""}</p><Checkbox checked={c.enabled} disabled={i===3} onCheckedChange={v=>edit(c.id,"enabled",Boolean(v))}/></div><Input value={c.title} onChange={e=>edit(c.id,"title",e.target.value)} placeholder="Title"/><Textarea value={c.description} onChange={e=>edit(c.id,"description",e.target.value)} placeholder="Description"/><Input value={c.buttonText} onChange={e=>edit(c.id,"buttonText",e.target.value)} placeholder="Button text"/>{i<3&&<><Input value={c.type} onChange={e=>edit(c.id,"type",e.target.value as Challenge["type"])} placeholder="survey / offer / action"/><Input value={c.url} onChange={e=>edit(c.id,"url",e.target.value)} placeholder="Sponsor action URL"/><Input value={c.postback_secret??""} onChange={e=>edit(c.id,"postback_secret",e.target.value)} placeholder="Provider postback secret (enter when ready)"/><p className="text-xs text-muted-foreground">The sponsor must call the giveaway postback endpoint after the action is verified.</p></>}{i===3&&<><Input type="number" min={5} value={c.min_seconds??15} onChange={e=>edit(c.id,"min_seconds",Number(e.target.value)||15)} placeholder="Minimum video seconds"/><p className="text-xs text-muted-foreground">The final challenge cannot be skipped; the server verifies the minimum watch time.</p></>}</div>)}<Button className="w-full" disabled={saving} onClick={save}><Save className="mr-2 h-4 w-4"/>{saving?"Saving…":"Save Giveaway Configuration"}</Button></CardContent></Card></div></main>;
}
export function Giveaway(){const [challenges,setChallenges]=useState<Challenge[]>(defaults);useEffect(()=>{(async()=>{const {data}=await supabase.rpc("get_active_giveaway_config");const saved=data?.qualification_config?.challenges;if(Array.isArray(saved))setChallenges(saved.map((x:any,i:number)=>({...defaults[i],...x,type:i===3?"video":x.type,enabled:i===3?true:Boolean(x.enabled)})));})();},[]);return <main className="min-h-screen bg-background px-4 py-6 text-foreground"><div className="mx-auto max-w-3xl space-y-5"><header><Badge variant="secondary">Water Break Giveaway</Badge><h1 className="mt-2 text-2xl font-bold">Complete the challenge to qualify</h1></header><GiveawayExperience challenges={challenges}/></div></main>;}
