# TerraFuse WordPress A/B Test Handoff

This handoff creates three public YouTube links, assigns each visitor to a sticky A/B variant, forwards attribution into the Vercel iframe, and sends non-PII funnel events to the Google tag installed by Site Kit.

## Public and internal links

| Purpose | Public WordPress URL | Internal Vercel iframe URL |
| --- | --- | --- |
| Building Review video | `https://terrafuse.com.au/building-review` | Assigned automatically |
| Free Building Review video | `https://terrafuse.com.au/free-building-review` | Assigned automatically |
| Future-Ready Buildings video | `https://terrafuse.com.au/future-ready-buildings` | Assigned automatically |
| Standard layout | `https://terrafuse.com.au/building-solutions` | `https://landing-page-tf.vercel.app/building-solutions` |
| Review-first layout | `https://terrafuse.com.au/building-solutions-review-first` | `https://landing-page-tf.vercel.app/building-solutions-review-first` |
| Events | `https://terrafuse.com.au/events` | `https://landing-page-tf.vercel.app/events` |
| Smart Strata | `https://terrafuse.com.au/smart-strata` | `https://landing-page-tf.vercel.app/smart-strata` |
| SCA Queensland | `https://terrafuse.com.au/sca-queensland` | `https://landing-page-tf.vercel.app/sca-queensland` |

These three branded URLs are the only links and QR codes supplied to the YouTube partner. The A/B destination is selected automatically.

## 1. Add the three WordPress tracking routes

Add this PHP through the **Code Snippets** plugin or paste it inside the existing PHP context of the active child theme's `functions.php`. The snippet intentionally omits an opening `<?php` tag. Run it only once; do not install the same snippet in both places.

```php
/**
 * TerraFuse YouTube landing-page experiment.
 * Detects the three public paths directly, so it does not depend on
 * custom WordPress rewrite rules.
 */
add_action('template_redirect', function () {
    $request_path = wp_parse_url(
        wp_unslash($_SERVER['REQUEST_URI'] ?? '/'),
        PHP_URL_PATH
    );
    $route = trim((string) $request_path, '/');

    $video_sources = array(
        'building-review'       => 'building_review_video',
        'free-building-review'  => 'free_building_review_video',
        'future-ready-buildings' => 'future_ready_buildings_video',
    );

    if (!isset($video_sources[$route])) {
        return;
    }

    nocache_headers();
    header('Vary: Cookie', false);

    $cookie_name = 'tf_building_solutions_variant';
    $variant = isset($_COOKIE[$cookie_name])
        ? sanitize_key(wp_unslash($_COOKIE[$cookie_name]))
        : '';

    if (!in_array($variant, array('standard', 'review_first'), true)) {
        $variant = random_int(0, 1) === 0 ? 'standard' : 'review_first';

        setcookie($cookie_name, $variant, array(
            'expires'  => time() + (30 * DAY_IN_SECONDS),
            'path'     => '/',
            'secure'   => is_ssl(),
            'httponly' => true,
            'samesite' => 'Lax',
        ));
    }

    $destination_path = $variant === 'review_first'
        ? '/building-solutions-review-first/'
        : '/building-solutions/';

    $destination = add_query_arg(array(
        'utm_source'   => 'youtube',
        'utm_medium'   => 'partner_video',
        'utm_campaign' => 'building_solutions_ab_2026',
        'utm_content'  => $video_sources[$route],
        'utm_id'       => 'building_solutions_layout_2026',
    ), home_url($destination_path));

    wp_safe_redirect($destination, 302, 'TerraFuse A/B Test');
    exit;
}, 1);
```

In **Code Snippets**, set the snippet to run on the site frontend (normally **Run everywhere**) and confirm its status is **Active**. Do not choose an admin-only scope. This version reads the public paths directly, so saving WordPress permalinks is not required.

After activating it, purge the Hostinger/LiteSpeed page cache and test all three paths in a private window. Each path must return a `302` response whose `Location` is one of the two public WordPress destination pages with the expected UTM parameters.

Do not cache `/building-review`, `/free-building-review`, or `/future-ready-buildings` at the CDN/page-cache layer. A cached redirect could force every visitor to the same variant or video attribution.

## 2. Create or update the five WordPress iframe pages

Use the iframe base URL matching each WordPress page:

