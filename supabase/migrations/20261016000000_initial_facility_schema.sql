-- Initial facility-management schema for the learning/dev environment.
-- This migration is version-controlled; apply it only to a dev project first.

create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  created_at timestamptz not null default now()
);

create table public.equipment_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  sort_order integer not null default 0
);

create table public.facility_members (
  facility_id uuid not null references public.facilities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (facility_id, user_id)
);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  category_id uuid not null references public.equipment_categories(id),
  name text not null,
  asset_code text,
  location text not null default '',
  status text not null default 'normal' check (status in ('normal', 'caution', 'alarm', 'offline')),
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (facility_id, asset_code)
);

create table public.equipment_specs (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  label text not null,
  value text not null default '',
  unit text,
  sort_order integer not null default 0
);

create table public.equipment_sections (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  title text not null,
  section_type text not null default 'text' check (section_type in ('text', 'image_gallery', 'diagram', 'checklist')),
  body text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.equipment_media (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  section_id uuid references public.equipment_sections(id) on delete set null,
  bucket text not null default 'facility-files',
  object_path text not null,
  media_type text not null check (media_type in ('photo', 'diagram', 'drawing', 'manual')),
  caption text,
  alt_text text not null default '',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (bucket, object_path)
);

create table public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  record_type text not null check (record_type in ('inspection', 'repair', 'replacement', 'work')),
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed', 'action_required')),
  scheduled_at timestamptz,
  completed_at timestamptz,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create index equipment_facility_category_idx on public.equipment (facility_id, category_id);
create index equipment_sections_order_idx on public.equipment_sections (equipment_id, display_order);
create index equipment_media_order_idx on public.equipment_media (equipment_id, display_order);
create index maintenance_records_schedule_idx on public.maintenance_records (equipment_id, scheduled_at desc);

-- Membership is managed by an administrator through trusted setup.
-- Definer helpers keep related-row policies concise and avoid membership-policy recursion.
create or replace function public.has_facility_role(_facility_id uuid, _allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.facility_members fm
    where fm.facility_id = _facility_id
      and fm.user_id = (select auth.uid())
      and fm.role = any (_allowed_roles)
  );
$$;

create or replace function public.can_access_equipment(_equipment_id uuid, _allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.equipment e
    join public.facility_members fm on fm.facility_id = e.facility_id
    where e.id = _equipment_id
      and fm.user_id = (select auth.uid())
      and fm.role = any (_allowed_roles)
  );
$$;

revoke all on function public.has_facility_role(uuid, text[]) from public, anon;
revoke all on function public.can_access_equipment(uuid, text[]) from public, anon;
grant execute on function public.has_facility_role(uuid, text[]) to authenticated;
grant execute on function public.can_access_equipment(uuid, text[]) to authenticated;

alter table public.facilities enable row level security;
alter table public.equipment_categories enable row level security;
alter table public.facility_members enable row level security;
alter table public.equipment enable row level security;
alter table public.equipment_specs enable row level security;
alter table public.equipment_sections enable row level security;
alter table public.equipment_media enable row level security;
alter table public.maintenance_records enable row level security;

revoke all on public.facilities, public.equipment_categories, public.facility_members,
  public.equipment, public.equipment_specs, public.equipment_sections,
  public.equipment_media, public.maintenance_records from anon, authenticated;

grant select on public.equipment_categories to authenticated;
grant select on public.facility_members to authenticated;
grant select, insert, update, delete on public.facilities, public.equipment,
  public.equipment_specs, public.equipment_sections, public.equipment_media,
  public.maintenance_records to authenticated;

create policy "members can read their facilities"
  on public.facilities for select to authenticated
  using (public.has_facility_role(id, array['admin', 'editor', 'viewer']));
create policy "facility editors can update facilities"
  on public.facilities for update to authenticated
  using (public.has_facility_role(id, array['admin', 'editor']))
  with check (public.has_facility_role(id, array['admin', 'editor']));

create policy "authenticated users can read categories"
  on public.equipment_categories for select to authenticated using (true);

create policy "users can read their own memberships"
  on public.facility_members for select to authenticated
  using (user_id = (select auth.uid()));

create policy "facility members can read equipment"
  on public.equipment for select to authenticated
  using (public.has_facility_role(facility_id, array['admin', 'editor', 'viewer']));
create policy "facility editors can add equipment"
  on public.equipment for insert to authenticated
  with check (public.has_facility_role(facility_id, array['admin', 'editor']));
create policy "facility editors can update equipment"
  on public.equipment for update to authenticated
  using (public.has_facility_role(facility_id, array['admin', 'editor']))
  with check (public.has_facility_role(facility_id, array['admin', 'editor']));
create policy "facility admins can remove equipment"
  on public.equipment for delete to authenticated
  using (public.has_facility_role(facility_id, array['admin']));

create policy "members can read equipment specs"
  on public.equipment_specs for select to authenticated
  using (public.can_access_equipment(equipment_id, array['admin', 'editor', 'viewer']));
create policy "editors can add equipment specs"
  on public.equipment_specs for insert to authenticated
  with check (public.can_access_equipment(equipment_id, array['admin', 'editor']));
create policy "editors can update equipment specs"
  on public.equipment_specs for update to authenticated
  using (public.can_access_equipment(equipment_id, array['admin', 'editor']))
  with check (public.can_access_equipment(equipment_id, array['admin', 'editor']));
create policy "admins can remove equipment specs"
  on public.equipment_specs for delete to authenticated
  using (public.can_access_equipment(equipment_id, array['admin']));

create policy "members can read equipment sections"
  on public.equipment_sections for select to authenticated
  using (public.can_access_equipment(equipment_id, array['admin', 'editor', 'viewer']));
create policy "editors can add equipment sections"
  on public.equipment_sections for insert to authenticated
  with check (public.can_access_equipment(equipment_id, array['admin', 'editor']));
create policy "editors can update equipment sections"
  on public.equipment_sections for update to authenticated
  using (public.can_access_equipment(equipment_id, array['admin', 'editor']))
  with check (public.can_access_equipment(equipment_id, array['admin', 'editor']));
create policy "admins can remove equipment sections"
  on public.equipment_sections for delete to authenticated
  using (public.can_access_equipment(equipment_id, array['admin']));

create policy "members can read equipment media"
  on public.equipment_media for select to authenticated
  using (public.can_access_equipment(equipment_id, array['admin', 'editor', 'viewer']));
create policy "editors can add equipment media"
  on public.equipment_media for insert to authenticated
  with check (public.can_access_equipment(equipment_id, array['admin', 'editor']));
create policy "editors can update equipment media"
  on public.equipment_media for update to authenticated
  using (public.can_access_equipment(equipment_id, array['admin', 'editor']))
  with check (public.can_access_equipment(equipment_id, array['admin', 'editor']));
create policy "admins can remove equipment media"
  on public.equipment_media for delete to authenticated
  using (public.can_access_equipment(equipment_id, array['admin']));

create policy "members can read maintenance records"
  on public.maintenance_records for select to authenticated
  using (public.can_access_equipment(equipment_id, array['admin', 'editor', 'viewer']));
create policy "editors can add maintenance records"
  on public.maintenance_records for insert to authenticated
  with check (public.can_access_equipment(equipment_id, array['admin', 'editor']));
create policy "editors can update maintenance records"
  on public.maintenance_records for update to authenticated
  using (public.can_access_equipment(equipment_id, array['admin', 'editor']))
  with check (public.can_access_equipment(equipment_id, array['admin', 'editor']));
create policy "admins can remove maintenance records"
  on public.maintenance_records for delete to authenticated
  using (public.can_access_equipment(equipment_id, array['admin']));

-- Private bucket for internal photos, drawings, and manuals.
insert into storage.buckets (id, name, public)
values ('facility-files', 'facility-files', false)
on conflict (id) do update set public = false;

create policy "facility members can view files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'facility-files'
    and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.has_facility_role(((storage.foldername(name))[1])::uuid, array['admin', 'editor', 'viewer'])
  );
create policy "facility editors can upload files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'facility-files'
    and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.has_facility_role(((storage.foldername(name))[1])::uuid, array['admin', 'editor'])
  );
create policy "facility editors can update files"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'facility-files'
    and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.has_facility_role(((storage.foldername(name))[1])::uuid, array['admin', 'editor'])
  )
  with check (
    bucket_id = 'facility-files'
    and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.has_facility_role(((storage.foldername(name))[1])::uuid, array['admin', 'editor'])
  );
create policy "facility admins can delete files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'facility-files'
    and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.has_facility_role(((storage.foldername(name))[1])::uuid, array['admin'])
  );
