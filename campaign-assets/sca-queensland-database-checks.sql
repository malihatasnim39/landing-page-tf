-- READ ONLY. Run in the production project's Supabase SQL Editor.
-- The configured SUPABASE_LEADS_TABLE may override this default table name.

-- 1. Confirm the live schema includes the expected attribution columns.
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'building_review_enquiries'
order by ordinal_position;

-- 2. Find existing attribution for this WordPress path, including rows that the
-- current /events embed may have incorrectly labelled organization_slug=general.
-- No names, email addresses, phone numbers, or free-text form fields are returned.
select organization_slug, landing_page_variant, event_slug, event_name,
       utm_source, utm_medium, utm_campaign, utm_content,
       count(*) as submitted_leads,
       min(created_at) as first_submission,
       max(created_at) as latest_submission
from public.building_review_enquiries
where organization_slug = 'sca_queensland'
   or parent_path in ('/sca-queensland', '/sca-queensland/')
   or landing_page_path in ('/sca-queensland', '/sca-queensland/')
group by organization_slug, landing_page_variant, event_slug, event_name,
         utm_source, utm_medium, utm_campaign, utm_content
order by latest_submission desc;

-- 3. Count this brochure's submitted leads. This does NOT count visits or scans.

