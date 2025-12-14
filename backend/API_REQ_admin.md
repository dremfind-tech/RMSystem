# Missing Admin API Requirements

The following API endpoints are required for full Admin Panel functionality but are missing from the current Backend Contract/Implementation.

## 1. Update Category
*   **Method**: `PUT`
*   **Endpoint**: `/api/menu/category/:id`
*   **Purpose**: Allows admins to rename categories or change their sort order.
*   **Required Role**: `ADMIN`
*   **Request Body**:
    ```json
    {
        "name": "Updated Name",
        "sort_order": 2
    }
    ```

## 2. Delete Category
*   **Method**: `DELETE`
*   **Endpoint**: `/api/menu/category/:id`
*   **Purpose**: Allows admins to soft-delete or remove categories.
*   **Required Role**: `ADMIN`

## 3. Dedicated Analytics
*   **Method**: `GET`
*   **Endpoint**: `/api/analytics/dashboard`
*   **Purpose**: To offload heavy aggregation queries (Revenue, Top Items) from the client/frontend to the database layer.
*   **Required Role**: `ADMIN`
*   **Query Params**: `?from=2023-01-01&to=2023-01-07`
