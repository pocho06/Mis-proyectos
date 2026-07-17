(() => {
  const container = document.querySelector('#beneficiaryRows');
  const hidden = document.querySelector('#lifeBeneficiary');
  const addButton = document.querySelector('#addBeneficiary');
  const totalLabel = document.querySelector('#beneficiaryTotal');
  if (!container || !hidden) return;

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function addRow(data = {}) {
    const row = document.createElement('div');
    row.className = 'beneficiary-row';
    row.innerHTML = `
      <label><span>Nombre completo</span><input data-beneficiary="name" placeholder="Nombre y apellido" value="${escapeHtml(data.name || '')}"></label>
      <label><span>DNI</span><input data-beneficiary="dni" inputmode="numeric" maxlength="9" placeholder="Sin puntos" value="${escapeHtml(data.dni || '')}"></label>
      <label><span>Parentesco</span><select data-beneficiary="relationship"><option value="">Seleccionar</option><option>Padre / Madre</option><option>Cónyuge</option><option>Hijo/a</option><option>Hermano/a</option><option>Otro</option></select></label>
      <label><span>Porcentaje</span><div class="percent-input"><input data-beneficiary="percentage" type="number" min="1" max="100" placeholder="0" value="${escapeHtml(data.percentage || '')}"><b>%</b></div></label>
      <button type="button" class="remove-beneficiary" title="Eliminar beneficiario" aria-label="Eliminar beneficiario">×</button>`;
    row.querySelector('[data-beneficiary="relationship"]').value = data.relationship || '';
    row.querySelectorAll('input,select').forEach(control => control.addEventListener('input', sync));
    row.querySelector('.remove-beneficiary').addEventListener('click', () => {
      if (container.children.length === 1) {
        row.querySelectorAll('input,select').forEach(control => control.value = '');
      } else row.remove();
      sync();
    });
    container.append(row);
    sync();
  }

  function values() {
    return [...container.querySelectorAll('.beneficiary-row')].map(row => ({
      name: row.querySelector('[data-beneficiary="name"]').value.trim(),
      dni: row.querySelector('[data-beneficiary="dni"]').value.replace(/\D/g, ''),
      relationship: row.querySelector('[data-beneficiary="relationship"]').value,
      percentage: Number(row.querySelector('[data-beneficiary="percentage"]').value) || 0
    }));
  }

  function sync() {
    const rows = values();
    hidden.value = rows.filter(x => x.name || x.dni || x.relationship || x.percentage)
      .map(x => `${x.name} · DNI ${x.dni} · ${x.relationship} · ${x.percentage}%`).join('\n');
    const total = rows.reduce((sum, item) => sum + item.percentage, 0);
    totalLabel.textContent = `${total}%`;
    totalLabel.className = total === 100 ? 'complete' : total > 100 ? 'over' : '';
  }

  function restore() {
    if (!hidden.value || container.dataset.restored === hidden.value) return;
    const parsed = hidden.value.split('\n').map(line => {
      const parts = line.split('·').map(x => x.trim());
      return {name: parts[0], dni: (parts[1] || '').replace(/\D/g, ''), relationship: parts[2], percentage: (parts[3] || '').replace(/\D/g, '')};
    }).filter(x => x.name);
    if (!parsed.length) return;
    container.innerHTML = '';
    parsed.forEach(addRow);
    container.dataset.restored = hidden.value;
  }

  addButton.addEventListener('click', () => {
    addRow();
    const rows = container.querySelectorAll('.beneficiary-row');
    rows[rows.length - 1].querySelector('input').focus();
  });

  document.querySelector('.form-card .primary')?.addEventListener('click', event => {
    const lifeStep = document.querySelector('.life-fields');
    if (!lifeStep || lifeStep.hidden || lifeStep.classList.contains('wizard-hidden')) return;
    const rows = values(), total = rows.reduce((sum, item) => sum + item.percentage, 0);
    const invalidDni = rows.find(item => item.dni && (item.dni.length < 7 || item.dni.length > 9));
    if (invalidDni || total !== 100) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (invalidDni) toast('DNI de beneficiario inválido', 'Ingresá entre 7 y 9 números.', 'error');
      else toast('Revisá los porcentajes', `El total asignado es ${total}% y debe ser 100%.`, 'error');
    }
  }, true);

  addRow();
  window.addEventListener('psp:authenticated', () => setTimeout(restore, 700));
})();