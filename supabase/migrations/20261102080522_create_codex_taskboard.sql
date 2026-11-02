-- Independent Codex implementation. Does not alter the earlier prototype.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.tb_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  created_at timestamptz not null default now()
);
create table public.tb_user_roles (
  user_id uuid primary key references public.tb_profiles(id) on delete cascade,
  role text not null default 'user' check (role in ('user','admin'))
);
create table public.tb_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.tb_profiles(id),
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  color text not null default 'sage' check (color in ('sage','blue','peach','violet')),
  created_at timestamptz not null default now()
);
create table public.tb_stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.tb_projects(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  position integer not null check (position >= 0),
  is_done boolean not null default false,
  unique(project_id,id), unique(project_id,position)
);
create table public.tb_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.tb_projects(id) on delete cascade,
  stage_id uuid not null,
  created_by uuid not null default auth.uid() references public.tb_profiles(id),
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text not null default '' check (char_length(description) <= 5000),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  due_date date,
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  unique(project_id,id),
  foreign key(project_id,stage_id) references public.tb_stages(project_id,id)
);
create table public.tb_attachments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.tb_projects(id) on delete cascade,
  task_id uuid not null,
  uploaded_by uuid not null default auth.uid() references public.tb_profiles(id),
  storage_path text not null unique,
  original_name text not null check (char_length(original_name) between 1 and 255),
  size_bytes bigint not null check (size_bytes between 1 and 5242880),
  mime_type text not null check (mime_type in ('image/png','image/jpeg','image/webp','application/pdf','text/plain')),
  created_at timestamptz not null default now(),
  foreign key(project_id,task_id) references public.tb_tasks(project_id,id) on delete cascade,
  check (split_part(storage_path,'/',1) = project_id::text and split_part(storage_path,'/',2) = task_id::text and split_part(storage_path,'/',3) <> '' and split_part(storage_path,'/',4) = '')
);
create index tb_projects_owner_idx on public.tb_projects(owner_id);
create index tb_tasks_order_idx on public.tb_tasks(project_id,stage_id,position,id);
create index tb_tasks_stage_idx on public.tb_tasks(stage_id);
create index tb_tasks_creator_idx on public.tb_tasks(created_by);
create index tb_attachments_task_idx on public.tb_attachments(task_id);
create index tb_attachments_uploader_idx on public.tb_attachments(uploaded_by);

-- Definer helpers live outside the exposed public API schema, have a fixed
-- search_path, and always authorize the current authenticated caller.
create function private.tb_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists(select 1 from public.tb_user_roles where user_id = auth.uid() and role = 'admin');
$$;
create function private.tb_project_access(p_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists(select 1 from public.tb_projects where id = p_id and (owner_id = auth.uid() or private.tb_admin()));
$$;
create function private.tb_storage_access(p_path text) returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists(
    select 1 from public.tb_tasks t join public.tb_projects p on p.id = t.project_id
    where t.id::text = split_part(p_path,'/',2) and p.id::text = split_part(p_path,'/',1)
    and split_part(p_path,'/',3) <> '' and split_part(p_path,'/',4) = ''
    and (p.owner_id = auth.uid() or private.tb_admin())
  );
$$;
create function private.tb_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.tb_profiles(id,display_name) values(new.id,left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''),nullif(split_part(new.email,'@',1),''),'Потребител'),80));
  insert into public.tb_user_roles(user_id,role) values(new.id,'user');
  return new;
end; $$;
create trigger tb_auth_user_created after insert on auth.users for each row execute function private.tb_new_user();
insert into public.tb_profiles(id,display_name)
select id,left(coalesce(nullif(trim(raw_user_meta_data->>'display_name'),''),nullif(split_part(email,'@',1),''),'Потребител'),80) from auth.users on conflict do nothing;
insert into public.tb_user_roles(user_id) select id from public.tb_profiles on conflict do nothing;

