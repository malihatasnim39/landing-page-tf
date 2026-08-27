const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const port = Number(process.env.PORT || 8080);
const root = __dirname;
const publicDir = path.join(root, "public");
const indexPath = path.join(publicDir, "index.html");
const adminEmail = process.env.ADMIN_EMAIL || "tech@terrafuse.com.au";
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseTable = process.env.SUPABASE_LEADS_TABLE || "building_review_enquiries";
const sendgridApiKey = process.env.SENDGRID_API_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || "TerraFuse <noreply@terrafuse.com.au>";
const publicSiteUrl = process.env.PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
const emailLogoUrl = process.env.EMAIL_LOGO_URL;
const configuredEventName = process.env.EVENT_NAME;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm"
};

function safeJoin(baseDir, requestPath) {
  const decoded = decodeURIComponent(requestPath.split("?")[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const resolved = path.join(baseDir, normalized);
  return resolved.startsWith(baseDir) ? resolved : null;
}

function sendFile(response, filePath) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500, {
        "Content-Type": "text/plain; charset=utf-8"
      });
      response.end(error.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const cacheControl = [".html", ".css", ".js", ".mp4", ".webm"].includes(extension)
      ? "no-cache"
      : "public, max-age=86400";

    response.writeHead(200, {
      "Content-Type": mimeTypes[extension] || "application/octet-stream",
      "Cache-Control": cacheControl,
      "Content-Security-Policy": "frame-ancestors 'self' https://terrafuse.com.au https://www.terrafuse.com.au;",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Content-Type-Options": "nosniff"
    });
    response.end(data);
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 32_000) {
        reject(new Error("Payload too large"));
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });

    request.on("error", reject);
  });
}

function cleanString(value, maxLength = 500) {
  return String(value || "").trim().slice(0, maxLength);
}

function cleanNullableString(value, maxLength = 500) {
  const text = cleanString(value, maxLength);
  return text || null;
}

function cleanLeadPayload(payload) {
  const trackingEventName = cleanString(payload.trackingEventName, 160);
  const defaultEventName = cleanString(configuredEventName || payload.eventName || "TerraFuse Events", 160);
  const lead = {
    organization_slug: cleanNullableString(payload.organization_slug, 120),
    organization_name: cleanNullableString(payload.organization_name, 160),
    event_slug: cleanNullableString(payload.event_slug, 160),
    event_name: trackingEventName || defaultEventName,
    landing_page_variant: cleanNullableString(payload.landing_page_variant, 120),
    landing_page_path: cleanNullableString(payload.landing_page_path, 500),
    landing_page_url: cleanNullableString(payload.landing_page_url, 1000),
    iframe_url: cleanNullableString(payload.iframe_url, 1000),
    parent_url: cleanNullableString(payload.parent_url, 1000),
    parent_path: cleanNullableString(payload.parent_path, 500),
    referrer: cleanNullableString(payload.referrer, 1000),
    utm_source: cleanNullableString(payload.utm_source, 160),
    utm_medium: cleanNullableString(payload.utm_medium, 160),
    utm_campaign: cleanNullableString(payload.utm_campaign, 260),
    utm_content: cleanNullableString(payload.utm_content, 260),
    utm_term: cleanNullableString(payload.utm_term, 260),
    utm_id: cleanNullableString(payload.utm_id, 160),
    full_name: cleanString(payload.fullName, 160),
    company: cleanString(payload.company, 160),
    email: cleanString(payload.email, 254).toLowerCase(),
    mobile: cleanString(payload.mobile, 80),
    building_count: payload.buildingCount === "" || payload.buildingCount == null
      ? null
      : Number(payload.buildingCount),
    main_interest: cleanString(payload.mainInterest, 80),
    preferred_follow_up_time: cleanString(payload.followUpTime, 160),
    note: cleanString(payload.note, 2000),
    contact_consent: payload.contactConsent === true,
    marketing_consent: payload.marketingConsent === true
  };

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validBuildingCount = lead.building_count == null
    || (Number.isInteger(lead.building_count) && lead.building_count >= 0);

  if (
    !lead.full_name
    || !lead.event_name
    || !lead.company
    || !emailPattern.test(lead.email)
    || !lead.main_interest
    || !lead.contact_consent
    || !validBuildingCount
  ) {
    return { error: "Please complete the required fields with valid details." };
  }

  return { lead };
}

