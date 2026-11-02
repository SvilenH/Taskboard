# Taskboard course project

This project is authored by Codex from scratch at the student's request. Do not use the sibling taskboard project as an implementation source. The filename is retained because the course explicitly requires it; Copilot is not part of the development workflow.

Use vanilla JavaScript, HTML, CSS, Bootstrap, Vite and Supabase. No React, Vue or TypeScript. Each screen has its own HTML entry and page module. Services own persistence and authorization comes from database and Storage RLS. Validate input both in the UI and database. Render data as text or escape it. Never put secret/service-role keys in frontend configuration. SQL migrations are append-only once deployed. The tb_ table prefix isolates this implementation from the older prototype.

Demo mode is explicitly labelled, uses local data and IndexedDB files, and never impersonates Supabase authentication. Do not silently switch cloud errors to demo mode. Preserve data on errors and on reload. Test real flows, role separation and cross-project constraints before shipping.
