import { useEffect, useState } from "react";
import { Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

export type VirtualGift = { id:string; name:string; emoji:string; cost:number; effect:string };
export const VIRTUAL_GIFTS: VirtualGift[] = [
  { id:"bamboo", name:"Fresh Bamboo", emoji:"🎋", cost:5, effect:"Crispy crunch" },
  { id:"matcha", name:"Matcha Latte", emoji:"🍵", cost:15, effect:"Warm cozy vibes" },
  { id:"torch", name:"Fire Torch", emoji:"🔥", cost:30, effect:"Hot Seat on fire" },
  { id:"crown", name:"Panda Crown", emoji:"👑", cost:50, effect:"Royal honor" },
  { id:"rocket", name:"Super Rocket", emoji:"🚀", cost:100, effect:"To the moon" },
];

export function GiftDrawer({open,onOpenChange,onSendGift}:{open:boolean;onOpenChange:(open:boolean)=>void;onSendGift:(gift:VirtualGift)=>Promise<void>}) {
  const [balance,setBalance]=useState<number|null>(null);
  const [selectedGift,setSelectedGift]=useState(VIRTUAL_GIFTS[0]);
  const [sending,setSending]=useState(false);
  const loadBalance=async()=>{
    const {data:user}=await supabase.auth.getUser();
    if(!user.user){setBalance(null);return;}
    const {data}=await supabase.from("bc_accounts").select("balance").eq("user_id",user.user.id).maybeSingle();
    setBalance(data?.balance==null?null:Number(data.balance));
  };
  useEffect(()=>{if(open)void loadBalance();},[open]);
  const handleSend=async()=>{
    setSending(true);
    try { await onSendGift(selectedGift); toast.success(`🎉 Sent ${selectedGift.emoji} ${selectedGift.name}!`); await loadBalance(); onOpenChange(false); }
    catch(e:any){ toast.error(e?.message??"Gift could not be sent."); await loadBalance(); }
    finally{setSending(false);}
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-md rounded-3xl border-white/10 bg-neutral-950/95 text-white backdrop-blur-2xl p-6">
    <DialogHeader><DialogTitle className="flex items-center gap-2 text-xl font-bold"><Gift className="size-5 text-amber-400"/> Send Gift to Host</DialogTitle><DialogDescription className="text-xs text-neutral-400">BC is checked and charged by Circle Panda's secure server.</DialogDescription></DialogHeader>
    <div className="flex justify-end"><span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">🪙 {balance==null?"—":balance} BC</span></div>
    <div className="grid grid-cols-3 gap-2.5">{VIRTUAL_GIFTS.map(g=><button key={g.id} type="button" onClick={()=>setSelectedGift(g)} className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all ${selectedGift.id===g.id?"border-amber-500 bg-amber-500/20 scale-105":"border-white/10 bg-neutral-900/80"}`}><span className="text-3xl">{g.emoji}</span><span className="max-w-full truncate text-xs font-semibold">{g.name}</span><span className="text-[11px] font-bold text-amber-400">{g.cost} BC</span></button>)}</div>
    <Button disabled={sending||balance==null||balance<selectedGift.cost} onClick={handleSend} className="w-full gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-white py-5">{sending?<Loader2 className="size-4 animate-spin"/>:<Gift className="size-4"/>}{sending?"Sending…":`Send ${selectedGift.emoji} ${selectedGift.name} (${selectedGift.cost} BC)`}</Button>
    {balance!=null&&balance<selectedGift.cost?<p className="text-center text-xs text-neutral-400">Not enough BC. Use Circle Panda's normal rewarded-ad or activity rewards to top up.</p>:null}
  </DialogContent></Dialog>;
}
