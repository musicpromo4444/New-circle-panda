-- Circle Panda Reward / Qualification Engine
-- Admin-controlled wheel allocations, prize fulfilment and multi-stage qualification.

create table if not exists public.cp_reward_campaigns (
  id uuid primary key default gen_random_uuid(), name text not null, description text,
  enabled boolean not null default false, window_size bigint not null default 10000 check (window_size > 0),
  max_qualifiers_per_user integer not null default 1 check (max_qualifiers_per_user > 0),
  qualification_message text not null default 'You have qualified for this prize.',
  updated_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create table if not exists public.cp_reward_prizes (
  id uuid primary key default gen_random_uuid(), campaign_id uuid not null references public.cp_reward_campaigns(id) on delete cascade,
  name text not null, description text, image_url text, emoji text not null default '🎁',
  prize_type text not null default 'physical' check (prize_type in ('bc','vip','data','physical','voucher','lead','custom','try_again')),
  value bigint not null default 0, allocation_count bigint not null default 0 check (allocation_count >= 0),
  allocation_window bigint not null default 10000 check (allocation_window > 0),
  qualification_label text not null default 'You have qualified for this prize.',
  fulfilment_type text not null default 'claim_form' check (fulfilment_type in ('automatic_bc','automatic_vip','claim_form','trivia','lead_form','browser','manual')),
  fulfilment_config jsonb not null default '{}'::jsonb, enabled boolean not null default true,
  sort_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.cp_reward_wheel_state (
  campaign_id uuid primary key references public.cp_reward_campaigns(id) on delete cascade,
  window_no bigint not null default 1, spins_in_window bigint not null default 0, total_spins bigint not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists public.cp_reward_wheel_slots (
  campaign_id uuid not null references public.cp_reward_campaigns(id) on delete cascade,
  window_no bigint not null, spin_number bigint not null, prize_id uuid not null references public.cp_reward_prizes(id) on delete cascade,
  primary key (campaign_id,window_no,spin_number)
);
create table if not exists public.cp_reward_spin_attempts (
  id uuid primary key default gen_random_uuid(), campaign_id uuid not null references public.cp_reward_campaigns(id) on delete cascade,
  user_id uuid not null, window_no bigint not null, spin_number bigint not null, prize_id uuid not null references public.cp_reward_prizes(id),
  created_at timestamptz not null default now()
);
create table if not exists public.cp_reward_qualifications (
  id uuid primary key default gen_random_uuid(), campaign_id uuid not null references public.cp_reward_campaigns(id) on delete cascade,
  prize_id uuid not null references public.cp_reward_prizes(id), user_id uuid not null,
  spin_attempt_id uuid not null references public.cp_reward_spin_attempts(id),
  status text not null default 'qualified' check (status in ('qualified','stage_1','stage_2','stage_3','finalist','winner','eliminated','claimed')),
  current_stage integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(campaign_id,prize_id,user_id)
);
create table if not exists public.cp_reward_stages (
  id uuid primary key default gen_random_uuid(), campaign_id uuid not null references public.cp_reward_campaigns(id) on delete cascade,
  stage_number integer not null, title text not null, instructions text,
  stage_type text not null default 'form' check (stage_type in ('form','lead','trivia','browser','engagement','manual')),
  enabled boolean not null default true, sponsor_name text, action_url text, form_config jsonb not null default '{}'::jsonb,
  ad_enabled boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(campaign_id,stage_number)
);
create table if not exists public.cp_reward_stage_submissions (
  id uuid primary key default gen_random_uuid(), qualification_id uuid not null references public.cp_reward_qualifications(id) on delete cascade,
  stage_id uuid not null references public.cp_reward_stages(id) on delete cascade, user_id uuid not null,
  answers jsonb not null default '{}'::jsonb, status text not null default 'submitted' check (status in ('submitted','approved','rejected')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(qualification_id,stage_id)
);
create table if not exists public.cp_reward_fulfilments (
  id uuid primary key default gen_random_uuid(), qualification_id uuid not null references public.cp_reward_qualifications(id) on delete cascade,
  user_id uuid not null, method text not null, payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','submitted','approved','fulfilled','rejected')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.cp_reward_campaigns enable row level security;
alter table public.cp_reward_prizes enable row level security;
alter table public.cp_reward_wheel_state enable row level security;
alter table public.cp_reward_wheel_slots enable row level security;
alter table public.cp_reward_spin_attempts enable row level security;
alter table public.cp_reward_qualifications enable row level security;
alter table public.cp_reward_stages enable row level security;
alter table public.cp_reward_stage_submissions enable row level security;
alter table public.cp_reward_fulfilments enable row level security;
revoke all on public.cp_reward_wheel_state,public.cp_reward_wheel_slots,public.cp_reward_spin_attempts from anon,authenticated;
grant select on public.cp_reward_campaigns,public.cp_reward_prizes,public.cp_reward_stages to authenticated;

create or replace function public.cp_generate_reward_slots(p_campaign_id uuid,p_window_no bigint default 1)
returns void language plpgsql security definer set search_path=public as $$
declare c record; p record;
begin
 select * into c from public.cp_reward_campaigns where id=p_campaign_id for update;
 if not found then raise exception 'campaign not found'; end if;
 delete from public.cp_reward_wheel_slots where campaign_id=p_campaign_id and window_no=p_window_no;
 for p in select * from public.cp_reward_prizes where campaign_id=p_campaign_id and enabled and allocation_count>0 order by sort_order,created_at loop
  if p.allocation_window<>c.window_size then raise exception 'Prize % allocation window must equal campaign window size %',p.name,c.window_size; end if;
  insert into public.cp_reward_wheel_slots(campaign_id,window_no,spin_number,prize_id)
  select p_campaign_id,p_window_no,g,p.id from (
   select gs g from generate_series(1,c.window_size) gs
   where not exists(select 1 from public.cp_reward_wheel_slots s where s.campaign_id=p_campaign_id and s.window_no=p_window_no and s.spin_number=gs)
   order by md5(p_campaign_id::text||':'||p_window_no::text||':'||gs::text||':'||p.id::text)
   limit p.allocation_count
  ) x;
 end loop;
end $$;

create or replace function public.cp_admin_reward_campaign_upsert(p_id uuid default null,p_name text default '',p_description text default null,p_enabled boolean default false,p_window_size bigint default 10000,p_qualification_message text default 'You have qualified for this prize.')
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
 if not public.is_admin() then raise exception 'admin required'; end if;
 if p_id is null then insert into public.cp_reward_campaigns(name,description,enabled,window_size,qualification_message) values(p_name,p_description,p_enabled,p_window_size,p_qualification_message) returning id into v_id; insert into public.cp_reward_wheel_state(campaign_id) values(v_id);
 else update public.cp_reward_campaigns set name=p_name,description=p_description,enabled=p_enabled,window_size=p_window_size,qualification_message=p_qualification_message,updated_at=now() where id=p_id returning id into v_id; end if;
 perform public.cp_generate_reward_slots(v_id,coalesce((select window_no from public.cp_reward_wheel_state where campaign_id=v_id),1)); return v_id;
end $$;

create or replace function public.cp_admin_reward_prize_upsert(p_id uuid default null,p_campaign_id uuid default null,p_name text default '',p_description text default null,p_image_url text default '',p_emoji text default '🎁',p_prize_type text default 'physical',p_value bigint default 0,p_allocation_count bigint default 0,p_allocation_window bigint default 10000,p_qualification_label text default 'You have qualified for this prize.',p_fulfilment_type text default 'claim_form',p_fulfilment_config jsonb default '{}'::jsonb,p_enabled boolean default true,p_sort_order integer default 0)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_campaign uuid;
begin
 if not public.is_admin() then raise exception 'admin required'; end if;
 if p_id is null then
  insert into public.cp_reward_prizes(campaign_id,name,description,image_url,emoji,prize_type,value,allocation_count,allocation_window,qualification_label,fulfilment_type,fulfilment_config,enabled,sort_order)
  values(p_campaign_id,p_name,p_description,p_image_url,p_emoji,p_prize_type,p_value,p_allocation_count,p_allocation_window,p_qualification_label,p_fulfilment_type,p_fulfilment_config,p_enabled,p_sort_order) returning id,campaign_id into v_id,v_campaign;
 else
  update public.cp_reward_prizes set campaign_id=p_campaign_id,name=p_name,description=p_description,image_url=p_image_url,emoji=p_emoji,prize_type=p_prize_type,value=p_value,allocation_count=p_allocation_count,allocation_window=p_allocation_window,qualification_label=p_qualification_label,fulfilment_type=p_fulfilment_type,fulfilment_config=p_fulfilment_config,enabled=p_enabled,sort_order=p_sort_order,updated_at=now() where id=p_id returning id,campaign_id into v_id,v_campaign;
 end if;
 perform public.cp_generate_reward_slots(v_campaign,coalesce((select window_no from public.cp_reward_wheel_state where campaign_id=v_campaign),1)); return v_id;
end $$;

create or replace function public.cp_admin_reward_prize_delete(p_id uuid) returns void language plpgsql security definer set search_path=public as $$ declare c uuid; begin if not public.is_admin() then raise exception 'admin required'; end if; select campaign_id into c from public.cp_reward_prizes where id=p_id; delete from public.cp_reward_prizes where id=p_id; if c is not null then perform public.cp_generate_reward_slots(c,coalesce((select window_no from public.cp_reward_wheel_state where campaign_id=c),1)); end if; end $$;

create or replace function public.cp_admin_reward_stage_upsert(p_id uuid default null,p_campaign_id uuid default null,p_stage_number integer default 1,p_title text default '',p_instructions text default null,p_stage_type text default 'form',p_enabled boolean default true,p_sponsor_name text default null,p_action_url text default null,p_form_config jsonb default '{}'::jsonb,p_ad_enabled boolean default true)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
 if not public.is_admin() then raise exception 'admin required'; end if;
 insert into public.cp_reward_stages(id,campaign_id,stage_number,title,instructions,stage_type,enabled,sponsor_name,action_url,form_config,ad_enabled)
 values(coalesce(p_id,gen_random_uuid()),p_campaign_id,p_stage_number,p_title,p_instructions,p_stage_type,p_enabled,p_sponsor_name,p_action_url,p_form_config,p_ad_enabled)
 on conflict(campaign_id,stage_number) do update set title=excluded.title,instructions=excluded.instructions,stage_type=excluded.stage_type,enabled=excluded.enabled,sponsor_name=excluded.sponsor_name,action_url=excluded.action_url,form_config=excluded.form_config,ad_enabled=excluded.ad_enabled,updated_at=now() returning id into v_id; return v_id;
end $$;

create or replace function public.cp_admin_reward_stage_delete(p_id uuid) returns void language plpgsql security definer set search_path=public as $$ begin if not public.is_admin() then raise exception 'admin required'; end if; delete from public.cp_reward_stages where id=p_id; end $$;

create or replace function public.cp_spin_reward(p_campaign_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); c public.cp_reward_campaigns; st public.cp_reward_wheel_state; slot public.cp_reward_wheel_slots; p public.cp_reward_prizes; attempt uuid; qual uuid; nextn bigint;
begin
 if uid is null then raise exception 'login required'; end if;
 select * into c from public.cp_reward_campaigns where id=p_campaign_id and enabled; if not found then raise exception 'campaign unavailable'; end if;
 if exists(select 1 from public.cp_reward_spin_attempts where campaign_id=p_campaign_id and user_id=uid and created_at>now()-interval '24 hours') then raise exception 'You can spin once every 24 hours'; end if;
 insert into public.cp_reward_wheel_state(campaign_id) values(p_campaign_id) on conflict(campaign_id) do nothing;
 select * into st from public.cp_reward_wheel_state where campaign_id=p_campaign_id for update;
 if st.spins_in_window>=c.window_size then
  update public.cp_reward_wheel_state set window_no=st.window_no+1,spins_in_window=0,updated_at=now() where campaign_id=p_campaign_id returning * into st;
  perform public.cp_generate_reward_slots(p_campaign_id,st.window_no);
 end if;
 nextn:=st.spins_in_window+1;
 select * into slot from public.cp_reward_wheel_slots where campaign_id=p_campaign_id and window_no=st.window_no and spin_number=nextn;
 if slot.prize_id is null then
  select * into p from public.cp_reward_prizes where campaign_id=p_campaign_id and prize_type='try_again' and enabled order by sort_order limit 1;
  if p.id is null then select * into p from public.cp_reward_prizes where campaign_id=p_campaign_id and enabled order by allocation_count asc,sort_order limit 1; end if;
 else select * into p from public.cp_reward_prizes where id=slot.prize_id; end if;
 if p.id is null then raise exception 'No prizes configured'; end if;
 insert into public.cp_reward_spin_attempts(campaign_id,user_id,window_no,spin_number,prize_id) values(p_campaign_id,uid,st.window_no,nextn,p.id) returning id into attempt;
 update public.cp_reward_wheel_state set spins_in_window=nextn,total_spins=total_spins+1,updated_at=now() where campaign_id=p_campaign_id;
 if p.prize_type<>'try_again' then
  insert into public.cp_reward_qualifications(campaign_id,prize_id,user_id,spin_attempt_id) values(p_campaign_id,p.id,uid,attempt) on conflict(campaign_id,prize_id,user_id) do nothing returning id into qual;
  if p.prize_type='bc' then
   insert into public.bc_accounts(user_id,balance) values(uid,p.value) on conflict(user_id) do update set balance=public.bc_accounts.balance+p.value,updated_at=now();
   insert into public.bc_ledger(user_id,amount,reason,reference_type,reference_id) values(uid,p.value,'Reward wheel: '||p.name,'reward_wheel',attempt);
  elsif p.prize_type='vip' then
   update public.profiles set is_vip=true,vip_expires_at=greatest(coalesce(vip_expires_at,now()),now())+make_interval(days=>p.value) where id=uid;
  end if;
 end if;
 return jsonb_build_object('attempt_id',attempt,'qualification_id',qual,'window_no',st.window_no,'spin_number',nextn,'prize_id',p.id,'title',p.name,'description',p.description,'image_url',p.image_url,'emoji',p.emoji,'prize_type',p.prize_type,'value',p.value,'qualification_label',p.qualification_label,'fulfilment_type',p.fulfilment_type,'fulfilment_config',p.fulfilment_config);
end $$;

create or replace function public.cp_submit_reward_stage(p_qualification_id uuid,p_stage_id uuid,p_answers jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); q public.cp_reward_qualifications; s public.cp_reward_stages;
begin
 if uid is null then raise exception 'login required'; end if;
 select * into q from public.cp_reward_qualifications where id=p_qualification_id and user_id=uid; if not found then raise exception 'qualification not found'; end if;
 select * into s from public.cp_reward_stages where id=p_stage_id and campaign_id=q.campaign_id and enabled; if not found then raise exception 'stage unavailable'; end if;
 insert into public.cp_reward_stage_submissions(qualification_id,stage_id,user_id,answers) values(q.id,s.id,uid,coalesce(p_answers,'{}'::jsonb))
 on conflict(qualification_id,stage_id) do update set answers=excluded.answers,status='submitted',updated_at=now();
 update public.cp_reward_qualifications set current_stage=s.stage_number+1,status=case when exists(select 1 from public.cp_reward_stages x where x.campaign_id=q.campaign_id and x.stage_number=s.stage_number+1 and x.enabled) then 'stage_'||(s.stage_number+1)::text else 'finalist' end,updated_at=now() where id=q.id;
 return jsonb_build_object('ok',true,'next_stage',s.stage_number+1);
end $$;

revoke all on public.cp_reward_campaigns,public.cp_reward_prizes,public.cp_reward_stages from anon,authenticated;
revoke all on public.cp_generate_reward_slots(uuid,bigint) from public,anon,authenticated;
grant select on public.cp_reward_campaigns,public.cp_reward_prizes,public.cp_reward_stages to authenticated;
grant execute on function public.cp_spin_reward(uuid),public.cp_submit_reward_stage(uuid,uuid,jsonb),public.cp_admin_reward_campaign_upsert(uuid,text,text,boolean,bigint,text),public.cp_admin_reward_prize_upsert(uuid,uuid,text,text,text,text,text,bigint,bigint,bigint,text,text,jsonb,boolean,integer),public.cp_admin_reward_prize_delete(uuid),public.cp_admin_reward_stage_upsert(uuid,uuid,integer,text,text,text,boolean,text,text,jsonb,boolean),public.cp_admin_reward_stage_delete(uuid) to authenticated;

insert into public.cp_reward_campaigns(name,description,enabled,window_size,qualification_message)
select 'Circle Panda Reward Wheel','Admin-controlled qualification and prize funnel.',false,10000,'You have qualified for this prize. Complete the next step to remain in the running.'
where not exists(select 1 from public.cp_reward_campaigns);
insert into public.cp_reward_wheel_state(campaign_id)
select id from public.cp_reward_campaigns c where not exists(select 1 from public.cp_reward_wheel_state s where s.campaign_id=c.id);
insert into public.cp_reward_prizes(campaign_id,name,description,emoji,prize_type,allocation_count,allocation_window,qualification_label,fulfilment_type,sort_order)
select c.id,'Try Again','No qualification this spin.','🔄','try_again',0,c.window_size,'Try again on your next eligible spin.','manual',999
from public.cp_reward_campaigns c where not exists(select 1 from public.cp_reward_prizes p where p.campaign_id=c.id);
