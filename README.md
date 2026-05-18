# 短视频 IP 获客平台 (Short Video IP Lead Generation)

A full-stack web application that turns short video content into a lead generation engine. Visitors watch branded short video content and submit their contact information; the admin dashboard aggregates, filters, and exports the captured leads.

---

## Features

| Feature | Details |
|---|---|
| 🎬 Video showcase | Grid of short videos with IP (brand) labels |
| 📋 Lead capture | Modal form: name, email, phone, company, message |
| 📊 Live stats | Total leads, today's leads, video count, top IP |
| 🔍 Admin dashboard | Filter leads by video or free-text search |
| ⬇ CSV export | One-click download of all leads |
| 🗑 Delete leads | Remove individual leads from the admin panel |
| 💾 SQLite backend | Zero-config persistent storage |

---

## Quick Start

**Prerequisites:** Node.js ≥ 18

```bash
# 1. Install dependencies
npm install

# 2. Start the server  (default port: 3000)
npm start

# 3. Open in browser
open http://localhost:3000          # landing page
open http://localhost:3000/admin.html  # admin dashboard
```

Set the `PORT` environment variable to change the listening port:

```bash
PORT=8080 npm start
```

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/videos` | List all videos |
| `GET`  | `/api/videos/:id` | Get a single video |
| `POST` | `/api/leads` | Submit a new lead |
| `GET`  | `/api/leads` | List all leads (optional `?video_id=`) |
| `GET`  | `/api/leads/export/csv` | Download leads as CSV |
| `DELETE` | `/api/leads/:id` | Delete a lead |
| `GET`  | `/api/stats` | Platform statistics |

### POST /api/leads — request body

```json
{
  "video_id": "uuid (optional)",
  "name":     "string (required)",
  "email":    "string (required)",
  "phone":    "string (optional)",
  "company":  "string (optional)",
  "message":  "string (optional)"
}
```

---

## Project Structure

```
.
├── server.js          Express API + SQLite backend
├── public/
│   ├── index.html     Landing page (video showcase + lead capture)
│   ├── admin.html     Admin dashboard
│   ├── css/style.css  Styles
│   └── js/
│       ├── app.js     Landing page logic
│       └── admin.js   Admin dashboard logic
├── tests/
│   └── test.js        Integration tests
├── data/
│   └── leads.db       SQLite database (auto-created, git-ignored)
└── package.json
```

---

## Running Tests

```bash
npm test
```

Tests run against an isolated in-memory database and cover all API endpoints.