-- pgvector extension
create extension if not exists vector;

-- Kullanıcı profilleri
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  mode text check (mode in ('student', 'clinician', 'general')) default 'general',
  plan text check (plan in ('free', 'student', 'clinician', 'admin')) default 'free',
  daily_queries int default 0,
  last_query_date date default current_date,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now()
);

-- Doküman parçaları (RAG)
create table documents (
  id bigserial primary key,
  content text not null,
  source text not null,
  page int,
  url text,
  embedding vector(384),         -- multilingual-MiniLM boyutu
  created_at timestamptz default now()
);

-- Sohbet geçmişi
create table conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  title text,
  created_at timestamptz default now()
);

create table messages (
  id bigserial primary key,
  conversation_id uuid references conversations(id) on delete cascade,
  role text check (role in ('user', 'assistant')),
  content text not null,
  sources jsonb,
  created_at timestamptz default now()
);

-- Vektör arama fonksiyonu
create or replace function match_documents(
  query_embedding vector(384),
  match_count int default 10,
  match_threshold float default 0.5
)
returns table (
  id bigint,
  content text,
  source text,
  page int,
  url text,
  similarity float
)
language sql stable
as $$
  select
    id, content, source, page, url,
    1 - (embedding <=> query_embedding) as similarity
  from documents
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- Günlük sorgu sayacını sıfırla
create or replace function check_and_reset_daily_queries(user_id uuid)
returns int
language plpgsql
as $$
declare
  current_count int;
  last_date date;
begin
  select daily_queries, last_query_date
  into current_count, last_date
  from profiles where id = user_id;

  if last_date < current_date then
    update profiles set daily_queries = 0, last_query_date = current_date
    where id = user_id;
    return 0;
  end if;

  return current_count;
end;
$$;

-- Sorgu limitleri
create or replace function get_query_limit(plan text)
returns int
language sql
as $$
  select case plan
    when 'free'      then 20
    when 'student'   then 100
    when 'clinician' then 999999
    when 'admin'     then 999999
    else 20
  end;
$$;

-- RLS politikaları
alter table profiles enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table documents enable row level security;

create policy "Users own profile" on profiles for all using (auth.uid() = id);
create policy "Users own conversations" on conversations for all using (auth.uid() = user_id);
create policy "Users own messages" on messages for all
  using (conversation_id in (select id from conversations where user_id = auth.uid()));
create policy "Documents public read" on documents for select using (true);

-- Yeni kullanıcı kaydında profil oluştur
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
