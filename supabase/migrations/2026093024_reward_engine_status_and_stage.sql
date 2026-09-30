-- Reward engine follow-up: status RPC and user qualification access.
alter table public.cp_reward_qualifications drop constraint if exists cp_reward_qualifications_status_check;
create or replace function public.cp_get_reward_status(p_campaign_id uuid)
returns jsonb language sql security definer set search_path=public as $$
 select jsonb_build_object(
  'can_spin',case when not exists(select 1 from public.cp_reward_spin_attempts where campaign_id=p_campaign_id and user_id=auth.uid() and created_at>now()-interval '24 hours') then true else false end,
  'next_spin_at',(select max(created_at)+interval '24 hours' from public.cp_reward_spin_attempts where campaign_id=p_campaign_id and user_id=auth.uid())
 )
$$;
grant execute on function public.cp_get_reward_status(uuid) to authenticated;
grant select on public.cp_reward_qualifications,public.cp_reward_stage_submissions to authenticated;
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='cp_reward_qualifications' and policyname='users read own qualifications') then
  create policy "users read own qualifications" on public.cp_reward_qualifications for select to authenticated using ((select auth.uid())=user_id);
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='cp_reward_stage_submissions' and policyname='users read own stage submissions') then
  create policy "users read own stage submissions" on public.cp_reward_stage_submissions for select to authenticated using ((select auth.uid())=user_id);
 end if;
end $$;
do $$ declare c uuid; begin
 select id into c from public.cp_reward_campaigns order by created_at limit 1;
 if c is not null and not exists(select 1 from public.cp_reward_stages where campaign_id=c and stage_number=1) then
  insert into public.cp_reward_stages(campaign_id,stage_number,title,instructions,stage_type,form_config,ad_enabled)
  values(c,1,'General Claim Form','Tell Circle Panda how you want to receive updates about this qualification.','form','{"fields":[{"key":"contact_method","label":"How would you like to receive this prize?","type":"text","required":true},{"key":"contact_value","label":"WhatsApp number or email","type":"text","required":true}]}',true);
 end if;
end $$;