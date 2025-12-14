# Restaurant Management System Backend

## Overview
A production-ready Node.js/Express system using Supabase (PostgreSQL) for a restaurant menu and order management system.

## Stack
- **Backend:** Node.js, Express, TypeScript
- **Database:** Supabase (PostgreSQL), Supabase Auth
- **Deployment:** Vercel (Serverless)

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file:
   ```env
   PORT=3000
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   JWT_SECRET=your_supabase_jwt_secret
   ```

3. **Database Setup**
   - Go to your Supabase SQL Editor.
   - Run the contents of `sql/01_schema.sql`.
   - Run the contents of `sql/02_rls.sql`.

4. **Run Locally**
   ```bash
   npm run dev
   ```

## API Endpoints

### Auth
Authenticated via Supabase JWT in `Authorization: Bearer <token>` header.

### Menu
- `GET /api/menu`: Get all categories and items.
- `POST /api/menu/category`: Create category (Admin).
- `POST /api/menu/item`: Create item (Admin).
- `PUT /api/menu/item/:id`: Update item.
- `DELETE /api/menu/item/:id`: Delete item.

### Orders
- `POST /api/orders`: Create an order (Waiter).
- `GET /api/orders`: Get orders (Role filtered).
- `GET /api/orders/:id`: Get specific order.
- `PUT /api/orders/:id/status`: Update status (Chef/Waiter).
  - Triggers Invoice generation when status becomes `SERVED`.

### Invoices
- `GET /api/invoices/:orderId`: Get invoice (Cashier).

## Realtime
This backend primarily serves REST APIs. Realtime updates (Order status changes) are handled by Supabase Realtime functionality. Clients should subscribe to the `orders` table updates directly via Supabase Client for instant notifications.

## Deployment on Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel`.
3. Set environment variables in Vercel project settings.
