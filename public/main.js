const root = document.documentElement;
const toggle = document.querySelector(".theme-toggle");
const form = document.querySelector("#lead-form");
const year = document.querySelector("#year");

const SUBMISSION_ENDPOINT = "/api/leads";

function applyTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem("terrafuse-theme", theme);
  const isDark = theme === "dark";
  if (toggle) {
    toggle.setAttribute("aria-pressed", String(isDark));
    toggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  }
}

function collectFormData(formElement) {
  const data = Object.fromEntries(new FormData(formElement).entries());
  return {
    ...data,
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

  try {
    const response = await submitLead(collectFormData(form));
    if (!response.ok) {
      throw new Error("Submission failed");
    }
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

applyTheme(root.dataset.theme || "light");
