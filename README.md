# VirtualGuard.io — Backend

> ⚠️ **Portfolio Notice:** This code was written in **2023** and is shared purely as a portfolio piece. It does **not** represent the current skillset or coding standards of the developer. Architectural decisions, security practices, and code quality have evolved significantly since then.

---

## Table of Contents

1. [Overview](#overview)
2. [Goals & Purpose](#goals--purpose)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Features](#features)
6. [API Reference](#api-reference)
7. [Database Schema](#database-schema)
8. [Security](#security)
9. [Configuration](#configuration)
10. [Getting Started](#getting-started)
11. [Project Structure](#project-structure)
12. [Logging](#logging)
13. [Known Limitations & Notes](#known-limitations--notes)

---

## Overview

**VirtualGuard.io** is a web-based platform that allows users to upload Windows executables (`.exe` / `.dll`) and generate **protected builds** of those files using a custom native engine. The backend is a REST API built with **Node.js** and **Express**, backed by a **MySQL** database, and designed to support a full SaaS workflow including user accounts, license management, a support ticket system, an admin panel, and automated email notifications.

This repository contains only the **backend** of the platform. The native processing binaries (`engine/`) are included as compiled artifacts for both Windows and Linux.

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

---

## API Reference

All user-facing endpoints are prefixed with `/API/V1/`. Responses follow a consistent envelope:

```json
// Success
{ "status": "success", "message": "...", "data": { ... } }

// Error
{ "status": "error", "error": "Human-readable message", "error_r": "error_code_reference" }
```

### User Endpoints — `/API/V1/user`

| Method | Path | Description |
|---|---|---|
| `GET` | `/authenticate` | Verify the current session token |
| `POST` | `/register` | Register a new account (requires captcha) |
| `POST` | `/login` | Authenticate and set session cookies |
| `GET` | `/logout` | Destroy session and clear cookies |
| `GET` | `/get_user_projects` | List the authenticated user's files |
| `GET` | `/get_username` | Return the authenticated user's username |
| `POST` | `/request_password_reset` | Send a password-reset email |
| `POST` | `/client_password_reset_with_token` | Complete a password reset using the emailed token |
| `GET` | `/get_license` | Return the user's license type and expiry |

### Engine Endpoints — `/API/V1/engine`

| Method | Path | Description |
|---|---|---|
| `POST` | `/upload` | Upload an `.exe` or `.dll` file |
| `GET` | `/get_file` | Retrieve file metadata |
| `GET` | `/serve_file` | Download a file |
| `POST` | `/update_config` | Update a file's protection configuration |
| `POST` | `/build` | Invoke the native build binary and return the result |
| `GET` | `/delete` | Delete a file and remove it from disk |

### Ticket Endpoints — `/API/V1/ticket`

| Method | Path | Description |
|---|---|---|
| `POST` | `/create` | Open a new support ticket |
| `GET` | `/your_tickets` | List the authenticated user's tickets |
| `GET` | `/view_ticket?id=<id>` | View a ticket and its reply thread |
| `POST` | `/reply` | Add a reply to a ticket |
| `POST` | `/close` | Close a ticket |

### Notification Endpoints — `/API/V1/notification`

| Method | Path | Description |
|---|---|---|
| `GET` | `/get_notifications` | Retrieve unread notifications |
| `GET` | `/acknowledge_notification?id=<id>` | Mark a notification as seen |

### Admin Endpoints — `/admin`

Admin endpoints require `is_admin=1` on the authenticated user's account.

| Method | Path | Description |
|---|---|---|
| `GET` | `/?page=admin_general` | General dashboard |
| `GET` | `/?page=admin_users` | User management |
| `GET` | `/?page=admin_tickets` | Ticket management |
| `GET` | `/?page=admin_statistics` | Signup & usage statistics |
| `GET` | `/?page=admin_view_user` | Individual user detail |
| `GET` | `/user_statistics` | Signup counts (24h / 7d / 30d / 365d) |
| `GET` | `/ticket_list?category=<c>&page=<n>` | Paginated ticket list |
| `GET` | `/get_all_users` | Full user list |
| `GET` | `/get_user?user_id=<id>` | Single user data |
| `GET` | `/run_action?action=<a>&target=<t>` | Execute an admin action (e.g., ban) |
| `GET` | `/get_request_data` | Request analytics payload |
| `GET` | `/set_maintenance` | Enable maintenance mode |
| `GET` | `/unset_maintenance` | Disable maintenance mode |
| `GET` | `/get_runtime_log` | Read the runtime log file |
| `GET` | `/get_server_info` | Live system information |
| `GET` | `/restart_server` | Soft server restart |
| `GET` | `/hard_restart_server` | Hard server restart |

### Redirect Endpoints — `/link`

| Method | Path | Description |
|---|---|---|
| `GET` | `/discord` | Redirect to the community Discord server |
| `GET` | `/twitter` | Redirect to the project's Twitter profile |

---

## Database Schema

The application uses a MySQL database named `virtualguard`. The tables below are inferred from the SQL queries throughout the codebase.

> ⚠️ No migration scripts are included in this repository. The database must be created and seeded manually.

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | INT | Primary key |
| `username` | VARCHAR | Unique |
| `password_bcrypt` | VARCHAR | bcrypt hash |
| `session_token` | VARCHAR | Active session token |
| `session_ip` | VARCHAR | IP bound to the session |
| `session_token_expiry` | DATETIME | Session expiry timestamp |
| `created_at` | DATETIME | Account creation time |
| `is_admin` | TINYINT(1) | Admin flag |
| `is_support` | TINYINT(1) | Support staff flag |
| `is_banned` | TINYINT(1) | Ban flag |
| `license_type` | VARCHAR | e.g. `basic`, `premium` |
| `license_expiry` | DATETIME | License expiry date |
| `total_files_protected` | INT | Running counter |
| `password_reset_token` | VARCHAR | Time-limited reset token |
| `password_reset_token_expiry` | DATETIME | Reset token expiry |

### `file_input`
| Column | Type | Notes |
|---|---|---|
| `id` | INT | Primary key |
| `project_name` | VARCHAR | User-supplied project name |
| `file_type` | VARCHAR | `exe` or `dll` |
| `uploaded_by` | INT | FK → `users.id` |
| `uploaded_at` | DATETIME | Upload timestamp |
| `file_location` | VARCHAR | Path on disk |
| `file_ending` | VARCHAR | File extension |
| `file_size` | INT | File size in bytes |
| `config` | TEXT / JSON | Protection configuration |
| `last_build_time` | DATETIME | Last successful build |

### `ticket_threads`
| Column | Type | Notes |
|---|---|---|
| `id` | INT | Primary key |
| `owned_by` | INT | FK → `users.id` |
| `title` | VARCHAR | Ticket title |
| `content` | TEXT | Initial message |
| `replies` | INT | Reply count |
| `created_at` | DATETIME | Creation timestamp |
| `updated_at` | DATETIME | Last activity timestamp |
| `assigned_to` | INT | FK → `users.id` (staff) |
| `state` | VARCHAR | `awaiting_assignment`, `awaiting_reply`, `closed` |
| `category` | VARCHAR | Ticket category |

### `ticket_replies`
| Column | Type | Notes |
|---|---|---|
| `id` | INT | Primary key |
| `reply_to` | INT | FK → `ticket_threads.id` |
| `is_admin_reply` | TINYINT(1) | Staff reply flag |
| `content` | TEXT | Reply body |
| `reply_user` | INT | FK → `users.id` |
| `reply_time` | DATETIME | Reply timestamp |

### `user_notifications`
| Column | Type | Notes |
|---|---|---|
| `id` | INT | Primary key |
| `notification_user` | INT | FK → `users.id` |
| `notification_json` | TEXT | Notification payload (JSON) |
| `notification_seen` | TINYINT(1) | Seen flag |

### `builds_log`
| Column | Type | Notes |
|---|---|---|
| `id` | INT | Primary key |
| `file_id` | INT | FK → `file_input.id` |
| `build_status` | VARCHAR | `success` or `error` |
| `build_data` | TEXT | Output from the build binary |
| `build_time` | DATETIME | Build timestamp |

### `requests_log`
| Column | Type | Notes |
|---|---|---|
| `id` | INT | Primary key |
| `ip` | VARCHAR | Requester IP |
| `request_url` | VARCHAR | Requested path |
| `request_params` | TEXT | Query/body parameters |
| `request_trust_score` | INT | Computed trust score |
| `request_detections` | TEXT | Triggered detection flags |
| `request_timestamp` | DATETIME | Request timestamp |

---

## Security

| Mechanism | Implementation |
|---|---|
| **Password storage** | bcrypt (8 salt rounds) |
| **Session tokens** | 64-character cryptographically random hex strings |
| **Session binding** | Sessions are validated against the originating IP address |
| **Cookie flags** | `httpOnly` on the session token cookie; `SameSite` enforced |
| **SQL injection prevention** | Parameterised queries throughout (`mysql2` prepared statements) |
| **File validation** | Extension whitelist (`.exe` / `.dll`) and size cap (100 MB) |
| **CAPTCHA** | Google reCAPTCHA v2 on the registration endpoint |
| **Request trust scoring** | Every request is scored for bot/pentest signals and logged |
| **Maintenance mode** | Gate flag in `config.json` blocks all non-admin traffic |

---

## Configuration

`config.json` (project root):

```json
{
  "env": "dev",
  "links": {
    "discord": "https://discord.gg/...",
    "twitter": "https://twitter.com/..."
  },
  "google_captcha_secret_key": "<YOUR_RECAPTCHA_SECRET>",
  "maintenance": false
}
```

| Key | Values | Description |
|---|---|---|
| `env` | `"dev"` / `"prod"` | Selects port (3000 vs 80) and engine binary (win_x64 vs linux_x64) |
| `links.discord` | URL string | Target for the `/link/discord` redirect |
| `links.twitter` | URL string | Target for the `/link/twitter` redirect |
| `google_captcha_secret_key` | String | Google reCAPTCHA v2 server-side secret |
| `maintenance` | `true` / `false` | Toggles maintenance mode; manageable via the admin panel at runtime |

Database credentials and email SMTP settings are currently hardcoded in `src/connection.js` and `src/API/V1/email/email_functions.js` respectively.

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 16
- **MySQL** ≥ 8 with a database named `virtualguard`
- A Google reCAPTCHA v2 site/secret key pair
- A SendinBlue (Brevo) SMTP account for email delivery

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Morso33/Virtualguard.io-backend-for-public-release.git
cd Virtualguard.io-backend-for-public-release

# 2. Install Node dependencies
npm install

# 3. Create the database and tables in MySQL
#    (No migration scripts are provided — see Database Schema above)

# 4. Update database credentials in src/connection.js
# 5. Update SMTP credentials in src/API/V1/email/email_functions.js
# 6. Set your reCAPTCHA secret in config.json

# 7. Start the server
npm start
```

**Development** (Windows, port 3000):
```bash
# config.json → "env": "dev"
npm start
```

**Production** (Linux, port 80):
```bash
# config.json → "env": "prod"
node src/index.js
```

### Filesystem Directories

The following directories are created automatically at runtime if they do not exist:

```
filesystem/
  input/    — uploaded source files
  output/   — protected build outputs
  config/   — generated configuration files
logs/
  runtime.log
```

---

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

## Logging

The centralised logger (`src/logging.js`) writes structured entries to `logs/runtime.log` and to the console. Each entry includes a severity level:

| Level | Colour | Meaning |
|---|---|---|
| `INFO` | Cyan | Normal operational events |
| `WARNING` | Yellow | Unexpected but non-fatal situations |
| `ERROR` | Red | Caught errors that impact a request |
| `FATAL` | Magenta | Unrecoverable errors |
| `MALICIOUS` | Red | Requests flagged by the trust-score system |

---

## Known Limitations & Notes

> 🚨 **DO NOT DEPLOY AS-IS.** This codebase contains hardcoded credentials (database host/user/password and SMTP credentials). Before any deployment these **must** be replaced with environment variables or a dedicated secrets manager. Deploying with hardcoded secrets is a serious security risk.

- **No migration scripts** — The database must be created and populated manually.
- **Credentials are hardcoded** — Database credentials (`src/connection.js`) and SMTP credentials (`src/API/V1/email/email_functions.js`) are embedded in source files rather than loaded from environment variables or a secrets store. This is a known shortcoming of this 2023 codebase that must be addressed before any real deployment.
- **Webhooks module removed** — The `/API/V1/hooks` route is registered but empty; the webhook implementation was stripped before the public release.
- **No automated tests** — The project does not include a test suite.
- **Port 80 in production** — The server binds directly to port 80 rather than running behind a reverse proxy (e.g. Nginx).
- **Native binaries included** — Pre-compiled `config_gen` and `build` binaries are committed to the repository.

---

## License

MIT © Morso33
