import {
  BROAD_PAGE_CONTENT,
  getAttribution,
  getAttributionMeta,
  getOrganizationConfig
} from "./attribution.js?v=20260827e";

const root = document.documentElement;
const toggle = document.querySelector(".theme-toggle");
const form = document.querySelector("#lead-form");
const year = document.querySelector("#year");
const heroSection = document.querySelector(".hero");
const reviewSection = document.querySelector("#free-review");
const problemSection = document.querySelector("#problem");
const audienceSection = document.querySelector("#audiences");
const organizationSection = document.querySelector("#organization-focus");

const SUBMISSION_ENDPOINT = "/api/leads";
const DEFAULT_PARENT_ORIGIN = "https://terrafuse.com.au";
const ALLOWED_PARENT_ORIGINS = new Set([
  "https://terrafuse.com.au",
  "https://www.terrafuse.com.au"
]);

const attribution = getAttribution();
const attributionMeta = getAttributionMeta();
const organizationConfig = getOrganizationConfig(attribution);

function getParentOrigin() {
  for (const value of [attribution.parent_url, document.referrer]) {
    try {
      const origin = new URL(value).origin;
      if (ALLOWED_PARENT_ORIGINS.has(origin)) {
        return origin;
      }
    } catch (error) {
      // Ignore absent or malformed parent URLs and use the known site origin.
    }
  }

  return DEFAULT_PARENT_ORIGIN;
}

function analyticsPayload() {
  return {
    lead_organization: attribution.organization_slug || organizationConfig.organization_slug || null,
    lead_organization_name: attribution.organization_name || organizationConfig.organization_name || null,
    lead_event: attribution.event_slug || null,
    lead_event_name: attribution.event_name || organizationConfig.defaultEventName || null,
    landing_page_variant: attribution.landing_page_variant || organizationConfig.landing_page_variant || null,
    landing_page_path: attribution.landing_page_path || window.location.pathname,
    iframe_path: window.location.pathname,
    utm_source: attribution.utm_source || null,
    utm_medium: attribution.utm_medium || null,
    utm_campaign: attribution.utm_campaign || null,
    utm_content: attribution.utm_content || null,
    utm_id: attribution.utm_id || null
  };
}

function postAnalyticsMessage(type, payload = analyticsPayload()) {
  if (window.parent === window) {
    return;
  }

  window.parent.postMessage({ type, payload }, getParentOrigin());
}

function applyTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem("terrafuse-theme", theme);
  const isDark = theme === "dark";
  if (toggle) {
    toggle.setAttribute("aria-pressed", String(isDark));
    toggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  }
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element && value) {
    element.textContent = value;
  }
}

function setMultilineText(selector, value) {
  const element = document.querySelector(selector);
  if (!element || !value) {
    return;
  }

  element.textContent = "";
  value.split("\n").forEach((line, index) => {
    if (index > 0) {
      element.append(document.createElement("br"));
    }
    element.append(document.createTextNode(line));
  });
}

function replaceList(selector, items) {
  const list = document.querySelector(selector);
  if (!list) {
    return;
  }

  list.replaceChildren(...items.map((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    return listItem;
  }));
}

function replaceFeatureCards(selector, features) {
  const grid = document.querySelector(selector);
  if (!grid) {
    return;
  }

  grid.replaceChildren(...features.map((feature) => {
    const card = document.createElement("article");
    card.className = "feature-card";

    const heading = document.createElement("h3");
    heading.textContent = feature.heading;

    const copy = document.createElement("p");
    copy.textContent = feature.copy;

    card.append(heading, copy);
    return card;
  }));
}

function setImage(selector, source, alt) {
  const image = document.querySelector(selector);
  if (!image || !source) {
    return;
  }

  image.src = source;
  image.alt = alt || "";
}

