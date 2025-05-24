-- Complex SQL formatting test with CTEs, window functions, and subqueries
WITH sales_data AS (
    SELECT
        customer_id,
        product_id,
        quantity,
        price,
        order_date
    FROM
        orders
    WHERE
        order_date >= '2023-01-01'
),
customer_totals AS (
    SELECT
        customer_id,
        sum(quantity * price) AS total_spent,
        count(*) AS order_count
    FROM
        sales_data
    GROUP BY
        customer_id
    HAVING
        sum(quantity * price) > 1000
)
SELECT
    c.customer_id,
    c.first_name,
    c.last_name,
    ct.total_spent,
    ct.order_count,
    row_number() over (
        ORDER BY
            ct.total_spent DESC
    ) AS spending_rank,
    lag(ct.total_spent) over (
        ORDER BY
            ct.total_spent DESC
    ) AS prev_customer_total,
    CASE
        WHEN ct.total_spent > 5000 THEN 'Premium'
        WHEN ct.total_spent > 2000 THEN 'Gold'
        ELSE 'Standard'
    END AS customer_tier
FROM
    customers c
    JOIN customer_totals ct ON c.customer_id = ct.customer_id
WHERE
    c.status = 'active'
    AND EXISTS (
        SELECT
            1
        FROM
            orders o
        WHERE
            o.customer_id = c.customer_id
            AND o.order_date > date_sub(NOW(), INTERVAL 90 DAY)
    )
ORDER BY
    ct.total_spent DESC
LIMIT
    100;
