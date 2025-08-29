-- 00_schema.sql — idempotent
create extension if not exists pgcrypto;

-- profiles (clé = auth.users.id)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- rides (trajets)
create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(id) on delete cascade,
  origin_label text not null,
  origin_lat numeric(9,6),
  origin_lng numeric(9,6),
  destination_label text not null,
  destination_lat numeric(9,6),
  destination_lng numeric(9,6),
  departure_time timestamptz not null,
  seats_total int not null check (seats_total > 0 and seats_total <= 10),
  price_cents int not null check (price_cents >= 0),
  is_listed boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_rides_updated_at on public.rides;
create trigger trg_rides_updated_at
before update on public.rides
for each row execute function public.set_updated_at();

-- ride_bookings (réservations)
create type booking_status as enum ('requested','accepted','rejected','cancelled');

do $$ begin
  if not exists (select 1 from pg_type where typname = 'booking_status') then
    create type booking_status as enum ('requested','accepted','rejected','cancelled');
  end if;
end $$;

create table if not exists public.ride_bookings (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  rider_id uuid not null references public.profiles(id) on delete cascade,
  passengers int not null default 1 check (passengers > 0 and passengers <= 10),
  status booking_status not null default 'requested',
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ride_id, rider_id) -- 1 booking max par rider/ride
);

drop trigger if exists trg_bookings_updated_at on public.ride_bookings;
create trigger trg_bookings_updated_at
before update on public.ride_bookings
for each row execute function public.set_updated_at();

-- ride_messages (messagerie)
create table if not exists public.ride_messages (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

-- Vue: membres d'un trajet (driver + réservations acceptées)
create or replace view public.ride_members_v as
select r.id as ride_id, r.driver_id as member_id from public.rides r
union all
select b.ride_id, b.rider_id from public.ride_bookings b where b.status = 'accepted';

-- Vue: liste publique réduite
create or replace view public.rides_public_v as
select
  r.id,
  r.origin_label,
  r.destination_label,
  r.departure_time,
  r.seats_total,
  greatest(0, r.seats_total - coalesce((
    select sum(passengers) from public.ride_bookings b
    where b.ride_id = r.id and b.status = 'accepted'
  ), 0)) as seats_available,
  r.price_cents,
  r.notes,
  r.driver_id,
  r.created_at
from public.rides r
where r.is_listed = true;

-- Trigger: empêcher de dépasser la capacité lors d'un passage à 'accepted'
create or replace function public.check_capacity_before_accept()
returns trigger language plpgsql as $$
declare
  seats_taken int;
  seats_total int;
begin
  if (tg_op = 'INSERT' and new.status = 'accepted') or
     (tg_op = 'UPDATE' and new.status = 'accepted' and old.status is distinct from 'accepted') then
    select r.seats_total, coalesce(sum(b.passengers),0)
      into seats_total, seats_taken
    from public.rides r
    left join public.ride_bookings b
      on b.ride_id = r.id and b.status = 'accepted'
    where r.id = new.ride_id
    group by r.seats_total;

    if seats_taken + new.passengers > seats_total then
      raise exception 'Capacity exceeded: % taken + % new > % total', seats_taken, new.passengers, seats_total;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_bookings_capacity on public.ride_bookings;
create trigger trg_bookings_capacity
before insert or update on public.ride_bookings
for each row execute function public.check_capacity_before_accept();

-- Indexes
create index if not exists idx_rides_departure_time on public.rides(departure_time);
create index if not exists idx_rides_is_listed on public.rides(is_listed);
create index if not exists idx_bookings_ride_id on public.ride_bookings(ride_id);
create index if not exists idx_messages_ride_id on public.ride_messages(ride_id);
