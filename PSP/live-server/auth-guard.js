(() => {
  const loginUrl = `login.html?next=${encodeURIComponent(location.pathname.split("/").pop() || "index.html")}`;
  const requiredRole = location.pathname.endsWith("vendedor.html") ? "seller" : "admin";

  function initials(name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 3).map(part => part[0]).join("").toUpperCase();
  }
  function applyIdentity(profile) {
    const shortName = profile.full_name.split(/\s+/)[0];
    const letters = initials(profile.full_name);
    document.querySelectorAll(".profile strong, .header-user strong").forEach(el => el.textContent = profile.full_name);
    document.querySelectorAll(".profile>span, .header-user>span, .avatar").forEach(el => el.textContent = letters);
    const greeting = document.querySelector(".welcome h1");
    if (greeting) greeting.innerHTML = `Hola, ${shortName} <span>👋</span>`;
  }
  function addLogout() {
    const sidebar = document.querySelector(".sidebar");
    const profile = sidebar?.querySelector(".profile");
    if (!sidebar || !profile || sidebar.querySelector(".auth-logout")) return;
    const button = document.createElement("button");
    button.className = "auth-logout";
    button.innerHTML = "<span>↪</span>Cerrar sesión";
    button.addEventListener("click", () => window.PSPAuth.signOut());
    profile.before(button);
  }
  function showAccessError(message) {
    document.body.innerHTML = `<main class="auth-error"><div><span>!</span><h1>No se pudo abrir el panel</h1><p>${message}</p><a href="login.html">Volver al inicio de sesión</a></div></main>`;
    document.body.classList.add("auth-authorized");
  }

  async function protect() {
    if (!window.PSPAuth?.client) return showAccessError(window.PSPAuth?.error || "No se pudo iniciar la conexión.");
    try {
      const current = await window.PSPAuth.currentUser();
      if (!current) return location.replace(loginUrl);
      if (!current.profile.active) {
        await window.PSPAuth.client.auth.signOut();
        return location.replace("login.html?error=inactive");
      }
      if (current.profile.role !== requiredRole) {
        return location.replace(current.profile.role === "admin" ? "index.html" : "vendedor.html");
      }
      applyIdentity(current.profile);
      addLogout();
      document.body.classList.add("auth-authorized");
      window.dispatchEvent(new CustomEvent("psp:authenticated", { detail: current }));
    } catch (error) {
      console.error(error);
      showAccessError("La sesión no pudo validarse. Intentá ingresar nuevamente.");
    }
  }

  protect();
})();
