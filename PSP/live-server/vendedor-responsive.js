(() => {
  const header = document.querySelector("main > header");
  const sidebar = document.querySelector(".sidebar");
  if (!header || !sidebar) return;

  const button = document.createElement("button");
  button.className = "seller-menu-button";
  button.type = "button";
  button.setAttribute("aria-label", "Abrir menú");
  button.setAttribute("aria-expanded", "false");
  button.textContent = "☰";
  header.prepend(button);

  const backdrop = document.createElement("div");
  backdrop.className = "seller-menu-backdrop";
  document.body.append(backdrop);

  const close = () => {
    sidebar.classList.remove("menu-open");
    backdrop.classList.remove("show");
    button.textContent = "☰";
    button.setAttribute("aria-expanded", "false");
  };
  const open = () => {
    sidebar.classList.add("menu-open");
    backdrop.classList.add("show");
    button.textContent = "×";
    button.setAttribute("aria-expanded", "true");
  };

  button.addEventListener("click", () => sidebar.classList.contains("menu-open") ? close() : open());
  backdrop.addEventListener("click", close);
  sidebar.querySelectorAll("a").forEach(link => link.addEventListener("click", close));
  window.addEventListener("resize", () => { if (window.innerWidth > 980) close(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape") close(); });
})();