function buildAudienceExplorer(config) {
  const explorer = document.querySelector("[data-audience-explorer]");
  if (!explorer) {
    return;
  }

  const tabList = document.createElement("div");
  tabList.className = "audience-tablist";
  tabList.setAttribute("role", "tablist");
  tabList.setAttribute("aria-label", "Choose your role");

  const panelContainer = document.createElement("div");
  panelContainer.className = "audience-panels";

  const tabs = [];
  const panels = [];

  config.panels.forEach((panelConfig, index) => {
    const tabId = `audience-tab-${panelConfig.id}`;
    const panelId = `audience-panel-${panelConfig.id}`;
    const tab = document.createElement("button");
    tab.className = "audience-tab";
    tab.type = "button";
    tab.id = tabId;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panelId);
    tab.setAttribute("aria-selected", String(index === 0));
    tab.tabIndex = index === 0 ? 0 : -1;
    tab.textContent = panelConfig.label;

    const panel = document.createElement("section");
    panel.className = "audience-panel";
    panel.id = panelId;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tabId);
    panel.tabIndex = 0;
    panel.hidden = index !== 0;

    const media = document.createElement("div");
    media.className = "audience-media";
    const image = document.createElement("img");
    image.src = panelConfig.image;
    image.alt = panelConfig.imageAlt;
    image.style.objectPosition = panelConfig.imagePosition || "center center";
    image.loading = index === 0 ? "eager" : "lazy";
    image.addEventListener("error", () => {
      image.alt = "";
      media.classList.add("image-missing");
    });
    media.append(image);

    const content = document.createElement("div");
    content.className = "audience-content";
    const heading = document.createElement("h3");
    heading.textContent = panelConfig.heading;

    const benefits = document.createElement("div");
    benefits.className = "audience-benefits";
    panelConfig.benefits.forEach((benefit, benefitIndex) => {
      const card = document.createElement("article");
      card.className = "audience-benefit";

      const number = document.createElement("span");
      number.className = "audience-benefit-number";
      number.setAttribute("aria-hidden", "true");
      number.textContent = String(benefitIndex + 1).padStart(2, "0");

      const cardCopy = document.createElement("div");
      const cardHeading = document.createElement("h4");
      cardHeading.textContent = benefit.heading;
      const paragraph = document.createElement("p");
      paragraph.textContent = benefit.copy;
      cardCopy.append(cardHeading, paragraph);
      card.append(number, cardCopy);
      benefits.append(card);
    });

    const cta = document.createElement("a");
    cta.className = "button audience-cta";
    cta.href = "#lead-form";
    cta.textContent = config.cta;

    content.append(heading, benefits, cta);
    panel.append(media, content);
    tabList.append(tab);
    panelContainer.append(panel);
    tabs.push(tab);
    panels.push(panel);
  });

  function selectTab(nextIndex, moveFocus = false) {
    tabs.forEach((tab, index) => {
      const selected = index === nextIndex;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[index].hidden = !selected;
    });

    if (moveFocus) {
      tabs[nextIndex].focus();
    }
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(index));
    tab.addEventListener("keydown", (event) => {
      let nextIndex = index;
      if (event.key === "ArrowRight") {
        nextIndex = (index + 1) % tabs.length;
      } else if (event.key === "ArrowLeft") {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = tabs.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      selectTab(nextIndex, true);
    });
  });

  explorer.replaceChildren(tabList, panelContainer);
}

function applyOrganizationContent(config) {
  document.title = config.title;
  setText("[data-org-eyebrow]", config.eyebrow);
  setMultilineText("[data-org-heading]", config.heading);
  setText("[data-org-subheadline]", config.subheadline);
  setText("[data-org-secondary-cta]", config.secondaryCta);
  setText("[data-org-section-eyebrow]", config.sectionEyebrow);
  setText("[data-org-section-heading]", config.sectionHeading);
  setText("[data-org-section-copy]", config.sectionCopy);
  setText("[data-org-footer-context]", config.footerContext);

  const defaultEventName = document.querySelector("[data-org-default-event-name]");
  if (defaultEventName) {
    defaultEventName.value = config.defaultEventName;
  }
}

