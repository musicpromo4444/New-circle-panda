import { useState } from "react";
import { CheckCircle2, ExternalLink, Gift, Mail, MessageCircle, Play, ShieldCheck, Smartphone, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Challenge = {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  type: "survey" | "offer" | "action" | "video";
  url?: string;
};

const defaultChallenges: Challenge[] = [
  { id: "survey", title: "Complete a short survey", description: "Answer the sponsor's questions to complete this challenge.", buttonText: "Start survey", type: "survey" },
  { id: "offer", title: "Complete an offer", description: "Open the sponsor offer and complete the required action.", buttonText: "Complete offer", type: "offer" },
  { id: "action", title: "Complete the sponsor action", description: "Follow the instructions and finish the required action.", buttonText: "Start challenge", type: "action" },
  { id: "video", title: "Watch a video ad", description: "Watch the full rewarded video to qualify for this giveaway.", buttonText: "Watch video", type: "video" },
];

export function GiveawayExperience() {
  const [stage, setStage] = useState<"questions" | "contact" | "ready" | "challenges" | "qualified">("questions");
  const [contact, setContact] = useState("whatsapp");
  const [contactValue, setContactValue] = useState("");
  const [answers, setAnswers] = useState(["", "", ""]);
  const [completed, setCompleted] = useState<string[]>([]);

  const finishQuestionnaire = () => setStage("contact");
  const saveContact = () => { if (contactValue.trim()) setStage("ready"); };
  const startChallenges = () => setStage("challenges");
  const complete = (c: Challenge) => {
    if (c.type === "video") {
      setCompleted((x) => x.includes(c.id) ? x : [...x, c.id]);
      return;
    }
    if (c.url) window.open(c.url, "_blank", "noopener,noreferrer");
    setCompleted((x) => x.includes(c.id) ? x : [...x, c.id]);
  };

  if (stage === "questions") return (
    <Card><CardHeader><CardTitle>Giveaway qualification</CardTitle><p className="text-sm text-muted-foreground">Answer these quick questions before continuing.</p></CardHeader>
      <CardContent className="space-y-4">
        {["Are you 18 or older?", "Are you ready to complete the giveaway challenge?", "Can we contact you if you win?"].map((q, i) => (
          <div key={q} className="space-y-2"><p className="text-sm font-medium">{q}</p>
            <div className="flex gap-2">{["Yes", "No"].map(a => <Button key={a} type="button" variant={answers[i] === a ? "default" : "outline"} onClick={() => setAnswers(v => v.map((x,j) => j===i?a:x))}>{a}</Button>)}</div>
          </div>
        ))}
        <Button className="w-full" disabled={answers.some(x => !x)} onClick={finishQuestionnaire}>Continue</Button>
      </CardContent>
    </Card>
  );

  if (stage === "contact") return (
    <Card><CardHeader><CardTitle>How should we reach you?</CardTitle><p className="text-sm text-muted-foreground">Your selected contact is used only for giveaway communication.</p></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">{[["whatsapp","WhatsApp",MessageCircle],["sms","Text",Smartphone],["email","Email",Mail]].map(([id,label,Icon]) => <Button key={id as string} variant={contact===id ? "default" : "outline"} onClick={() => setContact(id as string)}><Icon className="mr-2 h-4 w-4"/>{label as string}</Button>)}</div>
        <Input value={contactValue} onChange={e=>setContactValue(e.target.value)} placeholder={contact==="email" ? "Enter email address" : "Enter phone/WhatsApp number"} />
        <Button className="w-full" disabled={!contactValue.trim()} onClick={saveContact}>Save contact & continue</Button>
      </CardContent>
    </Card>
  );

  if (stage === "ready") return (
    <Card><CardContent className="space-y-5 p-6 text-center"><Gift className="mx-auto h-10 w-10"/><h2 className="text-xl font-bold">Ready for the Giveaway Challenge?</h2><p className="text-sm text-muted-foreground">Complete the required challenges. The final challenge is always the video ad.</p><Button className="w-full" onClick={startChallenges}>Yes, start challenge</Button></CardContent></Card>
  );

  if (stage === "challenges") return (
    <Card><CardHeader><CardTitle>Giveaway Challenge</CardTitle><p className="text-sm text-muted-foreground">Complete all four challenges to qualify.</p></CardHeader>
      <CardContent className="space-y-3">{defaultChallenges.map((c,i) => { const done=completed.includes(c.id); return <div key={c.id} className="rounded-xl border p-4">
        <div className="flex items-start gap-3"><div className="mt-0.5 rounded-full border p-2 text-xs font-bold">{i+1}</div><div className="min-w-0 flex-1"><p className="font-semibold">{c.title}</p><p className="mt-1 text-xs text-muted-foreground">{c.description}</p><Button className="mt-3" size="sm" disabled={done} onClick={()=>complete(c)}>{done ? <><CheckCircle2 className="mr-2 h-4 w-4"/>Completed</> : <>{c.type==="video" ? <Play className="mr-2 h-4 w-4"/> : <ExternalLink className="mr-2 h-4 w-4"/>}{c.buttonText}</>}</Button></div></div>
      </div>})}
      <Button className="w-full" disabled={completed.length !== 4} onClick={()=>setStage("qualified")}>Finish & qualify</Button></CardContent>
    </Card>
  );

  return <Card><CardContent className="p-7 text-center space-y-4"><Trophy className="mx-auto h-12 w-12"/><h2 className="text-2xl font-bold">You're qualified!</h2><p className="text-sm text-muted-foreground">Your giveaway entry is now recorded with your chosen contact method.</p><Badge><ShieldCheck className="mr-1 h-3 w-3"/> Qualified entry</Badge></CardContent></Card>;
}

export function BreakLoungeAdmin() {
  const [selected, setSelected] = useState<Record<number,string[]>>({1:["giveaway","music"],2:["investment"],3:["giveaway","poll","video"]});
  const events = [
    ["giveaway","Giveaway"],
    ["investment","Investment Game"],
    ["music","Music Event"],
    ["movie","Movie / Comedy"],
    ["poll","Poll"],
    ["video","Sponsor Video"],
  ];
  const toggle=(breakNo:number,id:string)=>setSelected(s=>({...s,[breakNo]:(s[breakNo]||[]).includes(id)?s[breakNo].filter(x=>x!==id):[...(s[breakNo]||[]),id]}));
  return <main className="min-h-screen bg-background px-4 py-6 text-foreground"><div className="mx-auto max-w-4xl space-y-5">
    <header><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin Dashboard</p><h1 className="text-2xl font-bold">Water Break Events</h1><p className="text-sm text-muted-foreground">Choose exactly which events appear during each water break.</p></header>
    {[1,2,3].map(n=><Card key={n}><CardHeader><CardTitle className="text-lg">Water Break {n}</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{events.map(([id,label])=><label key={id} className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer"><Checkbox checked={(selected[n]||[]).includes(id)} onCheckedChange={()=>toggle(n,id)}/><span>{label}</span></label>)}<div className="sm:col-span-2"><Button>Save Water Break {n}</Button></div></CardContent></Card>)}
    <Card><CardHeader><CardTitle>Giveaway Challenge Content</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">The four challenge slots are editable in the giveaway configuration. Slot 4 is permanently reserved for the rewarded video qualification step.</p></CardContent></Card>
  </div></main>
}

export function Giveaway() {
  return <main className="min-h-screen bg-background px-4 py-6 text-foreground"><div className="mx-auto max-w-3xl space-y-5"><header><Badge variant="secondary">Water Break Giveaway</Badge><h1 className="mt-2 text-2xl font-bold">Complete the challenge to qualify</h1></header><GiveawayExperience/></div></main>
}
