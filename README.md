# Fragments UI

A modern Next.js web client for working with the Fragments microservice API. It lets you authenticate via AWS Cognito and then create, list, view, update, convert, and delete “fragments” (text or binary content) without curl/Postman.

## Features

- CRUD for fragments (list, view details, edit, delete)
- Upload via text input or file picker/drag-and-drop
- Preview for supported types (HTML rendering, image display)
- conversions:
  - Markdown -> HTML , Plain text
  - JSON -> YAML , Plain text
  - YAML -> JSON
  - CSV -> JSON , Plain text
  - Images: PNG, JPEG, WebP, GIF, AVIF
- Search/filter fragments by id, type, size, or timestamps
- Auth with AWS Cognito
- Production image with Nginx and runtime API URL injection
- CI with GitHub Actions; Docker builds pushed to Docker Hub

## Tech stack

- Next.js 15, React, TypeScript
- Tailwind CSS, shadcn/ui, Framer Motion
- Authentication: oidc-client-ts + react-oidc-context (AWS Cognito)
- Static export (`next.config.js` sets `output: 'export'`)
- Docker multi-stage build, Nginx runtime

## Project structure

```
fragments-ui/
├─ app/
│  ├─ layout.tsx            # Root layout/providers
│  ├─ page.tsx              # Main UI: auth, list, view, convert, edit
│  └─ provider.tsx          # Auth provider setup
├─ components/
│  ├─ ui/                   # Reusable UI primitives (shadcn/ui)
│  ├─ Info.tsx              # Create fragment modal (text/file)
│  ├─ EditFragmentModal.tsx # Update existing fragment
│  └─ AnimatedButton.tsx    # Button with loading/success/error states
├─ services/
│  ├─ api.ts                # API client (build/runtime API base URL)
│  └─ auth.ts               # AWS Cognito OIDC client + helpers
├─ docker/
│  ├─ nginx.conf            # Nginx serving static export
│  ├─ env-config.js.template# Injects window.__ENV.API_ORIGIN at runtime
│  └─ entrypoint.sh         # Renders env-config.js via envsubst
├─ .github/workflows/ci.yml # Lint, build, Docker build+push
├─ Dockerfile               # Multi-stage: deps -> build -> nginx runner
├─ next.config.js           # `output: 'export'`, unoptimized images
├─ tailwind.config.js, postcss.config.js
└─ package.json             # Scripts and dependencies
```

## Getting started (local)

1. Install deps

```bash
npm install
```

2. Configure env (create `.env` in project root)

```bash
# Fragments API URL used at build time
NEXT_PUBLIC_API_URL=http://localhost:8080

# AWS Cognito
NEXT_PUBLIC_AWS_COGNITO_POOL_ID=your_pool_id
NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID=your_client_id
NEXT_PUBLIC_OAUTH_SIGN_IN_REDIRECT_URL=http://localhost:3000
```

3. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000.

## Docker

Build and run with runtime API override (no rebuild needed when API URL changes):

```bash
docker build \
  --build-arg NEXT_PUBLIC_AWS_COGNITO_POOL_ID=your_pool_id \
  --build-arg NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID=your_client_id \
  --build-arg NEXT_PUBLIC_OAUTH_SIGN_IN_REDIRECT_URL=http://localhost:3000 \
  -t fragments-ui .

docker run -p 8080:8080 \
  -e API_ORIGIN=https://your-api.example.com \
  fragments-ui
```

Open http://localhost:8080. Nginx serves the static export and injects `window.__ENV.API_ORIGIN` from `API_ORIGIN`.

## Scripts

- `npm run dev` – start dev server (port 3000)
- `npm run build` – production build (static export in `out/`)
- `npm start` – serve Next in production mode (not used with static export)
- `npm run lint` – run ESLint

## Environment variables

Build-time (NEXT*PUBLIC*\* must be defined when building):

- `NEXT_PUBLIC_API_URL` – default API base URL
- `NEXT_PUBLIC_AWS_COGNITO_POOL_ID` – Cognito User Pool id
- `NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID` – Cognito App Client id

Runtime (Docker/Nginx):

- `API_ORIGIN` – overrides API base URL at runtime (exposed as `window.__ENV.API_ORIGIN`)

## How it works

- Authentication: OIDC Code flow via AWS Cognito. After login, the ID token is attached as `Authorization: Bearer <token>` for API calls.
- API base URL resolution: `services/api.ts` prefers `window.__ENV.API_ORIGIN` (runtime) then falls back to `NEXT_PUBLIC_API_URL` (build-time).
- Conversions and previews are handled by calling the API

## CI/CD

GitHub Actions workflow runs on pushes and PRs to `main`:

- Lint (ESLint)
- Dockerfile lint (Hadolint)
- Build (Next.js) using safe dummy envs
- Build & push Docker image to Docker Hub (`snehamaharjan/fragments-ui`) with tags `latest`, `main`, and `sha-<commit>`

## Usage guide

1. Login to Cognito (Login button)
2. Create a fragment
3. View fragments (View Fragments or list with search)
4. Click a card to preview content
5. Use convert buttons (text/image) to transform formats
6. Edit or Delete from the list
