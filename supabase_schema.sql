-- ============================================
-- MALMÖ 040 TOUR HUB — Schema Supabase
-- Pega esto en Supabase > SQL Editor > Run
-- ============================================

-- USUARIOS DE LA GIRA (banda + crew)
create table tour_members (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  initials text not null,
  role text not null,
  type text not null check (type in ('banda', 'crew', 'admin')),
  bg_color text default '#2a1020',
  text_color text default '#ee0088',
  created_at timestamptz default now()
);

-- SHOWS
create table shows (
  id uuid primary key default gen_random_uuid(),
  day text not null,
  month text not null,
  weekday text not null,
  title text not null,
  city text not null,
  status text default '' check (status in ('next', '')),
  info_status text default 'wip' check (info_status in ('complete', 'wip')),
  -- ficha del show
  show_duration text default '—',
  pantalla_val text default '—' check (pantalla_val in ('Sí', 'No', '—')),
  pantalla_res text default '',
  realizacion text default '—' check (realizacion in ('Sí', 'No', '—')),
  -- notas libres
  notas text default '',
  -- hotel
  hotel_name text default '',
  hotel_address text default '',
  hotel_checkin text default '—',
  hotel_checkout text default '—',
  hotel_tel text default '',
  hotel_habitaciones text default '',
  sort_order int default 0,
  created_at timestamptz default now()
);

-- HORARIOS (items del timeline)
create table schedule_items (
  id uuid primary key default gen_random_uuid(),
  show_id uuid references shows(id) on delete cascade,
  time_start text not null,
  time_end text default '',
  title text not null,
  subtitle text default '',
  type text default '' check (type in ('show', 'sound', 'travel', '')),
  extra_lines text[] default '{}',  -- array de líneas de texto libre
  visible_to text[] default '{}',   -- array de member ids
  sort_order int default 0,
  created_at timestamptz default now()
);

-- CONTACTOS POR SHOW
create table show_contacts (
  id uuid primary key default gen_random_uuid(),
  show_id uuid references shows(id) on delete cascade,
  name text not null,
  role text default '',
  phone text default '',
  sort_order int default 0
);

-- DOCUMENTOS (riders, advance sheets, stage plots, etc.)
create table documents (
  id uuid primary key default gen_random_uuid(),
  show_id uuid references shows(id) on delete cascade,
  name text not null,
  file_type text default 'pdf' check (file_type in ('pdf', 'img', 'txt')),
  storage_path text default '',  -- ruta en Supabase Storage
  is_rider_doc boolean default false,  -- aparece en ficha del show
  sort_order int default 0,
  created_at timestamptz default now()
);

-- BILLETES / TRANSPORTE
create table tickets (
  id uuid primary key default gen_random_uuid(),
  show_id uuid references shows(id) on delete cascade,
  member_id uuid references tour_members(id) on delete cascade,
  transport_type text default 'van' check (transport_type in ('van', 'train', 'fly')),
  detail text default '',
  file_name text default '',
  storage_path text default '',
  created_at timestamptz default now()
);

-- GUEST LIST
create table guest_list (
  id uuid primary key default gen_random_uuid(),
  show_id uuid references shows(id) on delete cascade,
  name text not null,
  quantity int default 1,
  category text default 'f' check (category in ('m', 'p', 'f', 'i')),
  sort_order int default 0
);

