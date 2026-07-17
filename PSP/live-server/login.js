(() => {
  const form = document.querySelector("#loginForm");
  const email = document.querySelector("#email");
  const password = document.querySelector("#password");
  const submit = document.querySelector("#submitButton");
  const message = document.querySelector("#loginMessage");

  function showMessage(text, success = false) {
    message.textContent = text;
    message.style.background = success ? "#e9f6eb" : "#fff0ee";
    message.style.color = success ? "#378f4a" : "#bd4b45";
    message.hidden = false;
  }
  function setLoading(loading) {
    submit.disabled = loading;
    submit.querySelector("span").textContent = loading ? "Verificando..." : "Ingresar";
  }
  function friendlyError(error) {
    const value = String(error?.message || "").toLowerCase();
    if (value.includes("invalid login")) return "El correo o la contraseña no son correctos.";
    if (value.includes("email not confirmed")) return "Primero tenés que confirmar tu correo electrónico.";
    return "No pudimos iniciar sesión. Revisá los datos e intentá nuevamente.";
  }
  async function redirectAuthenticated() {
    if (!window.PSPAuth?.client) return;
    try {
      const current = await window.PSPAuth.currentUser();
      if (current?.profile?.active) location.replace(current.profile.role === "admin" ? "index.html" : "vendedor.html");
    } catch (_) { /* La pantalla de acceso permanece disponible. */ }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault(); message.hidden = true;
    if (!window.PSPAuth?.client) return showMessage("No se pudo conectar con Supabase.");
    setLoading(true);
    try {
      const { data, error } = await window.PSPAuth.client.auth.signInWithPassword({ email: email.value.trim(), password: password.value });
      if (error) throw error;
      const profile = await window.PSPAuth.getProfile(data.user.id);
      if (!profile.active) { await window.PSPAuth.client.auth.signOut(); throw new Error("inactive"); }
      location.replace(profile.role === "admin" ? "index.html" : "vendedor.html");
    } catch (error) {
      showMessage(error.message === "inactive" ? "Esta cuenta está desactivada. Contactá al administrador." : friendlyError(error));
      setLoading(false);
    }
  });

  document.querySelector("#togglePassword").addEventListener("click", event => {
    const visible = password.type === "text";
    password.type = visible ? "password" : "text";
    event.currentTarget.textContent = visible ? "◉" : "⊘";
    event.currentTarget.setAttribute("aria-label", visible ? "Mostrar contraseña" : "Ocultar contraseña");
  });
  document.querySelector("#forgotPassword").addEventListener("click", async () => {
    if (!email.value.trim()) { email.focus(); return showMessage("Ingresá tu correo para recuperar la contraseña."); }
    setLoading(true);
    const { error } = await window.PSPAuth.client.auth.resetPasswordForEmail(email.value.trim(), { redirectTo: `${location.origin}${location.pathname.replace("login.html", "login.html")}` });
    setLoading(false);
    if (error) return showMessage("No pudimos enviar el correo de recuperación.");
    showMessage("Te enviamos un enlace para recuperar tu contraseña.", true);
  });

  const params = new URLSearchParams(location.search);
  if (params.get("error") === "inactive") showMessage("Esta cuenta está desactivada.");
  redirectAuthenticated();
})();