async function insertLead(lead) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase is not configured");
  }

  const endpoint = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${encodeURIComponent(supabaseTable)}`;
  const result = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": supabaseServiceRoleKey,
      "Authorization": `Bearer ${supabaseServiceRoleKey}`,
      "Prefer": "return=representation"
    },
    body: JSON.stringify(lead)
  });

  if (!result.ok) {
    const detail = await result.text();
    throw new Error(`Supabase insert failed: ${detail}`);
  }

  const rows = await result.json();
  return rows[0];
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseEmailSender(value) {
  const sender = cleanString(value, 254);
  const match = sender.match(/^(.*?)\s*<([^>]+)>$/);

  if (!match) {
    return { email: sender };
  }

  return {
    email: match[2].trim(),
    name: match[1].trim().replace(/^"|"$/g, "")
  };
}

function absoluteUrl(value) {
  const url = cleanString(value, 500);

  if (!url) {
    return "";
  }

  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function publicAssetUrl(pathname) {
  const baseUrl = absoluteUrl(publicSiteUrl);

  if (!baseUrl) {
    return "";
  }

  return `${baseUrl.replace(/\/$/, "")}${pathname}`;
}

function customerEmailSignatureHtml() {
  const logoUrl = absoluteUrl(emailLogoUrl) || publicAssetUrl("/images/logo_main.png");

  if (!logoUrl) {
    return "";
  }

  return `
    <div style="margin-top:24px">
      <img src="${escapeHtml(logoUrl)}" alt="TerraFuse" width="160" style="display:block;width:160px;max-width:100%;height:auto">
    </div>
  `;
}

function leadSummaryText(lead) {
  return [
    `Event: ${lead.event_name}`,
    `Full name: ${lead.full_name}`,
    `Company: ${lead.company}`,
    `Email: ${lead.email}`,
    `Mobile: ${lead.mobile}`,
    `Number of buildings under management: ${lead.building_count ?? "Not provided"}`,
    `Main interest: ${lead.main_interest}`,
    `Preferred follow-up time: ${lead.preferred_follow_up_time || "Not provided"}`,
    `Optional note: ${lead.note || "Not provided"}`,
    `Contact consent: ${lead.contact_consent ? "Yes" : "No"}`,
    `Marketing updates consent: ${lead.marketing_consent ? "Yes" : "No"}`
  ].join("\n");
}

function leadAttributionText(lead) {
  return [
    `Organization: ${lead.organization_name || "Not provided"}`,
    `Event: ${lead.event_name || "Not provided"}`,
    `Event slug: ${lead.event_slug || "Not provided"}`,
    `Landing page: ${lead.landing_page_path || "Not provided"}`,
    `Campaign: ${lead.utm_campaign || "Not provided"}`,
    `Source / Medium: ${lead.utm_source || "Not provided"} / ${lead.utm_medium || "Not provided"}`,
    `Content: ${lead.utm_content || "Not provided"}`,
    `Parent URL: ${lead.parent_url || "Not provided"}`
  ].join("\n");
}

function leadSummaryHtml(lead) {
  return `
    <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:680px">
      ${[
        ["Event", lead.event_name],
        ["Full name", lead.full_name],
        ["Company", lead.company],
        ["Email", lead.email],
        ["Mobile", lead.mobile],
        ["Number of buildings under management", lead.building_count ?? "Not provided"],
        ["Main interest", lead.main_interest],
        ["Preferred follow-up time", lead.preferred_follow_up_time || "Not provided"],
        ["Optional note", lead.note || "Not provided"],
        ["Contact consent", lead.contact_consent ? "Yes" : "No"],
        ["Marketing updates consent", lead.marketing_consent ? "Yes" : "No"]
      ].map(([label, value]) => `
        <tr>
          <th align="left" style="border:1px solid #d9e5ee;background:#f5f9fc">${escapeHtml(label)}</th>
          <td style="border:1px solid #d9e5ee">${escapeHtml(value)}</td>
        </tr>
      `).join("")}
    </table>
  `;
}

function leadAttributionHtml(lead) {
  return `
    <h2 style="font-size:18px;margin:24px 0 12px">Lead attribution</h2>
    <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:680px">
      ${[
        ["Organization", lead.organization_name || "Not provided"],
        ["Event", lead.event_name || "Not provided"],
        ["Event slug", lead.event_slug || "Not provided"],
        ["Landing page", lead.landing_page_path || "Not provided"],
        ["Campaign", lead.utm_campaign || "Not provided"],
        ["Source / Medium", `${lead.utm_source || "Not provided"} / ${lead.utm_medium || "Not provided"}`],
        ["Content", lead.utm_content || "Not provided"],
        ["Parent URL", lead.parent_url || "Not provided"]
      ].map(([label, value]) => `
        <tr>
          <th align="left" style="border:1px solid #d9e5ee;background:#f5f9fc">${escapeHtml(label)}</th>
          <td style="border:1px solid #d9e5ee">${escapeHtml(value)}</td>
        </tr>
      `).join("")}
    </table>
  `;
}

async function sendEmail({ to, subject, text, html }) {
  let result;

  if (sendgridApiKey) {
    result = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sendgridApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: parseEmailSender(emailFrom),
        subject,
        content: [
          { type: "text/plain", value: text },
          { type: "text/html", value: html }
        ]
      })
    });
  } else if (resendApiKey) {
    result = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: emailFrom,
        to,
        subject,
        text,
        html
      })
    });
  } else {
    console.warn("No email API key is configured; skipping email send.");
    return null;
  }

  if (!result.ok) {
    const detail = await result.text();
    throw new Error(`Email send failed: ${detail}`);
  }

  return result.status === 202 || result.status === 204 ? null : result.json();
}

async function sendLeadEmails(lead) {
  const summaryText = leadSummaryText(lead);
  const summaryHtml = leadSummaryHtml(lead);
  const attributionText = leadAttributionText(lead);
  const attributionHtml = leadAttributionHtml(lead);

  await Promise.all([
    sendEmail({
      to: lead.email,
      subject: "Your TerraFuse Building Suitability Review request",
      text: [
        `Hi ${lead.full_name},`,
        "",
        `Thanks for your Building Suitability Review enquiry for ${lead.event_name}. The TerraFuse team has received your request and will follow up with you after the event.`,
        "",
        "Your request details:",
        summaryText,
        "",
        "TerraFuse"
      ].join("\n"),
      html: `
        <p>Hi ${escapeHtml(lead.full_name)},</p>
        <p>Thanks for your Building Suitability Review enquiry for ${escapeHtml(lead.event_name)}. The TerraFuse team has received your request and will follow up with you after the event.</p>
        <p><strong>Your request details:</strong></p>
        ${summaryHtml}
        ${customerEmailSignatureHtml()}
      `
    }),
    sendEmail({
      to: adminEmail,
      subject: `New ${lead.event_name} review request: ${lead.full_name}`,
      text: [
        "A new Building Suitability Review request was submitted.",
        "",
        summaryText,
        "",
        "Lead attribution:",
        attributionText
      ].join("\n"),
      html: `
        <p>A new Building Suitability Review request was submitted.</p>
        ${summaryHtml}
        ${attributionHtml}
      `
    })
  ]);
}

async function handleLeadSubmission(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const payload = await readJsonBody(request);
    const { lead, error } = cleanLeadPayload(payload);

    if (error) {
      sendJson(response, 400, { error });
      return;
    }

    const storedLead = await insertLead(lead);

    try {
      await sendLeadEmails(storedLead || lead);
    } catch (error) {
      console.error(error);
    }

    sendJson(response, 200, { ok: true });
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: "Submission could not be processed." });
  }
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const pathname = requestUrl.pathname;

  if (pathname === "/api/leads") {
    handleLeadSubmission(request, response);
    return;
  }

  if (
    pathname === "/"
    || pathname === "/qstrata"
    || pathname === "/qstrata/"
    || pathname === "/events"
    || pathname === "/events/"
    || pathname === "/sca-queensland"
    || pathname === "/sca-queensland/"
    || pathname === "/smart-strata"
    || pathname === "/smart-strata/"
    || pathname === "/building-solutions"
    || pathname === "/building-solutions/"
    || pathname === "/building-solutions-review-first"
    || pathname === "/building-solutions-review-first/"
  ) {
    sendFile(response, indexPath);
    return;
  }

  if (pathname.startsWith("/images/")) {
    const filePath = safeJoin(publicDir, pathname);
    if (filePath) {
      sendFile(response, filePath);
      return;
    }
  }

  if (pathname.startsWith("/videos/")) {
    const filePath = safeJoin(publicDir, pathname);
    if (filePath) {
      sendFile(response, filePath);
      return;
    }
  }

  const publicPath = safeJoin(publicDir, pathname);
  if (publicPath) {
    sendFile(response, publicPath);
    return;
  }

  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
});

server.listen(port, () => {
  console.log(`TerraFuse events landing page listening on http://localhost:${port}`);
});
