-- Storage policies from an earlier, unused app reference revoked public helpers.
-- SQL AND/CASE expressions may check those function ACLs even for another bucket.
-- A procedural guard defers legacy helper evaluation until its bucket is used.
-- SECURITY INVOKER preserves all existing helper permissions and RLS.
create function private.tb_legacy_bucket_access(p_bucket text,p_name text,p_admin boolean)
returns boolean language plpgsql stable security invoker set search_path = '' as $$
begin
  if p_bucket is distinct from 'task-attachments' or auth.uid() is null then
    return false;
  end if;
  if p_admin then
    return public.is_workspace_admin(((storage.foldername(p_name))[1])::uuid);
  end if;
  return public.is_workspace_member(((storage.foldername(p_name))[1])::uuid);
end;
$$;
revoke all on function private.tb_legacy_bucket_access(text,text,boolean) from public,anon,authenticated;
grant execute on function private.tb_legacy_bucket_access(text,text,boolean) to authenticated;

-- Fresh installations have no legacy policies; their setup remains independent.
do $$
begin
  if exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='task_attachments_storage_select') then
    alter policy task_attachments_storage_select on storage.objects
      using (private.tb_legacy_bucket_access(bucket_id,name,false));
  end if;
  if exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='task_attachments_storage_insert') then
    alter policy task_attachments_storage_insert on storage.objects
      with check (private.tb_legacy_bucket_access(bucket_id,name,false));
  end if;
  if exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='task_attachments_storage_delete') then
    alter policy task_attachments_storage_delete on storage.objects
      using (private.tb_legacy_bucket_access(bucket_id,name,true));
  end if;
end;
$$;
