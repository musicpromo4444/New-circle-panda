import { Gift, ShieldCheck, Trophy } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function LiveGiveawayModal({open,onOpenChange,hostName="Hot Seat Host"}:{open:boolean;onOpenChange:(open:boolean)=>void;hostName?:string}) {
  const openGiveaway=()=>{onOpenChange(false);window.location.href="/giveaway";};
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-sm border border-amber-500/30 bg-neutral-950/95 p-5 text-white backdrop-blur-xl rounded-2xl">
    <DialogHeader><DialogTitle className="flex items-center gap-2 text-base font-bold text-amber-300"><Gift className="size-5"/> Live Hot Seat Giveaway</DialogTitle><DialogDescription className="text-xs text-neutral-400">Hosted by {hostName}. Entries and qualification are handled by the real Circle Panda giveaway system.</DialogDescription></DialogHeader>
    <div className="space-y-4"><div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"><div className="flex items-center gap-2 font-bold"><Trophy className="size-4 text-amber-400"/> Verified qualification</div><p className="mt-2 text-xs text-neutral-300">Complete the configured sponsor challenges and final video verification. Your qualification is saved server-side.</p></div><div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-neutral-300"><ShieldCheck className="mr-1 inline size-3.5 text-emerald-400"/> No fake ticket count or local winner state is used here.</div><Button onClick={openGiveaway} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-black"><Gift className="mr-2 size-4"/> Open Giveaway Challenge</Button></div>
  </DialogContent></Dialog>;
}
