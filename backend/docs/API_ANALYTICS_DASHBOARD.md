# Analytics Dashboard API Documentation

## Endpoint: GET `/api/analytics/dashboard`

### Description
Retrieves comprehensive analytics data for the restaurant dashboard, including revenue metrics, order statistics, and top-selling items for a specified date range.

---

## Authentication
**Required:** Yes  
**Role Required:** `ADMIN`

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

---

## Request

### HTTP Method
```
GET
```

### URL
```
/api/analytics/dashboard
```

### Query Parameters

| Parameter | Type   | Required | Default        | Description                                      |
|-----------|--------|----------|----------------|--------------------------------------------------|
| `period`  | string | No       | -              | Predefined period: `all` for all-time analytics  |
| `from`    | string | No       | 7 days ago     | Start date for analytics period (ISO 8601 format)|
| `to`      | string | No       | Current date   | End date for analytics period (ISO 8601 format)  |

**Date Format:** ISO 8601 (e.g., `2024-12-01T00:00:00.000Z` or `2024-12-01`)

**Period Values:**
- `all` - Retrieves analytics for all time (from 1970-01-01 to current date)
- If `period=all` is set, the `from` parameter is ignored

**Priority Order:**
1. If `period=all` → Uses all-time range
2. If `from` is provided → Uses custom date range
3. Default → Last 7 days

### Example Requests

**Default (Last 7 days):**
```http
GET /api/analytics/dashboard
```

**All Time Analytics:**
```http
GET /api/analytics/dashboard?period=all
```

**Custom Date Range:**
```http
GET /api/analytics/dashboard?from=2024-12-01&to=2024-12-14
```

**With Full ISO Timestamps:**
```http
GET /api/analytics/dashboard?from=2024-12-01T00:00:00.000Z&to=2024-12-14T23:59:59.999Z
```

---

## Response

### Success Response

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "period": {
    "from": "2024-12-07T00:00:00.000Z",
    "to": "2024-12-14T23:59:59.999Z"
  },
  "stats": {
    "total_revenue": 15847.50,
    "total_orders": 125,
    "average_order_value": 126.78
  },
  "sales_data": [
    {
      "date": "2024-12-07",
      "revenue": 2100.50,
      "orders": 18
    },
    {
      "date": "2024-12-08",
      "revenue": 1850.25,
      "orders": 15
    },
    {
      "date": "2024-12-09",
      "revenue": 2300.75,
      "orders": 20
    },
    {
      "date": "2024-12-10",
      "revenue": 1950.00,
      "orders": 16
    },
    {
      "date": "2024-12-11",
      "revenue": 2200.00,
      "orders": 19
    },
    {
      "date": "2024-12-12",
      "revenue": 2450.00,
      "orders": 21
    },
    {
      "date": "2024-12-13",
      "revenue": 1996.00,
      "orders": 16
    }
  ],
  "topItems": [
    {
      "name": "Classic Burger",
      "count": 45,
      "revenue": 674.55
    },
    {
      "name": "Margherita Pizza",
      "count": 38,
      "revenue": 645.62
    },
    {
      "name": "Pasta Carbonara",
      "count": 32,
      "revenue": 511.68
    },
    {
      "name": "French Fries",
      "count": 28,
      "revenue": 139.72
    },
    {
      "name": "Grilled Chicken",
      "count": 25,
      "revenue": 474.75
    }
  ]
}
```

### Response Fields

#### `period` (object)
Contains the actual date range used for the analytics query.

| Field  | Type   | Description                                    |
|--------|--------|------------------------------------------------|
| `from` | string | Start date of the analytics period (ISO 8601) |
| `to`   | string | End date of the analytics period (ISO 8601)   |

#### `stats` (object)
High-level summary metrics for the specified period.

| Field                 | Type   | Description                                           |
|-----------------------|--------|-------------------------------------------------------|
| `total_revenue`       | number | Total revenue from all SERVED orders (in currency)    |
| `total_orders`        | number | Total count of SERVED orders                          |
| `average_order_value` | number | Average revenue per order (total_revenue / total_orders) |

#### `sales_data` (array)
**NEW:** Daily aggregated sales data for time-series charts. Each entry represents one day in the date range.

Each item contains:

| Field     | Type   | Description                                    |
|-----------|--------|------------------------------------------------|
| `date`    | string | Date in YYYY-MM-DD format (e.g., "2024-12-07") |
| `revenue` | number | Total revenue for that specific date           |
| `orders`  | number | Number of orders for that specific date        |

**Note:** Array is sorted chronologically (oldest to newest).

#### `topItems` (array)
Array of the top 5 best-selling menu items, sorted by quantity sold (descending).

Each item contains:

| Field     | Type   | Description                                    |
|-----------|--------|------------------------------------------------|
| `name`    | string | Name of the menu item                          |
| `count`   | number | Total quantity sold                            |
| `revenue` | number | Total revenue generated by this item           |

---

## Error Responses

### 401 Unauthorized
**Condition:** No valid JWT token provided or token is expired.

```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
**Condition:** User does not have ADMIN role.

