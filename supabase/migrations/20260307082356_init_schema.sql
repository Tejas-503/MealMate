-- Drop existing objects
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user;
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists seat_bookings cascade;
drop table if exists seats cascade;
drop table if exists menu_items cascade;
drop table if exists profiles cascade;

-- Profiles
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  role text check (role in ('student','staff')) default 'student',
  created_at timestamptz default now()
);

-- Seats
create table seats (
  id bigserial primary key,
  seat_number int unique check (seat_number >= 1 and seat_number <= 50),
  is_active boolean default true
);

-- Seat Bookings
create table seat_bookings (
  id bigserial primary key,
  user_id uuid references auth.users(id),
  booking_date date not null,
  slot text check (slot in ('break','lunch')) not null,
  seat_id bigint references seats(id),
  status text check (status in ('booked','cancelled','completed')) default 'booked',
  created_at timestamptz default now(),
  unique(booking_date, slot, seat_id)
);

-- Menu Items
create table menu_items (
  id bigserial primary key,
  day date not null,
  name text not null,
  price numeric(10,2) not null,
  is_available boolean default true,
  created_at timestamptz default now()
);

-- Orders
create table orders (
  id bigserial primary key,
  user_id uuid references auth.users(id),
  status text check (status in ('placed','preparing','ready','cancelled')) default 'placed',
  total numeric(10,2) default 0,
  created_at timestamptz default now()
);

-- Order Items
create table order_items (
  id bigserial primary key,
  order_id bigint references orders(id) on delete cascade,
  menu_item_id bigint references menu_items(id),
  qty int check (qty > 0) not null,
  price_each numeric(10,2) not null
);

-- Triggers
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Row Level Security (RLS)
alter table profiles enable row level security;
alter table seats enable row level security;
alter table seat_bookings enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Policies for profiles
create policy "User can read own profile" on profiles for select using (auth.uid() = id);
create policy "User can update own profile" on profiles for update using (auth.uid() = id);
create policy "Staff can read all profiles" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'staff')
);

-- Policies for seats & menu_items
create policy "Everyone can read seats" on seats for select using (true);
create policy "Staff can insert seats" on seats for insert with check (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));
create policy "Staff can update seats" on seats for update using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));
create policy "Staff can delete seats" on seats for delete using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));

create policy "Everyone can read menu items" on menu_items for select using (true);
create policy "Staff can insert menu items" on menu_items for insert with check (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));
create policy "Staff can update menu items" on menu_items for update using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));
create policy "Staff can delete menu items" on menu_items for delete using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));

-- Policies for seat_bookings
create policy "Student can read own bookings" on seat_bookings for select using (auth.uid() = user_id);
create policy "Student can insert own bookings" on seat_bookings for insert with check (auth.uid() = user_id);
create policy "Student can update own bookings" on seat_bookings for update using (auth.uid() = user_id);
create policy "Staff can read all bookings" on seat_bookings for select using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));
create policy "Staff can update all bookings" on seat_bookings for update using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));

-- Policies for orders
create policy "Student can read own orders" on orders for select using (auth.uid() = user_id);
create policy "Student can insert own orders" on orders for insert with check (auth.uid() = user_id);
create policy "Staff can read all orders" on orders for select using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));
create policy "Staff can update all orders" on orders for update using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));

-- Policies for order_items
create policy "Student can read own order items" on order_items for select using (
  exists (select 1 from orders where orders.id = order_id and orders.user_id = auth.uid())
);
create policy "Student can insert own order items" on order_items for insert with check (
  exists (select 1 from orders where orders.id = order_id and orders.user_id = auth.uid())
);
create policy "Staff can read all order items" on order_items for select using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));
create policy "Staff can update all order items" on order_items for update using (exists (select 1 from profiles where id = auth.uid() and role = 'staff'));

-- Seed Data (50 seats)
insert into seats (seat_number)
select gs from generate_series(1,50) as gs on conflict do nothing;

-- Seed Data (Today's Menu)
insert into menu_items (day, name, price)
values 
  (current_date, 'Masala Dosa', 60.00),
  (current_date, 'Chicken Biryani', 120.00),
  (current_date, 'Paneer Butter Masala Combo', 150.00),
  (current_date, 'Filter Coffee', 20.00),
  (current_date, 'Veg Sandwich', 40.00),
  (current_date, 'Fresh Lime Soda', 30.00);

-- Enable Realtime for specific tables (Orders and Bookings)
begin;
  -- remove the supabase_realtime publication
  drop publication if exists supabase_realtime;
  -- re-create the supabase_realtime publication with no tables
  create publication supabase_realtime;
commit;

alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table seat_bookings;
alter publication supabase_realtime add table order_items;