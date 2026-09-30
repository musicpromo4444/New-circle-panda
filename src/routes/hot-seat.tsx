import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Flame, Gift, Heart, MessageCircle, Send, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { HostReel } from "@/components/hotseat/HostReel";
import { QuestionCard } from "@/components/hotseat/QuestionCard";
import { WaterBreakOverlay } from "@/components/break-lounge/WaterBreakOverlay";
import { GiftDrawer, type VirtualGift } from "@/components/hotseat/GiftDrawer";
import { LiveGiveawayModal } from "@/components/hotseat/LiveGiveawayModal";

export const Route = createFileRoute("/hot-seat")({
  head: () => ({ meta: [{ title: "Hot Seat Live — Circle Panda" }] }),
  component: HotSeatPage,
});

type Host = {
  id:string; alias:string; avatar:string; media_url:string|null; media_kind:string;
  started_at:string; ends_at:string; is_active:boolean; stream_provider:string;
  max_hosts:number; topic:string|null; location:string|null; viewer_count:number; answered_count:number;
};
type Question = {
  id:string; host_id:string|null; asker_alias:string; body:string; is_priority:boolean; created_at:string;
  hot_seat_answers:Array<{id:string;question_id:string;kind:"text"|"voice"|"photo"|"video";body:string|null;media_url:string|null;duration_seconds:number|null;created_at:string}>;
};