-- SETLIST
create table setlist_items (
  id uuid primary key default gen_random_uuid(),
  show_id uuid references shows(id) on delete cascade,
  track_number int not null,
  title text not null,
  duration text default '',
  note text default ''
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table tour_members enable row level security;
alter table shows enable row level security;
alter table schedule_items enable row level security;
alter table show_contacts enable row level security;
alter table documents enable row level security;
alter table tickets enable row level security;
alter table guest_list enable row level security;
alter table setlist_items enable row level security;

-- Todos los usuarios autenticados pueden leer todo
create policy "Auth users read all" on tour_members for select using (auth.role() = 'authenticated');
create policy "Auth users read shows" on shows for select using (auth.role() = 'authenticated');
create policy "Auth users read schedule" on schedule_items for select using (auth.role() = 'authenticated');
create policy "Auth users read contacts" on show_contacts for select using (auth.role() = 'authenticated');
create policy "Auth users read docs" on documents for select using (auth.role() = 'authenticated');
create policy "Auth users read tickets" on tickets for select using (auth.role() = 'authenticated');
create policy "Auth users read gl" on guest_list for select using (auth.role() = 'authenticated');
create policy "Auth users read setlist" on setlist_items for select using (auth.role() = 'authenticated');

-- Solo admins pueden escribir (insert/update/delete)
create policy "Admins write members" on tour_members for all using (
  exists (select 1 from tour_members where auth_user_id = auth.uid() and type = 'admin')
);
create policy "Admins write shows" on shows for all using (
  exists (select 1 from tour_members where auth_user_id = auth.uid() and type = 'admin')
);
create policy "Admins write schedule" on schedule_items for all using (
  exists (select 1 from tour_members where auth_user_id = auth.uid() and type = 'admin')
);
create policy "Admins write contacts" on show_contacts for all using (
  exists (select 1 from tour_members where auth_user_id = auth.uid() and type = 'admin')
);
create policy "Admins write docs" on documents for all using (
  exists (select 1 from tour_members where auth_user_id = auth.uid() and type = 'admin')
);
create policy "Admins write tickets" on tickets for all using (
  exists (select 1 from tour_members where auth_user_id = auth.uid() and type = 'admin')
);
create policy "Admins write gl" on guest_list for all using (
  exists (select 1 from tour_members where auth_user_id = auth.uid() and type = 'admin')
);
create policy "Admins write setlist" on setlist_items for all using (
  exists (select 1 from tour_members where auth_user_id = auth.uid() and type = 'admin')
);

-- ============================================
-- STORAGE BUCKET para documentos y billetes
-- ============================================
-- En Supabase > Storage > New bucket:
-- Nombre: "tour-docs"
-- Public: NO (privado, solo autenticados)

-- ============================================
-- DATOS INICIALES — muestra con PDL y Sonorama
-- ============================================

insert into shows (day, month, weekday, title, city, status, info_status, show_duration, pantalla_val, pantalla_res, realizacion, notas, hotel_name, hotel_address, hotel_checkin, hotel_checkout, hotel_tel, hotel_habitaciones, sort_order) values
('12', 'Jun', 'Vie', 'Madrid / Puesta de largo', 'Madrid, ES', 'next', 'complete', '45 min', 'Sí', '1920×1080', 'Sí', 'Parking trasero backstage. Acreditaciones puerta lateral.
Review setlist tarde anterior.', 'Exe Pozuelo', 'C. de Luis Buñuel, 1, Pozuelo de Alarcón', '—', '—', '+34 915 01 01 18', 'Triple: Framis, Peguero, Víctor
Twin: Joanet, Gonzo
DUI: Karateka
DUI: Carla', 1),
('3', 'Jul', 'Vie', 'La Solana / Oasis Sound', 'La Solana, Ciudad Real', '', 'wip', '—', '—', '', '—', 'Advance sheet pendiente.', 'Por confirmar', '—', '—', '—', '—', '', 2),
('16', 'Jul', 'Jue', 'Llanera / Boombastic Asturias', 'Llanera, Asturias', '', 'wip', '—', '—', '', '—', '', 'Por confirmar', '—', '—', '—', '—', '', 3),
('18', 'Jul', 'Sáb', 'Castro Urdiales / Sonórica', 'Castro Urdiales, Cantabria', '', 'wip', '—', '—', '', '—', '', 'Por confirmar', '—', '—', '—', '—', '', 4),
('24', 'Jul', 'Vie', 'Alcañiz / Aragón Sonoro', 'Alcañiz, Teruel', '', 'wip', '—', '—', '', '—', '', 'Por confirmar', '—', '—', '—', '—', '', 5),
('25', 'Jul', 'Sáb', 'Santander / Semana Grande', 'Santander, Cantabria', '', 'wip', '—', '—', '', '—', '', 'Por confirmar', '—', '—', '—', '—', '', 6),
('4', 'Ago', 'Mar', 'Jávea / IQOS', 'Xàbia, Alicante', '', 'wip', '—', '—', '', '—', '', 'Por confirmar', '—', '—', '—', '—', '', 7),
('7', 'Ago', 'Vie', 'Aranda de Duero / Sonorama', 'Aranda de Duero, Burgos', '', 'complete', '75 min', 'Sí', '2560×1080', 'Sí', 'Llegada antes de las 11h. Acreditaciones puerta sur.
Meet & greet tras el show.', 'Ibis Aranda de Duero', 'Ctra. Madrid-Irún km 162', '14:00', '11:00', '+34 947 502 600', '', 8),
('12', 'Ago', 'Mar', 'Semana Grande / Donosti', 'San Sebastián, Gipuzkoa', '', 'wip', '—', '—', '', '—', '', 'Por confirmar', '—', '—', '—', '—', '', 9);
