# API Documentation

Base URL: `/api`

## Authentication
All protected endpoints require a valid Supabase JWT in the `Authorization` header.
`Authorization: Bearer <your-jwt-token>`

---

## 1. Menu & Categories Management
These endpoints manage the restaurant menu, including categories and individual items.

### Get Menu
Retrieves the full menu (categories with nested items).
*   **URL**: `/menu` or `/categories`
*   **Method**: `GET`
*   **Auth**: Required
*   **Response**: JSON Array of categories with their menu items.

### Create Category (Admin)
*   **URL**: `/menu/category` or `/categories`
*   **Method**: `POST`
*   **Role**: `ADMIN`
*   **Body**:
    ```json
    {
      "name": "Starters",
      "description": "Appetizers",
      "restaurant_id": "uuid",
      "sort_order": 1
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
      "description": "Crispy vegetable rolls",
      "price": 5.99,
      "image_url": "http://...",
      "is_available": true
    }
    ```

### Update Menu Item (Admin)
*   **URL**: `/menu/item/:id`
*   **Method**: `PUT`
*   **Role**: `ADMIN`
*   **Body**: Partial JSON object with fields to update.

### Delete Menu Item (Admin)
*   **URL**: `/menu/item/:id`
*   **Method**: `DELETE`
*   **Role**: `ADMIN`

---

## 2. Order Management

### Create Order (Waiter/Admin)
Creates a new order.
*   **URL**: `/orders`
*   **Method**: `POST`
*   **Role**: `WAITER`, `ADMIN`
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
Fetches list of orders.
*   **URL**: `/orders`
*   **Method**: `GET`
*   **Auth**: Required (Response filtered based on User Role logic in controller)

### Get Order Details
*   **URL**: `/orders/:id`
*   **Method**: `GET`
*   **Auth**: Required

### Update Order Status
Updates the status of an order.
*   **URL**: `/orders/:id/status`
*   **Method**: `PUT`
*   **Role**: `CHEF`, `WAITER`, `ADMIN`
*   **Body**:
    ```json
    {
      "status": "COOKING" 
    }
    ```
*   **Valid Statuses**: `CREATED`, `ACCEPTED`, `COOKING`, `READY`, `SERVED`, `CANCELLED`

---

## 3. Invoices

### Get Invoice by Order ID
Retrieves invoice details for a specific order.
*   **URL**: `/invoices/:orderId`
*   **Method**: `GET`
*   **Role**: `CASHIER`, `ADMIN`

