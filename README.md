# Maaniko Admin

Next.js admin portal for authenticated catalog management.

## Setup

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Set the backend URL, NextAuth secret, and Google OAuth credentials in `.env.local`.

## Catalog management

The portal includes live CRUD pages for:

- Products: core data, category, journey relations, images, details, dynamic attributes and values
- Solution boxes: product relations, quantities, bilingual content, guides, reviews, FAQ, and packaging
- Banners: home/shop placement, desktop/mobile images, schedule, link, ordering, and publish state

All mutations pass through authenticated Next.js server routes and are authorized again by the NestJS JWT role guard.