function applyBroadContent(config) {
  root.dataset.contentMode = "broad";
  document.title = config.title;

  const description = document.querySelector('meta[name="description"]');
  description?.setAttribute("content", config.description);
  document.querySelector("[data-brand-link]")?.setAttribute("aria-label", "TerraFuse home");

  config.navigation.forEach((item) => {
    const link = document.querySelector(`[data-nav-item="${item.key}"]`);
    if (link) {
      link.textContent = item.label;
      link.setAttribute("href", item.href);
    }
  });

  setText("[data-org-eyebrow]", config.hero.eyebrow);
  setMultilineText("[data-org-heading]", config.hero.heading);
  setText("[data-org-subheadline]", config.hero.subheadline);
  setText("[data-hero-primary-cta]", config.hero.primaryCta);
  setText("[data-org-secondary-cta]", config.hero.secondaryCta);
  document.querySelector("[data-org-secondary-cta]")?.setAttribute("href", config.hero.secondaryCtaHref);
  document.querySelector("[data-hero-media]")?.setAttribute("aria-label", config.hero.mediaLabel);
  setText("[data-hero-stat-heading]", config.hero.statHeading);
  setText("[data-hero-stat-copy]", config.hero.statCopy);

  if (problemSection) {
    problemSection.hidden = true;
  }
  if (organizationSection) {
    organizationSection.hidden = true;
  }
  if (audienceSection) {
    audienceSection.hidden = false;
  }

  setText("[data-audience-eyebrow]", config.audiences.eyebrow);
  setText("[data-audience-heading]", config.audiences.heading);
  setText("[data-audience-introduction]", config.audiences.introduction);
  buildAudienceExplorer(config.audiences);

  setText("[data-ev-eyebrow]", config.evCharging.eyebrow);
  setText("[data-ev-heading]", config.evCharging.heading);
  setText("[data-ev-introduction]", config.evCharging.introduction);
  setImage("[data-ev-image]", config.evCharging.image, config.evCharging.imageAlt);
  replaceList("[data-ev-services]", config.evCharging.services);
  replaceFeatureCards("[data-ev-features]", config.evCharging.features);

  setText("[data-parking-eyebrow]", config.visitorParking.eyebrow);
  setText("[data-parking-heading]", config.visitorParking.heading);
  setText("[data-parking-introduction]", config.visitorParking.introduction);
  setImage("[data-parking-image]", config.visitorParking.image, config.visitorParking.imageAlt);
  replaceFeatureCards("[data-parking-features]", config.visitorParking.features);

  setText("[data-why-eyebrow]", config.whyTerraFuse.eyebrow);
  setText("[data-why-heading]", config.whyTerraFuse.heading);
  setText("[data-why-copy]", config.whyTerraFuse.copy);
  replaceList("[data-why-benefits]", config.whyTerraFuse.benefits);

  setText("[data-review-eyebrow]", config.review.eyebrow);
  setText("[data-review-heading]", config.review.heading);
  setText("[data-review-lead]", config.review.lead);
  setText("[data-review-coverage-heading]", config.review.coverageHeading);
  replaceList("[data-review-coverage]", config.review.coverage);

  setText("[data-form-heading]", config.form.heading);
  setText("[data-form-introduction]", config.form.introduction);
  setText("[data-form-building-label]", config.form.buildingLabel);
  setText("[data-form-building-count-label]", config.form.buildingCountLabel);
  setText("[data-form-note-label]", config.form.noteLabel);
  setText("[data-form-marketing-consent]", config.form.marketingConsent);
  setText("[data-form-success]", config.form.successMessage);

  const helper = document.querySelector("[data-form-building-helper]");
  if (helper) {
    helper.textContent = config.form.buildingHelper;
    helper.hidden = false;
  }

  const submitButton = form?.querySelector("button[type='submit']");
  if (submitButton) {
    submitButton.textContent = config.form.submitLabel;
    submitButton.dataset.defaultLabel = config.form.submitLabel;
  }

  setText("[data-org-footer-context]", config.footer.context);
  setText("[data-footer-copy]", config.footer.copy);
}

