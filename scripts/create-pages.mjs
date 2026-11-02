import { writeFile } from 'node:fs/promises';
const pages = { index: 'Място за добри идеи', login: 'Вход', register: 'Регистрация', dashboard: 'Обзор', projects: 'Проекти', 'project-edit': 'Редактор на проект', board: 'Табло', tasks: 'Задачи', files: 'Файлове', admin: 'Администрация' };
for (const [page, title] of Object.entries(pages)) {
  await writeFile(`${page}.html`, `<!doctype html>
<html lang="bg"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Taskboard — проекти, задачи и малки победи на едно спокойно място."><meta name="theme-color" content="#275541"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><title>${title} · Taskboard</title></head>
<body data-page="${page}"><div id="app"><p style="padding:40px">Зареждане на пространството…</p></div><noscript>Taskboard изисква JavaScript, за да показва и запазва задачите.</noscript><script type="module" src="/src/main.js"></script></body></html>\n`);
}
