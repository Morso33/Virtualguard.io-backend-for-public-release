# VirtualGuard.io — Backend

> ⚠️ **Portfolio Notice:** This code was written in **2023** and is shared purely as a portfolio piece. It does **not** represent my current skillset or coding standards. Architectural decisions, security practices, and code quality have evolved significantly since then.

> For a more up-to-date representation, check out my new closed source website, https://drinkup.buzz

---

## Overview

**VirtualGuard.io** is a web-based platform that allows users to upload Windows executables (`.exe` / `.dll`) and generate **protected builds** of those files using a custom native engine. The backend is a REST API built with **Node.js** and **Express**, backed by a **MySQL** database, and designed to support a full SaaS workflow including user accounts, license management, a support ticket system, an admin panel, and automated email notifications.

This repository contains only the **backend** of the platform. The native processing binaries (`engine/`) are included as compiled artifacts for both Windows and Linux.

For the obfuscation engine this project uses, check out the engine developers repository: https://github.com/mitoiscool/VirtualGuard

---

## Goals & Purpose

The primary goals of the VirtualGuard.io platform were:

- Provide a **file-protection-as-a-service** offering, allowing users to upload binaries and receive obfuscated/protected outputs.
- Deliver a **complete SaaS backend** with user authentication, project management, licensing, and a support system — end-to-end.
- Demonstrate full-stack backend development skills: RESTful API design, database design, session management, file handling, native process invocation, and admin tooling.
- Implement a **layered security model** including request trust scoring, bot/pentest detection, IP-bound sessions, and captcha verification.

---

## Tech Stack

| Category | Technology |
|---|---|
| **Runtime** | Node.js |
| **Web Framework** | Express.js 4.18.2 |
| **Database** | MySQL (via `mysql2` 3.2.1 with connection pooling) |
| **Password Hashing** | bcryptjs 2.4.3 |
| **File Uploads** | express-fileupload 1.4.0 |
| **Email** | Nodemailer 6.9.7 (SendinBlue SMTP relay) |
| **HTTP Client** | Axios 1.6.2 |
| **IP Geolocation** | geoip-lite 1.4.9 |
| **ID Generation** | nanoid 4.0.2 |
| **Shell Safety** | shell-quote 1.8.1 |
| **System Info** | systeminformation 5.21.18 |
| **CSS Framework** | Tailwind CSS 3.3.1 (frontend static pages) |
| **Dev Tooling** | Nodemon 3.0.1 |
| **Captcha** | Google reCAPTCHA v2 |

---

## Architecture

```
Client (Browser)
      │
      ▼
Express.js Server  (src/index.js)
      │
      ├── Middleware Layer
      │     ├── JSON / URL-encoded body parsing
      │     ├── Cookie parsing
      │     ├── File upload handling (100 MB limit)
      │     ├── Request logging & trust scoring
      │     └── Maintenance mode gate
      │
      ├── Route Handlers  (src/API/V1/)
      │     ├── /API/V1/user          — Authentication & account management
      │     ├── /API/V1/engine        — File upload & native build pipeline
      │     ├── /API/V1/ticket        — Support ticket system
      │     ├── /API/V1/notification  — User notifications
      │     └── /admin                — Admin panel (server-rendered HTML)
      │
      ├── Business Logic  (*_functions.js)
      │
      ├── MySQL Connection Pool  (src/connection.js)
      │
      └── Native Engine  (engine/)
            ├── linux_x64/config_gen + build
            └── win_x64/config_gen.exe + build.exe
```

The server selects the correct engine binary (`linux_x64` vs `win_x64`) automatically based on the `env` field in `config.json`.

---

## Features

### User Accounts & Authentication
- Registration with Google reCAPTCHA v2 validation
- Login with cookie-based session tokens (6-hour expiry; 7-day "Remember Me")
- Sessions are bound to the originating IP address
- Password reset via time-limited email tokens (15-minute expiry)
- Geographic tracking via IP geolocation (country codes)

### File Upload & Protection Engine
- Upload Windows `.exe` and `.dll` files (up to 100 MB)
- Server-side file type and size validation
- Files stored under `filesystem/input/`
- Configuration generated via the native `config_gen` binary
- Protected builds produced by the native `build` binary, stored under `filesystem/output/`
- Full build history tracked in the database
- File deletion with filesystem cleanup

### Project & License Management
- Per-user project listing (uploaded files)
- Running count of total files protected
- License type (`basic` / `premium`) and expiry date stored per user

### Support Ticket System
- Create tickets with a title, content, and category
- Staff assignment workflow
- Ticket state machine: `awaiting assignment` → `awaiting reply` → `closed`
- Reply threads from both users and staff
- Paginated ticket listing in the admin panel

### Notifications
- Per-user notification queue stored as JSON
- Acknowledge / mark-as-seen endpoint

### Admin Panel
- Server-rendered HTML dashboard (no separate frontend framework)
- User management: list all users, view individual user profiles, ban users
- Ticket management: filter by category, paginate, assign and close
- Request analytics: log viewer with trust-score breakdown
- Server health: live system information via `systeminformation`
- Maintenance mode toggle (persisted in `config.json`)
- Soft and hard server restart actions
- Runtime log viewer

### Request Trust Scoring & Bot Detection
Every inbound request is assigned a numeric trust score based on signals including:
- User-agent analysis (bot patterns, headless browsers)
- Missing or anomalous HTTP headers
- Pentest path patterns (PHP, ASP, WordPress, Laravel paths)
- Direct-access indicators
- Form automation detection

Low-trust requests are flagged as `MALICIOUS` in the log and can be acted on by admins.

## Project Structure

```
.
├── engine/                  # Compiled native binaries
│   ├── linux_x64/           #   config_gen, build
│   └── win_x64/             #   config_gen.exe, build.exe
├── filesystem/              # Runtime file storage (gitignored)
│   ├── input/
│   ├── output/
│   └── config/
├── logs/                    # Runtime log output (gitignored)
├── src/
│   ├── index.js             # Application entry point & middleware setup
│   ├── connection.js        # MySQL connection pool
│   ├── logging.js           # Centralised structured logger
│   ├── API/
│   │   └── V1/
│   │       ├── user/        # Authentication & account routes + logic
│   │       ├── engine/      # File upload, config & build routes + logic
│   │       ├── ticket/      # Support ticket routes + logic
│   │       ├── notification/ # Notification routes + logic
│   │       ├── admin/       # Admin panel routes + server-rendered HTML
│   │       ├── email/       # Email helpers
│   │       └── general/     # Trust scoring, captcha, request logging, redirects
│   └── public/              # Static frontend files served directly by Express
│       ├── index.html       # Landing page
│       ├── p/               # Authenticated user pages (login, register, panel…)
│       ├── error/           # Error pages (403, 404, maintenance)
│       ├── global_js/       # Shared frontend JavaScript
│       └── assets/          # Images and branding assets
├── config.json              # Application configuration
├── package.json
└── tailwind.config.js       # Tailwind CSS configuration
```

---



## License

MIT © Morso33
