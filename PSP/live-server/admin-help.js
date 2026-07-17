(() => {
  const db = window.PSPAuth.client;
  let current = null, channel = null;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  async function fetchActivity() {
    const [help, follow] = await Promise.all([
      db.from('help_requests').select('*,seller:profiles!help_requests_seller_id_fkey(full_name)').order('created_at', {ascending:false}),
      db.from('insurance_requests').select('request_number,client_name,insurance_type,status,admin_notes,seller:profiles!insurance_requests_seller_id_fkey(full_name)').in('status',['pending','in_review','needs_correction']).order('created_at',{ascending:false})
    ]);
    if (help.error) throw help.error;
    if (follow.error) throw follow.error;
    return { helps: help.data || [], follow: follow.data || [] };
  }

  function setDot(count) {
    const dot = document.querySelector('[data-action="notifications"] i');
    if (dot) {
      dot.hidden = count === 0;
      dot.dataset.count = count;
    }
  }

  async function refreshDot() {
    try {
      const {helps, follow} = await fetchActivity();
      setDot(helps.filter(x => x.status !== 'resolved').length + follow.length);
    } catch {}
  }

  async function open() {
    try {
      const {helps, follow} = await fetchActivity();
      const pendingHelp = helps.filter(h => h.status !== 'resolved');
      setDot(pendingHelp.length + follow.length);
      const body = document.querySelector('#modalBody');
      document.querySelector('#modalEyebrow').textContent = 'CENTRO DE ACTIVIDAD';
      document.querySelector('#modalTitle').textContent = 'Pendientes del equipo';
      document.querySelector('#modalDescription').textContent = 'Consultas de vendedores y solicitudes que requieren seguimiento.';
      const requestRows = follow.map(r => `<div class="guide-step activity-request"><span>${r.status === 'needs_correction' ? '!' : '↗'}</span><div><h3>PSP-${r.request_number} · ${esc(r.client_name || r.insurance_type)}</h3><p>${esc(r.seller?.full_name || 'Vendedor')} · ${esc(statusLabel[r.status] || r.status)}</p>${r.admin_notes ? `<small>${esc(r.admin_notes)}</small>` : ''}</div><button class="link" data-detail="${r.request_number}">Abrir</button></div>`).join('');
      const helpRows = helps.map(h => `<div class="guide-step"><span>${h.status === 'resolved' ? '✓' : '?'}</span><div style="flex:1"><h3>${esc(h.seller?.full_name || 'Vendedor')}</h3><p>${esc(h.message)}</p>${h.admin_response ? `<p><b>Respuesta:</b> ${esc(h.admin_response)}</p>` : `<textarea id="reply-${h.id}" placeholder="Escribí una respuesta..."></textarea><button class="primary" data-help-reply="${h.id}">Responder y resolver</button>`}</div></div>`).join('');
      body.innerHTML = `<div class="detail-body activity-center"><h3>Solicitudes para revisar <span>${follow.length}</span></h3>${requestRows || '<p class="empty-activity">No hay solicitudes pendientes.</p>'}<h3>Ayuda de vendedores <span>${pendingHelp.length}</span></h3>${helpRows || '<p class="empty-activity">No hay consultas de ayuda.</p>'}</div>`;
      document.querySelector('#overlay').hidden = false;
      document.body.style.overflow = 'hidden';
    } catch (error) { alert(error.message); }
  }

  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-action="notifications"],[data-help-reply]');
    if (!b) return;
    if (b.dataset.action === 'notifications') return open();
    const text = document.querySelector(`#reply-${b.dataset.helpReply}`).value.trim();
    if (text.length < 2) return;
    const {error} = await db.from('help_requests').update({status:'resolved',admin_response:text,responded_by:current.user.id,responded_at:new Date().toISOString()}).eq('id',b.dataset.helpReply);
    if (error) return alert(error.message);
    open();
  });

  async function start(e) {
    current = e?.detail || await window.PSPAuth.currentUser();
    if (!current) return;
    refreshDot();
    if (!channel) channel = db.channel('admin-activity')
      .on('postgres_changes',{event:'*',schema:'public',table:'insurance_requests'},refreshDot)
      .on('postgres_changes',{event:'*',schema:'public',table:'help_requests'},refreshDot)
      .subscribe();
  }
  window.addEventListener('psp:authenticated', start);
  if (document.body.classList.contains('auth-authorized')) start();
})();