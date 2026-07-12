const ATTRIBUTION_STORAGE_KEY = "terrafuse-last-touch-attribution";

const TRACKED_QUERY_PARAMS = [
  "organization_slug",
  "organization_name",
  "landing_page_variant",
  "parent_url",
  "parent_path",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_id",
  "tf_event",
  "tf_event_name"
];

export const ORGANIZATION_CONFIGS = {
  general: {
    organization_slug: "general",
    organization_name: "TerraFuse Events",
    landing_page_variant: "events",
    title: "TerraFuse Events",
    eyebrow: "TerraFuse Events",
    heading: "EV Charging and Visitor Parking\nSolutions for Strata Buildings",
    subheadline: "Fully managed building amenities for body corporate communities, designed to reduce admin, improve fairness, and help strata managers support future-ready buildings.",
    secondaryCta: "Explore TerraFuse events",
    sectionEyebrow: "Events and partnerships",
    sectionHeading: "Built for strata conversations that turn interest into action.",
    sectionCopy: "TerraFuse events help strata managers, committees and building stakeholders understand practical pathways for EV charging and smarter visitor parking management.",
    footerContext: "TerraFuse Events",
    defaultEventName: "TerraFuse Events"
  },
  sca_queensland: {
    organization_slug: "sca_queensland",
    organization_name: "SCA Queensland",
    landing_page_variant: "sca-queensland",
    title: "TerraFuse for SCA Queensland",
    eyebrow: "TerraFuse with SCA Queensland",
    heading: "EV Charging and Visitor Parking\nSolutions for Queensland Strata Buildings",
    subheadline: "Fully managed building amenities for body corporate communities, designed to reduce admin, improve fairness, and help Queensland strata managers support future-ready buildings.",
    secondaryCta: "For SCA Queensland attendees",
    sectionEyebrow: "SCA Queensland focus",
    sectionHeading: "Practical support for Queensland strata communities.",
    sectionCopy: "For SCA Queensland audiences, TerraFuse focuses on committee-ready EV charging and visitor parking models that help reduce resident friction, support fair user-pays access and keep operational workload manageable.",
    footerContext: "SCA Queensland",
    defaultEventName: "SCA Queensland"
  },
  smart_strata: {
    organization_slug: "smart_strata",
    organization_name: "Smart Strata",
    landing_page_variant: "smart-strata",
    title: "TerraFuse for Smart Strata",
    eyebrow: "TerraFuse with Smart Strata",
    heading: "Smarter EV Charging and Visitor Parking\nfor Strata Communities",
    subheadline: "Fully managed building amenities for body corporate communities, designed to reduce admin, improve fairness, and help strata managers support future-ready buildings.",
    secondaryCta: "For Smart Strata attendees",
    sectionEyebrow: "Smart Strata focus",
    sectionHeading: "A smarter operating model for shared building amenities.",
    sectionCopy: "For Smart Strata audiences, TerraFuse brings EV charging and visitor parking together through managed technology, support and practical implementation pathways for modern strata buildings.",
    footerContext: "Smart Strata",
    defaultEventName: "Smart Strata"
  }
};

/**
 * @typedef {Object} Attribution
 * @property {string | null} organization_slug
 * @property {string | null} organization_name
 * @property {string | null} event_slug
 * @property {string | null} event_name
 * @property {string | null} landing_page_variant
 * @property {string | null} landing_page_path
 * @property {string | null} landing_page_url
 * @property {string | null} iframe_url
 * @property {string | null} parent_url
 * @property {string | null} parent_path
 * @property {string | null} referrer
 * @property {string | null} utm_source
 * @property {string | null} utm_medium
 * @property {string | null} utm_campaign
 * @property {string | null} utm_content
 * @property {string | null} utm_term
 * @property {string | null} utm_id
 */

function cleanValue(value) {
  const text = String(value || "").trim();
  return text || null;
}

function normalizeOrganizationSlug(value) {
  const slug = cleanValue(value);
  if (!slug) {
    return null;
  }

  return slug.toLowerCase().replace(/-/g, "_");
}

