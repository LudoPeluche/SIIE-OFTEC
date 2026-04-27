-- 1. Create profiles table to store role and name
-- This links to Supabase Auth.users via id
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  role text check (role in ('ADMIN', 'PLANNER', 'TECH')),
  name text, -- MUST match the names used in 'asignados' (e.g., 'LUDWIN CABA')
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.work_orders enable row level security;
alter table public.weekly_plan enable row level security;
alter table public.extra_hours enable row level security;

-- 3. Profiles Policies
-- Everyone can read profiles (needed to see who is who)
create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);

-- Users can insert their own profile (often handled by triggers, but safe to allow if ID matches)
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Users can update own profile
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- 4. Helper function to check role (Optional but makes policies cleaner)
-- Note: You might need to run this as a query separately if you don't have PL/pgSQL enabled, 
-- but it's standard in Supabase.
create or replace function public.get_my_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer;

-- 5. Work Orders Policies
-- ADMIN and PLANNER can see everything
create policy "Admin/Planner see all WOs" on public.work_orders
  for select using (
    public.get_my_role() in ('ADMIN', 'PLANNER')
  );

-- TECH can see WOs where they are assigned (checking name match)
-- We assume 'asignados' is TEXT[] and contains names like 'LUDWIN CABA'
create policy "Techs see assigned WOs" on public.work_orders
  for select using (
    public.get_my_role() = 'TECH' 
    and (select name from public.profiles where id = auth.uid()) = any(asignados)
  );

-- ADMIN has full access
create policy "Admin full access WOs" on public.work_orders
  for all using (
    public.get_my_role() = 'ADMIN'
  );

-- PLANNER can insert and update
create policy "Planner insert WOs" on public.work_orders
  for insert with check (
    public.get_my_role() = 'PLANNER'
  );

create policy "Planner update WOs" on public.work_orders
  for update using (
    public.get_my_role() = 'PLANNER'
  );

-- TECH can update assigned WOs (e.g. to close them or add hours)
create policy "Tech update assigned WOs" on public.work_orders
  for update using (
    public.get_my_role() = 'TECH'
    and (select name from public.profiles where id = auth.uid()) = any(asignados)
  );

-- 6. Weekly Plan & Extra Hours (Simplified for now)
-- Allow read for all authenticated, write for Admin/Planner
create policy "Read weekly plan" on public.weekly_plan
  for select using (auth.role() = 'authenticated');

create policy "Modify weekly plan" on public.weekly_plan
  for all using (public.get_my_role() in ('ADMIN', 'PLANNER'));

create policy "Read extra hours" on public.extra_hours
  for select using (auth.role() = 'authenticated');

-- Techs can insert extra hours requests
create policy "Tech insert extra hours" on public.extra_hours
  for insert with check (
    public.get_my_role() = 'TECH'
  );

-- Only Admin can update extra hours (approve/reject)
create policy "Admin update extra hours" on public.extra_hours
  for update using (
    public.get_my_role() = 'ADMIN'
  );
