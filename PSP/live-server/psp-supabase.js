(() => {
  const config = window.PSP_SUPABASE_CONFIG;
  if (!config || !window.supabase?.createClient) {
    window.PSPAuth = { error: "No se pudo cargar la conexión con Supabase." };
    return;
  }

  const client = window.supabase.createClient(config.url, config.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });

  async function getProfile(userId) {
    const { data, error } = await client
      .from("profiles")
      .select("id, full_name, role, active")
      .eq("id", userId)
      .single();
    if (error) throw error;
    return data;
  }

  window.PSPAuth = {
    client,
    getProfile,
    async currentUser() {
      const { data: { session } } = await client.auth.getSession();
      if (!session?.user) return null;
      return { user: session.user, profile: await getProfile(session.user.id) };
    },
    async signOut() {
      await client.auth.signOut();
      location.replace("login.html");
    },
  };
})();
