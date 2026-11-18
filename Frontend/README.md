# Labyrinth web app (React, CRA)

`npm ci`, copy `.env.example` to `.env` (set `REACT_APP_API_URL`), then `npm start` / `CI=true npm test` / `npm run build`.
All HTTP goes through `src/api/client.js` (adds the token, signs out on 401). See the root README for the full setup.
