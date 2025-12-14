# Admin Panel Architecture & API Integration

## 1. Directory Structure

The Admin Panel is built using Next.js 14 App Router, located in `adminpanel/`.

```
adminpanel/
├── app/
│   ├── (admin)/            # Protected Admin Routes (Layout with Sidebar)
│   │   ├── dashboard/      # Analytics Check via Supabase
│   │   ├── categories/     # Category Management
│   │   ├── menu-items/     # Menu Item Management
│   │   ├── orders/         # Order Management (Recent & History)
│   │   └── ...
│   ├── login/              # Public Login Page
│   ├── unauthorized/       # Access Denied Page
│   └── layout.tsx          # Root Layout (Theme, Toaster)
├── components/
│   ├── ui/                 # shadcn/ui generic components
│   ├── DataTable.tsx       # Reusable Table Component
│   ├── Sidebar.tsx         # Navigation
│   └── ...
├── lib/
│   ├── apiClient.ts        # Wrapper for Backend REST APIs
│   └── supabaseClient.ts   # Wrapper for Supabase Auth & Reads
└── middleware.ts           # Route Protection & Role Enforcement
```

## 2. API Integration Strategy

We follow a strict separation of concerns based on the project requirements:

*   **READ Operations (GET)**: Use `supabaseClient` (PostgREST) directly from the frontend where possible for performance and real-time capabilities. This applies to fetching lists of orders, menu items, and categories.
*   **WRITE Operations (POST, PUT, DELETE)**: **MUST** use `apiClient` to call the Express Backend. This ensures business logic validation (e.g., triggers, notifications) is executed centrally.

### Client Wrappers
*   **`lib/supabaseClient.ts`**: Uses via `@supabase/ssr` or `@supabase/supabase-js`.
*   **`lib/apiClient.ts`**: A standard `fetch` wrapper that:
    *   Automatically attaches the Supabase JWT (`Authorization: Bearer <token>`).
    *   Prefixes requests with `NEXT_PUBLIC_BACKEND_API_URL`.
    *   Handles 401/403/500 errors consistently.

## 3. Auth & Role Enforcement

1.  **Authentication**: Handled by Supabase Auth (Email/Password).
2.  **Middleware Protection**: `middleware.ts` runs on every request.
    *   Checks for valid Session.
    *   Decodes JWT to check `app_metadata.role` or `user_metadata.role`.
    *   Redirects non-`admin` users to `/unauthorized`.
3.  **Backend Protection**: The Express API verifies the JWT using Supabase Admin/Secret or JWT secret and checks the role again before processing writes.

## 4. Theme Handling
*   Uses `next-themes` with a `ThemeProvider` wrapper in `app/layout.tsx`.
*   Supports Light, Dark, and System modes.
*   shadcn/ui components support query-based dark mode via CSS variables (`--background`, `--foreground`).

## 5. Analytics Data Flow
*   Due to the lack of a dedicated Analytics API in the provided contract, the Dashboard calculates metrics Client-Side (or Server-Side in Page).
*   **Method**: Fetches raw `orders` (filtered by date range) via Supabase Client and computes:
    *   Total Revenue (Sum of `total_amount`)
    *   Order Count
    *   Average Order Value
*   **Note**: This is acceptable for the initial scale using the allowed Supabase direct access.

## 6. Error Handling Strategy
*   **Frontend UI**: Uses `sonner` for Toast notifications (Success/Error).
*   **API Client**: Catches non-2xx responses and throws standardized Javascript Errors containing the message from the backend.
*   **Forms**: Uses `react-hook-form` + `zod` for client-side validation before sending data found.
