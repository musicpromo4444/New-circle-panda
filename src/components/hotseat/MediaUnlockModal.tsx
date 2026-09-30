import { useEffect, useState } from "react";
import { Coins, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type Ad={id:string;duration_seconds:number;video_url:string|null;poster_url:string|null;sponsor:string;headline:string};

export function MediaUnlockModal({open,onOpenChange,onUnlocked,answerId}:{open:boolean;onOpenChange:(o:boolean)=>void;onUnlocked:()=>void;answerId:string|null}) {
 const [balance,setBalance]=useState<number|null>(null),[ad,setAd]=useState<Ad|null>(null),[sessionId,setSessionId]=useState<string|null>(null),[watching,setWatching]=useState(false),[left,setLeft]=useState(0),[loading,setLoading]=useState(false);
 const load=async()=>{if(!answerId)return;setLoading(true);const [{data:u},{data:a}]=await Promise.all([supabase.auth.getUser(),supabase.from("ad_creatives").select("id,duration_seconds,video_url,poster_url,sponsor,headline").eq("status","active").eq("format","video").order("updated_at",{ascending:false}).limit(1).maybeSingle()]);if(u.user){const {data:b}=await supabase.from("bc_accounts").select("balance").eq("user_id",u.user.id).maybeSingle();setBalance(b?.balance==null?null:Number(b.balance));}else setBalance(null);setAd(a??null);setLoading(false);};
 useEffect(()=>{if(open)void load();},[open,answerId]);
 useEffect(()=>{if(!watching||!sessionId)return;const t=setTimeout(async()=>{const next=Math.max(0,left-1);setLeft(next);if(next<=0){setWatching(false);const {error}=await supabase.rpc("complete_rewarded_ad_session",{p_session_id:sessionId});setSessionId(null);if(error){toast.error(error.message);return;}onUnlocked();onOpenChange(false);toast.success("Sponsored ad completed — media unlocked.");}},1000);return()=>clearTimeout(t)},[watching,left,sessionId,onUnlocked,onOpenChange]);
 const startAd=async()=>{if(!ad)return;const {data,error}=await supabase.rpc("start_rewarded_ad_session",{p_ad_id:ad.id,p_surface:"hot_seat_media"});if(error){toast.error(error.message);return;}const id=data?.session_id??data?.id;if(!id){toast.error("Sponsored ad session could not start.");return;}setSessionId(id);setLeft(Math.max(1,Number(ad.duration_seconds)||8));setWatching(true);};
 const pay=async()=>{if(!answerId)return;const {error}=await supabase.rpc("unlock_hot_seat_media_secure",{p_answer_id:answerId});if(error){toast.error(error.message);return;}onUnlocked();onOpenChange(false);toast.success("10 BC charged — media unlocked.");};
 return <Dialog open={open} onOpenChange={o=>!watching&&onOpenChange(o)}><DialogContent className="max-w-sm">
  <DialogTitle className="font-display text-xl">Unlock View-Once Media</DialogTitle><DialogDescription>Choose a verified sponsored ad or pay 10 BC. Unlocking is recorded on the server.</DialogDescription>
  {watching?<div className="space-y-3"><div className="relative grid h-40 place-items-center overflow-hidden rounded-xl bg-black">{ad?.video_url?<video src={ad.video_url} poster={ad.poster_url??undefined} autoPlay muted playsInline className="size-full object-cover"/>:<span className="text-4xl">🎬</span>}<span className="absolute bottom-2 rounded-full bg-black/70 px-3 py-1 text-xs text-white">{ad?.sponsor??"Sponsored"} · {left}s</span></div></div>:<div className="space-y-2">
   <Button className="h-12 w-full justify-start gap-2" onClick={startAd} disabled={loading||!ad}><Play className="size-4 fill-current"/>{ad?String.raw\`Watch \${ad.sponsor} ad to view free\`:"No sponsored ad available right now"}</Button>
   <Button variant="secondary" className="h-12 w-full justify-start gap-2 border border-[var(--coin)]/40 text-[var(--coin)]" onClick={pay} disabled={loading||balance==null||balance<10}><Coins className="size-4"/>Unlock instantly for 10 BC</Button>
   {balance!=null&&balance<10?<p className="text-center text-xs text-muted-foreground">You have {balance} BC. Use Circle Panda rewards to top up.</p>:null}
  </div>}
  {loading?<p className="text-center text-xs text-muted-foreground"><Loader2 className="mr-1 inline size-3 animate-spin"/>Checking available unlocks…</p>:null}
 </DialogContent></Dialog>;
}
