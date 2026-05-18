/* admin.js — Admin dashboard logic */
'use strict';

const API = '';
let allLeads = [];

// ── Stats ────────────────────────────────────────────────────────────────────
async function loadStats() {
  try {
    const data = await fetch(`${API}/api/stats`).then((r) => r.json());
    document.getElementById('stat-total-leads').textContent  = data.totalLeads;
    document.getElementById('stat-today-leads').textContent  = data.todayLeads;
    document.getElementById('stat-total-videos').textContent = data.totalVideos;
    document.getElementById('stat-top-ip').textContent =
      data.topVideo ? data.topVideo.ip_name : '—';
  } catch (_) { /* silent */ }
}

// ── Video filter dropdown ────────────────────────────────────────────────────
async function loadVideoFilter() {
  try {
    const videos = await fetch(`${API}/api/videos`).then((r) => r.json());
    const sel = document.getElementById('filter-video');
    videos.forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = `${v.ip_name} — ${v.title}`;
      sel.appendChild(opt);
    });
  } catch (_) { /* silent */ }
}

// ── Leads ────────────────────────────────────────────────────────────────────
async function loadLeads() {
  const tbody = document.getElementById('leads-tbody');
  try {
    allLeads = await fetch(`${API}/api/leads`).then((r) => r.json());
    renderLeads(allLeads);
  } catch (_) {
    tbody.innerHTML = '<tr><td colspan="9" class="loading">加载失败，请刷新重试</td></tr>';
  }
}

function renderLeads(leads) {
  const tbody = document.getElementById('leads-tbody');
  if (!leads.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty">暂无线索数据</td></tr>';
    return;
  }
  tbody.innerHTML = leads.map((l) => `
    <tr>
      <td>${escHtml(l.name)}</td>
      <td><a href="mailto:${escHtml(l.email)}">${escHtml(l.email)}</a></td>
      <td>${escHtml(l.phone || '—')}</td>
      <td>${escHtml(l.company || '—')}</td>
      <td>${escHtml(l.video_title || '—')}</td>
      <td>${l.ip_name ? `<span class="tag">${escHtml(l.ip_name)}</span>` : '—'}</td>
      <td>${escHtml(l.message ? (l.message.length > 40 ? l.message.slice(0, 40) + '…' : l.message) : '—')}</td>
      <td style="white-space:nowrap">${escHtml(formatDate(l.created_at))}</td>
      <td>
        <button class="btn btn--danger" data-id="${escHtml(l.id)}" onclick="deleteLead('${escHtml(l.id)}', this)">删除</button>
      </td>
    </tr>
  `).join('');
}

// ── Filters ──────────────────────────────────────────────────────────────────
function applyFilters() {
  const videoId = document.getElementById('filter-video').value;
  const search  = document.getElementById('filter-search').value.toLowerCase().trim();

  const filtered = allLeads.filter((l) => {
    if (videoId && l.video_id !== videoId) return false;
    if (search) {
      const hay = [l.name, l.email, l.company, l.ip_name, l.video_title]
        .filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });
  renderLeads(filtered);
}

document.getElementById('filter-video').addEventListener('change', applyFilters);
document.getElementById('filter-search').addEventListener('input', applyFilters);

// ── Delete ───────────────────────────────────────────────────────────────────
async function deleteLead(id, btn) {
  if (!confirm('确定删除该线索？此操作不可恢复。')) return;
  btn.disabled = true;
  try {
    const res = await fetch(`${API}/api/leads/${id}`, { method: 'DELETE' });
    if (res.ok) {
      allLeads = allLeads.filter((l) => l.id !== id);
      applyFilters();
      loadStats();
    } else {
      alert('删除失败，请重试');
      btn.disabled = false;
    }
  } catch (_) {
    alert('网络错误，请重试');
    btn.disabled = false;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T') + (iso.includes('T') ? '' : 'Z'));
  if (isNaN(d)) return iso;
  return d.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Init ─────────────────────────────────────────────────────────────────────
loadStats();
loadVideoFilter();
loadLeads();
