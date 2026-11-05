-- Cover both the project foreign key and the project/task relationship when
-- loading a project's attachments or cascading a project/task deletion.
create index tb_attachments_project_task_idx
  on public.tb_attachments (project_id, task_id);
