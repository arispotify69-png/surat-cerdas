-- Surat Cerdas schema
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role_id int not null check (role_id in (1,2)),
  created_at timestamptz default now()
);

create table if not exists public.surat_templates (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  konten jsonb not null,
  dibuat_oleh uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.surat_masuk (
  id uuid primary key default gen_random_uuid(),
  no_surat_masuk text not null,
  tanggal date not null,
  pengirim text not null,
  perihal text not null,
  ringkasan text,
  file_scan_path text not null,
  diunggah_oleh uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists public.surat_keluar (
  id uuid primary key default gen_random_uuid(),
  no_surat text not null,
  perihal text not null,
  isi_ringkas text not null,
  draf_text text,
  isi_lengkap text,
  status text not null default 'draft' check (status in ('draft','pending_approval','approved','rejected','published')),
  is_public boolean default false,
  ttd_path text,
  ttd_type text check (ttd_type in ('canvas','upload')),
  pdf_path text,
  scan_masuk_ref uuid references public.surat_masuk(id),
  dibuat_oleh uuid references auth.users(id),
  disetujui_oleh uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_surat_keluar_public on public.surat_keluar (is_public, status);

create table if not exists public.approval_logs (
  id uuid primary key default gen_random_uuid(),
  surat_id uuid references public.surat_keluar(id) on delete cascade,
  approver_id uuid references auth.users(id),
  tindakan text not null check (tindakan in ('approve','reject','revisi')),
  catatan text,
  created_at timestamptz default now()
);

alter table public.user_roles enable row level security;
alter table public.surat_templates enable row level security;
alter table public.surat_masuk enable row level security;
alter table public.surat_keluar enable row level security;
alter table public.approval_logs enable row level security;

drop policy if exists "tu_templates" on public.surat_templates;
create policy "tu_templates" on public.surat_templates for all to authenticated
  using (exists (select 1 from public.user_roles where user_id = auth.uid() and role_id = 1));

drop policy if exists "surat_select" on public.surat_keluar;
create policy "surat_select" on public.surat_keluar for select to authenticated
  using (
    is_public = true
    or exists (select 1 from public.user_roles where user_id = auth.uid() and role_id in (1,2))
  );
drop policy if exists "surat_public_read" on public.surat_keluar;
create policy "surat_public_read" on public.surat_keluar for select to anon
  using (is_public = true and status in ('approved','published'));
drop policy if exists "tu_insert_surat" on public.surat_keluar;
create policy "tu_insert_surat" on public.surat_keluar for insert to authenticated
  with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role_id = 1));
drop policy if exists "roles_update_surat" on public.surat_keluar;
create policy "roles_update_surat" on public.surat_keluar for update to authenticated
  using (exists (select 1 from public.user_roles where user_id = auth.uid() and role_id in (1,2)));

drop policy if exists "tu_masuk" on public.surat_masuk;
create policy "tu_masuk" on public.surat_masuk for all to authenticated
  using (exists (select 1 from public.user_roles where user_id = auth.uid() and role_id = 1));

drop policy if exists "approver_insert_logs" on public.approval_logs;
create policy "approver_insert_logs" on public.approval_logs for insert to authenticated
  with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role_id = 2));
drop policy if exists "roles_read_logs" on public.approval_logs;
create policy "roles_read_logs" on public.approval_logs for select to authenticated
  using (exists (select 1 from public.user_roles where user_id = auth.uid() and role_id in (1,2)));
