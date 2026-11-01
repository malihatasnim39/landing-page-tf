# SCA Queensland brochure tracking

Audit date: 1 November 2026. Local source and publicly served HTML/JavaScript inspected; live database rows and authenticated GA4 settings not accessed. Production was not changed.

## Event and brochure destination

- Event: Management Right Conference
- Venue: Sunnybank Performing Art Centre
- Date: Wednesday, 11 November 2026
- Time: 9 am–5 pm, venue local time (Australia/Brisbane)

Encode this entire URL in the event brochure QR code:

```text
https://terrafuse.com.au/sca-queensland/?utm_source=sca_queensland&utm_medium=qr&utm_campaign=management_right_conference_2026_11_11&utm_content=event_brochure&tf_event=management-right-conference-2026-11-11&tf_event_name=Management%20Right%20Conference
```

The URL returned HTTP 200 and retained its parameters. Print the short, untagged address as the human-readable website address if desired. Do not encode that plain address in the QR. Keep this tagged URL exclusive to this brochure; use different `utm_content` values for posters, email, or other placements.

This measures visits from a QR-tagged link, not the physical act of scanning. A scan without opening/loading the page is invisible, and someone opening a shared copy of the tagged URL is included. Repeat loads can produce repeat visit events. Sessions/users and submitted leads are separate metrics. Historical visits to an untagged QR destination cannot reliably be separated from direct visits after the fact.

## Verified findings

| Area | Finding |
| --- | --- |
| Server routes | Both `/events` and `/sca-queensland` serve the landing page. |
| Live WordPress embed | Matches the supplied snippet: embeds `/events` with SCA query parameters. |
| Attribution defect | `/events` route configuration overrides those query parameters with `organization_slug=general` and `landing_page_variant=events`. The name can still say SCA Queensland, producing inconsistent records. Reproduced locally. |
| Dedicated route | `/sca-queensland` produces `sca_queensland` / `sca-queensland`. Reproduced locally. |
| Frontend deployed code | Live `main.js` and `attribution.js` matched local files byte for byte. |
| Funnel events | Frontend posts `TF_LANDING_PAGE_VIEW`, `TF_FORM_STARTED`, and `TF_LEAD_SUBMITTED`. Current WordPress listener only forwards the last one. |
| Public Google tag | Site Kit installs `GT-W6KCNHT5`; its public configuration includes GA4 destination `G-NJB7WS6V0S`. This does not prove that a specific visit/event arrived in GA4. |
| Database design | Default table `public.building_review_enquiries` supports organization, event, paths/URLs, and six UTM fields. `/api/leads` inserts only on form submission. |
| Visit storage | No scan/visit ingestion endpoint or visit table is defined in this repository. The leads table cannot count people who visit without submitting. |
| Event setup | No Management Right Conference / Sunnybank / 11 November 2026 configuration or brochure asset was found in the source. Explicit URL parameters are sufficient for lead event attribution; no event registry is required by this code. |
| Stored attribution | Missing current parameters retain old localStorage values. The supplied direct fallback resets campaign/source/medium/event but can retain old brochure content. The replacement gives absent content/ID/term explicit fallback values. |

## Replacement WordPress block

Use `sca-queensland-wordpress.html` to replace the existing iframe and its entire listener together. It uses the dedicated SCA route, forwards brochure parameters, checks both message origin and iframe source, queues events through the existing Google tag, and registers the listener before loading the iframe.

It sends:

| Event | When | Reporting use |
| --- | --- | --- |
| `tf_landing_page_view` | Iframe initializes, once per parent page load | All page entries |
| `tf_qr_landing_view` | Same initialization, only for the exact brochure tags above | Brochure-tagged visits without requiring a form submission |
| `tf_form_start` | First focus inside the form | Form engagement |
| `generate_lead` | Successful form submission | Submitted leads |

All include `entry_method=qr_brochure`, `other_tagged`, or `untagged`, plus the allowed non-identity attribution fields from the iframe. `entry_method` is computed from the current parent URL, independently of old stored attribution. It is a new GA event parameter, not a database column.

An untagged visit is not proof of a typed/direct visit: search, referrals, bookmarks, and links without tags can also be untagged. Keep the parent's URL unchanged so GA4 can use its normal referrer/session attribution. The iframe's legacy `direct / organization_page` fallback is an app label, not GA4's `(direct) / (none)` classification.

## GA4 verification and reporting

1. In Site Kit, confirm the connected Analytics property/web stream matches `G-NJB7WS6V0S` and that Analytics code placement is enabled. A public tag cannot expose the property's custom definitions, key-event settings, filters, or reports.
2. After replacing the block, use Tag Assistant on the tagged URL while logged out of WordPress. Site Kit may exclude logged-in users; consent settings and blockers can also affect collection.
3. In GA4 Realtime/DebugView confirm `tf_landing_page_view` and `tf_qr_landing_view` each appear once, with `entry_method=qr_brochure` and the expected `lead_event`/campaign/content. Focus a form field and confirm `tf_form_start`.
4. Open the plain URL in a separate private session. Confirm `entry_method=untagged` and no `tf_qr_landing_view`. Also verify a QR visit followed by a plain visit in the same browser resets the fallback content and ID.
5. Create event-scoped custom dimensions for `entry_method`, `lead_event`, `lead_organization`, and `landing_page_variant` if needed. Standard campaign dimensions already cover source/medium/campaign/content; use those rather than duplicating them. If reporting the custom `utm_*` parameters on individual events is needed, register the relevant event-scoped definitions separately.
6. Mark `generate_lead` as a key event. Use `tf_qr_landing_view` event count for loaded brochure entries; use an Exploration filtered by `entry_method=qr_brochure` to compare views, form starts, and leads. For session acquisition, filter session campaign to `management_right_conference_2026_11_11` and session source/medium to `sca_queensland / qr`. Session attribution and current-entry event labels may differ for returning users.
7. Only a successful real submission verifies the complete database/lead event path. No production form submission was made during this audit, because it also sends customer/admin emails.

Official references:

- [Google campaign URL parameters](https://support.google.com/analytics/answer/10917952)
- [Google Analytics events](https://developers.google.com/analytics/devguides/collection/ga4/events)
- [Verify Google Analytics collection](https://developers.google.com/analytics/devguides/collection/ga4/troubleshoot)
- [Event-scoped custom dimensions](https://support.google.com/analytics/answer/14239696)

## Live database verification still needed

The workspace has an example environment file, but no configured Supabase URL/service key and no connected Supabase tool. The production deployment may have these values; local absence is not evidence of production failure. Supabase was offered as an available integration for completing the read-only check.

Run `sca-queensland-database-checks.sql` against the correct production project after confirming `SUPABASE_LEADS_TABLE`. It inspects live columns, groups existing SCA/path attribution without contact details, and counts this brochure's leads. No migration is required for these lead fields if the checked-in schema is applied. Counting all visits in the database would require a separate visit logging design; GA4 can handle the visit count for this setup.

Browser access to the existing Arc session was not approved, so authenticated GA4 settings and live database contents remain unverified.

## Local verification of the replacement

Executed the replacement script in an isolated Node VM with the actual attribution module. Checks passed for SCA organization/variant and conference identity; brochure-only visit event; duplicate view suppression; form-start/lead forwarding; existing-tag and queued-tag behavior; message origin/source validation; exclusion of identity fields; a brochure visit followed by an untagged return; and preservation of another campaign's tags. These checks did not contact the lead API, insert database rows, or send Analytics events/emails. Browser/GA4 end-to-end validation remains outstanding after the WordPress change.
