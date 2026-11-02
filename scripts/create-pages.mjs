import { writeFile } from 'node:fs/promises';
const pages = { index: 'A place for good ideas', login: 'Sign in', register: 'Sign up', dashboard: 'Overview', projects: 'Projects', 'project-edit': 'Project editor', board: 'Board', tasks: 'Tasks', files: 'Files', admin: 'Administration' };
for (const [page, title] of Object.entries(pages)) {
  await writeFile(`${page}.html`, `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Taskboard — projects, tasks and small wins in one calm space."><meta name="theme-color" content="#275541"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><title>${title} · Taskboard</title></head>
<body data-page="${page}"><div id="app"><p style="padding:40px">Loading your workspace…</p></div><noscript>Taskboard needs JavaScript to display and save your tasks.</noscript><script type="module" src="/src/main.js"></script></body></html>\n`);
}
