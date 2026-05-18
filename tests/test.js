'use strict';
/**
 * Integration tests for the Short Video IP LeadGen API.
 * Run with:  node tests/test.js
 */

const http = require('http');
const path = require('path');
const fs   = require('fs');

// Use an isolated in-memory DB for tests
process.env.DB_PATH = ':memory:';
const { app, db } = require('../server');

let server;
let baseUrl;
let pass = 0;
let fail = 0;

// ── Test helpers ──────────────────────────────────────────────────────────────
function request(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const url     = new URL(urlPath, baseUrl);
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };
    const req = http.request(opts, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        let data = raw;
        try { data = JSON.parse(raw); } catch (_) {}
        resolve({ status: res.statusCode, headers: res.headers, data });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function assert(desc, condition) {
  if (condition) {
    console.log(`  ✅ ${desc}`);
    pass++;
  } else {
    console.error(`  ❌ ${desc}`);
    fail++;
  }
}

async function run(suiteName, fn) {
  console.log(`\n📋 ${suiteName}`);
  await fn();
}

// ── Tests ─────────────────────────────────────────────────────────────────────
async function main() {
  // Start server on a random port
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  // ── Videos ──────────────────────────────────────────────────────────────────
  await run('GET /api/videos', async () => {
    const r = await request('GET', '/api/videos');
    assert('returns 200', r.status === 200);
    assert('returns array', Array.isArray(r.data));
    assert('seed videos exist', r.data.length >= 3);
    const v = r.data[0];
    assert('video has id',      typeof v.id === 'string');
    assert('video has title',   typeof v.title === 'string');
    assert('video has ip_name', typeof v.ip_name === 'string');
    assert('video has url',     typeof v.url === 'string');
  });

  let videoId;
  await run('GET /api/videos/:id', async () => {
    const all = await request('GET', '/api/videos');
    videoId = all.data[0].id;

    const r = await request('GET', `/api/videos/${videoId}`);
    assert('returns 200 for valid id', r.status === 200);
    assert('returns correct video',    r.data.id === videoId);

    const notFound = await request('GET', '/api/videos/non-existent-id');
    assert('returns 404 for unknown id', notFound.status === 404);
  });

  // ── Leads: validation ───────────────────────────────────────────────────────
  await run('POST /api/leads — validation', async () => {
    const noName = await request('POST', '/api/leads', { email: 'a@b.com' });
    assert('rejects missing name', noName.status === 400);

    const noEmail = await request('POST', '/api/leads', { name: 'Test' });
    assert('rejects missing email', noEmail.status === 400);

    const badEmail = await request('POST', '/api/leads', { name: 'Test', email: 'not-an-email' });
    assert('rejects bad email', badEmail.status === 400);

    const badVideo = await request('POST', '/api/leads', {
      name: 'Test', email: 'x@y.com', video_id: 'fake-video-id',
    });
    assert('rejects invalid video_id', badVideo.status === 400);
  });

  // ── Leads: happy path ────────────────────────────────────────────────────────
  let leadId;
  await run('POST /api/leads — happy path', async () => {
    const r = await request('POST', '/api/leads', {
      video_id: videoId,
      name: '张三',
      email: 'zhangsan@example.com',
      phone: '13800138000',
      company: '测试公司',
      message: '希望合作',
    });
    assert('returns 201', r.status === 201);
    assert('returns id', typeof r.data.id === 'string');
    leadId = r.data.id;

    // without optional fields
    const r2 = await request('POST', '/api/leads', { name: 'Li Si', email: 'lisi@test.com' });
    assert('minimal payload accepted', r2.status === 201);

    // email normalised to lowercase
    const r3 = await request('POST', '/api/leads', { name: 'Wang', email: 'UPPER@EMAIL.COM' });
    assert('email is case-insensitive', r3.status === 201);
  });

  // ── Leads: list ─────────────────────────────────────────────────────────────
  await run('GET /api/leads', async () => {
    const r = await request('GET', '/api/leads');
    assert('returns 200', r.status === 200);
    assert('returns array', Array.isArray(r.data));
    assert('contains our lead', r.data.some((l) => l.id === leadId));

    const filtered = await request('GET', `/api/leads?video_id=${videoId}`);
    assert('video_id filter works', filtered.data.every((l) => l.video_id === videoId));
  });

  // ── Stats ────────────────────────────────────────────────────────────────────
  await run('GET /api/stats', async () => {
    const r = await request('GET', '/api/stats');
    assert('returns 200', r.status === 200);
    assert('totalLeads is number',   typeof r.data.totalLeads === 'number');
    assert('totalVideos is number',  typeof r.data.totalVideos === 'number');
    assert('todayLeads is number',   typeof r.data.todayLeads === 'number');
    assert('totalLeads >= 3',        r.data.totalLeads >= 3);
  });

  // ── CSV export ───────────────────────────────────────────────────────────────
  await run('GET /api/leads/export/csv', async () => {
    const r = await request('GET', '/api/leads/export/csv');
    assert('returns 200',           r.status === 200);
    assert('content-type is csv',   r.headers['content-type'].includes('text/csv'));
    assert('has header row',        r.data.startsWith('ID,Name,Email'));
  });

  // ── Delete lead ──────────────────────────────────────────────────────────────
  await run('DELETE /api/leads/:id', async () => {
    const r = await request('DELETE', `/api/leads/${leadId}`);
    assert('returns 200', r.status === 200);

    const notFound = await request('DELETE', `/api/leads/${leadId}`);
    assert('returns 404 on second delete', notFound.status === 404);
  });

  // ── Static files ─────────────────────────────────────────────────────────────
  await run('Static files', async () => {
    const r = await request('GET', '/');
    assert('index.html served',     r.status === 200);
    assert('index.html has title',  typeof r.data === 'string' && r.data.includes('短视频 IP 获客'));

    const r2 = await request('GET', '/admin.html');
    assert('admin.html served',     r2.status === 200);
    assert('admin.html has title',  typeof r2.data === 'string' && r2.data.includes('管理后台'));
  });

  // ── Cleanup ──────────────────────────────────────────────────────────────────
  server.close();
  db.close();

  console.log(`\n${'─'.repeat(45)}`);
  console.log(`Results: ${pass} passed, ${fail} failed`);
  if (fail > 0) {
    process.exit(1);
  } else {
    console.log('All tests passed ✅');
  }
}

main().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
