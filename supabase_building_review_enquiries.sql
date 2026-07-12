create table if not exists public.building_review_enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  organization_slug text,
  organization_name text,
  event_slug text,
  event_name text not null default 'TerraFuse Events',
  landing_page_variant text,
  landing_page_path text,
  landing_page_url text,
  iframe_url text,
  parent_url text,
  parent_path text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  utm_id text,
  full_name text not null,
  company text not null,
  email text not null,
  mobile text,
  building_count integer check (building_count is null or building_count >= 0),
  main_interest text not null check (
    main_interest in ('EV charging', 'Visitor parking', 'Both', 'Not sure yet')
  ),
  preferred_follow_up_time text,
  note text,
  contact_consent boolean not null default false,
  marketing_consent boolean not null default false
);

alter table public.building_review_enquiries
  add column if not exists organization_slug text,
  add column if not exists organization_name text,
  add column if not exists event_slug text,
  add column if not exists event_name text not null default 'TerraFuse Events',
  add column if not exists landing_page_variant text,
  add column if not exists landing_page_path text,
  add column if not exists landing_page_url text,
  add column if not exists iframe_url text,
  add column if not exists parent_url text,
  add column if not exists parent_path text,
  add column if not exists referrer text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists utm_term text,
  add column if not exists utm_id text;

alter table public.building_review_enquiries
  alter column mobile drop not null;

alter table public.building_review_enquiries
  alter column event_name set default 'TerraFuse Events';

alter table public.building_review_enquiries enable row level security;

create index if not exists building_review_enquiries_created_at_idx
  on public.building_review_enquiries (created_at desc);

create index if not exists building_review_enquiries_event_name_idx
  on public.building_review_enquiries (event_name);

create index if not exists building_review_enquiries_organization_slug_idx
  on public.building_review_enquiries (organization_slug);

create index if not exists building_review_enquiries_event_slug_idx
  on public.building_review_enquiries (event_slug);

create index if not exists building_review_enquiries_utm_campaign_idx
  on public.building_review_enquiries (utm_campaign);

create index if not exists building_review_enquiries_event_created_at_idx
  on public.building_review_enquiries (event_name, created_at desc);

create index if not exists building_review_enquiries_email_idx
  on public.building_review_enquiries (email);

-- The landing page server inserts rows with SUPABASE_SERVICE_ROLE_KEY.
-- Service-role requests bypass RLS, so no public insert policy is required.
-- Download CSV later from Supabase Table Editor:
-- public.building_review_enquiries > Filter event_name > Export data > CSV.
