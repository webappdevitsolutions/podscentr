# Podscentra

Podscentra is a premium multi-page ecommerce experience built with Next.js 15, React, TypeScript, Tailwind CSS, and Framer Motion.

## Features

- Modern luxury UI with responsive dark and light modes
- Home, shop, product details, cart, checkout, order success, profile, auth, about, contact, blog, FAQ, order tracking, error, and admin dashboard pages
- Local storage cart and shared catalog state
- Search, filters, sorting, pagination UI, product cards, gallery zoom, quantity controls, checkout forms, accordions, toast notifications, and skeleton loading states
- SEO metadata and accessible navigation patterns
- Empty product catalog ready for real products in `data/products.ts`

## Installation

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production Build

```bash
npm run build
npm run start
```

## Deploy To Vercel

1. Push this project to GitHub.
2. Import the repository in Vercel.
3. Keep the default Next.js build settings.
4. Deploy.

## Structure

```text
app/          Route pages and global layout
components/   Reusable UI components
data/         Product catalog and blog data
hooks/        Cart and shared catalog state
lib/          Utilities
public/       Static assets
styles/       Reserved for additional global styles
```
