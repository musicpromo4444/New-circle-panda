-- Add admin authorization inside the finalist-listing RPC.
create or replace function public.cp_admin_list_reward_qualifications(p_campaign_id uuid)
returns table(qualification_id uuid,user_id uuid,display_name text,prize_name text,status text,current_stage integer,created_at timestamptz)
language plpgsql security definer set search_path=public as $$
begin
 if not public.is_admin() then raise exception 'admin required'; end if;
 return query select q.id,q.user_id,coalesce(p.display_name,'Anonymous Panda'),rp.name,q.status,q.current_stage,q.created_at
 from public.cp_reward_qualifications q join public.cp_reward_prizes rp on rp.id=q.prize_id
 left join public.profiles p on p.id=q.user_id where q.campaign_id=p_campaign_id order by q.created_at desc;
end $$;