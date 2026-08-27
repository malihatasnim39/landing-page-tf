# TerraFuse WordPress A/B Test Handoff

This handoff creates three public YouTube links, assigns each visitor to a sticky A/B variant, forwards attribution into the Vercel iframe, and sends non-PII funnel events to the Google tag installed by Site Kit.

## Public and internal links

| Purpose | Public WordPress URL | Internal Vercel iframe URL |
| --- | --- | --- |
| Video 1 entry | `https://terrafuse.com.au/go/video-1` | Assigned automatically |
| Video 2 entry | `https://terrafuse.com.au/go/video-2` | Assigned automatically |
| Video 3 entry | `https://terrafuse.com.au/go/video-3` | Assigned automatically |
| Standard layout | `https://terrafuse.com.au/building-solutions` | `https://landing-page-tf.vercel.app/building-solutions` |
| Review-first layout | `https://terrafuse.com.au/building-solutions-review-first` | `https://landing-page-tf.vercel.app/building-solutions-review-first` |
| Events | `https://terrafuse.com.au/events` | `https://landing-page-tf.vercel.app/events` |
| Smart Strata | `https://terrafuse.com.au/smart-strata` | `https://landing-page-tf.vercel.app/smart-strata` |
| SCA Queensland | `https://terrafuse.com.au/sca-queensland` | `https://landing-page-tf.vercel.app/sca-queensland` |

The three `/go/video-N` URLs are the only links and QR codes supplied to the YouTube partner. The A/B destination is selected automatically.

## 1. Add the three WordPress tracking routes

Add this PHP through the **Code Snippets** plugin or paste it inside the existing PHP context of the active child theme's `functions.php`. The snippet intentionally omits an opening `<?php` tag. Run it only once; do not install the same snippet in both places.

```php
/**
 * TerraFuse YouTube landing-page experiment.
 * Public routes: /go/video-1, /go/video-2, /go/video-3
 */
add_action('init', function () {
    add_rewrite_rule(
        '^go/(video-[123])/?$',
        'index.php?tf_youtube_video=$matches[1]',
        'top'
    );
});

add_filter('query_vars', function ($query_vars) {
    $query_vars[] = 'tf_youtube_video';
    return $query_vars;
});

add_action('template_redirect', function () {
    $route = sanitize_key((string) get_query_var('tf_youtube_video'));
    $video_sources = array(
        'video-1' => 'video_1',
        'video-2' => 'video_2',
        'video-3' => 'video_3',
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

After enabling the snippet, open **WordPress Admin → Settings → Permalinks** and click **Save Changes** once. This flushes WordPress rewrite rules so the three `/go/` URLs work.

Do not cache the `/go/video-1`, `/go/video-2`, or `/go/video-3` responses at the CDN/page-cache layer. A cached redirect could force every visitor to the same variant or video attribution.

## 2. Create or update the five WordPress iframe pages

Use the iframe base URL matching each WordPress page:

| WordPress page | `data-iframe-base` value |
| --- | --- |
| `/building-solutions` | `https://landing-page-tf.vercel.app/building-solutions` |
| `/building-solutions-review-first` | `https://landing-page-tf.vercel.app/building-solutions-review-first` |
| `/events` | `https://landing-page-tf.vercel.app/events` |
| `/smart-strata` | `https://landing-page-tf.vercel.app/smart-strata` |
| `/sca-queensland` | `https://landing-page-tf.vercel.app/sca-queensland` |

Paste the following into the page's Custom HTML block or HTML widget. Change only `data-iframe-base` and the title for that page. Retain any existing site-specific iframe height styling if it is managed elsewhere.

```html
<iframe
  id="tf-landing-page"
  data-iframe-base="https://landing-page-tf.vercel.app/building-solutions"
  title="TerraFuse Building Solutions"
  src="about:blank"
  style="display:block;width:100%;border:0"
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

If the existing WordPress pages already contain a `TF_LEAD_SUBMITTED` message listener, replace it with the combined listener above. Keeping both will double-count lead events.

## 3. Site Kit and GA4 review

Site Kit continues to own the Google tag. The snippet above queues custom events into that tag and does not install another Analytics ID.

1. In **Site Kit → Settings → Connected Services → Analytics**, record the GA4 measurement ID and confirm Site Kit is placing the code.
2. Visit each final WordPress page with GA4 DebugView open.
3. Confirm `tf_landing_page_view`, `tf_form_start`, and `generate_lead` arrive once per intended action.
4. In GA4, register event-scoped custom dimensions for `landing_page_variant`, `utm_content`, and `utm_id` if they are not already available in reporting.
5. Mark `generate_lead` as a key event.

No form identity fields are included in the iframe messages. Name, email, mobile, company, and notes remain only in the existing lead-submission workflow.

## 4. Release checks

- Test all three `/go/video-N` links in private windows and confirm `utm_content` matches the link.
- Clear the `tf_building_solutions_variant` cookie between assignment tests.
- Confirm the same browser remains on the same layout for repeat visits during the 30-day window.
- Confirm Variant A keeps the review form at the bottom and Variant B places it directly after the header.
- Confirm accepted leads store `landing_page_variant` and `utm_content` in Supabase.
- Confirm the three public URLs work before distributing their QR codes.
- Do not launch the campaign until the broader-audience content pass is approved.
