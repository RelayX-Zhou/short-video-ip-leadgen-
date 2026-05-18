'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'leads.db');

// ── Database setup ────────────────────────────────────────────────────────────
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS videos (
    id        TEXT PRIMARY KEY,
    title     TEXT NOT NULL,
    url       TEXT NOT NULL,
    thumbnail TEXT,
    ip_name   TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leads (
    id         TEXT PRIMARY KEY,
    video_id   TEXT REFERENCES videos(id),
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    phone      TEXT,
    company    TEXT,
    message    TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Seed demo videos if none exist
const videoCount = db.prepare('SELECT COUNT(*) as c FROM videos').get().c;
if (videoCount === 0) {
  const insert = db.prepare(
    'INSERT INTO videos (id, title, url, thumbnail, ip_name) VALUES (?, ?, ?, ?, ?)'
  );
  const demos = [
    [uuidv4(), '品牌 IP 短视频营销实战', 'https://www.w3schools.com/html/mov_bbb.mp4', '', '创意工坊 IP'],
    [uuidv4(), '产品故事短视频合集',     'https://www.w3schools.com/html/movie.mp4',   '', '星耀品牌 IP'],
    [uuidv4(), '爆款短视频流量密码',      'https://www.w3schools.com/html/mov_bbb.mp4', '', '流量引擎 IP'],
  ];
  demos.forEach((d) => insert.run(...d));
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── API: Videos ───────────────────────────────────────────────────────────────
app.get('/api/videos', (_req, res) => {
  const rows = db.prepare('SELECT * FROM videos ORDER BY created_at DESC').all();
  res.json(rows);
});

app.get('/api/videos/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Video not found' });
  res.json(row);
});

// ── API: Leads ────────────────────────────────────────────────────────────────
app.post('/api/leads', (req, res) => {
  const { video_id, name, email, phone, company, message } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  if (video_id) {
    const video = db.prepare('SELECT id FROM videos WHERE id = ?').get(video_id);
    if (!video) return res.status(400).json({ error: 'Invalid video_id' });
  }

  const id = uuidv4();
  db.prepare(
    `INSERT INTO leads (id, video_id, name, email, phone, company, message)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    video_id || null,
    name.trim(),
    email.trim().toLowerCase(),
    phone ? phone.trim() : null,
    company ? company.trim() : null,
    message ? message.trim() : null
  );

  res.status(201).json({ id, message: 'Lead captured successfully' });
});

app.get('/api/leads', (req, res) => {
  const { video_id } = req.query;
  let query = `
    SELECT l.*, v.title as video_title, v.ip_name
    FROM leads l
    LEFT JOIN videos v ON l.video_id = v.id
  `;
  const params = [];
  if (video_id) {
    query += ' WHERE l.video_id = ?';
    params.push(video_id);
  }
  query += ' ORDER BY l.created_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

app.get('/api/leads/export/csv', (req, res) => {
  const rows = db.prepare(`
    SELECT l.id, l.name, l.email, l.phone, l.company, l.message,
           v.title as video_title, v.ip_name, l.created_at
    FROM leads l
    LEFT JOIN videos v ON l.video_id = v.id
    ORDER BY l.created_at DESC
  `).all();

  const header = ['ID', 'Name', 'Email', 'Phone', 'Company', 'Message', 'Video Title', 'IP Name', 'Created At'];
  const escape = (v) => {
    if (v == null) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [r.id, r.name, r.email, r.phone, r.company, r.message, r.video_title, r.ip_name, r.created_at]
        .map(escape)
        .join(',')
    ),
  ];

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
  res.send(lines.join('\r\n'));
});

app.delete('/api/leads/:id', (req, res) => {
  const result = db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Lead not found' });
  res.json({ message: 'Lead deleted' });
});

// ── Stats ─────────────────────────────────────────────────────────────────────
app.get('/api/stats', (_req, res) => {
  const totalLeads   = db.prepare('SELECT COUNT(*) as c FROM leads').get().c;
  const totalVideos  = db.prepare('SELECT COUNT(*) as c FROM videos').get().c;
  const todayLeads   = db.prepare(
    "SELECT COUNT(*) as c FROM leads WHERE date(created_at) = date('now')"
  ).get().c;
  const topVideo     = db.prepare(`
    SELECT v.title, v.ip_name, COUNT(l.id) as lead_count
    FROM videos v
    LEFT JOIN leads l ON v.id = l.video_id
    GROUP BY v.id
    ORDER BY lead_count DESC
    LIMIT 1
  `).get();

  res.json({ totalLeads, totalVideos, todayLeads, topVideo: topVideo || null });
});

// ── Fallback: SPA ─────────────────────────────────────────────────────────────
app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Short Video IP LeadGen server running at http://localhost:${PORT}`);
  });
}

module.exports = { app, db };
