# Restaurant Order & Menu Management System (ROMS) - Admin Panel

A production-ready Admin Panel built with Next.js 14, TypeScript, Tailwind CSS, Shadcn UI, and Supabase.

## Features

- **Analytics Dashboard**: Real-time overview of orders, revenue, and trends.
- **Order Management**: View recent orders and full order history with status timeline.
- **Menu Management**: Create, edit, and delete categories and menu items.
- **Live Preview**: See the menu exactly as customers see it.
- **User Management**: Assign roles (Admin, Waiter, Chef, Cashier) and manage access.
- **Authentication**: Secure Supabase Auth with Role-Based Access Control (RBAC).
- **Theme Support**: Light, Dark, and System modes.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **Database/Auth**: Supabase
- **Charts**: Recharts
- **State/Forms**: React Hook Form, Zod

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   BACKEND_API_URL=http://localhost:3000
   NEXT_PUBLIC_ENABLE_MENU_IMAGES=true
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```
   Access the admin panel at `http://localhost:3000` (or port 3001 if backend is on 3000).

## Project Structure

- `app/(admin)`: Protected admin routes (Dashboard, Orders, etc.)
- `app/login`: Authentication page.
- `components`: Reusable UI components (Shadcn + Custom).
- `lib`: Utilities, Supabase Client, API Client.
- `middleware.ts`: Route protection logic.

## Deployment

The application is ready for deployment on Vercel.
1. Push to GitHub/GitLab.
2. Import project in Vercel.
3. specific Environment Variables in Vercel Project Settings.
4. Deploy.
