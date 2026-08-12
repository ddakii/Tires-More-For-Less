# Tires & More For Less — Website + CRM Demo

Personalized demo website and shop CRM for **Tires & More For Less** (Minneapolis, MN).

## Stack

- **Client:** React, TypeScript, Vite, Tailwind CSS, React Router, Recharts
- **Server:** Node.js, Express, TypeScript
- **Database:** SQLite via Prisma

## Quick start

```bash
cd tires-more-for-less
npm run setup
npm run dev
```

- Public site: http://localhost:5173
- API: http://localhost:3001
- Admin CRM: http://localhost:5173/admin/login

### Demo admin login

- Email: `admin@tiresmoreforless.demo`
- Password: `Demo123!`

## What’s included

### Public website
Home, tire search/catalog, services, about, reviews (Michael D. only), contact (map + hours), appointment booking, quote requests, optional customer portal (`/portal/:token`).

### Admin CRM
Dashboard, customers, vehicles, appointments, tire inventory, quote requests, quotes, service orders, invoices, reports, settings, global search, mock notifications.

### Demo journey
1. Search **225/65R17** on the site
2. Request a quote (or open CRM customer **Jordan Mitchell**)
3. Accepted quote **QTE-0100** → Convert to service order
4. Add tires / installation / balancing → inventory decreases
5. Complete → create invoice → mark paid

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Run API + Vite together |
| `npm run setup` | Install deps, push schema, seed |
| `npm run db:seed` | Re-seed demo data |
| `npm run db:push` | Push Prisma schema |

## Note on folder path

This project lives at `Desktop/tires-more-for-less` (no `&` in the path) so Node/Prisma tooling works reliably on Windows.
