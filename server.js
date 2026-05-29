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
const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || "TerraFuse <noreply@terrafuse.com.au>";
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

function cleanLeadPayload(payload) {
  const lead = {
    event_name: cleanString(configuredEventName || payload.eventName || "QStrata 2026", 160),
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

async function sendEmail({ to, subject, text, html }) {
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY is not configured; skipping email send.");
    return null;
  }

  const result = await fetch("https://api.resend.com/emails", {
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

  if (!result.ok) {
    const detail = await result.text();
    throw new Error(`Email send failed: ${detail}`);
  }

  return result.json();
}

async function sendLeadEmails(lead) {
  const summaryText = leadSummaryText(lead);
  const summaryHtml = leadSummaryHtml(lead);

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
        <p>TerraFuse</p>
      `
    }),
    sendEmail({
      to: adminEmail,
      subject: `New ${lead.event_name} review request: ${lead.full_name}`,
      text: [
        "A new Building Suitability Review request was submitted.",
        "",
        summaryText
      ].join("\n"),
      html: `
        <p>A new Building Suitability Review request was submitted.</p>
        ${summaryHtml}
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

  if (pathname === "/" || pathname === "/qstrata" || pathname === "/qstrata/") {
    sendFile(response, indexPath);
    return;
  }

  if (pathname.startsWith("/images/")) {
    const filePath = safeJoin(root, pathname);
    if (filePath) {
      sendFile(response, filePath);
      return;
    }
  }

  if (pathname.startsWith("/videos/")) {
    const filePath = safeJoin(root, pathname);
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
  console.log(`TerraFuse QStrata landing page listening on http://localhost:${port}`);
});
