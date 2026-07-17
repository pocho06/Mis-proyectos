const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector(".nav-toggle");
const year = document.querySelector("[data-year]");
const form = document.querySelector("[data-contact-form]");

if (year) {
  year.textContent = new Date().getFullYear();
}

const closeNav = () => {
  document.body.classList.remove("nav-open");
  nav?.classList.remove("is-open");
  navToggle?.setAttribute("aria-expanded", "false");
};

navToggle?.addEventListener("click", () => {
  const isOpen = nav?.classList.toggle("is-open");
  document.body.classList.toggle("nav-open", Boolean(isOpen));
  navToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
});

nav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    closeNav();
  }
});

window.addEventListener("scroll", () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const message = String(formData.get("message") || "").trim();

  const body = [
    `Nombre: ${name}`,
    `Email: ${email}`,
    "",
    "Proyecto:",
    message,
  ].join("\n");

  const mailto = new URL("mailto:fabriciopoccioni1@gmail.com");
  mailto.searchParams.set("subject", "Consulta desde The Programming Studio");
  mailto.searchParams.set("body", body);

  window.location.href = mailto.toString();
});
