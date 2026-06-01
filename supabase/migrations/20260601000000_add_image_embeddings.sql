-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Create the table to store saree variant image embeddings
create table if not exists public.product_image_embeddings (
  id uuid primary key default gen_random_uuid(),
  product_group_key text not null,          -- Links back to your catalog group (e.g. 101004)
  variant_code text not null,               -- Links to the specific color variant (e.g. 101004-1)
  image_url text not null unique,           -- The public URL of the indexed image (unique)
  
  -- Embedding vector size. 
  -- both 'clip-vit-base-patch32' and Cloudflare's 'bge-visual' use 512 dimensions.
  embedding vector(512) not null,
  
  -- Secondary metadata for quick color filtering and sorting
  dominant_colors jsonb default '[]'::jsonb, -- e.g. [{"hex": "#8B0000", "weight": 0.75}]
  created_at timestamptz default now()
);

-- 3. Create high-performance HNSW index for sub-millisecond visual searches
-- Cosine similarity (<=> operator) is the optimal similarity measure for normalized visual vectors.
create index if not exists product_image_embeddings_cosine_idx 
  on public.product_image_embeddings 
  using hnsw (embedding vector_cosine_ops);

-- 4. Enable Row Level Security (RLS)
alter table public.product_image_embeddings enable row level security;

-- 5. Public read policy (All logged-in B2B users can run visual search queries)
drop policy if exists "Allow authenticated users to read embeddings" on public.product_image_embeddings;
create policy "Allow authenticated users to read embeddings"
  on public.product_image_embeddings for select
  to authenticated
  using (true);

-- 6. Admin management policy (Allows sheets sync worker or admins to insert/update embeddings)
drop policy if exists "Allow admins all operations on embeddings" on public.product_image_embeddings;
create policy "Allow admins all operations on embeddings"
  on public.product_image_embeddings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 7. Deploy vector similarity matching function
create or replace function match_saree_images (
  query_embedding vector(512),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  product_group_key text,
  variant_code text,
  image_url text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    pie.id,
    pie.product_group_key,
    pie.variant_code,
    pie.image_url,
    1 - (pie.embedding <=> query_embedding) as similarity -- Converts distance to similarity percentage
  from public.product_image_embeddings pie
  where 1 - (pie.embedding <=> query_embedding) > match_threshold
  order by pie.embedding <=> query_embedding -- Distance ascending = closest first
  limit match_count;
end;
$$;
