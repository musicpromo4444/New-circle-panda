import { useEffect, useMemo, useRef, useState } from "react";
import { Timer, Volume2, VolumeX, PauseCircle } from "lucide-react";
import { formatCountdown, type HostRow } from "@/lib/hotseat";
function youtubeId(url:string){const m=url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&/]+)/i);return m?.[1]??null;}
export function HostReel({host}:{host:HostRow}) {
 const videoRef=useRef<HTMLVideoElement>(null); const [muted,setMuted]=useState(true); const [now,setNow]=useState(Date.now());
 useEffect(()=>{const i=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(i)},[]);
 const paused=Boolean(host.pause_until&&new Date(host.pause_until).getTime()>now);
 const cycle=useMemo(()=>{const elapsed=Math.max(0,Math.floor((now-new Date(host.started_at).getTime())/1000));const pos=elapsed%14400;if(pos<10800)return{label:"LIVE",ms:(10800-pos)*1000};return{label:"WATER BREAK",ms:(14400-pos)*1000};},[now,host.started_at]);
 const ytId=host.media_url?youtubeId(host.media_url):null;
 return <div className="relative h-[40vh] min-h-56 w-full overflow-hidden bg-black">
  {ytId?<iframe title={`${host.alias} Hot Seat live stream`} src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&playsinline=1`} className="size-full border-0" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/>:host.media_url&&host.media_kind==="video"?<video ref={videoRef} src={host.media_url} className="size-full object-cover" autoPlay loop muted={muted} playsInline/>:<div className="grid size-full place-items-center bg-gradient-to-br from-primary/30 to-[var(--dating)]/25 text-6xl">{host.avatar}</div>}
  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/20 to-background/40"/>
  <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3"><span className="flex items-center gap-1.5 rounded-full border border-destructive/60 bg-background/70 px-2.5 py-1 text-xs font-semibold tabular-nums text-destructive backdrop-blur">{paused?<PauseCircle className="size-3.5"/>:<Timer className="size-3.5"/>}{paused?"PAUSED":cycle.label} · {formatCountdown(cycle.ms)}</span>{!ytId&&<button type="button" onClick={()=>setMuted(m=>!m)} aria-label={muted?"Unmute host reel":"Mute host reel"} className="grid size-9 place-items-center rounded-full border border-border/60 bg-background/70 text-foreground backdrop-blur">{muted?<VolumeX className="size-4"/>:<Volume2 className="size-4" />}</button>}</div>
  <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-4"><span className="flex size-12 items-center justify-center rounded-full border-2 border-primary bg-background text-2xl leading-none">{host.avatar}</span><div className="min-w-0"><span className="inline-flex rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">Host · 3h Live / 1h Break</span><p className="truncate text-lg font-semibold">{host.alias}</p></div></div>
 </div>;
}
