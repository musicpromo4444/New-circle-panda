-- Hot Seat secure gift catalog
create or replace function public.send_hot_seat_gift_secure(
  p_host_id uuid,
  p_gift_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_name text;
  v_emoji text;
  v_cost bigint;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select g.name, g.emoji, g.cost_bc into v_name, v_emoji, v_cost
  from public.hot_seat_gift_catalog g
  where g.gift_id = p_gift_id and g.enabled = true;

  if v_cost is null then raise exception 'Gift is unavailable'; end if;

  if not exists (
    select 1 from public.hot_seat_hosts h
    where h.id = p_host_id and h.is_active = true
      and h.started_at <= now() and h.ends_at > now()
  ) then raise exception 'Hot Seat session is not active'; end if;

  return public.send_hot_seat_gift(p_host_id,p_gift_id,v_name,v_emoji,v_cost);
end;
$$;

revoke execute on function public.send_hot_seat_gift(uuid,text,text,text,bigint) from public, anon, authenticated;
revoke execute on function public.send_hot_seat_gift_secure(uuid,text) from public, anon;
grant execute on function public.send_hot_seat_gift_secure(uuid,text) to authenticated;
grant select on table public.hot_seat_gift_catalog to authenticated;
