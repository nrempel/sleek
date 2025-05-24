-- Test SQL file for Sleek formatter extension
select u.id, u.name, u.email, o.total from users u inner join orders o on u.id = o.user_id where o.status = 'completed' and o.total > 100 order by o.total desc;

insert into users (name, email, created_at) values ('John Doe', 'john@example.com', now()), ('Jane Smith', 'jane@example.com', now());

update products set price = price * 1.1 where category = 'electronics' and stock > 0;

delete from logs where created_at < now() - interval '30 days'; 