# Проверки

## Автоматизирани проверки

`npm test`: 8 успешни теста. Интеграционният тест изпълнява действителната migration в PGlite PostgreSQL с тестови Auth/Storage schemas и роли.

Проверява се: normal signup независимо от metadata, атомарно създаване на проект със stages, RPC подреждане и преместване, забрана на cross-project stage, неизменяем owner, изолация на двама потребители, Storage RLS, отказ на self-promotion, admin промяна на чужда роля и отказ на анонимен достъп. Unit тестовете покриват статистики, empty state, дати и файлови ограничения.

`npm run build`: успешно генерира 10 HTML entry страници и assets.

## Ръчен браузърен сценарий

Проверено на localhost:

1. Начална страница → demo → обзор с изчислени 3 проекта и 13 задачи.
2. Създаване на нов проект през формата → автоматични три колони.
3. Създаване на задача с висок приоритет и TXT файл.
4. Редактиране и преместване в „Завършени“ → напредък 1/1.
5. Refresh → задачата, колоната и файлът остават запазени.
6. Файлова страница → изтегляне на TXT файла; съдържанието се проверява спрямо оригинала.
7. Console error log е празен при този поток.
8. Responsive проверка на 390 px ширина, странично меню и вътрешно скролиране на таблиците.

## Не е доказано от тези проверки

Реална Supabase регистрация, потвърждаване на email, session с потвърден акаунт и Storage HTTP upload/download. Admin bootstrap трябва да се направи за изрично избран реален user UUID.

## Облачни проверки на 2 ноември 2026

- Codex Supabase MCP OAuth входът е успешен; проектът е `vmorymxzdgtatjkfjspc`.
- Приложена migration `20261102094635_create_codex_taskboard.sql`; локалното име е синхронизирано с remote migration history.
- Проверени са 6 tb_ таблици, всички с включен RLS.
- Storage bucket `tb-attachments` е частен и ограничава размера до 5 MB.
- Security advisors връща `lints: []`.
- REST заявка за проекти с publishable key без потребителски вход е отказана с HTTP 401 / PostgreSQL `42501`.
- Auth API е достъпен и отказва несъществуващ акаунт с HTTP 400 / `invalid_credentials`.
- Email confirmations са включени. Не са изключвани за тестовете.
- Frontend конфигурацията използва актуален активен publishable key; secret/service-role ключ не е използван.

## Преди предаване

- Задаване на Site URL и позволените login Redirect URLs в Supabase Auth.
- Проверки с обикновен, втори обикновен и admin акаунт.
- Cloud upload/download и отказ на неоторизиран достъп.
- Публичен GitHub URL и подходящо достъпен live сайт.
- Реални commits в поне 3 различни дни.
- Реални тестови accounts, автор/email, live URL, repo URL и самооценка в условието.
