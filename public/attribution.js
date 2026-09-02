const ATTRIBUTION_STORAGE_KEY = "terrafuse-last-touch-attribution";
const BROAD_CAMPAIGN_EVENT_NAME = "brisbane-channel collab";
const BROAD_CAMPAIGN_VIDEO_ROUTES = {
  building_review_video: "building-review",
  free_building_review_video: "free-building-review",
  future_ready_buildings_video: "future-ready-buildings"
};
const BROAD_CAMPAIGN_EVENT_SLUGS = new Set(Object.values(BROAD_CAMPAIGN_VIDEO_ROUTES));

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

export const BROAD_PAGE_CONTENT = {
  title: "EV Charging & Visitor Parking for Brisbane Buildings | TerraFuse",
  description: "Fully managed EV charging and smart visitor parking for Brisbane apartments, body corporate communities and mixed-use buildings. Book a free building suitability review.",
  navigation: [
    { key: "audiences", label: "Who It’s For", href: "#audiences" },
    { key: "ev", label: "EV Charging", href: "#ev-charging" },
    { key: "parking", label: "Visitor Parking", href: "#visitor-parking" },
    { key: "review", label: "Free Review", href: "#free-review" }
  ],
  hero: {
    eyebrow: "TerraFuse x The Brisbane Channel",
    heading: "EV charging and visitor parking, made simple for your building.",
    subheadline: "TerraFuse helps residents, strata managers and building owners introduce fully managed EV charging and smarter visitor parking—with practical planning, fair access and ongoing support.",
    primaryCta: "Book a Free Building Review",
    secondaryCta: "See What’s in It for You",
    secondaryCtaHref: "#audiences",
    mediaLabel: "TerraFuse EV charging and visitor parking in action",
    statHeading: "One managed platform",
    statCopy: "EV charging, visitor parking, billing, access and ongoing support."
  },
  audiences: {
    eyebrow: "Built for the whole building",
    heading: "TerraFuse has something to offer everyone.",
    introduction: "Select your role to see how better EV charging and visitor parking can benefit you and your Brisbane building.",
    cta: "Book a Free Building Review",
    panels: [
      {
        id: "residents",
        label: "Residents",
        heading: "More convenience where you live.",
        image: "../images/pxl_20250321_011958143.mp.jpg",
        imageAlt: "Electric vehicle charging in a shared apartment car park",
        imagePosition: "center center",
        benefits: [
          {
            heading: "Charge where you live",
            copy: "Access convenient shared EV charging in your building without relying only on public charging."
          },
          {
            heading: "Fair, simple access",
            copy: "App-based access and user-pays charging help keep usage and costs clear, without making non-users pay for electricity they do not use."
          },
          {
            heading: "Easier visits",
            copy: "Clear visitor parking bookings and controlled access make it easier to host guests with less uncertainty and frustration."
          }
        ]
      },
      {
        id: "strata-managers",
        label: "Strata Managers",
        heading: "Modern amenities without more administration.",
        image: "../images/WhatsApp Image 2026-07-04 at 13.34.36.jpeg",
        imageAlt: "TerraFuse EV charging and managed visitor bays in a shared building car park",
        imagePosition: "center center",
        benefits: [
          {
            heading: "Less day-to-day workload",
            copy: "TerraFuse manages onboarding, billing, monitoring, support and maintenance, so your team is not left operating another system."
          },
          {
            heading: "Fewer shared-space disputes",
            copy: "Clear charging and visitor parking rules, bookings and access controls help reduce avoidable resident complaints."
          },
          {
            heading: "A practical approval pathway",
            copy: "Start with building suitability, resident demand and a clear implementation pathway that can be presented to the body corporate committee."
          }
        ]
      },
      {
        id: "building-owners",
        label: "Building Owners",
        heading: "Make the building more appealing and ready for change.",
        image: "../images/PXL_20251129_035834023.MP.jpg",
        imageAlt: "Scalable TerraFuse EV charging infrastructure in a multi-residential car park",
        imagePosition: "center center",
        benefits: [
          {
            heading: "Stronger building appeal",
            copy: "Offer useful, future-focused amenities that respond to changing resident and tenant expectations."
          },
          {
            heading: "A lower barrier to action",
            copy: "Eligible buildings can explore a no-upfront-installation-cost pathway instead of funding a major infrastructure project alone."
          },
          {
            heading: "Infrastructure that can grow",
            copy: "Plan shared charging and parking infrastructure that can expand with demand instead of relying on disconnected one-off solutions."
          }
        ]
      }
    ]
  },
  evCharging: {
    eyebrow: "EV Charging",
    heading: "Shared EV charging built around how your building works.",
    introduction: "Every building is different. TerraFuse reviews demand, car park layout, electrical capacity and access needs, then helps plan a communal charging model that can be introduced and managed over time.",
    image: "../images/IMG_3182~photo-full.jpg",
    imageAlt: "Electric vehicle using a completed TerraFuse shared charging installation",
    services: [
      "Initial building suitability review",
      "Site and infrastructure assessment",
      "Shared charging and load-management planning",
      "Installation and commissioning",
      "Resident and user onboarding",
      "App-based access and billing",
      "Monitoring, support and maintenance"
    ],
    features: [
      {
        heading: "Lower upfront barrier",
        copy: "Eligible buildings can access a no-upfront-installation-cost pathway."
      },
      {
        heading: "Fair user-pays model",
        copy: "EV users pay for the charging service they use, helping keep the model fair for other residents."
      },
      {
        heading: "Managed end to end",
        copy: "TerraFuse coordinates the technology, access, billing, monitoring and ongoing support."
      },
      {
        heading: "Ready to scale",
        copy: "Start with what the building needs now and plan for future charging demand."
      }
    ]
  },
  visitorParking: {
    eyebrow: "Visitor Parking",
    heading: "Take the guesswork out of visitor parking.",
    introduction: "TerraFuse combines app-based booking, hardwired smart bollards, configurable access rules and operational support to help Brisbane buildings manage limited visitor bays more consistently.",
    image: "../images/WhatsApp Image 2026-07-04 at 13.34.41.jpeg",
    imageAlt: "Visitor parking bays protected by TerraFuse smart bollards",
    features: [
      {
        heading: "Clearer bookings",
        copy: "Residents have a straightforward way to organise visitor parking."
      },
      {
        heading: "Better access control",
        copy: "Smart bollards and configurable rules help discourage unauthorised use and overstays."
      },
      {
        heading: "Less manual follow-up",
        copy: "A managed system reduces the need for building teams to handle every parking issue manually."
      },
      {
        heading: "A better resident experience",
        copy: "Residents can host visitors with greater confidence and fewer parking frustrations."
      }
    ]
  },
  whyTerraFuse: {
    eyebrow: "Why TerraFuse",
    heading: "One partner from the first review to ongoing operation.",
    copy: "TerraFuse brings the planning, technology and day-to-day operation together. The result is a practical pathway for Brisbane residents, body corporate communities, building managers and owners—not another disconnected system for the building to manage.",
    benefits: [
      "Building-first planning",
      "Fully managed operation",
      "Fair shared-use model",
      "App-based access and billing",
      "Ongoing monitoring and support",
      "Scalable infrastructure planning"
    ]
  },
  review: {
    eyebrow: "Free Building Review",
    heading: "Is your building ready for EV charging or smarter visitor parking?",
    lead: "Tell us a little about your Brisbane apartment, mixed-use property or building portfolio. TerraFuse will help identify a practical next step—whether you are a resident raising the idea, a strata manager supporting a committee, or an owner planning ahead.",
    coverageHeading: "The review can cover",
    coverage: [
      "Current resident or tenant interest",
      "Existing car park layout",
      "Visitor parking access needs",
      "Initial power and infrastructure suitability",
      "Basement connectivity and smart bollard options",
      "Potential rollout pathways",
      "Body corporate or committee discussion support"
    ]
  },
  form: {
    heading: "Request your free building review",
    introduction: "Tell us about your building. Required fields are marked with an asterisk.",
    buildingLabel: "Building or organisation *",
    buildingHelper: "Residents can enter their building name or suburb.",
    buildingCountLabel: "Number of buildings, if applicable",
    noteLabel: "Tell us about your building or enquiry",
    marketingConsent: "I would also like to receive future TerraFuse updates and related information. I can unsubscribe at any time.",
    submitLabel: "Book My Free Building Review",
    successMessage: "Thank you—your Building Suitability Review request has been received. The TerraFuse team will contact you shortly."
  },
  footer: {
    context: "TerraFuse Brisbane Building Solutions",
    copy: "Fully managed EV charging and smart visitor parking for Brisbane apartment, body corporate and mixed-use buildings."
  }
};

