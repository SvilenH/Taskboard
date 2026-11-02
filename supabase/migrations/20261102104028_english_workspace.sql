-- English defaults and errors. Existing user content and function grants are preserved.
create or replace function private.tb_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.tb_profiles(id,display_name) values(new.id,left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''),nullif(split_part(new.email,'@',1),''),'User'),80));
  insert into public.tb_user_roles(user_id,role) values(new.id,'user');
  return new;
end; $$;

create or replace function public.tb_create_project(p_title text,p_description text default '',p_color text default 'sage') returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in is required.'; end if;
  insert into public.tb_projects(title,description,color) values(trim(p_title),p_description,p_color) returning id into v_id;
  insert into public.tb_stages(project_id,name,position,is_done) values(v_id,'To do',0,false),(v_id,'In progress',1,false),(v_id,'Done',2,true);
  return v_id;
end; $$;

create or replace function public.tb_save_task(p_id uuid,p_project_id uuid,p_stage_id uuid,p_title text,p_description text,p_priority text,p_due_date date) returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid; v_position integer; v_old_stage uuid;
begin
  perform 1 from public.tb_projects where id = p_project_id for update;
  if not found then raise exception 'Project not found or access denied.'; end if;
  if not exists(select 1 from public.tb_stages where id = p_stage_id and project_id = p_project_id) then raise exception 'Invalid column.'; end if;
  select coalesce(max(position),-1)+1 into v_position from public.tb_tasks where stage_id = p_stage_id;
  if p_id is null then
    insert into public.tb_tasks(project_id,stage_id,title,description,priority,due_date,position) values(p_project_id,p_stage_id,trim(p_title),p_description,p_priority,p_due_date,v_position) returning id into v_id;
  else
    select stage_id into v_old_stage from public.tb_tasks where id = p_id and project_id = p_project_id;
    if not found then raise exception 'Task not found.'; end if;
    update public.tb_tasks set title=trim(p_title),description=p_description,priority=p_priority,due_date=p_due_date,
      position=case when stage_id=p_stage_id then position else v_position end,stage_id=p_stage_id
      where id=p_id and project_id=p_project_id returning id into v_id;
  end if;
  return v_id;
end; $$;

create or replace function public.tb_move_task(p_task uuid,p_stage uuid,p_position integer) returns void language plpgsql security invoker set search_path = '' as $$
declare v_project uuid; v_old uuid; v_count integer;
begin
  if p_position is null or p_position < 0 then raise exception 'Invalid position.'; end if;
  select project_id into v_project from public.tb_tasks where id=p_task;
  perform 1 from public.tb_projects where id=v_project for update;
  if not found then raise exception 'Access to this project is denied.'; end if;
  select stage_id into v_old from public.tb_tasks where id=p_task;
  if not found then raise exception 'Task not found.'; end if;
  if not exists(select 1 from public.tb_stages where id=p_stage and project_id=v_project) then raise exception 'The column belongs to a different project.'; end if;
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

create or replace function private.tb_change_role(p_user uuid,p_role text) returns void language plpgsql security definer set search_path = '' as $$
begin
  lock table public.tb_user_roles in share row exclusive mode;
  if not private.tb_admin() then raise exception 'Only administrators can change roles.'; end if;
  if p_role is null or p_role not in ('user','admin') then raise exception 'Invalid role.'; end if;
  if p_user=auth.uid() then raise exception 'You cannot change your own role.'; end if;
  update public.tb_user_roles set role=p_role where user_id=p_user;
  if not found then raise exception 'User not found.'; end if;
end; $$;