function HotSeatPage(){
  const navigate=useNavigate(); const {isAdmin}=useStore();
  const [host,setHost]=useState<Host|null>(null),[questions,setQuestions]=useState<Question[]>([]);
  const [chat,setChat]=useState<any[]>([]),[queue,setQueue]=useState<any[]>([]);
  const [question,setQuestion]=useState(""),[chatText,setChatText]=useState(""),[priority,setPriority]=useState(false);
  const [joined,setJoined]=useState(false),[likes,setLikes]=useState(0),[giftOpen,setGiftOpen]=useState(false),[giveawayOpen,setGiveawayOpen]=useState(false);

  const load=async()=>{
    const {data:h}=await supabase.from("hot_seat_hosts").select("*").eq("is_active",true).order("started_at",{ascending:false}).limit(1).maybeSingle();
    setHost((h??null) as Host|null); if(!h)return;
    const [{data:q},{data:c},{data:qq},{count:l}]=await Promise.all([
      supabase.from("hot_seat_questions").select("*,hot_seat_answers(*)").eq("host_id",h.id).order("is_priority",{ascending:false}).order("created_at",{ascending:false}),
      supabase.from("hot_seat_chat").select("id,alias,body,created_at").eq("host_id",h.id).order("created_at",{ascending:false}).limit(40),
      supabase.from("hot_seat_queue").select("user_id,bid_bc,joined_at,updated_at").order("bid_bc",{ascending:false}).order("updated_at",{ascending:true}).limit(20),
      supabase.from("hot_seat_likes").select("user_id",{count:"exact",head:true}).eq("host_id",h.id)
    ]);
    setQuestions((q??[]) as Question[]);setChat(c??[]);setQueue(qq??[]);setLikes(l??0);
    const {data:u}=await supabase.auth.getUser();setJoined(Boolean(u.user&&(qq??[]).some((x:any)=>x.user_id===u.user.id)));
  };
  useEffect(()=>{void load();const t=setInterval(()=>void load(),5000);return()=>clearInterval(t)},[]);

  const ask=async()=>{if(!host||!question.trim())return;const {error}=await supabase.rpc("ask_hot_seat_question_secure",{p_host_id:host.id,p_body:question.trim(),p_priority:priority});if(error){toast.error(error.message);return;}setQuestion("");setPriority(false);toast.success("Question sent anonymously.");void load()};
  const sendChat=async()=>{if(!host||!chatText.trim())return;const {error}=await supabase.rpc("send_hot_seat_chat_secure",{p_host_id:host.id,p_body:chatText.trim()});if(error){toast.error(error.message);return;}setChatText("");void load()};
  const join=async(bid:number)=>{const {error}=await supabase.rpc("join_hot_seat_queue_secure",{p_bid_bc:bid});if(error){toast.error(error.message);return;}setJoined(true);toast.success(bid===25?"Priority boosted.":"Joined Hot Seat queue.");void load()};
  const like=async()=>{if(!host)return;const {data,error}=await supabase.rpc("toggle_hot_seat_like",{p_host_id:host.id});if(error)toast.error(error.message);else setLikes(Number(data?.like_count??likes))};
  const follow=async()=>{
    if(!host)return;
    const {data,error}=await supabase.rpc("toggle_hot_seat_follow_secure",{p_host_id:host.id});
    if(error)toast.error(error.message);else toast.success(data?.following?"Hot Seat followed.":"Hot Seat unfollowed.");
  };
  const gift=async(g:VirtualGift)=>{
    if(!host) throw new Error("Hot Seat session is unavailable.");
    const {error}=await supabase.rpc("send_hot_seat_gift_secure",{p_host_id:host.id,p_gift_id:g.id});
    if(error) throw new Error(error.message);
    void load();
  };

  if(!host)return <main className="grid min-h-screen place-items-center bg-background p-6 text-center"><div><h1 className="text-2xl font-bold">Hot Seat is between sessions.</h1><p className="mt-2 text-sm text-muted-foreground">The next live session will appear automatically.</p><Button className="mt-4" onClick={()=>navigate({to:"/"})}>Back to Circle Panda</Button></div></main>;

  return <main className="min-h-screen bg-background pb-24">
    <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/90 px-3 py-2 backdrop-blur">
      <Button variant="ghost" size="sm" onClick={()=>navigate({to:"/"})}><ArrowLeft className="mr-1 size-4"/>Circle Panda</Button>
      <span className="rounded-full bg-destructive/10 px-2 py-1 text-[10px] font-bold text-destructive">{host.pause_until&&new Date(host.pause_until).getTime()>Date.now()?"PAUSED":"LIVE"} · {host.stream_provider}</span>
    </header>
    <section className="mx-auto max-w-3xl">
      <HostReel host={host}/>
      <div className="space-y-4 p-3">
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">Hot Seat topic</p><h1 className="mt-1 text-lg font-bold">{host.topic||"Ask the host anything anonymously."}</h1><p className="mt-1 text-xs text-muted-foreground">{host.max_hosts} host slot{host.max_hosts===1?"":"s"} · {host.location||"Worldwide"}</p></div><Button size="sm" variant="outline" onClick={follow}>Follow</Button></div>
          <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={like}><Heart className="mr-1 size-4"/>{likes}</Button><Button size="sm" variant="outline" onClick={()=>navigator.share?.({title:"Circle Panda Hot Seat",url:location.href})}><Share2 className="mr-1 size-4"/>Share</Button><Button size="sm" variant="outline" onClick={()=>setGiftOpen(true)}><Gift className="mr-1 size-4"/>Gifts</Button><Button size="sm" variant="outline" onClick={()=>setGiveawayOpen(true)}><Flame className="mr-1 size-4"/>Giveaway</Button></div>
        </div>
        <div className="rounded-2xl border bg-card p-4"><h2 className="font-bold">Waiting room</h2><p className="mt-1 text-xs text-muted-foreground">Your queue position is saved in Circle Panda, so you do not need to remain online.</p><div className="mt-3 space-y-2">{queue.slice(0,5).map((q:any,i)=><div key={q.user_id} className="flex justify-between rounded-xl border p-3 text-xs"><span>#{i+1} · Anonymous Panda</span><b>{q.bid_bc} BC</b></div>)}</div><div className="mt-3 grid grid-cols-2 gap-2"><Button disabled={joined} onClick={()=>join(5)}>{joined?"In Queue":"Join Queue · 5 BC"}</Button><Button variant="outline" onClick={()=>join(25)}>Boost · 25 BC</Button></div></div>
        <div className="rounded-2xl border bg-card p-4"><div className="flex items-center gap-2"><MessageCircle className="size-4 text-primary"/><h2 className="font-bold">Ask anonymously</h2></div><textarea value={question} onChange={e=>setQuestion(e.target.value)} maxLength={280} placeholder="Ask the host anything…" className="mt-3 min-h-20 w-full rounded-xl border bg-background p-3 text-sm"/><div className="mt-2 flex justify-between text-xs"><label><input type="checkbox" checked={priority} onChange={e=>setPriority(e.target.checked)} className="mr-2"/>Priority · 10 BC</label><span>{question.length}/280</span></div><Button className="mt-3 w-full" disabled={!question.trim()} onClick={ask}><Send className="mr-2 size-4"/>Send Question</Button></div>
        <div><h2 className="mb-3 font-bold">Questions</h2>{questions.length?questions.map(q=><QuestionCard key={q.id} question={q}/>):<div className="rounded-xl border p-4 text-sm text-muted-foreground">No questions yet.</div>}</div>
        <div className="rounded-2xl border bg-card p-4"><h2 className="font-bold">Live chat</h2><div className="mt-3 max-h-64 space-y-2 overflow-y-auto">{chat.map(c=><div key={c.id} className="rounded-xl bg-muted/40 p-2 text-xs"><b>{c.alias}</b> {c.body}</div>)}</div><div className="mt-3 flex gap-2"><input value={chatText} onChange={e=>setChatText(e.target.value)} maxLength={120} className="min-w-0 flex-1 rounded-xl border bg-background px-3" placeholder="Say something…"/><Button onClick={sendChat} disabled={!chatText.trim()}><Send className="size-4"/></Button></div></div>
        {isAdmin&&<div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs">Admin Hot Seat controls are in the Admin Dashboard.</div>}
      </div>
    </section>
    <WaterBreakOverlay/>
    <GiftDrawer open={giftOpen} onOpenChange={setGiftOpen} onSendGift={gift}/>
    <LiveGiveawayModal open={giveawayOpen} onOpenChange={setGiveawayOpen} hostName={host.alias}/>
  </main>;
}