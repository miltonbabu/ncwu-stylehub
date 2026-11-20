# NCWU StyleHub — Online Clothes Store

A full-stack web-based online store system built for the course design
**"Comprehensive Internship in Computer System Development 2"**
(North China University of Water Resources and Electric Power, School of Information Engineering).

Functional scope follows the assignment brief: product uploading, product management,
user management and product review management in the back office; product display,
product reviews, shopping cart and order management on the front end — plus hero
carousel, product categories, featured products, promotional sections and
sign in / sign up.

## Tech Stack

| Layer      | Technology                                       |
|------------|--------------------------------------------------|
| Frontend   | React 18 + **Next.js 16** (App Router) + TypeScript |
| UI         | Tailwind CSS v4 + Lucide icons (design system in `design-system/MASTER.md`) |
| Backend    | **Java 21 + Spring Boot + Maven** — `java-backend/` |
| Database   | **PostgreSQL (Supabase Cloud)** — H2 file fallback for local dev |
| Auth       | JWT (PBKDF2-HMAC password hashing), role-based (customer / admin) |

The backend implements the REST API under `/api/v1/...`; the frontend connects to it
via the single env var `NEXT_PUBLIC_API_URL`.

## Project Structure

```
├── design-system/MASTER.md # UI/UX design system (colors, type, layout rules)
├── frontend/               # Next.js app (customer store + admin back office)
│                           #   → its OWN git repo → its own Vercel project
├── java-backend/           # Spring Boot REST API (Java 21 + Maven)
├── deploy/                 # optional single-server Docker Compose + Nginx kit
├── supabase/schema.sql     # PostgreSQL schema for Supabase SQL editor
└── course-docs/            # course plan / report / brief — LOCAL ONLY, git-ignored
```

> `frontend/` (Next.js) is the only storefront — the classic HTML/CSS/jQuery frontend has been removed.

## Quick Start (local, no external services needed)

### 1. Backend (Java Spring Boot, port 8080)

```bash
cd java-backend
mvn spring-boot:run
```

Needs JDK 21+. Uses a local H2 database automatically and seeds demo data on first start.
See `java-backend/README.md` for details.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:3000
```

`frontend/.env.local` points the app at `http://localhost:8080` by default
(`NEXT_PUBLIC_API_URL`).

### Demo accounts

| Role     | Email               | Password  |
|----------|---------------------|-----------|
| Admin    | admin@ncwustylehub.com | Admin@123 |
| Customer | demo@ncwustylehub.com  | Demo@123  |

## Feature Checklist (mapped to the assignment brief)

| Requirement | Where |
|-------------|-------|
| Product uploading | Admin → Products → "Upload Product" (image URL or file upload) |
| Product management | Admin → Products (edit / delete / stock / featured) |
| User management | Admin → Users (roles, enable/disable) |
| Product review management | Admin → Reviews (approve / reject / delete queue) |
| Product display | Home, Shop (search, category filter, sort), Product detail |
| Product reviews | Product detail → review list + submit form (moderated) |
| Shopping cart | Cart page + header cart badge (quantity, totals, free shipping) |
| Order management | Checkout → My Orders / Order detail; Admin → Orders (status) |
| Carousel / categories / featured / promo | Homepage sections (auto-play carousel) |
| Sign in / Sign up | JWT auth, role-based access to `/admin` |

API docs available at `http://localhost:8080/docs` when the backend runs.

## Using Supabase PostgreSQL

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. Copy **Project Settings → Database → Connection string (Session pooler)**.
4. Set the environment variables before starting `java-backend`:
   ```powershell
   $env:DATABASE_URL = "postgresql://postgres.xxxx:password@aws-0-xx.pooler.supabase.com:6543/postgres"
   $env:SECRET_KEY = "<long-random-string>"
   $env:CORS_ORIGINS = "https://your-frontend.vercel.app"
   ```
5. Start the backend — tables are auto-created and seeded on first run.

## Image uploads (Cloudinary)

