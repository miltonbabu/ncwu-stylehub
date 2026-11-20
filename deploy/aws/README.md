# Deploy the StyleHub API to AWS EC2 (2 GB RAM)

The frontend stays on Vercel and PostgreSQL stays on Supabase. EC2 runs only the Java 21 API and Nginx. This repository does not contain the separately versioned frontend.

## 1. Create the instance

Use Ubuntu 24.04 LTS, a 2 GB instance such as t3.small, and at least 20 GB gp3 storage. Attach an Elastic IP if you need a stable address. Allow inbound TCP 80 and 443, and SSH 22 from your own IP. Do not expose port 8080 or PostgreSQL ports. AWS pricing and free-tier eligibility depend on your account and region.

SSH into the instance and install the runtime:

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2 git certbot
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
```

Log out and reconnect before running Docker commands without sudo.

For build headroom on a 2 GB server, optionally add 2 GB swap if `swapon --show` is empty and `/swapfile` does not already exist:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
printf '/swapfile none swap sw 0 0\n' | sudo tee -a /etc/fstab
```

Swap helps builds; it does not replace RAM or guarantee capacity under load.

## 2. Configure the backend

```bash
git clone YOUR_BACKEND_GITHUB_URL stylehub
cd stylehub/deploy/aws
cp .env.example .env
chmod 600 .env
openssl rand -hex 32
nano .env
```

Paste the generated value into `SECRET_KEY`; do not reuse a secret shared in chat. Fill in:

- `DATABASE_URL`: Supabase **Connect > Session pooler**, port **5432**, without embedded credentials, for example `postgresql://aws-0-REGION.pooler.supabase.com:5432/postgres?sslmode=require`.
- `DATABASE_USER`: pooler username, typically `postgres.PROJECT_REF`.
- `DATABASE_PASSWORD`: your database password. Single-quote values containing `$` or `#` in the Compose `.env` file.
- `CORS_ORIGINS`: exact Vercel/custom frontend origins, comma separated, without trailing slashes. Do not use `*`.
- `SITE_URL`: public frontend URL for email links.

Use the actual hostname and username shown in Supabase. Separate credentials avoid URL-encoding issues in passwords. Optional Cloudinary and Resend settings are in the template. Supabase frontend API keys are not needed by this Java backend.

The existing backend uses Hibernate schema auto-update when starting. Back up an existing database before deployment. This package does not run SQL migrations or alter your Supabase project during setup.

Production Compose disables demo seeding and the runner that resets demo passwords on every startup. Existing demo accounts remain in the database: change their passwords or disable them before going live. Ensure you retain a working admin account; a brand-new empty database will not receive demo accounts with this configuration.

## 3. Build and start

```bash
docker compose config --quiet
docker compose build api
docker compose up -d
docker compose ps
docker compose logs --tail=100 api
curl --fail http://localhost/health
```

The health endpoint checks database connectivity. Java has a 512 MB heap and a 1 GB container limit; Nginx has a 64 MB limit. Docker build memory is separate from these runtime limits. This is a starting configuration for light traffic, not a load-tested capacity guarantee.

Uploaded images persist in the `uploads` Docker volume. Cloudinary is recommended for easier image backups. Do not run `docker compose down -v` unless you intentionally want to delete persistent uploads.

## 4. Enable HTTPS before connecting Vercel

An HTTPS Vercel frontend cannot call an HTTP API because browsers block mixed content. Point an API domain such as `api.example.com` to the Elastic IP and wait for DNS to resolve.

Stop Nginx briefly so Certbot can bind port 80:

```bash
docker compose stop web
sudo certbot certonly --standalone --cert-name stylehub -d api.example.com
```

After successful issuance, enable the HTTPS configuration permanently for subsequent Compose commands:

```bash
printf '\nCOMPOSE_FILE=docker-compose.yml:docker-compose.https.yml\n' >> .env
docker compose up -d web
curl --fail https://api.example.com/health
```

Port 80 redirects to HTTPS; port 443 serves the API. If certificate issuance fails, `docker compose start web` restores HTTP while you resolve DNS or firewall settings.

For renewal, install the following commands as Certbot hooks (substitute the actual absolute checkout path if different):

```bash
sudo mkdir -p /etc/letsencrypt/renewal-hooks/pre /etc/letsencrypt/renewal-hooks/post
printf '#!/bin/sh\ncd /home/ubuntu/stylehub/deploy/aws && /usr/bin/docker compose stop web\n' | sudo tee /etc/letsencrypt/renewal-hooks/pre/stylehub-stop >/dev/null
printf '#!/bin/sh\ncd /home/ubuntu/stylehub/deploy/aws && /usr/bin/docker compose start web\n' | sudo tee /etc/letsencrypt/renewal-hooks/post/stylehub-start >/dev/null
sudo chmod 755 /etc/letsencrypt/renewal-hooks/pre/stylehub-stop /etc/letsencrypt/renewal-hooks/post/stylehub-start
sudo systemctl enable --now certbot.timer
sudo certbot renew --dry-run
```

Standalone renewal briefly stops Nginx. The post hook starts it again using the renewed certificate.

## 5. Connect the Vercel frontend

In Vercel > Project > Settings > Environment Variables set:

```text
NEXT_PUBLIC_API_URL=https://api.example.com
```

Use no trailing slash and do not append `/api/v1`. Redeploy the frontend. Verify products load, sign-in works, and an uploaded image can be opened.

## Updates and troubleshooting

```bash
git pull --ff-only
docker compose build api
docker compose up -d
docker compose logs --tail=100 api web
docker stats --no-stream
```

A changed `.env` takes effect after `docker compose up -d`. Keep `.env` and SSH keys outside Git. Back up uploads and the Supabase database. The Docker build context excludes local credentials and data.

If API health fails, check Supabase availability, network restrictions, pooler credentials and SSL configuration. If the browser reports CORS errors, match `CORS_ORIGINS` to the exact frontend origin and recreate the API container. Do not publish secret environment values in logs or screenshots.
