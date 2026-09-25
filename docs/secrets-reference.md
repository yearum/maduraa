# Secrets Reference

Never commit real credentials.

| Variable | Location | Purpose | Required |
|---|---|---|---|
| VITE_API_BASE_URL | client/.env | Backend API base URL | Development |
| PORT | server/.env | Backend server port | Development |
| DATABASE_URL | server/.env | PostgreSQL connection URI | Backend |
| JWT_SECRET | server/.env | JWT signing secret if JWT auth is used | Backend |
| NODE_ENV | server/.env | Runtime environment | Development |

Use `.env.example` as a safe template. Store real values only in local environment configuration or the approved secret manager.
