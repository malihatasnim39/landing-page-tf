const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const root = path.join(__dirname, "..");
const attributionSource = fs.readFileSync(path.join(root, "public/attribution.js"), "utf8")
  .replace(/export /g, "");
const embedSource = fs.readFileSync(path.join(root, "campaign-assets/events-wordpress.html"), "utf8")
  .match(/<script>([\s\S]*?)<\/script>/)[1];
const conferenceParams = new URLSearchParams({
  organization_slug: "knowledge_bank_australia",
  organization_name: "Knowledge Bank Australia",
  utm_source: "knowledge_bank_australia",
  utm_medium: "qr",
  utm_campaign: "management_rights_conference_2026_11_11",
  utm_content: "event_brochure",
  tf_event: "management-rights-conference-2026-11-11",
  tf_event_name: "2026 Management Rights Conference"
});
const merchandiseParams = new URLSearchParams({
  utm_source: "merchandise",
  utm_medium: "qr",
  utm_campaign: "generic_merchandise",
  utm_content: "merchandise_qr"
});

function attributionClient() {
  const storage = new Map();
  const context = vm.createContext({
    URLSearchParams,
    console,
    window: { location: new URL("https://landing-page-tf.vercel.app/events") },
    document: { referrer: "https://terrafuse.com.au/" },
    localStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key)
    }
  });
  vm.runInContext(attributionSource, context);
  return {
    visit(route, params = "") {
      context.window.location = new URL(`https://landing-page-tf.vercel.app${route}?${params}`);
      context.attribution = vm.runInContext("getAttribution()", context);
      return {
        attribution: context.attribution,
        content: vm.runInContext("getOrganizationConfig(attribution)", context),
        meta: vm.runInContext("getAttributionMeta()", context)
      };
    }
  };
}

function embed(search = conferenceParams, existingTag = false) {
  const iframe = { contentWindow: {} };
  const listeners = {};
  const calls = [];
  const window = {
    location: new URL(`https://terrafuse.com.au/events/?${search}`),
    addEventListener: (type, listener) => { listeners[type] = listener; }
  };
  if (existingTag) window.gtag = (...args) => calls.push(args);
  Object.defineProperty(iframe, "src", {
    set(value) {
      assert.equal(typeof listeners.message, "function", "listener must precede iframe loading");
      this.url = value;
    }
  });
  vm.runInNewContext(embedSource, { window, document: { getElementById: () => iframe }, URLSearchParams });
  return {
    iframeUrl: new URL(iframe.url),
    send(type, payload = {}, origin = "https://landing-page-tf.vercel.app", source = iframe.contentWindow) {
      listeners.message({ origin, source, data: { type, payload } });
    },
    events() {
      return existingTag ? calls : Array.from(window.dataLayer || [], (args) => Array.from(args));
    }
  };
}

test("events stores the supplied organizer while keeping the generic content and variant", () => {
  const { attribution: a, content, meta } = attributionClient().visit("/events", conferenceParams);
  assert.equal(a.organization_slug, "knowledge_bank_australia");
  assert.equal(a.organization_name, "Knowledge Bank Australia");
  assert.equal(a.event_slug, conferenceParams.get("tf_event"));
  assert.equal(a.event_name, conferenceParams.get("tf_event_name"));
  assert.equal(a.landing_page_variant, "events");
  assert.equal(content.title, "TerraFuse Events");
  assert.equal(content.showSecondaryCta, false);
  assert.equal(content.showBuildingDetails, true);
  assert.equal(meta.eventNameSource, "tf_event_name");
});

test("new organizers need no registry entry and trailing slashes work", () => {
  const { attribution: a, content } = attributionClient().visit("/events/", "organization_slug=new-partner&landing_page_variant=sca-queensland");
  assert.equal(a.organization_slug, "new_partner");
  assert.equal(a.organization_name, "new_partner");
  assert.equal(a.landing_page_variant, "events");
  assert.equal(content.title, "TerraFuse Events");
});

test("events asset URLs resolve to the static server routes with or without a trailing slash", () => {
  const html = fs.readFileSync(path.join(root, "public/index.html"), "utf8");
  const stylesheet = html.match(/<link rel="stylesheet" href="([^\"]+)"/)[1];
  const script = html.match(/<script src="([^\"]+)" type="module"/)[1];
  for (const route of ["/events", "/events/"]) {
    const pageUrl = `https://landing-page-tf.vercel.app${route}`;
    assert.equal(new URL(stylesheet, pageUrl).pathname, "/styles.css");
    assert.equal(new URL(script, pageUrl).pathname, "/main.js");
  }
});

test("a supplied organization name can identify an organizer without a slug", () => {
  const { attribution: a } = attributionClient().visit("/events", "organization_name=Knowledge+Bank+Australia");
  assert.equal(a.organization_slug, "knowledge_bank_australia");
  assert.equal(a.organization_name, "Knowledge Bank Australia");
});

