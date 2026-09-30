create or replace function public.unlock_hot_seat_media_secure(p_answer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_user_id uuid := auth.uid(); v_host_id uuid; v_cost bigint := 10; v_balance bigint;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select h.id into v_host_id
  from public.hot_seat_answers a
  join public.hot_seat_questions q on q.id=a.question_id
  join public.hot_seat_hosts h on h.id=q.host_id
  where a.id=p_answer_id and h.is_active=true and h.started_at<=now() and h.ends_at>now() and a.kind<>'text';
  if v_host_id is null then raise exception 'Media is unavailable'; end if;
  select balance into v_balance from public.bc_accounts where user_id=v_user_id for update;
  if coalesce(v_balance,0)<v_cost then raise exception 'Not enough BC'; end if;
  update public.bc_accounts set balance=balance-v_cost,updated_at=now() where user_id=v_user_id;
  insert into public.bc_ledger(user_id,amount,reason,reference_type,reference_id) values(v_user_id,-v_cost,'Hot Seat view-once media unlock','hot_seat_answer',p_answer_id);
  return jsonb_build_object('unlocked',true,'cost_bc',v_cost);
end;
$$;
revoke execute on function public.unlock_hot_seat_media_secure(uuid) from public, anon;
grant execute on function public.unlock_hot_seat_media_secure(uuid) to authenticated;