const ROUTE_CONFIGS = {
  "/qstrata": {
    organization_slug: "general",
    landing_page_variant: "events",
    layout: "standard"
  },
  "/events": {
    organization_slug: "general",
    landing_page_variant: "events",
    layout: "standard"
  },
  "/sca-queensland": {
    organization_slug: "sca_queensland",
    landing_page_variant: "sca-queensland",
    layout: "standard"
  },
  "/smart-strata": {
    organization_slug: "smart_strata",
    landing_page_variant: "smart-strata",
    layout: "standard"
  },
  "/building-solutions": {
    organization_slug: "general",
    landing_page_variant: "broad_standard",
    layout: "standard",
    contentMode: "broad",
    defaultEventName: BROAD_CAMPAIGN_EVENT_NAME
  },
  "/building-solutions-review-first": {
    organization_slug: "general",
    landing_page_variant: "broad_form_first",
    layout: "review-first",
    contentMode: "broad",
    defaultEventName: BROAD_CAMPAIGN_EVENT_NAME
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

function normalizePathname(value) {
  const pathname = cleanValue(value) || "/";
  if (pathname === "/") {
    return pathname;
  }

  return pathname.replace(/\/+$/, "");
}

function normalizeBroadCampaignEventSlug(value) {
  const normalized = cleanValue(value)?.toLowerCase().replace(/^\/+|\/+$/g, "");
  if (!normalized) {
    return null;
  }

  if (BROAD_CAMPAIGN_EVENT_SLUGS.has(normalized)) {
    return normalized;
  }

  return BROAD_CAMPAIGN_VIDEO_ROUTES[normalized] || null;
}

function getRouteConfig() {
  return ROUTE_CONFIGS[normalizePathname(window.location.pathname)] || null;
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
  const routeConfig = getRouteConfig();
  const slug = routeConfig?.organization_slug || normalizeOrganizationSlug(attribution.organization_slug);
  const organizationConfig = ORGANIZATION_CONFIGS[slug] || ORGANIZATION_CONFIGS.general;

  return {
    ...organizationConfig,
    landing_page_variant: routeConfig?.landing_page_variant || organizationConfig.landing_page_variant,
    layout: routeConfig?.layout || "standard",
    contentMode: routeConfig?.contentMode || "organization",
    defaultEventName: routeConfig?.defaultEventName || organizationConfig.defaultEventName
  };
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
  const routeConfig = getRouteConfig();
  const eventNameSource = cleanValue(searchParams.get("tf_event_name"))
    ? "tf_event_name"
    : (stored.__event_name_source || null);

  // Last-touch attribution: merge current non-empty query/page values over
  // the previous stored attribution, but never erase a stored value with empty
  // query parameters from later visits.
  const merged = mergeNonEmpty(stored, current);
  const activeOrganizationSlug = routeConfig?.organization_slug
    || current.organization_slug
    || ORGANIZATION_CONFIGS.general.organization_slug;
  const activeOrganizationConfig = ORGANIZATION_CONFIGS[activeOrganizationSlug] || ORGANIZATION_CONFIGS.general;

  merged.organization_slug = activeOrganizationConfig.organization_slug;
  merged.organization_name = current.organization_name || activeOrganizationConfig.organization_name;
  // A known route is authoritative for experiment assignment. This prevents
  // a stale query string or stored visit from changing the A/B variant.
  merged.landing_page_variant = routeConfig?.landing_page_variant
    || current.landing_page_variant
    || activeOrganizationConfig.landing_page_variant;

  if (routeConfig?.contentMode === "broad") {
    // Broad campaign routes are authoritative. Do not let an old QStrata
    // localStorage value or Vercel EVENT_NAME override this campaign.
    merged.event_name = BROAD_CAMPAIGN_EVENT_NAME;
    merged.event_slug = normalizeBroadCampaignEventSlug(current.event_slug)
      || normalizeBroadCampaignEventSlug(current.utm_content)
      || normalizeBroadCampaignEventSlug(stored.event_slug)
      || normalizeBroadCampaignEventSlug(stored.utm_content);
    merged.__event_name_source = "broad_campaign";
  } else {
    // Do not carry Brisbane campaign identity into retained event routes.
    if (merged.__event_name_source === "broad_campaign") {
      delete merged.__event_name_source;
      merged.event_name = current.event_name;
      merged.event_slug = current.event_slug;
    }

    if (eventNameSource && eventNameSource !== "broad_campaign") {
      merged.__event_name_source = eventNameSource;
    }
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
