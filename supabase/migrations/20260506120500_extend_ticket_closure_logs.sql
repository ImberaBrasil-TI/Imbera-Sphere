alter table public.ticket_closure_logs
  add column if not exists aranda_id bigint,
  add column if not exists aranda_status text,
  add column if not exists supabase_status text,
  add column if not exists whatsapp_status text,
  add column if not exists payload_aranda jsonb,
  add column if not exists response_aranda jsonb,
  add column if not exists attachments jsonb,
  add column if not exists error_message text;
