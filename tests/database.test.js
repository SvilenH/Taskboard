import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const owner='10000000-0000-0000-0000-000000000001', outsider='10000000-0000-0000-0000-000000000002';
for (const legacyPolicies of [false, true]) test(`migration, RPC ordering, constraints and RLS (legacy Storage policies: ${legacyPolicies})`, async t => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
      create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth,storage to authenticated; grant execute on function auth.uid() to authenticated;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
      alter table storage.objects enable row level security; grant select,insert,delete on storage.objects to authenticated;
      alter default privileges in schema public grant all on tables to authenticated,anon;`);
    if (legacyPolicies) {
      // Reproduce the actual cloud conflict without granting the revoked helpers.
      await db.exec(`create function public.is_workspace_member(uuid) returns boolean language sql as 'select false';
        create function public.is_workspace_admin(uuid) returns boolean language sql as 'select false';
        revoke all on function public.is_workspace_member(uuid),public.is_workspace_admin(uuid) from public,authenticated,anon;
        create function storage.foldername(text) returns text[] language sql as 'select string_to_array($1,''/'')';
        create policy task_attachments_storage_select on storage.objects for select to authenticated
          using(bucket_id='task-attachments' and public.is_workspace_member(((storage.foldername(name))[1])::uuid));
        create policy task_attachments_storage_insert on storage.objects for insert to authenticated
          with check(bucket_id='task-attachments' and public.is_workspace_member(((storage.foldername(name))[1])::uuid));
        create policy task_attachments_storage_delete on storage.objects for delete to authenticated
          using(bucket_id='task-attachments' and public.is_workspace_admin(((storage.foldername(name))[1])::uuid));`);
    }
    const migrations = new URL('../supabase/migrations/', import.meta.url);
    for (const file of (await readdir(migrations)).filter(name => name.endsWith('.sql')).sort()) {
      await db.exec(await readFile(new URL(file, migrations), 'utf8'));
    }
    await db.query(`insert into auth.users values($1,'owner@example.invalid','{"display_name":"Owner","role":"admin"}'),($2,'outsider@example.invalid','{}')`,[owner,outsider]);
    assert.equal((await db.query(`select role from public.tb_user_roles where user_id=$1`,[owner])).rows[0].role,'user','signup metadata must not grant admin');
    const asUser = async id => { await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]); await db.exec('set role authenticated'); };
    await asUser(owner);
    const project=(await db.query(`select public.tb_create_project('One','','sage') id`)).rows[0].id;
    const project2=(await db.query(`select public.tb_create_project('Two','','blue') id`)).rows[0].id;
    const stages=(await db.query(`select * from tb_stages where project_id=$1 order by position`,[project])).rows;
    assert.equal(stages.length,3);
    assert.deepEqual(stages.map(stage => stage.name), ['To do', 'In progress', 'Done']);
    const makeTask=async name=>(await db.query(`select tb_save_task(null,$1,$2,$3,'','medium',null) id`,[project,stages[0].id,name])).rows[0].id;
    const one=await makeTask('First'),two=await makeTask('Second'),three=await makeTask('Third');
    await db.query('select tb_move_task($1,$2,0)',[three,stages[0].id]);
    assert.deepEqual((await db.query('select title from tb_tasks where stage_id=$1 order by position,id',[stages[0].id])).rows.map(t=>t.title),['Third','First','Second']);
    await db.query('select tb_move_task($1,$2,0)',[one,stages[2].id]);
    assert.deepEqual((await db.query('select position from tb_tasks where stage_id=$1 order by position',[stages[0].id])).rows.map(t=>t.position),[0,1]);
    const foreign=(await db.query('select id from tb_stages where project_id=$1 order by position',[project2])).rows[0].id;
    await assert.rejects(db.query('select tb_move_task($1,$2,0)',[one,foreign]), /The column belongs to a different project/);
    await assert.rejects(db.query('update tb_tasks set stage_id=$1 where id=$2',[foreign,one]));
    await assert.rejects(db.query('update tb_projects set owner_id=$1 where id=$2',[outsider,project]));
    const object=`${project}/${one}/sample`;
    await db.query(`insert into storage.objects(bucket_id,name) values('tb-attachments',$1)`,[object]);
    assert.equal((await db.query('select * from storage.objects')).rows.length,1);
    if (legacyPolicies) {
      await assert.rejects(db.query('select public.is_workspace_member($1)',[project]), /permission denied/);
      await assert.rejects(db.query(`insert into storage.objects(bucket_id,name) values('task-attachments',$1)`,[object]), /permission denied/);
    }
    await asUser(outsider);
    assert.equal((await db.query('select * from tb_projects')).rows.length,0);
    assert.equal((await db.query('select * from tb_tasks')).rows.length,0);
    assert.equal((await db.query('select * from storage.objects')).rows.length,0);
    await assert.rejects(db.query(`insert into storage.objects(bucket_id,name) values('tb-attachments',$1)`,[object]));
    await assert.rejects(db.query('select tb_move_task($1,$2,0)',[two,stages[0].id]));
    await assert.rejects(db.query('select tb_set_role($1,$2)',[outsider,'admin']));
    await assert.rejects(db.query("update tb_user_roles set role='admin' where user_id=$1",[outsider]));
    await db.exec('reset role'); await db.query("update tb_user_roles set role='admin' where user_id=$1",[owner]);
    await asUser(owner); await db.query("select tb_set_role($1,'admin')",[outsider]);
    await asUser(outsider); assert.equal((await db.query('select * from tb_projects')).rows.length,2);
    await assert.rejects(db.query("select tb_set_role($1,'user')",[outsider]),'admin cannot demote self');
    await db.exec('reset role; set role anon');
    await assert.rejects(db.query('select * from tb_tasks'));
    await assert.rejects(db.query("select tb_create_project('Anonymous','','sage')"));
  } finally { await db.close(); }
});
