export function ownerName(data, userId) {
  return data.profiles.find(profile => profile.id === userId)?.display_name || 'Unnamed user';
}

export function groupProjects(projects, data) {
  const groups = new Map();
  for (const project of projects) {
    if (!groups.has(project.owner_id)) groups.set(project.owner_id, { ownerId: project.owner_id, name: ownerName(data, project.owner_id), projects: [] });
    groups.get(project.owner_id).projects.push(project);
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name) || a.ownerId.localeCompare(b.ownerId));
}

export function projectState(project, data) {
  const tasks = data.tasks.filter(task => task.project_id === project.id);
  const stages = data.stages.filter(stage => stage.project_id === project.id).sort((a, b) => a.position - b.position);
  const completed = tasks.filter(task => stages.find(stage => stage.id === task.stage_id)?.is_done).length;
  const started = tasks.some(task => task.stage_id !== stages[0]?.id);
  const key = tasks.length && completed === tasks.length ? 'completed' : started ? 'active' : 'planned';
  return { key, label: { completed: 'Completed', active: 'In progress', planned: 'Not started' }[key], completed, total: tasks.length };
}

export function filterProjects(projects, data, { owner = '', status = '', query = '' } = {}) {
  const needle = query.trim().toLocaleLowerCase('en');
  return projects.filter(project => (!owner || project.owner_id === owner) && (!status || projectState(project, data).key === status) &&
    `${project.title} ${project.description}`.toLocaleLowerCase('en').includes(needle));
}
