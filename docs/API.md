# API Documentation

Base URL: `/api`

## Authentication
All protected endpoints require a valid Supabase JWT in the Authorization header.
`Authorization: Bearer <your-jwt-token>`

## 1. Menu Management

### Get Menu
Retrieves the full menu (categories and items).
*   **URL**: `/menu`
*   **Method**: `GET`
*   **Auth**: Required
*   **Response**: Array of categories with nested menu items.

### Create Category (Admin)
*   **URL**: `/menu/category`
*   **Method**: `POST`
*   **Role**: `ADMIN`
*   **Body**:
    ```json
    {
      "name": "Starters",
      "description": "Appetizers",
      "restaurant_id": "uuid"
    }
    ```

### Create Menu Item (Admin)
*   **URL**: `/menu/item`
*   **Method**: `POST`
*   **Role**: `ADMIN`
*   **Body**:
    ```json
    {
      "restaurant_id": "uuid",
      "category_id": "uuid",
      "name": "Spring Rolls",
      "description": "Crispy vagetable rolls",
      "price": 5.99,
      "image_url": "http://..."
    }
    ```

### Update Menu Item (Admin)
*   **URL**: `/menu/item/:id`
*   **Method**: `PUT`
*   **Role**: `ADMIN`
*   **Body**: JSON object with fields to update (e.g., price, name).

### Delete Menu Item (Admin)
*   **URL**: `/menu/item/:id`
*   **Method**: `DELETE`
*   **Role**: `ADMIN`

---

## 2. Order Management

### Create Order (Waiter)
Creates a new order. Prices are snapshot at the time of creation from the database.
*   **URL**: `/orders`
*   **Method**: `POST`
*   **Role**: `WAITER`
*   **Body**:
    ```json
    {
      "restaurant_id": "uuid",
      "table_number": "5",
      "items": [
        { "menu_item_id": "uuid", "quantity": 2, "notes": "No onions" },
        { "menu_item_id": "uuid", "quantity": 1 }
      ]
    }
    ```

### Get Orders
Fetches orders. Results are filtered by role (e.g., Waiters see their own, Chefs see all).
*   **URL**: `/orders`
*   **Method**: `GET`
*   **Auth**: Required

### Get Order Details
*   **URL**: `/orders/:id`
*   **Method**: `GET`
*   **Auth**: Required

### Update Order Status
Updates the status of an order. Enforces valid state transitions.
*   **URL**: `/orders/:id/status`
*   **Method**: `PUT`
*   **Role**: `CHEF`, `WAITER`, `ADMIN`
*   **Body**:
    ```json
    {
      "status": "COOKING" 
    }
    ```
*   **Valid Transitions**:
    *   `CREATED` -> `ACCEPTED`
    *   `ACCEPTED` -> `COOKING`
    *   `COOKING` -> `READY`
    *   `READY` -> `SERVED` (Triggers Invoice Generation)
    *   Any -> `CANCELLED`

---

## 3. Invoices

### Get Invoice
Retrieves invoice details for a specific order.
*   **URL**: `/invoices/:orderId`
*   **Method**: `GET`
*   **Role**: `CASHIER`, `ADMIN`
*   **Response**: Invoice details including subtotal, tax, and total.
