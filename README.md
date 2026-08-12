# Tires & More For Less

Website + CRM demo for the Minneapolis tire shop at 1708 Central Ave NE.

## Live

- **Site:** https://web-production-4bc23.up.railway.app
- **Admin CRM:** https://web-production-4bc23.up.railway.app/admin/login
- **GitHub:** https://github.com/ddakii/Tires-More-For-Less

### Demo login

- Email: `admin@tiresmoreforless.demo`
- Password: `Demo123!`

## Local setup

```bash
npm run setup
npm run dev
```

- Site: http://localhost:5173
- API: http://localhost:3001
- Admin: http://localhost:5173/admin/login

## Railway

Monorepo builds the Vite client and Express API, then serves both from one service.

Environment variables:

- `JWT_SECRET` — random secret string
- `DATABASE_URL` — SQLite `file:./prod.db` (demo seeds automatically when empty)
