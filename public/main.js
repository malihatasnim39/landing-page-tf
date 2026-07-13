import { getAttribution, getAttributionMeta, getOrganizationConfig } from "./attribution.js?v=20260712b";

const root = document.documentElement;
const toggle = document.querySelector(".theme-toggle");
const form = document.querySelector("#lead-form");
const year = document.querySelector("#year");

const SUBMISSION_ENDPOINT = "/api/leads";
const GA_PARENT_ORIGIN = "https://terrafuse.com.au";

const attribution = getAttribution();
const attributionMeta = getAttributionMeta();
const organizationConfig = getOrganizationConfig(attribution);

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
  window.parent?.postMessage({
    type: "TF_LEAD_SUBMITTED",
    payload: {
      lead_organization: leadPayload.organization_slug || null,
      lead_organization_name: leadPayload.organization_name || null,
      lead_event: leadPayload.event_slug || null,
      lead_event_name: leadPayload.event_name || null,
      landing_page_variant: leadPayload.landing_page_variant || null,
      landing_page_path: leadPayload.landing_page_path || null,
      utm_source: leadPayload.utm_source || null,
      utm_medium: leadPayload.utm_medium || null,
      utm_campaign: leadPayload.utm_campaign || null,
      utm_content: leadPayload.utm_content || null
    }
  }, GA_PARENT_ORIGIN);
}

toggle?.addEventListener("click", () => {
  applyTheme(root.dataset.theme === "dark" ? "light" : "dark");
});

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
    submitButton.textContent = "Book a Free Building Suitability Review";
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
applyTheme(root.dataset.theme || "light");
