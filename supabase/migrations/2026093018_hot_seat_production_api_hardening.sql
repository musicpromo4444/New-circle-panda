-- Circle Panda Hot Seat production API hardening
-- Client roles can read public live-session content only.
-- Mutations remain behind the existing secure Hot Seat RPCs.

do $$
begin
  revoke all on table public.hot_seat_hosts from public, anon, authenticated;
  revoke all on table public.hot_seat_questions from public, anon, authenticated;
  revoke all on table public.hot_seat_answers from public, anon, authenticated;
  revoke all on table public.hot_seat_question_votes from public, anon, authenticated;
  revoke all on table public.hot_seat_queue from public, anon, authenticated;
  revoke all on table public.hot_seat_chat from public, anon, authenticated;
  revoke all on table public.hot_seat_likes from public, anon, authenticated;
  revoke all on table public.hot_seat_follows from public, anon, authenticated;
  revoke all on table public.hot_seat_gifts from public, anon, authenticated;
  revoke all on table public.hot_seat_gift_catalog from public, anon, authenticated;
  revoke all on table public.hot_seat_host_earnings from public, anon, authenticated;
  revoke all on table public.hot_seat_presence_settings from public, anon, authenticated;
  revoke all on table public.hot_seat_session_hosts from public, anon, authenticated;
  revoke all on table public.hot_seat_break_content from public, anon, authenticated;
  revoke all on table public.hot_seat_provider_settings from public, anon, authenticated;
  revoke all on table public.hot_seat_moderation from public, anon, authenticated;
  revoke all on table public.hot_seat_break_polls from public, anon, authenticated;
  revoke all on table public.hot_seat_break_poll_votes from public, anon, authenticated;
  revoke all on table public.hot_seat_water_break_sessions from public, anon, authenticated;
  revoke all on table public.hot_seat_water_break_items from public, anon, authenticated;
  revoke all on table public.hot_seat_break_investments from public, anon, authenticated;
end $$;

grant select on table public.hot_seat_hosts to anon, authenticated;
grant select on table public.hot_seat_questions to anon, authenticated;
grant select on table public.hot_seat_answers to anon, authenticated;
grant select on table public.hot_seat_chat to anon, authenticated;
grant select on table public.hot_seat_break_content to anon, authenticated;
grant select on table public.hot_seat_break_polls to anon, authenticated;
