-- Reward wheel v2: independent prize allocation windows + resumable released stages.
alter table public.cp_reward_stages
  add column if not exists released_at timestamptz,
  add column if not exists notification_title text,
  add column if not exists notification_body text;

update public.cp_reward_stages
set released_at=coalesce(released_at,created_at,now()),
    notification_title=coalesce(notification_title,'Qualification challenge is ready'),
    notification_body=coalesce(notification_body,'Continue your prize qualification challenge.')
where released_at is null or notification_title is null or notification_body is null;

create or replace function public.cp_generate_reward_slots(p_campaign_id uuid,p_window_no bigint default 1)
returns void language plpgsql security definer set search_path=public as $$
declare c record;p record;local_no bigint;local_start bigint;local_end bigint;slots_needed bigint;
begin
 select * into c from public.cp_reward_campaigns where id=p_campaign_id for update;
 if not found then raise exception 'campaign not found'; end if;
 delete from public.cp_reward_wheel_slots where campaign_id=p_campaign_id and window_no=p_window_no;
 for p in select * from public.cp_reward_prizes where campaign_id=p_campaign_id and enabled and allocation_count>0 and prize_type<>'try_again'
   order by allocation_window asc,allocation_count desc,sort_order,created_at loop
  if p.allocation_window>c.window_size then raise exception 'Prize % allocation window % exceeds campaign cycle %',p.name,p.allocation_window,c.window_size; end if;
  local_no:=0;
  while local_no*p.allocation_window<c.window_size loop
   local_start:=local_no*p.allocation_window+1;
   local_end:=least((local_no+1)*p.allocation_window,c.window_size);
   slots_needed:=least(p.allocation_count,local_end-local_start+1);
   insert into public.cp_reward_wheel_slots(campaign_id,window_no,spin_number,prize_id)
   select p_campaign_id,p_window_no,g,p.id from generate_series(local_start,local_end) g
   where not exists(select 1 from public.cp_reward_wheel_slots s where s.campaign_id=p_campaign_id and s.window_no=p_window_no and s.spin_number=g)
   order by md5(p_campaign_id::text||':'||p_window_no::text||':'||g::text||':'||p.id::text) limit slots_needed;
   if (select count(*) from public.cp_reward_wheel_slots s where s.campaign_id=p_campaign_id and s.window_no=p_window_no and s.prize_id=p.id and s.spin_number between local_start and local_end)<slots_needed
     then raise exception 'Reward allocations collide: not enough free spins for prize % in allocation window %',p.name,p.allocation_window; end if;
   local_no:=local_no+1;
  end loop;
 end loop;
end $$;

create or replace function public.cp_admin_reward_campaign_upsert(p_id uuid default null,p_name text default '',p_description text default null,p_enabled boolean default false,p_window_size bigint default 10000,p_qualification_message text default 'You have qualified for this prize.')
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;v_max bigint;
begin
 if not public.is_admin() then raise exception 'admin required'; end if;
 if p_window_size<=0 then raise exception 'Campaign cycle must be greater than zero'; end if;
 select coalesce(max(allocation_window),0) into v_max from public.cp_reward_prizes where campaign_id=coalesce(p_id,'00000000-0000-0000-0000-000000000000'::uuid) and enabled;
 if p_window_size<v_max then raise exception 'Campaign cycle must be at least the largest prize allocation window (%)',v_max; end if;
 if p_id is null then
  insert into public.cp_reward_campaigns(name,description,enabled,window_size,qualification_message) values(p_name,p_description,p_enabled,p_window_size,p_qualification_message) returning id into v_id;
  insert into public.cp_reward_wheel_state(campaign_id) values(v_id);
 else
  update public.cp_reward_campaigns set name=p_name,description=p_description,enabled=p_enabled,window_size=p_window_size,qualification_message=p_qualification_message,updated_at=now() where id=p_id returning id into v_id;
  if v_id is null then raise exception 'campaign not found'; end if;
 end if;
 perform public.cp_generate_reward_slots(v_id,coalesce((select window_no from public.cp_reward_wheel_state where campaign_id=v_id),1));
 return v_id;
end $$;

create or replace function public.cp_admin_reward_prize_upsert(p_id uuid default null,p_campaign_id uuid default null,p_name text default '',p_description text default null,p_image_url text default '',p_emoji text default '🎁',p_prize_type text default 'physical',p_value bigint default 0,p_allocation_count bigint default 0,p_allocation_window bigint default 10000,p_qualification_label text default 'You have qualified for this prize.',p_fulfilment_type text default 'claim_form',p_fulfilment_config jsonb default '{}'::jsonb,p_enabled boolean default true,p_sort_order integer default 0)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;v_campaign uuid;v_window bigint;
begin
 if not public.is_admin() then raise exception 'admin required'; end if;
 select window_size into v_window from public.cp_reward_campaigns where id=p_campaign_id;
 if v_window is null then raise exception 'campaign not found'; end if;
 if p_allocation_window<=0 or p_allocation_window>v_window then raise exception 'Prize allocation window must be between 1 and the campaign cycle %',v_window; end if;
 if p_allocation_count<0 then raise exception 'Qualifier count cannot be negative'; end if;
 if p_id is null then
  insert into public.cp_reward_prizes(campaign_id,name,description,image_url,emoji,prize_type,value,allocation_count,allocation_window,qualification_label,fulfilment_type,fulfilment_config,enabled,sort_order)
  values(p_campaign_id,p_name,p_description,p_image_url,p_emoji,p_prize_type,p_value,p_allocation_count,p_allocation_window,p_qualification_label,p_fulfilment_type,p_fulfilment_config,p_enabled,p_sort_order) returning id,campaign_id into v_id,v_campaign;
 else
  update public.cp_reward_prizes set campaign_id=p_campaign_id,name=p_name,description=p_description,image_url=p_image_url,emoji=p_emoji,prize_type=p_prize_type,value=p_value,allocation_count=p_allocation_count,allocation_window=p_allocation_window,qualification_label=p_qualification_label,fulfilment_type=p_fulfilment_type,fulfilment_config=p_fulfilment_config,enabled=p_enabled,sort_order=p_sort_order,updated_at=now() where id=p_id returning id,campaign_id into v_id,v_campaign;
  if v_id is null then raise exception 'prize not found'; end if;
 end if;
 perform public.cp_generate_reward_slots(v_campaign,coalesce((select window_no from public.cp_reward_wheel_state where campaign_id=v_campaign),1));
 return v_id;
