-- 01_policies.sql — RLS stricte
alter table public.profiles enable row level security;
alter table public.rides enable row level security;
alter table public.ride_bookings enable row level security;
alter table public.ride_messages enable row level security;

-- profiles
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles
for select using (auth.uid() = id);

drop policy if exists profiles_self_upsert on public.profiles;
create policy profiles_self_upsert on public.profiles
for insert with check (auth.uid() = id);

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

-- rides
drop policy if exists rides_read_listed_or_member on public.rides;
create policy rides_read_listed_or_member on public.rides
for select using (
  is_listed = true
  or exists (select 1 from public.ride_members_v m where m.ride_id = id and m.member_id = auth.uid())
);

drop policy if exists rides_insert_driver on public.rides;
create policy rides_insert_driver on public.rides
for insert with check (driver_id = auth.uid());

drop policy if exists rides_update_driver on public.rides;
create policy rides_update_driver on public.rides
for update using (driver_id = auth.uid()) with check (driver_id = auth.uid());

drop policy if exists rides_delete_driver on public.rides;
create policy rides_delete_driver on public.rides
for delete using (driver_id = auth.uid());

-- ride_bookings
drop policy if exists bookings_read_member on public.ride_bookings;
create policy bookings_read_member on public.ride_bookings
for select using (
  rider_id = auth.uid()
  or exists (
    select 1 from public.rides r where r.id = ride_id and r.driver_id = auth.uid()
  )
);

drop policy if exists bookings_insert_rider on public.ride_bookings;
create policy bookings_insert_rider on public.ride_bookings
for insert with check (rider_id = auth.uid());

drop policy if exists bookings_update_rider_or_driver on public.ride_bookings;
create policy bookings_update_rider_or_driver on public.ride_bookings
for update using (
  rider_id = auth.uid()
  or exists (select 1 from public.rides r where r.id = ride_id and r.driver_id = auth.uid())
) with check (
  rider_id = auth.uid()
  or exists (select 1 from public.rides r where r.id = ride_id and r.driver_id = auth.uid())
);

drop policy if exists bookings_delete_rider on public.ride_bookings;
create policy bookings_delete_rider on public.ride_bookings
for delete using (rider_id = auth.uid());

-- ride_messages
drop policy if exists messages_member_read on public.ride_messages;
create policy messages_member_read on public.ride_messages
for select using (
  exists (select 1 from public.ride_members_v m where m.ride_id = ride_id and m.member_id = auth.uid())
);

drop policy if exists messages_member_write on public.ride_messages;
create policy messages_member_write on public.ride_messages
for insert with check (
  sender_id = auth.uid() and
  exists (select 1 from public.ride_members_v m where m.ride_id = ride_id and m.member_id = auth.uid())
);
