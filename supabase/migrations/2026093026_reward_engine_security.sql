-- Reward engine security: authenticated-only RPCs and active-content RLS.
revoke execute on function public.cp_admin_reward_campaign_upsert(uuid,text,text,boolean,bigint,text),public.cp_admin_reward_prize_upsert(uuid,uuid,text,text,text,text,text,bigint,bigint,bigint,text,text,jsonb,boolean,integer),public.cp_admin_reward_prize_delete(uuid),public.cp_admin_reward_stage_upsert(uuid,uuid,integer,text,text,text,boolean,text,text,jsonb,boolean),public.cp_admin_reward_stage_delete(uuid),public.cp_admin_list_reward_qualifications(uuid),public.cp_admin_select_reward_winner(uuid),public.cp_get_reward_status(uuid),public.cp_spin_reward(uuid),public.cp_submit_reward_stage(uuid,uuid,jsonb) from anon;
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='cp_reward_campaigns' and policyname='authenticated can read active reward campaigns') then
  create policy "authenticated can read active reward campaigns" on public.cp_reward_campaigns for select to authenticated using (enabled=true);
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='cp_reward_prizes' and policyname='authenticated can read active reward prizes') then
  create policy "authenticated can read active reward prizes" on public.cp_reward_prizes for select to authenticated using (enabled=true and exists(select 1 from public.cp_reward_campaigns c where c.id=campaign_id and c.enabled=true));
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='cp_reward_stages' and policyname='authenticated can read active reward stages') then
  create policy "authenticated can read active reward stages" on public.cp_reward_stages for select to authenticated using (enabled=true and exists(select 1 from public.cp_reward_campaigns c where c.id=campaign_id and c.enabled=true));
 end if;
end $$;