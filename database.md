
create extension if not exists pgcrypto;

-- 1. Tabla de Productos
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  description text,
  sku text,
  cost_price numeric(10, 2) default 0 not null, -- Costo Promedio
  sell_price numeric(10, 2) default 0 not null, -- Precio de Venta
  stock integer default 0 not null,
  min_stock integer default 5 not null,
  image_url text
);

-- 2. Tabla de Ventas (Cabecera)
create table if not exists sales (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  total_amount numeric(10, 2) not null,
  payment_method text default 'EFECTIVO',
  user_id uuid references auth.users
);

-- 3. Detalle de Venta
create table if not exists sale_items (
  id uuid default gen_random_uuid() primary key,
  sale_id uuid references sales(id) on delete cascade not null,
  product_id uuid references products(id) not null,
  quantity integer not null,
  unit_price numeric(10, 2) not null,
  unit_cost numeric(10, 2) not null
);

-- 4. Tabla de Compras (Proveedores)
create table if not exists purchases (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  supplier_name text not null,
  total_amount numeric(10, 2) not null,
  notes text
);

-- 5. Detalle de Compra
create table if not exists purchase_items (
  id uuid default gen_random_uuid() primary key,
  purchase_id uuid references purchases(id) on delete cascade not null,
  product_id uuid references products(id) not null,
  quantity integer not null,
  unit_cost numeric(10, 2) not null
);

-- 6. Tabla de Gastos Operativos
create table if not exists expenses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  description text not null,
  category text default 'GENERAL', 
  amount numeric(10, 2) not null
);

-- 7. Tabla de Inventario Inicial (Para cálculos contables de P&G)
create table if not exists initial_inventory (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  period_name text not null, -- Ej: "2024", "Octubre 2024"
  total_value numeric(10, 2) not null, -- Valor monetario total al inicio del periodo
  is_active boolean default true
);

-- Índices
create index if not exists idx_products_name on products(name);
create index if not exists idx_products_sku on products(sku);
create index if not exists idx_sales_created_at on sales(created_at);
create index if not exists idx_expenses_created_at on expenses(created_at);

-- Habilitar RLS
alter table products enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table purchases enable row level security;
alter table purchase_items enable row level security;
alter table expenses enable row level security;
alter table initial_inventory enable row level security;

-- Políticas de Acceso Público

drop policy if exists "Acceso publico productos" on products;
create policy "Acceso publico productos" on products for all using (true);

drop policy if exists "Acceso publico ventas" on sales;
create policy "Acceso publico ventas" on sales for all using (true);

drop policy if exists "Acceso publico items venta" on sale_items;
create policy "Acceso publico items venta" on sale_items for all using (true);

drop policy if exists "Acceso publico compras" on purchases;
create policy "Acceso publico compras" on purchases for all using (true);

drop policy if exists "Acceso publico items compra" on purchase_items;
create policy "Acceso publico items compra" on purchase_items for all using (true);

drop policy if exists "Acceso publico gastos" on expenses;
create policy "Acceso publico gastos" on expenses for all using (true);

drop policy if exists "Acceso publico inventario inicial" on initial_inventory;
create policy "Acceso publico inventario inicial" on initial_inventory for all using (true);