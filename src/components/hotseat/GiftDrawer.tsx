import { useEffect, useState } from "react";
import { Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

export type VirtualGift = { id:string; name:string; emoji:string; cost:number; effect:string };

export function GiftDrawer({open,onOpenChange,onSendGift}:{open:boolean;onOpenChange:(open:boolean)=>void;onSendGift:(gift:VirtualGift)=>Promise<void>}) {
  const [gifts,setGifts]=useState<VirtualGift[]>([]);
  const [balance,setBalance]=useState<number|null>(null);
  const [selectedGift,setSelectedGift]=useState<VirtualGift|null>(null);
  const [loading,setLoading]=useState(false);
  const [sending,setSending]=useState(false);

  const load=async()=>{
    setLoading(true);
    const [{data:user},{data:giftsData}]=await Promise.all([
      supabase.auth.getUser(),
      supabase.from("hot_seat_gift_catalog").select("gift_id,name,emoji,cost_bc,effect").eq("enabled",true).order("cost_bc",{ascending:true}),
    ]);
    if(!user.user){setBalance(null);}else{
      const {data}=await supabase.from("bc_accounts").select("balance").eq("user_id",user.user.id).maybeSingle();
      setBalance(data?.balance==null?null:Number(data.balance));
    }
    const next=(giftsData??[]).map((g:any)=>({id:g.gift_id,name:g.name,emoji:g.emoji,cost:Number(g.cost_bc),effect:g.effect??""}));
    setGifts(next);
    setSelectedGift(current=>current&&next.some(g=>g.id===current.id)?current:(next[0]??null));
    setLoading(false);
  };
  useEffect(()=>{if(open)void load();},[open]);

  const handleSend=async()=>{
    if(!selectedGift)return;
    setSending(true);
    try{await onSendGift(selectedGift);toast.success(`🎉 Sent ${selectedGift.emoji} ${selectedGift.name}!`);await load();onOpenChange(false);}
    catch(e:any){toast.error(e?.message??"Gift could not be sent.");await load();}
    finally{setSending(false);}
  };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-md rounded-3xl border-white/10 bg-neutral-950/95 text-white backdrop-blur-2xl p-6">
    <DialogHeader><DialogTitle className="flex items-center gap-2 text-xl font-bold"><Gift className="size-5 text-amber-400"/> Send Gift to Host</DialogTitle><DialogDescription className="text-xs text-neutral-400">Gift prices come from the live Circle Panda catalog and BC is charged server-side.</DialogDescription></DialogHeader>
    <div className="flex justify-end"><span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">🪙 {balance==null?"—":balance} BC</span></div>
    {loading?<div className="py-8 text-center text-sm text-neutral-400">Loading gifts…</div>:!gifts.length?<div className="py-8 text-center text-sm text-neutral-400">No gifts are currently available.</div>:<div className="grid grid-cols-3 gap-2.5">{gifts.map(g=><button key={g.id} type="button" onClick={()=>setSelectedGift(g)} className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all ${selectedGift?.id===g.id?"border-amber-500 bg-amber-500/20 scale-105":"border-white/10 bg-neutral-900/80"}`}><span className="text-3xl">{g.emoji}</span><span className="max-w-full truncate text-xs font-semibold">{g.name}</span><span className="text-[11px] font-bold text-amber-400">{g.cost} BC</span></button>)}</div>}
    <Button disabled={sending||!selectedGift||balance==null||balance<Number(selectedGift?.cost??0)} onClick={handleSend} className="w-full gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-white py-5">{sending?<Loader2 className="size-4 animate-spin"/>:<Gift className="size-4"/>}{sending?"Sending…":selectedGift?`Send ${selectedGift.emoji} ${selectedGift.name} (${selectedGift.cost} BC)`:"Select a gift"}</Button>
    {selectedGift&&balance!=null&&balance<selectedGift.cost?<p className="text-center text-xs text-neutral-400">Not enough BC. Use Circle Panda's normal rewarded-ad or activity rewards to top up.</p>:null}
  </DialogContent></Dialog>;
}