test("a plain events return resets earlier organizer, event, QR tags, and name metadata", () => {
  const client = attributionClient();
  client.visit("/events", conferenceParams);
  const { attribution: a, meta } = client.visit("/events");
  assert.equal(a.organization_slug, "general");
  assert.equal(a.organization_name, "TerraFuse Events");
  assert.equal(a.event_name, "General");
  for (const key of ["event_slug", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_id"]) {
    assert.equal(a[key], null, key);
  }
  assert.equal(meta.eventNameSource, null);
});

test("organizer-free campaigns remain general while retaining their own event and UTMs", () => {
  const { attribution: a } = attributionClient().visit("/events", "utm_source=partner&utm_medium=qr&tf_event=another-conference&tf_event_name=Another+Conference");
  assert.equal(a.organization_slug, "general");
  assert.equal(a.event_slug, "another-conference");
  assert.equal(a.utm_source, "partner");
});

test("a known organizer can be tracked on the generic page without branding it", () => {
  const { attribution: a, content } = attributionClient().visit("/events", "organization_slug=sca_queensland");
  assert.equal(a.organization_slug, "sca_queensland");
  assert.equal(a.organization_name, "SCA Queensland");
  assert.equal(content.title, "TerraFuse Events");
});

test("branded routes and Building Solutions retain their own identity and buttons", () => {
  const client = attributionClient();
  for (const [route, slug] of [["/sca-queensland", "sca_queensland"], ["/smart-strata", "smart_strata"]]) {
    client.visit("/events", conferenceParams);
    const { attribution: a, content } = client.visit(route);
    assert.equal(a.organization_slug, slug);
    assert.equal(a.landing_page_variant, route.slice(1));
    assert.equal(content.showSecondaryCta, true);
  }
  const broad = client.visit("/building-solutions", "utm_content=building_review_video");
  assert.equal(broad.attribution.event_name, "brisbane-channel collab");
  assert.equal(broad.attribution.organization_slug, "general");
  assert.equal(broad.attribution.landing_page_variant, "broad_standard");
});

test("embed forwards conference and organizer values and uses the WordPress path", () => {
  const bridge = embed();
  assert.equal(bridge.iframeUrl.pathname, "/events");
  for (const [key, value] of conferenceParams) assert.equal(bridge.iframeUrl.searchParams.get(key), value, key);
  assert.equal(bridge.iframeUrl.searchParams.get("parent_path"), "/events/");
  const { attribution: a } = attributionClient().visit("/events", bridge.iframeUrl.searchParams);
  assert.equal(a.organization_slug, "knowledge_bank_australia");
  assert.equal(a.landing_page_path, "/events/");
});

test("QR views and the full funnel work with an existing Google tag", () => {
  const bridge = embed(conferenceParams, true);
  bridge.send("TF_LANDING_PAGE_VIEW", { lead_organization: "knowledge_bank_australia", email: "not-forwarded@example.invalid" });
  bridge.send("TF_LANDING_PAGE_VIEW");
  bridge.send("TF_FORM_STARTED");
  bridge.send("TF_LEAD_SUBMITTED");
  assert.deepEqual(bridge.events().map((event) => event[1]), ["tf_landing_page_view", "tf_qr_landing_view", "tf_form_start", "generate_lead"]);
  assert.equal(bridge.events()[0][2].entry_method, "qr_brochure");
  assert.equal(bridge.events()[0][2].lead_organization, "knowledge_bank_australia");
  assert.equal(bridge.events()[0][2].email, undefined);
});

test("plain visits queue a view without fabricated organizer/campaign tags or QR events", () => {
  const bridge = embed("");
  assert.equal(bridge.iframeUrl.searchParams.has("organization_slug"), false);
  assert.equal(bridge.iframeUrl.searchParams.has("utm_source"), false);
  bridge.send("TF_LANDING_PAGE_VIEW");
  assert.equal(bridge.events().length, 1);
  assert.equal(bridge.events()[0][2].entry_method, "untagged");
});

test("QR detection works for another organizer and other placements", () => {
  const bridge = embed("organization_slug=another_partner&utm_medium=qr&utm_content=poster&tf_event=another-conference");
  bridge.send("TF_LANDING_PAGE_VIEW");
  assert.equal(bridge.events()[0][2].entry_method, "qr");
  assert.equal(bridge.events()[1][1], "tf_qr_landing_view");
  const email = embed("utm_source=newsletter&utm_medium=email");
  email.send("TF_LANDING_PAGE_VIEW");
  assert.equal(email.events().length, 1);
  assert.equal(email.events()[0][2].entry_method, "other_tagged");
});

test("embed ignores messages from another origin/window and unknown message types", () => {
  const bridge = embed();
  bridge.send("TF_LEAD_SUBMITTED", {}, "https://example.invalid");
  bridge.send("TF_LEAD_SUBMITTED", {}, "https://landing-page-tf.vercel.app", {});
  bridge.send("toString");
  assert.equal(bridge.events().length, 0);
});

function serializeLead(visit, env = {}, formOverrides = {}) {
  const mainSource = fs.readFileSync(path.join(root, "public/main.js"), "utf8");
  const collectSource = mainSource.slice(mainSource.indexOf("function collectFormData("), mainSource.indexOf("async function submitLead("));
  const formValues = {
    fullName: "Form check", company: "Test building", email: "test@example.invalid",
    eventName: visit.content.defaultEventName, suburb: "Sunnybank", role: "Strata Manager",
    mainInterest: "EV charging", contactConsent: "yes", note: "Please follow up.",
    ...formOverrides
  };
  const context = vm.createContext({
    require, __dirname: root, process: { env }, console,
    attribution: visit.attribution, attributionMeta: visit.meta, organizationConfig: visit.content,
    FormData: class { entries() { return Object.entries(formValues); } }
  });
  vm.runInContext(collectSource, context);
  context.payload = vm.runInContext("collectFormData({})", context);
  const serverSource = fs.readFileSync(path.join(root, "server.js"), "utf8").split("const server = http.createServer")[0];
  vm.runInContext(serverSource, context);
  const { lead, error } = vm.runInContext("cleanLeadPayload(payload)", context);
  return {
    payload: context.payload,
    lead,
    error,
    emailHtml: lead ? vm.runInContext("leadAttributionHtml(cleanLeadPayload(payload).lead)", context) : null
  };
}

test("conference lead serialization preserves organization, event, suburb and role despite a legacy server default", () => {
  const visit = attributionClient().visit("/events", conferenceParams);
  const { lead, error } = serializeLead(visit, { EVENT_NAME: "QStrata 2026" });
  assert.equal(error, undefined);
  assert.equal(lead.organization_slug, "knowledge_bank_australia");
  assert.equal(lead.event_name, "2026 Management Rights Conference");
  assert.equal(lead.utm_campaign, conferenceParams.get("utm_campaign"));
  assert.equal(lead.note, "Suburb: Sunnybank\nRole: Strata Manager\nMessage: Please follow up.");
});

test("merchandise stays general through attribution, form, server and email after a conference visit", () => {
  const client = attributionClient();
  client.visit("/events", conferenceParams);
  const bridge = embed(merchandiseParams);
  const visit = client.visit("/events", bridge.iframeUrl.searchParams);
  assert.equal(visit.attribution.organization_slug, "general");
  assert.equal(visit.attribution.event_name, "General");
  assert.equal(visit.attribution.event_slug, null);
  assert.equal(visit.meta.eventNameSource, null);
  assert.equal(visit.content.defaultEventName, "General");
  const { payload, lead, error, emailHtml } = serializeLead(visit, { EVENT_NAME: "QStrata 2026" });
  assert.equal(error, undefined);
  assert.equal(payload.eventName, "General");
  assert.equal(lead.event_name, "General");
  assert.equal(lead.organization_slug, "general");
  assert.equal(lead.event_slug, null);
  for (const [key, value] of merchandiseParams) assert.equal(lead[key], value, key);
  assert.match(emailHtml, />General</);
  assert.doesNotMatch(emailHtml, /QStrata/);
});

test("shared event defaults override a cached form name but retain the legacy QStrata route default", () => {
  for (const route of ["/events", "/events/"]) {
    const visit = attributionClient().visit(route, merchandiseParams);
    const { lead, error } = serializeLead(visit, { EVENT_NAME: "QStrata 2026" }, { eventName: "QStrata 2026" });
    assert.equal(error, undefined);
    assert.equal(lead.event_name, "General", route);
    assert.equal(lead.utm_campaign, "generic_merchandise");
  }
  const legacy = serializeLead(attributionClient().visit("/qstrata"), { EVENT_NAME: "QStrata 2026" });
  assert.equal(legacy.lead.event_name, "QStrata 2026");
});

test("plain events use General without a server override and broad campaigns retain their identity", () => {
  const plain = serializeLead(attributionClient().visit("/events"));
  assert.equal(plain.lead.event_name, "General");
  for (const route of ["/building-solutions", "/building-solutions-review-first"]) {
    const broad = serializeLead(attributionClient().visit(route, "utm_content=building_review_video"), { EVENT_NAME: "QStrata 2026" });
    assert.equal(broad.lead.event_name, "brisbane-channel collab");
    assert.equal(broad.lead.event_slug, "building-review");
  }
});
