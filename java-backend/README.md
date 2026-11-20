# NCWU StyleHub API — Java Spring Boot (Maven)

The backend for the NCWU StyleHub online store. It implements the REST API under
`/api/v1/...` (auth, catalog, cart, orders, admin) consumed by the Next.js frontend
in `../frontend`.

## Requirements

- JDK 21+ (e.g. Eclipse Temurin)
- Maven 3.9+

## Run (zero configuration)

```bash
cd java-backend
mvn spring-boot:run
```

The API starts on `http://localhost:8080` with a local **H2 file database**
(`java-backend/data/stylehub.mv.db`) and seeds demo data automatically.

API docs/debug: `http://localhost:8080/docs` and the `/api/v1/...` routes.

## Use Supabase Cloud PostgreSQL

Set the environment variables (PowerShell example):

```powershell
$env:DATABASE_URL = "postgresql://postgres.xxxx:password@aws-0-xx.pooler.supabase.com:6543/postgres"
$env:SECRET_KEY = "put-a-long-random-secret-here"
mvn spring-boot:run
```

Schema is created/updated automatically (`ddl-auto=update`) and is fully compatible with
`../supabase/schema.sql`.

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | *(empty → H2 fallback)* | Supabase PostgreSQL connection string |
| `SECRET_KEY` | `ncwu-stylehub-dev-secret-change-in-production` | JWT signing key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Token lifetime |
| `CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Allowed frontend origins (add your Vercel URL in production) |
| `SERVER_PORT` | `8080` | Listen port |

## Endpoint coverage

`auth` register/login/me · `categories` · `products` list/detail (search, category,
featured, sort, pagination) · `banners` · `promotions` · `reviews` submit + public list ·
`cart` CRUD · `orders` create/list/detail · `admin` products (upload + image upload),
users (incl. hard delete), review moderation, order status + hard delete, stats ·
`/uploads/*`.
