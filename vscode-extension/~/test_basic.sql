-- Basic SQL formatting test
SELECT
    id,
    name,
    email
FROM
    users
WHERE
    STATUS = 'active'
    AND created_at > '2023-01-01';

INSERT INTO
    orders (user_id, product_id, quantity, total)
VALUES
    (1, 100, 2, 29.99),
    (2, 101, 1, 15.50);

UPDATE
    users
SET
    last_login = NOW()
WHERE
    id IN (
        SELECT
            user_id
        FROM
            sessions
        WHERE
            active = TRUE
    );

DELETE FROM
    temp_data
WHERE
    created_at < date_sub(NOW(), INTERVAL 30 DAY);
