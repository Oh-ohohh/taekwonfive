begin;

alter table public.attendance_records
  add column class_session smallint
  constraint attendance_records_class_session_check
  check (class_session between 1 and 6);

comment on column public.attendance_records.class_session is
  'Selected class session (1-6) for this attendance date; null means not selected.';

notify pgrst, 'reload schema';

commit;
