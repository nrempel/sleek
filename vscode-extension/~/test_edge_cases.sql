/* Multi-line comment test */
-- This is a test for edge cases
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(255) NOT NULL,
    last_name varchar(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test with different casing and syntax
SELECT
    *
FROM
    users
WHERE
    email LIKE '%@gmail.com'
    AND created_at > '2023-01-01';

INSERT INTO
    users (first_name, last_name, email)
VALUES
    ('John', 'Doe', 'john.doe@example.com'),
    ('Jane', 'Smith', 'jane.smith@example.com');

/* Test with functions and expressions */
UPDATE
    users
SET
    first_name = UPPER(first_name),
    last_name = lower(last_name),
    email = CONCAT(
        SUBSTRING(first_name, 1, 1),
        '.',
        last_name,
        '@company.com'
    )
WHERE
    id BETWEEN 1 AND 100;

-- Test window functions
SELECT
    first_name,
    last_name,
    created_at,
    dense_rank() over (
        PARTITION by date(created_at)
        ORDER BY
            created_at
    ) AS daily_rank
FROM
    users;
