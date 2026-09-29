import { useState } from "react";
import { CheckCircle2, ExternalLink, Gift, Mail, MessageCircle, Play, Save, ShieldCheck, Smartphone, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";

type Challenge = { id:string; title:string; description:string; buttonText:string; type:"survey"|"offer"|"action"|"video"; url:string; enabled:boolean };
const initialChallenges:Challenge[]=[
{id:"challenge-1",title:"Complete a short survey",description:"Answer the sponsor's questions to complete this challenge.",buttonText:"Start survey",type:"survey",url:"",enabled:true},
{id:"challenge-2",title:"Complete an offer",description:"Complete the sponsor offer to continue.",buttonText:"Complete offer",type:"offer",url:"",enabled:true},
{id:"challenge-3",title:"Complete the sponsor action",description:"Follow the sponsor instructions and finish the required action.",buttonText:"Start challenge",type:"action",url:"",enabled:true},
{id:"challenge-4",title:"Watch a video ad",description:"Watch the full rewarded video to qualify for this giveaway.",buttonText:"Watch video",type:"video",url:"",enabled:true},
];

function GiveawayExperience({challenges}:{challenges:Challenge[]}) {
 const [stage,setStage]=useState<"questions"|"contact"|"ready"|"challenges"|"qualified">("questions");
 const [contact,setContact]=useState("whatsapp"); const [contactValue,setContactValue]=useState(""); const [answers,setAnswers]=useState(["","",""]); const [completed,setCompleted]=useState<string[]>([]);
 const complete=(c:Challenge)=>{if(c.url) window.open(c.url,"_blank","noopener,noreferrer"); if(!completed.includes(c.id)) setCompleted(x=>[...x,c.id]);};
 if(stage==="questions") return <Card><CardHeader><CardTitle>Giveaway qualification</CardTitle><p className="text-sm text-muted-foreground">Answer these quick questions before continuing.</p></CardHeader><CardContent className="space-y-4">{["Are you 18 or older?","Are you ready to complete the giveaway challenge?","Can we contact you if you win?"].map((q,i)=><div key={q} className="space-y-2"><p className="text-sm font-medium">{q}</p><div className="flex gap-2">{["Yes","No"].map(a=><Button key={a} variant={answers[i]===a?"default":"outline"} onClick={()=>setAnswers(v=>v.map((x,j)=>j===i?a:x))}>{a}</Button>)}</div></div>)}<Button className="w-full" disabled={answers.some(x=>!x)||answers[0]==="No"} onClick={()=>setStage("contact")}>Continue</Button></CardContent></Card>;
 if(stage==="contact") return <Card><CardHeader><CardTitle>How should we reach you?</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-3 gap-2">{[["whatsapp","WhatsApp",MessageCircle],["sms","Text",Smartphone],["email","Email",Mail]].map(([id,label,Icon])=><Button key={id as string} variant={contact===id?"default":"outline"} onClick={()=>setContact(id as string)}><Icon className="mr-2 h-4 w-4"/>{label as string}</Button>)}</div><Input value={contactValue} onChange={e=>setContactValue(e.target.value)} placeholder={contact==="email"?"Enter email address":"Enter phone/WhatsApp number"}/><Button className="w-full" disabled={!contactValue.trim()} onClick={()=>setStage("ready")}>Save contact & continue</Button></CardContent></Card>;
 if(stage==="ready") return <Card><CardContent className="space-y-5 p-6 text-center"><Gift className="mx-auto h-10 w-10"/><h2 className="text-xl font-bold">Ready for the Giveaway Challenge?</h2><p className="text-sm text-muted-foreground">Complete the four required challenges. The final challenge is always the video ad.</p><Button className="w-full" onClick={()=>setStage("challenges")}>Yes, start challenge</Button></CardContent></Card>;
 if(stage==="challenges") return <Card><CardHeader><CardTitle>Giveaway Challenge</CardTitle><p className="text-sm text-muted-foreground">Complete every challenge to qualify.</p></CardHeader><CardContent className="space-y-3">{challenges.map((c,i)=>{const done=completed.includes(c.id);return <div key={c.id} className="rounded-xl border p-4"><div className="flex gap-3"><div className="rounded-full border px-2 py-1 text-xs font-bold">{i+1}</div><div className="flex-1"><p className="font-semibold">{c.title}</p><p className="mt-1 text-xs text-muted-foreground">{c.description}</p><Button className="mt-3" size="sm" disabled={done||!c.enabled} onClick={()=>complete(c)}>{done?<><CheckCircle2 className="mr-2 h-4 w-4"/>Completed</>:c.type==="video"?<><Play className="mr-2 h-4 w-4"/>{c.buttonText}</>:<><ExternalLink className="mr-2 h-4 w-4"/>{c.buttonText}</>}</Button></div></div></div>})}<Button className="w-full" disabled={completed.length!==challenges.filter(c=>c.enabled).length} onClick={()=>setStage("qualified")}>Finish & qualify</Button></CardContent></Card>;
 return <Card><CardContent className="space-y-4 p-7 text-center"><Trophy className="mx-auto h-12 w-12"/><h2 className="text-2xl font-bold">You're qualified!</h2><p className="text-sm text-muted-foreground">Your giveaway qualification has been completed.</p><Badge><ShieldCheck className="mr-1 h-3 w-3"/> Qualified entry</Badge></CardContent></Card>;
}

export function BreakLoungeAdmin(){
 const [selected,setSelected]=useState<Record<number,string[]>>({});
 const [challenges,setChallenges]=useState(initialChallenges);
 const [status,setStatus]=useState("Loading saved settings…");
 const [saving,setSaving]=useState(false);
 const events=[["giveaway","Giveaway"],["investment","Investment Game"],["music","Music Event"],["movie","Movie / Comedy"],["poll","Poll"],["video","Sponsor Video"]];

 const load=async()=>{
   setStatus("Loading saved settings…");
   const {data,error}=await supabase.rpc("get_water_break_admin_config");
   if(error){setStatus(error.message);return;}
   const rows=(data?.events ?? []) as Array<{water_break_number:number;content_type:string;enabled:boolean;sort_order:number;title:string;description:string|null;media_url:string|null;action_url:string|null;config:Record<string,unknown>}>;
   const grouped:Record<number,string[]>={};
   for(const row of rows) if(row.enabled) (grouped[row.water_break_number]??=[]).push(row.content_type);
   setSelected(grouped);
   const saved=data?.giveaway?.qualification_config?.challenges;
   if(Array.isArray(saved)){
     setChallenges(saved.map((x:any,i:number)=>({
       id:String(x.id??`challenge-${i+1}`),
       title:String(x.title??initialChallenges[i].title),
       description:String(x.description??""),
       buttonText:String(x.buttonText??initialChallenges[i].buttonText),
       type:(i===3?"video":(x.type??initialChallenges[i].type)) as Challenge["type"],
       url:String(x.url??""),
       enabled:i===3?true:Boolean(x.enabled)
     })));
   }
   setStatus("Saved settings loaded.");
 };
 useEffect(()=>{void load();},[]);

 const toggle=(n:number,id:string)=>setSelected(s=>({...s,[n]:(s[n]||[]).includes(id)?s[n].filter(x=>x!==id):[...(s[n]||[]),id]}));
 const edit=(id:string,key:keyof Challenge,value:string|boolean)=>setChallenges(cs=>cs.map(c=>c.id===id?{...c,[key]:value}:c));

 const save=async()=>{
   setSaving(true); setStatus("Saving…");
   const eventsPayload=Object.entries(selected).flatMap(([n,ids])=>ids.map((id,sort_order)=>({
     water_break_number:Number(n), content_type:id, title:events.find(e=>e[0]===id)?.[1]??id,
     description:"", media_url:"", action_url:"", enabled:true, sort_order, config:{}
   })));
   const payload={
     events:eventsPayload,
     giveaway:{
       prize_name:"Water Break Giveaway",
       prize_description:"Complete all qualification challenges to enter.",
       is_active:true, winner_mode:"random", qualification_enabled:true, water_break_number:1,
       qualification_config:{challenges}
     }
   };
   const {error}=await supabase.rpc("save_water_break_admin_config",{payload});
   setSaving(false);
   setStatus(error?error.message:"Saved successfully.");
 };
 return <main className="min-h-screen bg-background px-4 py-6 text-foreground"><div className="mx-auto max-w-5xl space-y-5">
 <header><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin Dashboard</p><h1 className="text-2xl font-bold">Water Break</h1><p className="text-sm text-muted-foreground">Choose events for each break and control the giveaway challenge text.</p><Badge variant="secondary">{status}</Badge></header>
 {[1,2,3].map(n=><Card key={n}><CardHeader><CardTitle>Water Break {n}</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{events.map(([id,label])=><label key={id} className="flex cursor-pointer items-center gap-3 rounded-xl border p-3"><Checkbox checked={(selected[n]||[]).includes(id)} onCheckedChange={()=>toggle(n,id)}/><span>{label}</span></label>)}<Button className="sm:col-span-2" disabled={saving} onClick={save}><Save className="mr-2 h-4 w-4"/>Save Water Break {n}</Button></CardContent></Card>)}
 <Card><CardHeader><CardTitle>Giveaway Challenge Builder</CardTitle><p className="text-sm text-muted-foreground">Whatever you enter here is what users will see. Challenge 4 is always the final video ad.</p></CardHeader><CardContent className="space-y-5">{challenges.map((c,i)=><div key={c.id} className="space-y-3 rounded-xl border p-4"><div className="flex items-center justify-between"><p className="font-semibold">Challenge {i+1}{i===3?" • Always video ad":""}</p><Checkbox checked={c.enabled} disabled={i===3} onCheckedChange={v=>edit(c.id,"enabled",Boolean(v))}/></div><Input value={c.title} onChange={e=>edit(c.id,"title",e.target.value)} placeholder="Title"/><Textarea value={c.description} onChange={e=>edit(c.id,"description",e.target.value)} placeholder="Description"/><Input value={c.buttonText} onChange={e=>edit(c.id,"buttonText",e.target.value)} placeholder="Button text"/>{i<3&&<><Input value={c.type} onChange={e=>edit(c.id,"type",e.target.value as Challenge["type"])} placeholder="survey / offer / action"/><Input value={c.url} onChange={e=>edit(c.id,"url",e.target.value)} placeholder="Action link (optional)"/></>}{i===3&&<p className="text-xs text-muted-foreground">The final button is reserved for the rewarded video qualification step.</p>}</div>)}<Button className="w-full" disabled={saving} onClick={save}><Save className="mr-2 h-4 w-4"/>{saving?"Saving…":"Save Giveaway Configuration"}</Button></CardContent></Card>
 </div></main>;
}
export function Giveaway(){const [challenges]=useState(initialChallenges);return <main className="min-h-screen bg-background px-4 py-6 text-foreground"><div className="mx-auto max-w-3xl space-y-5"><header><Badge variant="secondary">Water Break Giveaway</Badge><h1 className="mt-2 text-2xl font-bold">Complete the challenge to qualify</h1></header><GiveawayExperience challenges={challenges}/></div></main>;}