alter table public.tb_profiles enable row level security;
alter table public.tb_user_roles enable row level security;
alter table public.tb_projects enable row level security;
alter table public.tb_stages enable row level security;
alter table public.tb_tasks enable row level security;
alter table public.tb_attachments enable row level security;
create policy tb_profiles_read on public.tb_profiles for select to authenticated using(id = (select auth.uid()) or (select private.tb_admin()));
create policy tb_profiles_update on public.tb_profiles for update to authenticated using(id = (select auth.uid())) with check(id = (select auth.uid()));
create policy tb_roles_read on public.tb_user_roles for select to authenticated using(user_id = (select auth.uid()) or (select private.tb_admin()));
create policy tb_projects_read on public.tb_projects for select to authenticated using(owner_id = (select auth.uid()) or (select private.tb_admin()));
create policy tb_projects_insert on public.tb_projects for insert to authenticated with check(owner_id = (select auth.uid()));
create policy tb_projects_update on public.tb_projects for update to authenticated using(owner_id = (select auth.uid()) or (select private.tb_admin())) with check(owner_id = (select auth.uid()) or (select private.tb_admin()));
create policy tb_projects_delete on public.tb_projects for delete to authenticated using(owner_id = (select auth.uid()) or (select private.tb_admin()));
create policy tb_stages_read on public.tb_stages for select to authenticated using(private.tb_project_access(project_id));
create policy tb_stages_insert on public.tb_stages for insert to authenticated with check(private.tb_project_access(project_id));
create policy tb_tasks_read on public.tb_tasks for select to authenticated using(private.tb_project_access(project_id));
create policy tb_tasks_insert on public.tb_tasks for insert to authenticated with check(created_by = (select auth.uid()) and private.tb_project_access(project_id));
create policy tb_tasks_update on public.tb_tasks for update to authenticated using(private.tb_project_access(project_id)) with check(private.tb_project_access(project_id));
create policy tb_tasks_delete on public.tb_tasks for delete to authenticated using(private.tb_project_access(project_id));
create policy tb_attachments_read on public.tb_attachments for select to authenticated using(private.tb_project_access(project_id));
create policy tb_attachments_insert on public.tb_attachments for insert to authenticated with check(uploaded_by = (select auth.uid()) and private.tb_project_access(project_id));
create policy tb_attachments_delete on public.tb_attachments for delete to authenticated using(private.tb_project_access(project_id));

grant select on public.tb_profiles,public.tb_user_roles,public.tb_projects,public.tb_stages,public.tb_tasks,public.tb_attachments to authenticated;
grant update(display_name) on public.tb_profiles to authenticated;
grant insert,delete on public.tb_projects,public.tb_tasks,public.tb_attachments to authenticated;
grant insert on public.tb_stages to authenticated;
grant update(title,description,color) on public.tb_projects to authenticated;
grant update(title,description,priority,due_date,stage_id,position) on public.tb_tasks to authenticated;
revoke all on public.tb_profiles,public.tb_user_roles,public.tb_projects,public.tb_stages,public.tb_tasks,public.tb_attachments from anon;

-- Project + its default stages are created in a single transaction.
create function public.tb_create_project(p_title text,p_description text default '',p_color text default 'sage') returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Изисква се вход.'; end if;
  insert into public.tb_projects(title,description,color) values(trim(p_title),p_description,p_color) returning id into v_id;
  insert into public.tb_stages(project_id,name,position,is_done) values(v_id,'За изпълнение',0,false),(v_id,'В процес',1,false),(v_id,'Завършени',2,true);
  return v_id;
end; $$;

-- Project row lock serializes all ordering operations performed by these RPCs.
create function public.tb_save_task(p_id uuid,p_project_id uuid,p_stage_id uuid,p_title text,p_description text,p_priority text,p_due_date date) returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid; v_position integer; v_old_stage uuid;
begin
  perform 1 from public.tb_projects where id = p_project_id for update;
  if not found then raise exception 'Проектът не е намерен или няма достъп.'; end if;
  if not exists(select 1 from public.tb_stages where id = p_stage_id and project_id = p_project_id) then raise exception 'Невалидна колона.'; end if;
  select coalesce(max(position),-1)+1 into v_position from public.tb_tasks where stage_id = p_stage_id;
  if p_id is null then
    insert into public.tb_tasks(project_id,stage_id,title,description,priority,due_date,position) values(p_project_id,p_stage_id,trim(p_title),p_description,p_priority,p_due_date,v_position) returning id into v_id;
  else
    select stage_id into v_old_stage from public.tb_tasks where id = p_id and project_id = p_project_id;
    if not found then raise exception 'Задачата не е намерена.'; end if;
    update public.tb_tasks set title=trim(p_title),description=p_description,priority=p_priority,due_date=p_due_date,
      position=case when stage_id=p_stage_id then position else v_position end,stage_id=p_stage_id
      where id=p_id and project_id=p_project_id returning id into v_id;
  end if;
  return v_id;
