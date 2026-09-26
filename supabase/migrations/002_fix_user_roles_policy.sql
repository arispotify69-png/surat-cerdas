-- Fix: user_roles butuh SELECT policy agar subquery role-check di policy lain bisa membaca baris milik user sendiri.
drop policy if exists "user_roles_read_own" on public.user_roles;
create policy "user_roles_read_own" on public.user_roles
  for select to authenticated
  using (user_id = auth.uid());