| WordPress page | `data-iframe-base` value |
| --- | --- |
| `/building-solutions` | `https://landing-page-tf.vercel.app/building-solutions` |
| `/building-solutions-review-first` | `https://landing-page-tf.vercel.app/building-solutions-review-first` |
| `/events` | `https://landing-page-tf.vercel.app/events` |
| `/smart-strata` | `https://landing-page-tf.vercel.app/smart-strata` |
| `/sca-queensland` | `https://landing-page-tf.vercel.app/sca-queensland` |

Paste the following into the page's Custom HTML block or HTML widget. Change `src`, `data-iframe-base`, and the title for that page; `src` and `data-iframe-base` must contain the same Vercel route. The existing `landing-page-iframe` class is retained so the iframe continues using the working WordPress CSS for its dimensions and presentation.

```html
<iframe
  id="tf-landing-page"
  class="landing-page-iframe"
  data-iframe-base="https://landing-page-tf.vercel.app/building-solutions"
  title="TerraFuse Building Solutions"
  src="https://landing-page-tf.vercel.app/building-solutions"
  loading="eager"
></iframe>

<script>
(function () {
  var iframe = document.getElementById('tf-landing-page');
  if (!iframe) return;

  var forwardedKeys = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'utm_id',
    'tf_event',
    'tf_event_name'
  ];
  var parentParams = new URLSearchParams(window.location.search);
  var iframeParams = new URLSearchParams();

  forwardedKeys.forEach(function (key) {
    var value = parentParams.get(key);
    if (value) iframeParams.set(key, value);
  });

  iframeParams.set('parent_url', window.location.href);
  iframeParams.set('parent_path', window.location.pathname);
  iframe.src = iframe.dataset.iframeBase + '?' + iframeParams.toString();

  var analyticsEvents = {
    TF_LANDING_PAGE_VIEW: 'tf_landing_page_view',
    TF_FORM_STARTED: 'tf_form_start',
    TF_LEAD_SUBMITTED: 'generate_lead'
  };
  var allowedParameters = [
    'lead_organization',
    'lead_organization_name',
    'lead_event',
    'lead_event_name',
    'landing_page_variant',
    'landing_page_path',
    'iframe_path',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_id'
  ];

  window.addEventListener('message', function (event) {
    if (
      event.origin !== 'https://landing-page-tf.vercel.app'
      || event.source !== iframe.contentWindow
      || !event.data
      || !analyticsEvents[event.data.type]
    ) {
      return;
    }

    var sourcePayload = event.data.payload || {};
    var analyticsPayload = {};
    allowedParameters.forEach(function (key) {
      if (sourcePayload[key] !== null && sourcePayload[key] !== undefined) {
        analyticsPayload[key] = sourcePayload[key];
      }
    });

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('event', analyticsEvents[event.data.type], analyticsPayload);
  });
})();
</script>
```

Set `src` and `data-iframe-base` to the same Vercel route on each WordPress page. The real `src` is a reliable fallback: the landing page still displays if WordPress delays or strips the inline script. When the script runs, it replaces `src` with the same Vercel route plus the forwarded tracking parameters.

If the landing page displays but its final iframe URL does not contain the WordPress page's UTM parameters, WordPress is not executing the inline script. In that case, move the JavaScript into the **Code Snippets** plugin or the active child theme rather than relying on the page's Custom HTML block. The iframe can display without that script, but video attribution and iframe-to-GA4 events require it.

If the existing WordPress pages already contain a `TF_LEAD_SUBMITTED` message listener, replace it with the combined listener above. Keeping both will double-count lead events.

### Verify iframe forwarding and event delivery

1. Open this test URL after the WordPress page is published:

   ```text
   https://terrafuse.com.au/building-solutions?utm_source=test&utm_medium=manual&utm_campaign=iframe_check&utm_content=building_review_video&utm_id=building_solutions_layout_2026
   ```

2. Open browser developer tools and select **Console**. In Chrome or Edge on macOS, use `Option + Command + J`.
3. Paste and run:

   ```javascript
   (function () {
     var iframe = document.getElementById('tf-landing-page');
     if (!iframe) return { error: 'Iframe not found' };
     var url = new URL(iframe.src);
     return {
       finalIframeUrl: url.href,
       utmSource: url.searchParams.get('utm_source'),
       utmContent: url.searchParams.get('utm_content'),
       variantPath: url.pathname,
       parentPath: url.searchParams.get('parent_path')
     };
   })();
   ```

