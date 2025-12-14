# Project Structure & Architecture

## System Overview
The Restaurant Management System is a serverless-ready backend application built with Node.js, Express, and TypeScript. It utilizes Supabase for PostgreSQL database, Authentication, and Realtime capabilities.

## Directory Structure

```
RestaurantManagementSystem/
├── docs/                   # Project documentation
├── sql/                    # Database schema and migration scripts
│   ├── 01_schema.sql       # Core database tables and relationships
│   └── 02_rls.sql          # Row Level Security policies
├── src/                    # Source code
│   ├── controllers/        # Request handlers (Business logic)
│   ├── middlewares/        # Express middlewares (Auth, Validation)
│   ├── routes/             # API route definitions
│   ├── utils/              # Helper functions and configurations
│   ├── app.ts              # Express application setup
│   └── server.ts           # Server entry point
├── .env.example            # Environment variable template
├── .gitignore              # Git ignore rules
├── package.json            # Project dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── vercel.json             # Vercel deployment configuration
```

## Architecture Layers

### 1. Database Layer (Supabase PostgreSQL)
*   **Tables**: `restaurants`, `users`, `categories`, `menu_items`, `orders`, `order_items`, `order_status_history`, `invoices`.
*   **Security**: Row Level Security (RLS) is used to enforce data access rules at the database level.
    *   **ADMIN**: Full access to all data.
    *   **WAITER**: Create orders, view own orders, read menu.
    *   **CHEF**: View and update orders (Kitchen Display).
    *   **CASHIER**: View orders and generated invoices.
*   **Realtime**: Clients subscribe directly to database changes for instant updates (e.g., Kitchen app subscribes to `orders` table).

### 2. Backend API Layer (Express.js)
The backend serves as a RESTful API for handling business logic that requires validation or specific processing sequences not easily handled by DB rules alone.

*   **Authentication**:
    *   Uses Supabase JWTs.
    *   `src/middlewares/auth.ts`: Middleware verifies the JWT and checks the user's role against the `user_roles` table.
*   **Controllers (`src/controllers/`)**:
    *   **Menu**: Handles creation, updates, and deletion of categories and items.
    *   **Orders**: Implements the State Machine for order flow (`CREATED` -> `ACCEPTED` -> ...). Handles complex logic like transactional price snapshots and billing triggers.
    *   **Invoices**: Retrieval of generated billing information.
*   **Routes (`src/routes/`)**: Defines the API endpoints and applies strict role-based middlewares.

### 3. Deployment (Serverless)
*   Configured for **Vercel** via `vercel.json`.
*   The API runs as stateless serverless functions.
*   No persistent local state; all state is stored in Supabase.

## Key Design Decisions

1.  **Serverless Server**: We use standard Express but wrap it for Vercel/Serverless usage. This avoids managing long-running servers.
2.  **Supabase Auth**: We leverage Supabase's robust auth system instead of rolling our own. The backend strictly validates these tokens.
3.  **Role Management**: Roles are stored in a dedicated `user_roles` table to allow for flexibility and distinct RBAC policies.
4.  **Order State Machine**: Transitions are enforced in the backend controller to prevent illegal states (e.g., skipping from CREATED to SERVED without cooking).
5.  **Billing Trigger**: Invoices are generated automatically when an order is marked as `SERVED`, ensuring data consistency.
