-- Complex SQL test cases for Sleek formatter

-- Simple SELECT
select * from users;

-- Complex JOIN with subquery
select u.id, u.name, u.email, o.total, (select count(*) from orders o2 where o2.user_id = u.id) as order_count from users u left join orders o on u.id = o.user_id where u.status = 'active' and o.total > (select avg(total) from orders) order by o.total desc, u.name asc;

-- CTE (Common Table Expression)
with monthly_sales as (select date_trunc('month', created_at) as month, sum(total) as total_sales from orders group by date_trunc('month', created_at)), top_customers as (select user_id, sum(total) as total_spent from orders group by user_id order by total_spent desc limit 10) select ms.month, ms.total_sales, tc.user_id, tc.total_spent from monthly_sales ms cross join top_customers tc;

-- Window functions
select user_id, total, row_number() over (partition by user_id order by created_at desc) as rn, sum(total) over (partition by user_id) as user_total, lag(total, 1) over (partition by user_id order by created_at) as prev_total from orders;

-- Complex INSERT
insert into orders (user_id, product_id, quantity, total, created_at) select u.id, p.id, case when p.category = 'electronics' then 2 else 1 end, p.price * case when p.category = 'electronics' then 2 else 1 end, now() from users u cross join products p where u.status = 'active' and p.stock > 0;

-- UPDATE with JOIN
update products set stock = stock - oi.total_quantity from (select product_id, sum(quantity) as total_quantity from order_items where created_at >= current_date group by product_id) oi where products.id = oi.product_id;

-- Complex CASE statement
select id, name, case when total > 1000 then 'premium' when total > 500 then 'standard' when total > 100 then 'basic' else 'minimal' end as customer_tier, case when date_part('year', created_at) = date_part('year', now()) then 'current_year' else 'previous_year' end as year_category from orders; 