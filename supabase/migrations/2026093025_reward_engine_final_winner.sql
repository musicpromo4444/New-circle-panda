-- Reward engine allocation guard and final winner controls.
create or replace function public.cp_admin_list_reward_qualifications(p_campaign_id uuid)
returns table(qualification_id uuid,user_id uuid,display_name text,prize_name text,status text,current_stage integer,created_at timestamptz)
language sql security definer set search_path=public as $$
 select q.id,q.user_id,coalesce(p.display_name,'Anonymous Panda'),rp.name,q.status,q.current_stage,q.created_at
 from public.cp_reward_qualifications q
 join public.cp_reward_prizes rp on rp.id=q.prize_id
 left join public.profiles p on p.id=q.user_id
 where q.campaign_id=p_campaign_id order by q.created_at desc
$$;
grant execute on function public.cp_admin_list_reward_qualifications(uuid) to authenticated;
create or replace function public.cp_admin_select_reward_winner(p_qualification_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare q public.cp_reward_qualifications;
begin
 if not public.is_admin() then raise exception 'admin required'; end if;
 select * into q from public.cp_reward_qualifications where id=p_qualification_id for update;
 if not found then raise exception 'qualification not found'; end if;
 if q.status in ('winner','eliminated','claimed') then raise exception 'qualification is no longer eligible'; end if;
 update public.cp_reward_qualifications set status='winner',updated_at=now() where id=q.id;
 update public.cp_reward_qualifications set status='eliminated',updated_at=now()
 where campaign_id=q.campaign_id and prize_id=q.prize_id and id<>q.id and status not in ('winner','claimed');
 return jsonb_build_object('ok',true,'qualification_id',q.id,'user_id',q.user_id);
end $$;
grant execute on function public.cp_admin_select_reward_winner(uuid) to authenticated;
