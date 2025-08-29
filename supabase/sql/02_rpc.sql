-- 02_rpc.sql — RPC sécurisées (RLS enforced)

-- request_booking
create or replace function public.request_booking(p_ride_id uuid, p_passengers int default 1, p_message text default null)
returns public.ride_bookings
language plpgsql
security definer
as $$
declare
  v_booking public.ride_bookings;
begin
  -- Insère la demande (status=requested). La capacité est vérifiée si quelqu'un l'accepte.
  insert into public.ride_bookings (ride_id, rider_id, passengers, status, message)
  values (p_ride_id, auth.uid(), p_passengers, 'requested', p_message)
  returning * into v_booking;
  return v_booking;
end;
$$;

revoke all on function public.request_booking(uuid, int, text) from public;
grant execute on function public.request_booking(uuid, int, text) to authenticated;

-- accept_booking (par le conducteur)
create or replace function public.accept_booking(p_booking_id uuid)
returns public.ride_bookings
language plpgsql
security definer
as $$
declare
  v_booking public.ride_bookings;
  v_driver uuid;
begin
  select r.driver_id into v_driver
  from public.ride_bookings b
  join public.rides r on r.id = b.ride_id
  where b.id = p_booking_id;

  if v_driver is null then
    raise exception 'Booking not found';
  end if;
  if v_driver <> auth.uid() then
    raise exception 'Only the driver can accept bookings';
  end if;

  update public.ride_bookings
  set status = 'accepted'
  where id = p_booking_id
  returning * into v_booking;

  return v_booking;
end;
$$;

revoke all on function public.accept_booking(uuid) from public;
grant execute on function public.accept_booking(uuid) to authenticated;

-- cancel_booking (par rider ou driver)
create or replace function public.cancel_booking(p_booking_id uuid)
returns public.ride_bookings
language plpgsql
security definer
as $$
declare
  v_booking public.ride_bookings;
  v_rider uuid;
  v_driver uuid;
begin
  select b.rider_id, r.driver_id
    into v_rider, v_driver
  from public.ride_bookings b
  join public.rides r on r.id = b.ride_id
  where b.id = p_booking_id;

  if v_rider is null then
    raise exception 'Booking not found';
  end if;
  if auth.uid() <> v_rider and auth.uid() <> v_driver then
    raise exception 'Only rider or driver can cancel';
  end if;

  update public.ride_bookings
  set status = 'cancelled'
  where id = p_booking_id
  returning * into v_booking;

  return v_booking;
end;
$$;

revoke all on function public.cancel_booking(uuid) from public;
grant execute on function public.cancel_booking(uuid) to authenticated;

-- list_public_rides (auth requise par défaut; voir 03_public_read_patch pour anon)
create or replace function public.list_public_rides(p_limit int default 20, p_from timestamptz default now(), p_to timestamptz default now() + interval '90 days')
returns setof public.rides_public_v
language sql
security definer
stable
as $$
  select * from public.rides_public_v
  where departure_time between p_from and p_to
  order by departure_time asc
  limit greatest(1, least(p_limit, 100));
$$;

revoke all on function public.list_public_rides(int, timestamptz, timestamptz) from public;
grant execute on function public.list_public_rides(int, timestamptz, timestamptz) to authenticated;
