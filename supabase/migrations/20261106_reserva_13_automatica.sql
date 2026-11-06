-- Reserva do 13º por e-mail, todo mês (contas no modo RH)
alter table public.config
  add column if not exists reserva_auto boolean not null default true,
  add column if not exists reserva_email text,
  add column if not exists reserva_enviada text;
comment on column public.config.reserva_auto is 'Manda todo mês por e-mail a reserva do 13º (só modo rh)';
comment on column public.config.reserva_email is 'Para quem vai o e-mail; vazio = e-mail da conta';
comment on column public.config.reserva_enviada is 'Último mês enviado (AAAA-MM), evita envio repetido';

-- segredo que só o service role lê: o agendador e a função usam para se reconhecer
create table if not exists public.segredos (nome text primary key, valor text not null);
alter table public.segredos enable row level security;
revoke all on public.segredos from anon, authenticated;
insert into public.segredos(nome, valor) values ('cron_token', encode(extensions.gen_random_bytes(24),'hex'))
  on conflict (nome) do nothing;

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- todo dia 5, às 8h de Brasília (11h UTC)
select cron.schedule('reserva-13-mensal', '0 11 5 * *', $$
  select net.http_post(
    url := 'https://qqqvoyqdmhicolyklswb.supabase.co/functions/v1/reserva-13',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-token',(select valor from public.segredos where nome='cron_token')),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000);
$$);
