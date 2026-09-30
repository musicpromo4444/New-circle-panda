import { useEffect, useState } from "react";
import { SpinWheel } from "@/components/SpinWheel";

const KEY="cp_daily_reward_engine_opened";

export function DailyLoginWheel(){
 const [open,setOpen]=useState(false);
 useEffect(()=>{const today=new Date().toISOString().slice(0,10);if(localStorage.getItem(KEY)!==today)setOpen(true)},[]);
 const close=(v:boolean)=>{if(!v)localStorage.setItem(KEY,new Date().toISOString().slice(0,10));setOpen(v)};
 return <SpinWheel open={open} onOpenChange={close}/>;
}