function getStoredAttribution() {
  try {
    return JSON.parse(localStorage.getItem(ATTRIBUTION_STORAGE_KEY) || "{}");
  } catch (error) {
    console.warn("Could not parse stored TerraFuse attribution.", error);
    return {};
  }
}

function setStoredAttribution(value) {
  try {
    localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    console.warn("Could not store TerraFuse attribution.", error);
  }
}

function pickQueryValues(searchParams) {
  return TRACKED_QUERY_PARAMS.reduce((values, key) => {
    values[key] = cleanValue(searchParams.get(key));
    return values;
  }, {});
}

function buildAttributionFromQuery(searchParams) {
  const query = pickQueryValues(searchParams);
  const eventName = query.tf_event_name || query.utm_campaign || null;

  return {
    organization_slug: normalizeOrganizationSlug(query.organization_slug),
    organization_name: query.organization_name,
    event_slug: query.tf_event,
    event_name: eventName,
    landing_page_variant: query.landing_page_variant,
    landing_page_path: query.parent_path || cleanValue(window.location.pathname),
    landing_page_url: query.parent_url || cleanValue(window.location.href),
    iframe_url: cleanValue(window.location.href),
    parent_url: query.parent_url,
    parent_path: query.parent_path,
    referrer: cleanValue(document.referrer),
    utm_source: query.utm_source,
    utm_medium: query.utm_medium,
    utm_campaign: query.utm_campaign,
    utm_content: query.utm_content,
    utm_term: query.utm_term,
    utm_id: query.utm_id
  };
}

function mergeNonEmpty(previous, next) {
  const merged = { ...previous };

  Object.entries(next).forEach(([key, value]) => {
    if (value !== null && value !== "") {
      merged[key] = value;
    }
  });

  return merged;
}

export function getOrganizationConfig(attribution) {
  const slug = normalizeOrganizationSlug(attribution.organization_slug);
  return ORGANIZATION_CONFIGS[slug] || ORGANIZATION_CONFIGS.general;
}

export function getAttributionMeta() {
  const stored = getStoredAttribution();
  return {
    eventNameSource: stored.__event_name_source || null
  };
}

export function clearAttributionForTests() {
  localStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
}

export function getAttribution() {
  const searchParams = new URLSearchParams(window.location.search);
  const current = buildAttributionFromQuery(searchParams);
  const stored = getStoredAttribution();
  const eventNameSource = cleanValue(searchParams.get("tf_event_name"))
    ? "tf_event_name"
    : (stored.__event_name_source || null);

  // Last-touch attribution: merge current non-empty query/page values over
  // the previous stored attribution, but never erase a stored value with empty
  // query parameters from later visits.
  const merged = mergeNonEmpty(stored, current);
  const activeOrganizationSlug = current.organization_slug || ORGANIZATION_CONFIGS.general.organization_slug;
  const activeOrganizationConfig = ORGANIZATION_CONFIGS[activeOrganizationSlug] || ORGANIZATION_CONFIGS.general;

  merged.organization_slug = activeOrganizationConfig.organization_slug;
  merged.organization_name = current.organization_name || activeOrganizationConfig.organization_name;
  merged.landing_page_variant = current.landing_page_variant || activeOrganizationConfig.landing_page_variant;

  if (eventNameSource) {
    merged.__event_name_source = eventNameSource;
  }

  setStoredAttribution(merged);

  return {
    organization_slug: merged.organization_slug || null,
    organization_name: merged.organization_name || null,
    event_slug: merged.event_slug || null,
    event_name: merged.event_name || null,
    landing_page_variant: merged.landing_page_variant || null,
    landing_page_path: merged.landing_page_path || null,
    landing_page_url: merged.landing_page_url || null,
    iframe_url: merged.iframe_url || null,
    parent_url: merged.parent_url || null,
    parent_path: merged.parent_path || null,
    referrer: merged.referrer || null,
    utm_source: merged.utm_source || null,
    utm_medium: merged.utm_medium || null,
    utm_campaign: merged.utm_campaign || null,
    utm_content: merged.utm_content || null,
    utm_term: merged.utm_term || null,
    utm_id: merged.utm_id || null
  };
}
