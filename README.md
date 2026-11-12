# Trailer Fleet Management Frontend

This is the frontend for the trailer fleet management system.

## Local development

- Install dependencies: `npm install`
- Run the app: `npm run dev`
- Build for production: `npm run build`

## Deployment notes

- Render reads `render.yaml` from the repository root, builds with `npm ci && npm run build`, and serves the production bundle with Vite preview.
- Set `VITE_API_BASE_URL` to the backend `/api` URL for the target environment; local development can use `.env.local`.
