create or replace function public.admin_get_hot_seat_session_hosts(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.cp_admin_is_admin() then raise exception 'Admin access required'; end if;
  return coalesce((select jsonb_agg(to_jsonb(h) order by h.host_order) from public.hot_seat_session_hosts h where h.session_id=p_session_id),'[]'::jsonb);
end;
$$;
revoke execute on function public.admin_get_hot_seat_session_hosts(uuid) from public, anon;
grant execute on function public.admin_get_hot_seat_session_hosts(uuid) to authenticated;