```json
{
  "error": "Insufficient permissions"
}
```

### 500 Internal Server Error
**Condition:** Database query failed or server error.

```json
{
  "error": "Database error message"
}
```

---

## Business Logic

### Revenue Calculation
- Only includes orders with status `SERVED`
- Sums the `total_amount` field from all matching orders
- Filters by `created_at` date range

### Order Count
- Counts only orders with status `SERVED`
- Filters by `created_at` date range

### Average Order Value
- Calculated as: `total_revenue / total_orders`
- Returns `0` if no orders exist

### Sales Data (Time-Series)
**NEW:** Daily aggregated data for charts
1. Groups all SERVED orders by date (YYYY-MM-DD format)
2. For each date:
   - Sums `total_amount` to get daily revenue
   - Counts number of orders
3. Sorts chronologically (oldest to newest)
4. Returns one entry per day that has orders

**Note:** Days with zero orders are NOT included in the array.

### Top Items Calculation
1. Fetches all `order_items` within the date range
2. Groups items by `name`
3. For each item:
   - Sums `quantity` to get total count
   - Calculates revenue as `SUM(quantity * price)`
4. Sorts by count (descending)
5. Returns top 5 items

**Note:** The top items calculation includes ALL order items in the date range, not just from SERVED orders. This is a current implementation detail that may be refined.

---

## Usage Examples

### JavaScript (Fetch API)
```javascript
// Get analytics for a specific date range
const token = 'your-jwt-token';
const from = '2024-12-01';
const to = '2024-12-14';

const response = await fetch(
  `/api/analytics/dashboard?from=${from}&to=${to}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const analytics = await response.json();

// Access summary stats
console.log('Total Revenue:', analytics.stats.total_revenue);
console.log('Total Orders:', analytics.stats.total_orders);
console.log('Average Order Value:', analytics.stats.average_order_value);

// Access daily sales data for charts
console.log('Sales Data:', analytics.sales_data);
// Example: [{ date: "2024-12-07", revenue: 2100.50, orders: 18 }, ...]

// Access top items
console.log('Top Item:', analytics.topItems[0].name);

// Get all-time analytics
const allTimeResponse = await fetch(
  '/api/analytics/dashboard?period=all',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const allTimeAnalytics = await allTimeResponse.json();
console.log('All-Time Revenue:', allTimeAnalytics.stats.total_revenue);
```

### cURL
```bash
curl -X GET \
  'https://your-api.com/api/analytics/dashboard?from=2024-12-01&to=2024-12-14' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Axios
```javascript
import axios from 'axios';

const getAnalytics = async (from, to) => {
  try {
    const response = await axios.get('/api/analytics/dashboard', {
      params: { from, to },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Analytics error:', error.response?.data);
    throw error;
  }
};

// Usage
const analytics = await getAnalytics('2024-12-01', '2024-12-14');
```

---

## Performance Considerations

### Current Implementation
- **In-Memory Aggregation:** Revenue and top items are calculated in the Node.js server memory
- **Suitable for:** Small to medium datasets (< 10,000 orders per query)
- **Query Count:** 2 database queries (orders + order_items)

### Optimization Recommendations

For high-volume scenarios, consider:

1. **Database-Level Aggregation:**
   ```sql
   -- Use Supabase RPC functions for server-side aggregation
   CREATE OR REPLACE FUNCTION get_analytics_dashboard(
     start_date TIMESTAMP,
     end_date TIMESTAMP
   )
   RETURNS JSON AS $$
   -- SQL aggregation logic here
   $$ LANGUAGE sql;
   ```

2. **Caching:**
   - Cache results for frequently requested date ranges
   - Use Redis or similar for 5-15 minute cache TTL

3. **Materialized Views:**
   - Create daily/hourly aggregated views
   - Refresh periodically for near-real-time data

---

## Related Endpoints

- `GET /api/orders` - Retrieve order details
- `GET /api/invoices` - Retrieve invoice data
- `GET /api/menu` - Retrieve menu items

---

## Changelog

| Version | Date       | Changes                                    |
|---------|------------|--------------------------------------------|
| 1.0     | 2024-12-14 | Initial implementation                     |

---

## Notes

- Default date range is last 7 days if no parameters provided
- All monetary values are in the restaurant's base currency (no currency field in response)
- Top items are limited to 5 results
- Date filtering uses `created_at` timestamp
- Only `SERVED` orders contribute to revenue and order count
