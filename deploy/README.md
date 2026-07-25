# OpenWA production deploy

## Stack

```bash
docker compose -f docker-compose.prod.yml up -d
```

| Service | Role |
|---------|------|
| `openwa-proxy` | nginx TLS terminator on `:80` / `:443` |
| `openwa-api` | NestJS API + dashboard (internal + `127.0.0.1:2785`) |
| `openwa-docker-proxy` | Hardened Docker socket gateway |

## URLs

- Public: https://wa.routedns.io  
- Local: http://127.0.0.1:2785  
- Health: https://wa.routedns.io/api/health/ready  
- Swagger: https://wa.routedns.io/api/docs  

TLS uses `./certs` (`fullchain.pem` + `privkey.pem`, covers `*.routedns.io`).

## Auth

- Dashboard login: username/password from `.env` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`)
- Session API key (scripts/bots): `data/.api-key` via `X-Api-Key`
- Master key: `.env` → `API_MASTER_KEY`
- JWT sessions: `.env` → `JWT_SECRET`

## Note vs RouteDNS nginx

This stack binds host `:80` / `:443`. Do not run RouteDNS `nginx` at the same time.