function applyPageLayout(config) {
  root.dataset.pageLayout = config.layout;

  if (config.layout === "review-first" && heroSection && reviewSection) {
    heroSection.before(reviewSection);
  }
}

function collectFormData(formElement) {
  const data = Object.fromEntries(new FormData(formElement).entries());
  const trackingEventName = attributionMeta.eventNameSource === "tf_event_name"
    ? attribution.event_name
    : null;
  const formEventName = data.eventName || organizationConfig.defaultEventName;
  const campaignFallbackEventName = !trackingEventName
    && attribution.event_name
    && formEventName === organizationConfig.defaultEventName
      ? attribution.event_name
      : null;

  return {
    ...data,
    ...attribution,
    organization_slug: attribution.organization_slug || organizationConfig.organization_slug,
    organization_name: attribution.organization_name || organizationConfig.organization_name,
    landing_page_variant: attribution.landing_page_variant || organizationConfig.landing_page_variant,
    eventName: trackingEventName || campaignFallbackEventName || formEventName,
    trackingEventName,
    contactConsent: data.contactConsent === "yes",
    marketingConsent: data.marketingConsent === "yes"
  };
}

async function submitLead(data) {
  return fetch(SUBMISSION_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}

function postLeadSubmittedMessage(leadPayload) {
  // The WordPress parent listens for this non-PII event and forwards it to GA4.
  // Never include form identity fields such as name, email, mobile, company or notes.
  postAnalyticsMessage("TF_LEAD_SUBMITTED", {
    ...analyticsPayload(),
    lead_organization: leadPayload.organization_slug || null,
    lead_organization_name: leadPayload.organization_name || null,
    lead_event: leadPayload.event_slug || null,
    lead_event_name: leadPayload.eventName || leadPayload.event_name || null,
    landing_page_variant: leadPayload.landing_page_variant || null,
    landing_page_path: leadPayload.landing_page_path || null,
    utm_source: leadPayload.utm_source || null,
    utm_medium: leadPayload.utm_medium || null,
    utm_campaign: leadPayload.utm_campaign || null,
    utm_content: leadPayload.utm_content || null,
    utm_id: leadPayload.utm_id || null
  });
}

toggle?.addEventListener("click", () => {
  applyTheme(root.dataset.theme === "dark" ? "light" : "dark");
});

form?.addEventListener("focusin", () => {
  postAnalyticsMessage("TF_FORM_STARTED");
}, { once: true });

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const errorMessage = form.querySelector(".form-error");
  const successMessage = form.querySelector(".form-success");

  errorMessage.hidden = true;
  successMessage.hidden = true;

  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    errorMessage.hidden = false;
    form.querySelector(":invalid")?.focus();
    return;
  }

  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Sending...";

  const leadPayload = collectFormData(form);

  try {
    const response = await submitLead(leadPayload);
    if (!response.ok) {
      throw new Error("Submission failed");
    }
    postLeadSubmittedMessage(leadPayload);
    form.reset();
    form.classList.remove("was-validated");
    successMessage.hidden = false;
  } catch (error) {
    console.error(error);
    errorMessage.textContent = "Something went wrong. Please try again shortly.";
    errorMessage.hidden = false;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = submitButton.dataset.defaultLabel || "Book a Free Building Suitability Review";
  }
});

document.querySelectorAll("img").forEach((image) => {
  image.addEventListener("error", () => {
    image.setAttribute("alt", "");
  });
});

if (year) {
  year.textContent = new Date().getFullYear();
}

applyOrganizationContent(organizationConfig);
if (organizationConfig.contentMode === "broad") {
  applyBroadContent(BROAD_PAGE_CONTENT);
}
applyPageLayout(organizationConfig);
applyTheme(root.dataset.theme || "light");
postAnalyticsMessage("TF_LANDING_PAGE_VIEW");
