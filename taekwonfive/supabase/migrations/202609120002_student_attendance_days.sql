begin;

-- ISO weekday numbers: Monday=1, ..., Sunday=7. NULL means unspecified.
create function public.is_valid_attendance_days(days smallint[])
returns boolean
language sql
immutable
parallel safe
set search_path = pg_catalog
as $$
  select days is null or (
    cardinality(days) between 1 and 7
    and array_ndims(days) = 1
    and array_lower(days, 1) = 1
    and array_position(days, null) is null
    and days <@ array[1,2,3,4,5,6,7]::smallint[]
    and days = array(select distinct day from unnest(days) as day order by day)
  );
$$;

alter table public.students
  add column attendance_days smallint[]
  constraint students_attendance_days_check
  check (public.is_valid_attendance_days(attendance_days));

comment on column public.students.attendance_days is
  'Scheduled attendance weekdays in ISO order: Monday=1 through Sunday=7. Sorted, unique; NULL means unspecified. Weekdays every day is {1,2,3,4,5}.';

notify pgrst, 'reload schema';

commit;
