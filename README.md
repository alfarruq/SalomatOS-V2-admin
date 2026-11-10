# SalomatOS Platform (vendor admin)

Standalone site for the vendor: customers (organizations and branches), contracts, the manual payment ledger
(install, server, voice add-on, SMS credits), suspend and reactivate. It is not linked from the clinic app.

It talks to the same Django backend as the clinic app, under `/api/platform/v1/`, with its own login. It never
reads patient data: usage is counts only.

```bash
pnpm install
pnpm dev        # http://localhost:5174, /api is proxied to http://localhost:8000
pnpm verify     # tsc + tests + build
```

Create the first login on the backend: `python manage.py create_platform_operator <username>`.

Serve this site on its own domain, with `/api/` routed to the backend (same-origin, so no CORS is needed).
