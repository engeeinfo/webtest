-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create tables table
create table tables (
  id uuid default uuid_generate_v4() primary key,
  number integer not null unique,
  capacity integer not null,
  status text default 'empty',
  session_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create menu_items table
create table menu_items (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text not null,
  price numeric not null,
  description text,
  image text,
  available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create orders table
create table orders (
  id uuid default uuid_generate_v4() primary key,
  session_id text not null,
  table_id uuid references tables(id),
  status text default 'pending',
  total_amount numeric default 0,
  payment_status text default 'pending',
  payment_method text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create order_items table
create table order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  quantity integer not null,
  price_at_time numeric not null,
  status text default 'pending',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table tables enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Create policies (Allow generic public access for demo purposes, or authenticated)
-- For this demo, we will allow public read/write to avoid complex auth setup issues for the user
-- In a real app, you would restrict 'write' to specific roles

create policy "Enable access to all users" on tables for all using (true) with check (true);
create policy "Enable access to all users" on menu_items for all using (true) with check (true);
create policy "Enable access to all users" on orders for all using (true) with check (true);
create policy "Enable access to all users" on order_items for all using (true) with check (true);

-- Insert some initial data
insert into tables (number, capacity, status) values 
(1, 4, 'empty'),
(2, 2, 'empty'),
(3, 6, 'empty'),
(4, 4, 'empty');

insert into menu_items (name, category, price, description, image, available) values
('Margherita Pizza', 'Main Courses', 12.99, 'Classic tomato and mozzarella', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500', true),
('Caesar Salad', 'Appetizers', 8.50, 'Romaine lettuce with croutons', 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500', true),
('Tiramisu', 'Desserts', 6.99, 'Coffee-flavored Italian dessert', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500', true),
('Cola', 'Beverages', 2.50, 'Cold refreshing soda', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500', true);
