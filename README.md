# Taskboard

Taskboard е приложение за лични проекти и задачи, разработено от Codex от нулата за курсовата работа по Software Technologies with AI. Кодът в тази папка е независим от по-стария прототип `taskboard`, създаден с Copilot. Не са копирани негови source файлове или SQL migrations.

## Какво прави

- Начална страница, регистрация и вход.
- Обзор с изчислени статистики и предстоящи задачи.
- Създаване, редактиране, търсене и изтриване на проекти.
- Kanban табло с три колони, drag-and-drop и алтернативи за клавиатура.
- Задачи с описание, приоритет и срок; създаване, редактиране, изтриване.
- Общ списък със задачи, търсене, филтри и странициране.
- Качване, сваляне и премахване на файлове към задачите.
- Admin страница за достъпните проекти и роли на потребители.
- Изрично обозначен демонстрационен режим, който работи без облачен акаунт.

## Технологии и архитектура

HTML, CSS, JavaScript ES modules, Bootstrap 5, Vite, Supabase JavaScript SDK, SortableJS и Lucide. Без React, Vue и TypeScript.

Приложението има **10 HTML entry файла**, конфигурирани като истински Vite multi-page build. Навигацията е чрез нормални адреси (`/projects.html`, `/board.html?project=...`), с browser Back/Forward и директно отваряне на екрани. Основните екрани не са popup-и в един HTML файл.

| Папка | Предназначение |
| --- | --- |
| `src/pages` | Отделен JavaScript модул за всеки екран |
| `src/components` | Общ layout, project card и task editor |
| `src/services/backend.js` | Supabase Auth, заявки, RPC и Storage |
| `src/services/demo.js` | Самостоятелен локален demo adapter |
| `src/utils` | Валидация, статистики, подреждане и UI helpers |
| `supabase/migrations` | Версионирана SQL schema, RLS и RPC |
| `tests` | Логика и интеграционен SQL тест с PGlite |
| `docs` | Проверки, критерии и подготовка за защита |

`src/main.js` зарежда съответния page module. За частните страници първо проверява session и зарежда позволените данни. Supabase RLS, а не скриването на бутони, определя реалния достъп.

## Локално стартиране

Изисква Node.js 22.12+ или поддържана по-нова версия и npm.

```powershell
npm ci
npm run dev
```

Отвори `http://127.0.0.1:5180/` и натисни **Разгледай демото**. При зает порт Vite спира с грешка, вместо да смени адреса незабелязано.

```powershell
npm test
npm run build
npm run preview -- --port 5181
```

Пакетите са с точни версии и lockfile. `scripts/create-pages.mjs` възстановява минималните HTML shells, ако са необходими; не е нужен за нормална разработка.

## Демонстрационен режим

Демото не използва Supabase login. Бутонът от началната страница отваря локално demo пространство с примерни проекти и задачи. Избран е фиксиран demo admin. Парола не е необходима.

- Примерните записи са в namespaced localStorage и се създават само при липсващ ключ. Умишлено празните списъци не се попълват отново.
- Файловете се пазят като Blob в IndexedDB и могат да се изтеглят след refresh.
- Демо session-ът е в sessionStorage. Изходът не изтрива проектите.
- Данните са само за този браузър и origin; не се споделят между localhost и публикувания сайт.
- Cloud грешките никога не включват demo режима автоматично.

## Облачна конфигурация

Създай отделен учебен Supabase проект или избери изрично подходящ проект. Не изпълнявай migration-а в несвързана работна база.

1. Приложи `supabase/migrations/20261102080522_create_codex_taskboard.sql` чрез Supabase migration workflow.
2. Копирай `.env.example` в `.env` и попълни project URL и **publishable** ключ.
3. Рестартирай Vite след промяна на `.env`.
4. Регистрирай потребител. Ако са включени email confirmations, потвърди акаунта през имейла. Приложението обработва и регистрация без незабавна session.
5. Създай първия admin чрез доверен SQL достъп, използвайки действителния Auth user UUID:

```sql
-- Replace the placeholder with an actual, explicitly chosen Auth user UUID.
update public.tb_user_roles
set role = 'admin'
where user_id = '<USER_UUID>'::uuid;
```

