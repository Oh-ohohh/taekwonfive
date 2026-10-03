begin;

alter table public.students enable row level security;
alter table public.attendance_records enable row level security;

-- Restrictive policies are ANDed with existing policies, including the
-- pre-existing permissive policies that granted anonymous full access.
-- app_metadata is controlled by the Auth admin API, not by the user.
create policy "taekwonfive_admin_required"
on public.students as restrictive for all to public
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "taekwonfive_admin_access"
on public.students as permissive for all to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "taekwonfive_admin_required"
on public.attendance_records as restrictive for all to public
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "taekwonfive_admin_access"
on public.attendance_records as permissive for all to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

commit;