Admin product image uploads are stored on **Cloudinary** when configured
(recommended for production — local files don't survive redeploys on Vercel/Render):

```
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=ncwu-stylehub   # optional
```

**Where these go — read this carefully.** The upload happens in the **Java backend**
(`CloudinaryUploader.java` signs the request and POSTs to Cloudinary). It does **not**
happen in the Next.js frontend. So the four Cloudinary vars above must be set on the
**backend host** (Render / Railway / Fly.io / etc.), **not on Vercel**. Putting them on
Vercel would (a) do nothing and (b) leak them to the browser, since everything on Vercel
with a `NEXT_PUBLIC_` prefix (and the bundle) is public.

- **Vercel** needs exactly one env var: `NEXT_PUBLIC_API_URL` (the backend's public URL).
- **Backend host** needs: `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS`, and the four
  `CLOUDINARY_*` vars above.

**How it behaves.** `CloudinaryUploader.upload()` returns the Cloudinary **`secure_url`**
— a previewable CDN URL like `https://res.cloudinary.com/<cloud>/image/upload/v123/ncwu-stylehub/abc.png`.
That URL is stored as the image and rendered in the storefront (auto-optimized to
`f_auto,q_auto` + sized via `cloudinaryImg()` in `frontend/src/lib/utils.ts`). So yes —
the API returns a normal URL you can open/preview immediately, whether it's a Cloudinary
`secure_url` or the local `/uploads/...` fallback.

**Fallback.** Without the Cloudinary vars (e.g. local dev), uploads fall back to the
local `uploads/` folder exactly as before — the file is saved and served back as a
previewable `/uploads/<id>.png` URL. The existing demo/seed images are hosted on Unsplash
and are unaffected.

**Rate limiting.** The upload endpoint (`POST /api/v1/admin/products/{id}/images`) is
rate-limited to **20 requests/minute per IP** (see `RateLimitFilter.java`) — separate from
the auth bucket (10/min) and the general API bucket (300/min). Over the limit returns
`429` with a `Retry-After: 60` header.

## Deployment (publish online) — Vercel + Supabase Cloud

For the Java backend on a **2 GB AWS EC2 instance**, follow [the EC2 deployment guide](deploy/aws/README.md). It includes Docker, Nginx, HTTPS, persistent uploads, memory limits, and Supabase environment configuration while keeping the frontend on Vercel.

**Database** — Supabase Cloud PostgreSQL (steps above), then give the same
`DATABASE_URL` + `SECRET_KEY` to whichever backend you connect.

**Frontend (Next.js)** — Vercel. `frontend/` is its **own git repository** so it
deploys as its own Vercel project (separate from this backend repo):

1. In `frontend/`: `git remote add origin https://github.com/<you>/ncwu-stylehub-frontend.git`
   then `git push -u origin main`.
2. Import that repo at [vercel.com](https://vercel.com) (framework auto-detected
   via `frontend/vercel.json`; no Root Directory needed — the repo root is the app).
3. Set env var `NEXT_PUBLIC_API_URL` = the URL of the ONE connected backend
   (e.g. `https://ncwu-stylehub-api.onrender.com`).
4. Deploy. The storefront goes live at `https://<project>.vercel.app`.

**Backend** (any Java host, e.g. Render, Railway, Fly.io, CloudBase Cloud Run
or a Lighthouse VM):

| Backend | Build | Start |
|---------|-------|-------|
| Java (`java-backend/`) | `mvn package -DskipTests` | `java -jar target/stylehub-api-1.0.0.jar` |

Set env vars on the backend: `DATABASE_URL` (Supabase), `SECRET_KEY`, `CORS_ORIGINS`
(your Vercel URL), and the four `CLOUDINARY_*` vars (for image uploads), then point the
Vercel env var `NEXT_PUBLIC_API_URL` at it.

After deploy: open the Vercel URL, sign in with the demo admin, upload a product,
place a test order — every brief requirement works in production.

## Development Documents

- `design-system/MASTER.md` — UI design tokens and layout rules
- `supabase/schema.sql` — database schema (SQL Server stored procedures from the brief
  are implemented as Spring Boot service layer + SQL transactions)

Course materials (`plan.md`, report template, requirements analysis, the extracted
assignment brief and report tooling) live in `course-docs/`. That folder is
**local only — excluded from git** (see `.gitignore`) and is not part of the
deployed application.