Не задавай роля чрез signup metadata. Всеки нов потребител получава `user`, независимо какво е изпратил браузърът.

Публични frontend променливи:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_KEY
```

Никога не поставяй `service_role`, Supabase secret key или access token в `VITE_` променливи. `.env` е изключен от Git. Само URL и publishable key се включват в браузърния bundle.

За CLI връзка използвай официалния Supabase CLI, `supabase login`, `supabase link` и `supabase db push`, след като провериш текущия `--help`. Migration файлът е създаден с `supabase migration new`. След прилагане не редактирай migration-а, а добави нов.

## База данни

Има 6 собствени приложни таблици с префикс `tb_`. Префиксът отделя реализацията от предишния прототип; сам по себе си не е ограничение на достъпа.

```mermaid
erDiagram
  AUTH_USERS ||--|| TB_PROFILES : profile
  TB_PROFILES ||--|| TB_USER_ROLES : role
  TB_PROFILES ||--o{ TB_PROJECTS : owns
  TB_PROJECTS ||--|{ TB_STAGES : contains
  TB_PROJECTS ||--o{ TB_TASKS : contains
  TB_STAGES ||--o{ TB_TASKS : stage
  TB_TASKS ||--o{ TB_ATTACHMENTS : files
  TB_PROFILES ||--o{ TB_ATTACHMENTS : uploads
```

Посетителят няма достъп до частните данни. Редовният потребител управлява своите проекти и зависимите задачи и файлове. Admin може да управлява всички проекти и да променя чужди роли. Не може да промени собствената си роля през приложението. Admin не се присъжда автоматично на първия регистриран акаунт.

Проектът се създава заедно с трите колони в една транзакция. Task mutations използват RPC и project row lock за последователно подреждане. Composite foreign keys забраняват задача да се свърже с колона от чужд проект и файл да сочи несъответстващ project/task.

## Файлове

Частният Storage bucket е `tb-attachments`. Разрешени са PNG, JPEG, WebP, PDF и plain text до 5 MB. Използват се генерирани storage paths, а оригиналното име е metadata. Storage RLS проверява действителната task/project принадлежност и текущия потребител.

При upload първо се качва файлът, след което се записва metadata. При неуспешен metadata запис се опитва compensating removal. Преди изтриване на задача или проект клиентът премахва съответните Storage objects чрез Storage API, след което изтрива DB записа. Пряко SQL изтриване извън приложението не почиства автоматично Storage; това е задача на администратора. Частични мрежови откази може да изискват повторна операция и проверка за останали обекти.

## Публикуване

`npm run build` генерира `dist/`, готов за static hosting. На Netlify/Vercel използвай build command `npm run build`, output directory `dist` и същите две публични променливи при build. HTML routes не изискват SPA catch-all rewrite. Не качвай само source папката без Vite build.

Sites deployment се управлява с `.openai/hosting.json`. По подразбиране първата Sites публикация е частна за собственика. Това не е публичен адрес за преподавател, докато достъпът не бъде настроен подходящо.

## Състояние и оставаща работа

Демонстрационният поток работи и е проверен в браузъра. SQL migration и ключовите правила за достъп са проверени с PostgreSQL чрез PGlite с моделирани `auth` и `storage` schemas. Това **не е проверка на реалната Supabase Auth/Storage услуга**.

При първоначалното изграждане connector-ите за студентските Supabase и GitHub акаунти връщат „Unknown tool“. Supabase CLI също няма активна login session. Затова cloud migration, реални accounts и облачен upload/download още не са приложени/проверени. Новата папка не използва `.env` от Copilot прототипа. Отделен файл `docs/verification.md` съдържа проверените потоци.

Git историята е нова и е само за тази реализация. Кодът е качен чрез Git CLI в отделния branch [codex-rebuild](https://github.com/SvilenH/Taskboard/tree/codex-rebuild). Той има собствен начален commit и не наследява commits от Copilot прототипа. Старият default branch е запазен. Sites source repository е отделен hosting remote.

Изискваните 15 commits в 3 реални дни трябва да се натрупат през действителните следващи стъпки; не се променят дати на commits. Крайният срок е неделя, 8 ноември 2026 г., според „края на седмицата“, казано на 2 ноември.