4. The result must show:

   ```text
   utmSource: "test"
   utmContent: "building_review_video"
   variantPath: "/building-solutions"
   parentPath: "/building-solutions"
   ```

If the iframe is found but the UTM values are `null`, the inline forwarding script did not run. If the iframe is not found, verify that the HTML uses `id="tf-landing-page"`.

To verify event delivery and detect duplicate listeners:

1. Open developer tools **Network**, filter requests by `collect`, and reload the page.
2. Confirm one GA request is sent for `tf_landing_page_view`.
3. Focus a form field once and confirm one request is sent for `tf_form_start`.
4. If either action produces two identical requests, remove the older WordPress message listener and retain only the combined listener in this handoff.
5. Confirm the same events appear in GA4 Realtime or DebugView during the Site Kit review.

Do not submit the form merely to test `generate_lead`, because a successful submission creates a Supabase record and sends the configured emails. Test that event later with a clearly identified test lead during the approved end-to-end release check.

## 3. Site Kit and GA4 review

Site Kit continues to own the Google tag. The snippet above queues custom events into that tag and does not install another Analytics ID.

### Prepare the test session

1. In **WordPress Admin → Site Kit → Settings → Connected Services → Analytics**, record the GA4 measurement ID and confirm **Place Google Analytics code** is enabled.
2. Site Kit excludes logged-in WordPress users from Analytics by default. Log out of WordPress in the browser tab used for testing, or temporarily disable **Exclude Analytics → All logged-in users** in Site Kit.
3. Disable ad blockers for `terrafuse.com.au` and grant Analytics consent if the site displays a cookie-consent banner.

### Start Tag Assistant and DebugView

1. In Google Chrome, open [Google Tag Assistant](https://tagassistant.google.com/).
2. Select **Add domain**, enter the final WordPress page URL below, and select **Connect**:

   ```text
   https://terrafuse.com.au/building-solutions?utm_source=test&utm_medium=manual&utm_campaign=iframe_check&utm_content=building_review_video&utm_id=building_solutions_layout_2026
   ```

3. Tag Assistant opens the WordPress page in a separate debug tab and adds a debug parameter to its URL. Keep both the Tag Assistant tab and the opened website tab running.
4. In another tab, open [Google Analytics](https://analytics.google.com/), select the same property and measurement ID used by Site Kit, then go to **Admin → Data display → DebugView**.
5. If DebugView offers a device selector, select the active browser device created by Tag Assistant.

### Trigger and confirm the events

1. Reload the Tag Assistant-opened WordPress page. Within several seconds, confirm `tf_landing_page_view` appears once in DebugView.
2. Click into any field inside the iframe form. Confirm `tf_form_start` appears once.
3. Repeat the process with:

   ```text
   https://terrafuse.com.au/building-solutions-review-first?utm_source=test&utm_medium=manual&utm_campaign=iframe_check&utm_content=building_review_video&utm_id=building_solutions_layout_2026
   ```

4. Select an event in DebugView and confirm its parameters include the expected `landing_page_variant`, `utm_content`, and `utm_id` values.
5. Do not test `generate_lead` until an approved end-to-end test, because a successful form submission creates a Supabase record and sends the configured emails.
6. In GA4, register event-scoped custom dimensions for `landing_page_variant`, `utm_content`, and `utm_id` if they are not already available in reporting, and mark `generate_lead` as a key event.

Start Tag Assistant directly on the two final WordPress landing pages, not on one of the three public video redirect links. Multiple redirects can interfere with the debug connection, while the source-routing behavior is tested separately in the release checks.

No form identity fields are included in the iframe messages. Name, email, mobile, company, and notes remain only in the existing lead-submission workflow.

## 4. Release checks

- Test all three branded tracking links in private windows and confirm `utm_content` is respectively `building_review_video`, `free_building_review_video`, or `future_ready_buildings_video`.
- Clear the `tf_building_solutions_variant` cookie between assignment tests.
- Confirm the same browser remains on the same layout for repeat visits during the 30-day window.
- Confirm Variant A keeps the review form at the bottom and Variant B places it directly after the header.
- Confirm accepted leads store `landing_page_variant` and `utm_content` in Supabase.
- Confirm the three public URLs work before distributing their QR codes.
- Do not launch the campaign until the broader-audience content pass is approved.
