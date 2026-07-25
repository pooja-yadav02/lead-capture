(function () {
  const tbody = document.getElementById('leads-tbody');
  const statsRow = document.getElementById('stats-row');
  const searchInput = document.getElementById('search-input');
  const statusFilter = document.getElementById('status-filter');

  let allLeads = []; // last fetched full set, used for client-side stats
  let debounceTimer = null;

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) +
      ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  function renderStats(leads) {
    const counts = { New: 0, Contacted: 0, Closed: 0 };
    leads.forEach((l) => { counts[l.status] = (counts[l.status] || 0) + 1; });

    statsRow.innerHTML = `
      <div class="stat-pill"><strong>${leads.length}</strong> total</div>
      <div class="stat-pill"><strong>${counts.New}</strong> new</div>
      <div class="stat-pill"><strong>${counts.Contacted}</strong> contacted</div>
      <div class="stat-pill"><strong>${counts.Closed}</strong> closed</div>
    `;
  }

  function renderTable(leads) {
    if (leads.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No leads match this view yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = leads.map((lead) => `
      <tr data-id="${lead._id}">
        <td>
          <div class="lead-name">${escapeHtml(lead.name)}</div>
          <div class="lead-email">${escapeHtml(lead.email)}</div>
        </td>
        <td><span class="budget-tag">${escapeHtml(lead.budgetRange)}</span></td>
        <td><div class="lead-message">${escapeHtml(lead.message)}</div></td>
        <td><span class="lead-date">${formatDate(lead.createdAt)}</span></td>
        <td>
          <select class="status-select status-${lead.status}" data-id="${lead._id}">
            <option value="New" ${lead.status === 'New' ? 'selected' : ''}>New</option>
            <option value="Contacted" ${lead.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
            <option value="Closed" ${lead.status === 'Closed' ? 'selected' : ''}>Closed</option>
          </select>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.status-select').forEach((select) => {
      select.addEventListener('change', onStatusChange);
    });
  }

  async function onStatusChange(e) {
    const select = e.target;
    const id = select.dataset.id;
    const newStatus = select.value;
    const previousClass = select.className;
    select.disabled = true;

    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Update failed');
      }

      select.className = `status-select status-${newStatus}`;
      const local = allLeads.find((l) => l._id === id);
      if (local) local.status = newStatus;
      renderStats(allLeads);
    } catch (err) {
      alert('Could not update status. Please try again.');
      select.className = previousClass;
      select.value = select.className.replace('status-select status-', '');
    } finally {
      select.disabled = false;
    }
  }

  async function fetchLeads() {
    const search = searchInput.value.trim();
    const status = statusFilter.value;
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);

    tbody.innerHTML = `<tr><td colspan="5" class="loading-state">Loading leads…</td></tr>`;

    try {
      const res = await fetch(`/api/leads?${params.toString()}`);
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Failed to load leads');
      }

      allLeads = result.leads;
      renderTable(allLeads);
      renderStats(allLeads);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Could not load leads. ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fetchLeads, 300);
  });

  statusFilter.addEventListener('change', fetchLeads);

  fetchLeads();
})();
