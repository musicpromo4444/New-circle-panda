import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type SessionHost={id:string;session_id:string;host_order:number;alias:string;avatar:string|null;media_url:string|null;is_active:boolean};

export function HotSeatAdmin(){
 const [settings,setSettings]=useState<any>(null),[host,setHost]=useState<any>(null),[roster,setRoster]=useState<SessionHost[]>([]),[saving,setSaving]=useState(false);
 const [form,setForm]=useState({alias:"",media_url:"",topic:"",location:"Worldwide",provider:"youtube",max_hosts:"5"});
 const [newHost,setNewHost]=useState({alias:"",avatar:"🐼",media_url:""});
 const load=async()=>{
  const [{data:s},{data:h}]=await Promise.all([
   supabase.rpc("admin_get_hot_seat_provider_settings"),
   supabase.from("hot_seat_hosts").select("*").eq("is_active",true).order("started_at",{ascending:false}).limit(1).maybeSingle()
  ]);
  setSettings(s);setHost(h);
  if(h){const {data,error}=await supabase.rpc("admin_get_hot_seat_session_hosts",{p_session_id:h.id});if(error)toast.error(error.message);else setRoster(Array.isArray(data)?data:[]);}
  else setRoster([]);
 };
 useEffect(()=>{void load()},[]);
 const saveProvider=async()=>{
  if(!settings)return;setSaving(true);
  const {error}=await supabase.rpc("admin_save_hot_seat_provider_settings",{p_youtube_enabled:Boolean(settings.youtube_enabled),p_youtube_api_key:settings.youtube_api_key||null,p_aws_enabled:Boolean(settings.aws_enabled),p_aws_region:settings.aws_region||"",p_aws_channel_arn:settings.aws_channel_arn||"",p_aws_playback_url:settings.aws_playback_url||"",p_aws_access_key_id:settings.aws_access_key_id||"",p_aws_secret_access_key:settings.aws_secret_access_key||null,p_zegocloud_enabled:Boolean(settings.zegocloud_enabled),p_zegocloud_app_id:settings.zegocloud_app_id||"",p_zegocloud_server_url:settings.zegocloud_server_url||"",p_zegocloud_server_secret:settings.zegocloud_server_secret||null,p_push_enabled:Boolean(settings.push_enabled),p_push_project_id:settings.push_project_id||"",p_push_client_email:settings.push_client_email||"",p_push_credentials_json:settings.push_credentials_json||null});
  setSaving(false);if(error)toast.error(error.message);else toast.success("Hot Seat provider settings saved.");
 };
 const start=async()=>{
  if(!form.alias||!form.media_url)return toast.error("Host name and media URL are required.");
  const {error}=await supabase.rpc("admin_hot_seat_start",{p_alias:form.alias,p_media_url:form.media_url,p_media_kind:"video",p_provider:form.provider,p_max_hosts:Number(form.max_hosts),p_topic:form.topic||null,p_location:form.location||null,p_start_at:new Date().toISOString(),p_duration_hours:24});
  if(error)toast.error(error.message);else{toast.success("Hot Seat started.");void load();}
 };
 const addHost=async()=>{
  if(!host||!newHost.alias.trim())return;
  if(roster.length>=Number(host.max_hosts))return toast.error("The configured host limit is full.");
  const {error}=await supabase.rpc("admin_hot_seat_add_host",{p_session_id:host.id,p_alias:newHost.alias.trim(),p_avatar:newHost.avatar||"🐼",p_media_url:newHost.media_url||null,p_host_order:roster.length+1});
  if(error)toast.error(error.message);else{setNewHost({alias:"",avatar:"🐼",media_url:""});toast.success("Host added.");void load();}
 };
 const action=async(name:string)=>{if(!host)return;const args=name==="end"?{p_host_id:host.id}:name==="pause"?{p_host_id:host.id,p_minutes:15}:{p_host_id:host.id};const {error}=await supabase.rpc(name==="end"?"admin_hot_seat_end":name==="pause"?"admin_hot_seat_pause":"admin_hot_seat_resume",args);if(error)toast.error(error.message);else{toast.success(name==="end"?"Hot Seat ended.":name==="pause"?"Hot Seat paused for 15 minutes.":"Hot Seat resumed.");void load();}};
 const patch=(k:string,v:any)=>setSettings((x:any)=>({...x,[k]:v}));
 return <div className="space-y-5">
  <Card><CardHeader><CardTitle>Hot Seat Session Control</CardTitle></CardHeader><CardContent className="space-y-4">
   {host?<div className="space-y-4">
    <div className="rounded-xl border p-4"><div className="flex items-center justify-between gap-3"><div><b>{host.alias}</b><p className="text-xs text-muted-foreground">{host.stream_provider} · {host.max_hosts} host slots · 3h live / 1h water break cycle</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={()=>action("pause")}>Pause 15m</Button><Button size="sm" variant="outline" onClick={()=>action("resume")}>Resume</Button><Button size="sm" variant="destructive" onClick={()=>action("end")}>End</Button></div></div></div>
    <div className="rounded-xl border p-4 space-y-3"><div><b>Host roster</b><p className="text-xs text-muted-foreground">{roster.length} / {host.max_hosts} host slots configured.</p></div>{roster.map(h=><div key={h.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm"><span className="text-xl">{h.avatar||"🐼"}</span><span className="font-semibold">{h.host_order}. {h.alias}</span><span className="ml-auto text-xs text-muted-foreground">{h.is_active?"Active":"Inactive"}</span></div>)}{roster.length<Number(host.max_hosts)?<div className="grid gap-2 sm:grid-cols-3"><Input placeholder="Host name" value={newHost.alias} onChange={e=>setNewHost({...newHost,alias:e.target.value})}/><Input placeholder="Avatar" value={newHost.avatar} onChange={e=>setNewHost({...newHost,avatar:e.target.value})}/><Input placeholder="Media URL (optional)" value={newHost.media_url} onChange={e=>setNewHost({...newHost,media_url:e.target.value})}/><Button className="sm:col-span-3" onClick={addHost}>Add Host</Button></div>:null}</div>
   </div>:<div className="grid gap-3 sm:grid-cols-2"><Input placeholder="Host name" value={form.alias} onChange={e=>setForm({...form,alias:e.target.value})}/><Input placeholder="Live media / playback URL" value={form.media_url} onChange={e=>setForm({...form,media_url:e.target.value})}/><Input placeholder="Topic" value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})}/><Input placeholder="Location / Worldwide" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/><Select value={form.provider} onValueChange={v=>setForm({...form,provider:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="youtube">YouTube</SelectItem><SelectItem value="aws">AWS</SelectItem><SelectItem value="zegocloud">ZEGOCLOUD</SelectItem></SelectContent></Select><Select value={form.max_hosts} onValueChange={v=>setForm({...form,max_hosts:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{["1","2","5","10","20"].map(v=><SelectItem key={v} value={v}>{v} host slots</SelectItem>)}</SelectContent></Select><Button className="sm:col-span-2" onClick={start}>Start Hot Seat</Button></div>}
  </CardContent></Card>
  {settings&&<Card><CardHeader><CardTitle>Streaming Provider Credentials</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
   <div className="space-y-2"><Label>YouTube API key</Label><Input type="password" value={settings.youtube_api_key||""} onChange={e=>patch("youtube_api_key",e.target.value)}/></div><div className="space-y-2"><Label>AWS region</Label><Input value={settings.aws_region||""} onChange={e=>patch("aws_region",e.target.value)}/></div><div className="space-y-2"><Label>AWS channel ARN</Label><Input value={settings.aws_channel_arn||""} onChange={e=>patch("aws_channel_arn",e.target.value)}/></div><div className="space-y-2"><Label>AWS playback URL</Label><Input value={settings.aws_playback_url||""} onChange={e=>patch("aws_playback_url",e.target.value)}/></div><div className="space-y-2"><Label>ZEGOCLOUD App ID</Label><Input value={settings.zegocloud_app_id||""} onChange={e=>patch("zegocloud_app_id",e.target.value)}/></div><div className="space-y-2"><Label>ZEGOCLOUD server URL</Label><Input value={settings.zegocloud_server_url||""} onChange={e=>patch("zegocloud_server_url",e.target.value)}/></div>
   <Button disabled={saving} className="sm:col-span-2" onClick={saveProvider}>{saving?"Saving…":"Save Provider Settings"}</Button>
  </CardContent></Card>}
 </div>;
}
