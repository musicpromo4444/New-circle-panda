create or replace function public.toggle_hot_seat_follow_secure(p_host_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_user_id uuid := auth.uid(); v_following boolean;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists(select 1 from public.hot_seat_hosts h where h.id=p_host_id and h.is_active=true) then raise exception 'Hot Seat session is not active'; end if;
  if exists(select 1 from public.hot_seat_follows f where f.user_id=v_user_id) then
    delete from public.hot_seat_follows where user_id=v_user_id; v_following:=false;
  else
    insert into public.hot_seat_follows(user_id,host_id) values(v_user_id,p_host_id); v_following:=true;
  end if;
  return jsonb_build_object('following',v_following);
end;
$$;
revoke execute on function public.toggle_hot_seat_follow_secure(uuid) from public, anon;
grant execute on function public.toggle_hot_seat_follow_secure(uuid) to authenticated;
