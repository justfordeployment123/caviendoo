# Caviendoo

Caviendoo is an Agricultural Intelligence platform for Tunisia, specializing in fruit production data, geographic mapping, and seasonal analysis.

## Project Structure

- `caviendoo-frontend/`: Next.js frontend application.
- `caviendoo-backend/`: (Future) API and Data services.

## Tech Stack

- **Frontend**: Next.js 16+, React, TailwindCSS, D3.js.
- **Deployment**: Dockerized, hosted on VPS via Coolify.

## Development

### Frontend

```bash
cd caviendoo-frontend
npm install
npm run dev
```

### Docker

```bash
docker build -t caviendoo-frontend ./caviendoo-frontend
```
