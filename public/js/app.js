/* app.js — Landing page logic */
'use strict';

const API = '';

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

// ── Videos ───────────────────────────────────────────────────────────────────
async function loadVideos() {
  const grid = document.getElementById('video-grid');
  try {
    const videos = await fetch(`${API}/api/videos`).then((r) => r.json());
    if (!videos.length) {
      grid.innerHTML = '<p class="loading">暂无视频内容</p>';
      return;
    }
    grid.innerHTML = videos.map((v) => `
      <div class="video-card">
        <video src="${escHtml(v.url)}" controls preload="none" poster="${escHtml(v.thumbnail || '')}"></video>
        <div class="video-card__body">
          <p class="video-card__ip">${escHtml(v.ip_name)}</p>
          <p class="video-card__title">${escHtml(v.title)}</p>
          <button class="btn btn--primary btn--full" data-video-id="${escHtml(v.id)}" data-video-title="${escHtml(v.title)}">
            获取合作方案
          </button>
        </div>
      </div>
    `).join('');

    // Attach click events
    grid.querySelectorAll('[data-video-id]').forEach((btn) => {
      btn.addEventListener('click', () => openModal(btn.dataset.videoId));
    });
  } catch (e) {
    grid.innerHTML = '<p class="loading">加载失败，请刷新重试</p>';
  }
}

// ── Modal ────────────────────────────────────────────────────────────────────
const modal        = document.getElementById('lead-modal');
const closeBtn     = document.getElementById('modal-close');
const leadForm     = document.getElementById('lead-form');
const statusEl     = document.getElementById('form-status');
const videoIdInput = document.getElementById('lead-video-id');

function openModal(videoId) {
  videoIdInput.value = videoId || '';
  leadForm.reset();
  clearErrors();
  statusEl.textContent = '';
  statusEl.className = 'form-status';
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  document.getElementById('lead-name').focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = '';
}

closeBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// ── Form validation & submit ──────────────────────────────────────────────────
leadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();
  statusEl.textContent = '';
  statusEl.className = 'form-status';

  const name    = document.getElementById('lead-name').value.trim();
  const email   = document.getElementById('lead-email').value.trim();
  const phone   = document.getElementById('lead-phone').value.trim();
  const company = document.getElementById('lead-company').value.trim();
  const message = document.getElementById('lead-message').value.trim();
  const videoId = videoIdInput.value;

  let valid = true;
  if (!name) {
    showError('err-name', '请填写姓名');
    valid = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError('err-email', '请输入有效的邮箱地址');
    valid = false;
  }
  if (!valid) return;

  const submitBtn = document.getElementById('lead-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = '提交中…';

  try {
    const res = await fetch(`${API}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_id: videoId || null, name, email, phone, company, message }),
    });
    const data = await res.json();
    if (res.ok) {
      statusEl.textContent = '✅ 提交成功！我们将尽快与您联系。';
      statusEl.classList.add('success');
      leadForm.reset();
      setTimeout(closeModal, 2200);
      loadStats();
    } else {
      statusEl.textContent = data.error || '提交失败，请重试';
      statusEl.classList.add('error');
    }
  } catch (_) {
    statusEl.textContent = '网络错误，请检查连接后重试';
    statusEl.classList.add('error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '提交';
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function clearErrors() {
  ['err-name', 'err-email'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Init ─────────────────────────────────────────────────────────────────────
loadStats();
loadVideos();
