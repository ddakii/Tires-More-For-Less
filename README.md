# Tires & More For Less

Website + CRM demo for the Minneapolis tire shop at 1708 Central Ave NE.

## Live demo

Deployed on Railway (see repository Actions / Railway dashboard after publish).

## Local setup

```bash
npm run setup
npm run dev
```

- Site: http://localhost:5173
- API: http://localhost:3001
- Admin: http://localhost:5173/admin/login

### Demo login

- Email: `admin@tiresmoreforless.demo`
- Password: `Demo123!`

## Railway

This monorepo builds the Vite client and Express API, then serves both from one service.

Required environment variables:

- `JWT_SECRET` — any long random string
- `DATABASE_URL` — defaults to SQLite `file:./prod.db` (demo resets if the filesystem is ephemeral; seed runs automatically when empty)
