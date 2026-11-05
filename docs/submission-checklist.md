# Покритие на условието за Taskboard

Прегледът е по предоставеното условие „Software Technologies with AI Capstone Project“, с проверки на 4 ноември 2026 г. Тук са описани реализираното поведение и доказателствата за него. Оценката и личната самооценка се попълват отделно във формуляра.

## Адреси за проверяващия

- Live: https://svilen-taskboard.netlify.app
- Публичен код и история: https://github.com/SvilenH/Taskboard, branch `main`
- Автоматични проверки: https://github.com/SvilenH/Taskboard/actions/workflows/ci.yml
- Тестови credentials: в частния формуляр за предаване. Alex е admin; Boyan е user.

## Изисквания и доказателства

| Изискване | Реализация и къде да се провери |
| --- | --- |
| JavaScript, HTML, CSS, Bootstrap, Node, npm и Vite | `package.json`, lockfile, `vite.config.js`, `src` и HTML entries; без React, Vue и TypeScript |
| Модулна client/server архитектура | `src/pages`, `src/components`, `src/services/backend.js`, `src/utils`; Supabase SDK комуникира с Auth, REST/RPC и Storage |
| Минимум 5 отделни responsive екрана | 10 HTML entries: home, login, register, dashboard, projects, project edit, board, tasks, files, admin; desktop и mobile проверки |
| Agent instructions | `.github/copilot-instructions.md` описва настоящата самостоятелна реализация; името е изисквано от условието |
| Auth и сесия | Регистрация, вход, изход и refresh чрез Supabase Auth; отделен ясно обозначен browser demo |
| Потребители и admin панел | `tb_user_roles`, `/admin`, различни права; забранени self-promotion и admin self-demotion |
| Сървърна защита | RLS е включено на шестте приложни таблици; Storage policies ограничават частните файлове; реален cross-user API тест |
| Минимум 4 свързани таблици | `tb_profiles`, `tb_user_roles`, `tb_projects`, `tb_stages`, `tb_tasks`, `tb_attachments`; foreign keys, constraints и индекси |
| Migrations в Supabase и GitHub | Четирите SQL файла в `supabase/migrations` съвпадат с приложените версии; локален интеграционен SQL тест |
| Файлове | Частен `tb-attachments` bucket; upload и download през UI и реалния API, проверка на съдържанието и отказ на чужд download |
| Публикувано приложение | Public Netlify; clean и `.html` адреси зареждат правилния HTML entry; неизвестен адрес връща 404 |
| Минимум 15 commits в минимум 3 дни | Собствена история в `main` на 2, 3, 4 и 5 ноември; без промени на timestamps |
| Описание, архитектура, DB diagram и local setup | `README.md`; diagram е Mermaid ER; setup с `npm ci`, `npm run dev` и игнориран `.env` |
| Подготовка и проверка | `docs/defense.md`, `docs/verification.md`, `npm test`, `npm run build`, `npm run check:live` |

## Проверки на 4 ноември

Локално минават 17 автоматични теста и production build. Read-only deployment проверката изпълнява 24 проверки: 19 page URL адреса, 404 и 4 декларирани JS/CSS ресурса. Тя е отделна от Auth проверките.

Реалните Alex и Boyan акаунти са проверени през Supabase: login, правилни роли, project/task create/edit/move, английски начални колони, TXT upload/download със съвпадащо съдържание. Boyan няма достъп до чужд проект, промяна на чужда задача или чужд файл; анонимен DB/download достъп е отказан. Admin може да управлява проекта и файла на Boyan. Тестовите записи и файлове са почистени, API сесиите са затворени локално.

Read-only SQL проверка потвърждава RLS и policies на шестте `tb_` таблици. Migrations API потвърждава четирите версии на настоящия проект. В cloud history има и две по-стари migration entries от предишния прототип; те не са част от собствената Git история и не са преизползвани за тази реализация.

Supabase security advisor няма DB/Storage findings. Единственото Auth предупреждение е изключена [Leaked Password Protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Email confirmation е изключено по избора за учебния проект. Това не отменя server-side RLS проверките.

## Предаване

Предай попълненото копие на оригиналния формуляр с автор SvilenH, предоставения course email, основния GitHub URL, Netlify URL и двата тестови акаунта. Личната самооценка е решение на студента. Не качвай формуляра с паролите или `.env` в публичното repository. Source ZIP е допълнително копие; водещи остават публичният GitHub и живото приложение.

## Ясна собственост и повторен upload тест

Личният Overview на администратора съдържа само неговите проекти. Projects и Administration отделят работата по собственик, а Tasks и Files имат Owner филтър и ясни етикети. Проектите се различават като Not started, In progress и Completed. Примерните задачи имат конкретен резултат, условие за завършване и бележка за текущото състояние.

Upload е повторно проверен през Files с PNG и през task editor с TXT, включително refresh и download със съвпадащи bytes. Файл над 5 MB се отказва без нов запис. Двата временни QA файла са почистени, а шестте постоянни примерни файла са запазени.