end; $$;

create function public.tb_move_task(p_task uuid,p_stage uuid,p_position integer) returns void language plpgsql security invoker set search_path = '' as $$
declare v_project uuid; v_old uuid; v_count integer;
begin
  if p_position is null or p_position < 0 then raise exception 'Невалидна позиция.'; end if;
  select project_id into v_project from public.tb_tasks where id=p_task;
  perform 1 from public.tb_projects where id=v_project for update;
  if not found then raise exception 'Няма достъп до проекта.'; end if;
  select stage_id into v_old from public.tb_tasks where id=p_task;
  if not found then raise exception 'Задачата не е намерена.'; end if;
  if not exists(select 1 from public.tb_stages where id=p_stage and project_id=v_project) then raise exception 'Колоната е от друг проект.'; end if;
  select count(*) into v_count from public.tb_tasks where stage_id=p_stage and id<>p_task;
  p_position:=least(p_position,v_count);
  -- Normalize before and after insertion, keeping deterministic order.
  with ordered as(select id,(row_number() over(order by position,id)-1)::integer pos from public.tb_tasks where stage_id=p_stage and id<>p_task)
  update public.tb_tasks t set position=case when o.pos>=p_position then o.pos+1 else o.pos end from ordered o where t.id=o.id;
  update public.tb_tasks set stage_id=p_stage,position=p_position where id=p_task;
  if v_old<>p_stage then
    with ordered as(select id,(row_number() over(order by position,id)-1)::integer pos from public.tb_tasks where stage_id=v_old)
    update public.tb_tasks t set position=o.pos from ordered o where t.id=o.id;
  end if;
end; $$;

-- No browser may update roles directly. Admin bootstrap is manual SQL.
create function private.tb_change_role(p_user uuid,p_role text) returns void language plpgsql security definer set search_path = '' as $$
begin
  lock table public.tb_user_roles in share row exclusive mode;
  if not private.tb_admin() then raise exception 'Само администратор може да променя роли.'; end if;
  if p_role is null or p_role not in ('user','admin') then raise exception 'Невалидна роля.'; end if;
  if p_user=auth.uid() then raise exception 'Не можеш да промениш собствената си роля.'; end if;
  update public.tb_user_roles set role=p_role where user_id=p_user;
  if not found then raise exception 'Потребителят не е намерен.'; end if;
end; $$;
create function public.tb_set_role(p_user uuid,p_role text) returns void language sql security invoker set search_path = '' as $$select private.tb_change_role(p_user,p_role);$$;

revoke all on function private.tb_admin(),private.tb_project_access(uuid),private.tb_storage_access(text),private.tb_new_user(),private.tb_change_role(uuid,text) from public,anon,authenticated;
grant execute on function private.tb_admin(),private.tb_project_access(uuid),private.tb_storage_access(text),private.tb_change_role(uuid,text) to authenticated;
revoke all on function public.tb_create_project(text,text,text),public.tb_save_task(uuid,uuid,uuid,text,text,text,date),public.tb_move_task(uuid,uuid,integer),public.tb_set_role(uuid,text) from public,anon;
grant execute on function public.tb_create_project(text,text,text),public.tb_save_task(uuid,uuid,uuid,text,text,text,date),public.tb_move_task(uuid,uuid,integer),public.tb_set_role(uuid,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('tb-attachments','tb-attachments',false,5242880,array['image/png','image/jpeg','image/webp','application/pdf','text/plain']);
create policy tb_storage_read on storage.objects for select to authenticated using(bucket_id='tb-attachments' and private.tb_storage_access(name));
create policy tb_storage_insert on storage.objects for insert to authenticated with check(bucket_id='tb-attachments' and private.tb_storage_access(name));
create policy tb_storage_delete on storage.objects for delete to authenticated using(bucket_id='tb-attachments' and private.tb_storage_access(name));
