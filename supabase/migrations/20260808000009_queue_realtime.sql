-- =============================================================================
-- MeriBaari — Queue Realtime (Prompt 4.6)
-- Enable Supabase Realtime for queues, queue_entries, and tickets only.
-- =============================================================================

-- Full replica identity so filtered postgres_changes (queue_id / user_id /
-- organization_id) receive UPDATE/DELETE payloads reliably.
alter table public.queues replica identity full;
alter table public.queue_entries replica identity full;
alter table public.tickets replica identity full;

-- Add tables to the supabase_realtime publication (idempotent).
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'queues'
  ) then
    alter publication supabase_realtime add table public.queues;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'queue_entries'
  ) then
    alter publication supabase_realtime add table public.queue_entries;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tickets'
  ) then
    alter publication supabase_realtime add table public.tickets;
  end if;
end $$;
