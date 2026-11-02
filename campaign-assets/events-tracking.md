# Shared events landing page

Use `https://terrafuse.com.au/events/` for all conferences that use the generic TerraFuse Events content. The iframe destination is `https://landing-page-tf.vercel.app/events`.

## WordPress setup

Deploy the application changes first. Replace the /events WordPress page's entire existing iframe and tracking listener with the contents of `events-wordpress.html`. Keep only one tracking listener. Site Kit continues to own the Google tag; no new Analytics property or tag is required.

The snippet forwards organizer, event, and UTM parameters, plus the WordPress parent URL/path. It does not assign every visit to one organizer or conference. Use the same snippet for future campaigns without editing it.

## Knowledge Bank Australia conference

Event: **2026 Management Rights Conference**, organized by **Knowledge Bank Australia**.

Plain address to print for typing:

```text
https://terrafuse.com.au/events/
```

Encode this entire destination in the brochure QR code:

```text
https://terrafuse.com.au/events/?organization_slug=knowledge_bank_australia&organization_name=Knowledge%20Bank%20Australia&utm_source=knowledge_bank_australia&utm_medium=qr&utm_campaign=management_rights_conference_2026_11_11&utm_content=event_brochure&tf_event=management-rights-conference-2026-11-11&tf_event_name=2026%20Management%20Rights%20Conference
```

| Field | Tagged brochure visit | Plain /events visit |
| --- | --- | --- |
| Organization slug | `knowledge_bank_australia` | `general` |
| Organization name | `Knowledge Bank Australia` | `TerraFuse Events` |
| Landing page variant | `events` | `events` |
| Event slug | `management-rights-conference-2026-11-11` | No event slug |
| Submitted lead event name | `2026 Management Rights Conference` | `TerraFuse Events` |
| Entry method in GA4 | `qr_brochure` | `untagged` |

The content remains generic even when the organizer is supplied. New organization slugs do not require a new app route or organization-specific page. Supply `organization_slug` and preferably `organization_name`; if only a name is supplied, the app derives a lowercase slug with spaces/hyphens replaced by underscores. If only a slug is supplied, a known organization's name is used where available, otherwise its slug is used as the label. If neither is supplied, attribution defaults to general.

The /events route uses the current URL's tracking values. A later untagged visit resets organization to general and does not inherit an earlier organizer, event, or QR campaign. Other branded and Building Solutions routes retain their previous attribution behavior.

## Form and storage

Suburb and Role are enabled and required on /events, alongside the existing form fields. Both values are stored in the existing `note` column and included in enquiry emails. Organizer/event fields and UTMs use the existing database columns. No schema migration is needed.

## Analytics checks

The existing Google tag receives `tf_landing_page_view`, `tf_form_start`, and `generate_lead`, with the non-identity attribution parameters. Visits with `utm_medium=qr` additionally send `tf_qr_landing_view`, independent of the organizer or event. Set `utm_content=event_brochure` or `brochure_qr` for `entry_method=qr_brochure`; other QR placements receive `entry_method=qr`.

Check the tagged URL in Tag Assistant and GA4 Realtime, including `lead_organization`, `lead_event`, `utm_campaign`, and `entry_method`. Open the plain URL afterward in the same browser and confirm general attribution and no additional QR-view event. These count loaded visits to tagged links, not the physical act of scanning. Shared tagged links and repeated loads can also produce events.

The old SCA-specific conference link should no longer be used for new brochures. If it has already been distributed, a targeted WordPress redirect can forward that exact old conference campaign to the corrected URL without redirecting unrelated SCA traffic.
