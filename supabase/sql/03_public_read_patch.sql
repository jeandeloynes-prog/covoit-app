-- 03_public_read_patch.sql — Lecture publique (anon) de rides_public_v et de la RPC list_public_rides
grant usage on schema public to anon;
grant select on public.rides_public_v to anon;
grant execute on function public.list_public_rides(int, timestamptz, timestamptz) to anon;
