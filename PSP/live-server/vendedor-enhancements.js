(() => {
  let channel;
  const detailHtml = r => `<div class="modal-body request-detail">
    <div class="detail-summary">
      <div><small>Cliente</small><b>${esc(r.client_name || 'Sin nombre')}</b></div>
      <div><small>Solicitud</small><b>PSP-${r.request_number}</b></div>
      <div><small>Seguro</small><b>${esc(r.insurance_type)}</b></div>
      <div><small>Estado</small><b class="modal-status ${statusClass(r.status)}">${labels[r.status] || r.status}</b></div>
      <div><small>Fecha</small><b>${new Date(r.created_at).toLocaleDateString('es-AR')}</b></div>
      <div><small>Monto</small><b>${money(r.amount)}</b></div>
    </div>
    ${r.admin_notes ? `<article class="correction-message"><strong>Mensaje de administración</strong><p>${esc(r.admin_notes)}</p></article>` : ''}
  </div>`;

  function openNotifications() {
    const corrections = requests.filter(r => r.status === 'needs_correction');
    const correctionRows = corrections.map(r => `<article class="notification-correction" data-request-detail="${r.request_number}"><span>!</span><div><b>Corregir PSP-${r.request_number}</b><small>${esc(r.admin_notes || 'Administración solicitó revisar los datos.')}</small></div></article>`).join('');
    const helpRows = helps.map(h => `<article><span>${h.status === 'resolved' ? '✓' : '▷'}</span><div><b>${h.status === 'resolved' ? 'Consulta respondida' : 'Consulta enviada'}</b><small>${esc(h.admin_response || h.message)}</small></div></article>`).join('');
    modal('Notificaciones', 'CENTRO DE ACTIVIDAD', `<div class="notification-list">${correctionRows + helpRows || '<article><div><b>Sin notificaciones</b><small>No tenés novedades pendientes.</small></div></article>'}</div>`);
  }

  function updateNotificationDot() {
    const dot = document.querySelector('.header-user>button i');
    if (dot) dot.hidden = !requests.some(r => r.status === 'needs_correction');
  }

  document.addEventListener('click', e => {
    const detail = e.target.closest('[data-request-detail]');
    if (detail) {
      const r = requests.find(x => x.request_number == detail.dataset.requestDetail);
      if (r) modal('Detalle de solicitud', 'SEGUIMIENTO', detailHtml(r));
    }
  });

  const notificationButton = document.querySelector('.header-user>button');
  notificationButton?.addEventListener('click', openNotifications);

  async function begin(e) {
    const auth = e?.detail || await window.PSPAuth.currentUser();
    if (!auth || channel) return;
    updateNotificationDot();
    channel = db.channel(`seller-requests-${auth.user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'insurance_requests', filter: `seller_id=eq.${auth.user.id}` }, async payload => {
        await load().catch(fail);
        updateNotificationDot();
        if (payload.new.status === 'needs_correction') toast('Solicitud para corregir', payload.new.admin_notes || 'Revisá la indicación de administración.', 'error');
        else toast('Solicitud actualizada', `Nuevo estado: ${labels[payload.new.status] || payload.new.status}`);
      })
      .subscribe();
  }

  const observer = new MutationObserver(updateNotificationDot);
  observer.observe(document.querySelector('.recent'), { childList: true, subtree: true });
  window.addEventListener('psp:authenticated', begin);
  if (document.body.classList.contains('auth-authorized')) begin();
})();