end $$;

create or replace function public.cp_admin_reward_stage_upsert(p_id uuid default null,p_campaign_id uuid default null,p_stage_number integer default 1,p_title text default '',p_instructions text default null,p_stage_type text default 'form',p_enabled boolean default true,p_sponsor_name text default null,p_action_url text default null,p_form_config jsonb default '{}'::jsonb,p_ad_enabled boolean default true,p_released_at timestamptz default null,p_notification_title text default 'Qualification challenge is ready',p_notification_body text default 'Continue your prize qualification challenge.')
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
 if not public.is_admin() then raise exception 'admin required'; end if;
 insert into public.cp_reward_stages(id,campaign_id,stage_number,title,instructions,stage_type,enabled,sponsor_name,action_url,form_config,ad_enabled,released_at,notification_title,notification_body)
 values(coalesce(p_id,gen_random_uuid()),p_campaign_id,p_stage_number,p_title,p_instructions,p_stage_type,p_enabled,p_sponsor_name,p_action_url,p_form_config,p_ad_enabled,p_released_at,p_notification_title,p_notification_body)
 on conflict(campaign_id,stage_number) do update set title=excluded.title,instructions=excluded.instructions,stage_type=excluded.stage_type,enabled=excluded.enabled,sponsor_name=excluded.sponsor_name,action_url=excluded.action_url,form_config=excluded.form_config,ad_enabled=excluded.ad_enabled,released_at=excluded.released_at,notification_title=excluded.notification_title,notification_body=excluded.notification_body,updated_at=now()
 returning id into v_id;
 return v_id;
end $$;

create or replace function public.cp_admin_release_reward_stage(p_stage_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s public.cp_reward_stages;q record;sent integer:=0;
begin
 if not public.is_admin() then raise exception 'admin required'; end if;
 select * into s from public.cp_reward_stages where id=p_stage_id for update;
 if not found then raise exception 'stage not found'; end if;
 update public.cp_reward_stages set released_at=now(),enabled=true,updated_at=now() where id=s.id returning * into s;
 for q in select distinct user_id from public.cp_reward_qualifications where campaign_id=s.campaign_id and current_stage=s.stage_number and status in ('qualified','stage_'||s.stage_number)
 loop
  insert into public.cp_notifications(user_id,title,body,kind) values(q.user_id,coalesce(s.notification_title,'Qualification challenge is ready'),coalesce(s.notification_body,'Continue your prize qualification challenge.'),'reward_qualification'); sent:=sent+1;
 end loop;
 return jsonb_build_object('ok',true,'stage_id',s.id,'sent',sent,'released_at',s.released_at);
end $$;

create or replace function public.cp_submit_reward_stage(p_qualification_id uuid,p_stage_id uuid,p_answers jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid();q public.cp_reward_qualifications;s public.cp_reward_stages;next_stage public.cp_reward_stages;
begin
 if uid is null then raise exception 'login required'; end if;
 select * into q from public.cp_reward_qualifications where id=p_qualification_id and user_id=uid for update;
 if not found then raise exception 'qualification not found'; end if;
 select * into s from public.cp_reward_stages where id=p_stage_id and campaign_id=q.campaign_id and enabled and stage_number=q.current_stage and released_at is not null;
 if not found then raise exception 'stage is not currently available'; end if;
 insert into public.cp_reward_stage_submissions(qualification_id,stage_id,user_id,answers) values(q.id,s.id,uid,coalesce(p_answers,'{}'::jsonb))
 on conflict(qualification_id,stage_id) do update set answers=excluded.answers,status='submitted',updated_at=now();
 select * into next_stage from public.cp_reward_stages where campaign_id=q.campaign_id and stage_number=s.stage_number+1 and enabled;
 update public.cp_reward_qualifications set current_stage=s.stage_number+1,status=case when next_stage.id is not null then 'stage_'||(s.stage_number+1)::text else 'finalist' end,updated_at=now() where id=q.id;
 return jsonb_build_object('ok',true,'next_stage',s.stage_number+1,'next_stage_released',coalesce(next_stage.released_at is not null,false));
end $$;

grant execute on function public.cp_admin_release_reward_stage(uuid) to authenticated;
