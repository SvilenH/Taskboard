# Taskboard course project

This project is authored by Codex from scratch at the student's request. The earlier prototype has been removed; do not restore or reuse it. The filename is retained because the course explicitly requires it; these instructions describe only the current implementation. The public GitHub repository's default branch is main.

Use vanilla JavaScript, HTML, CSS, Bootstrap, Vite and Supabase. No React, Vue or TypeScript. Each screen has its own HTML entry and page module. Services own persistence and authorization comes from database and Storage RLS. Validate input both in the UI and database. Render data as text or escape it. Never put secret/service-role keys in frontend configuration. SQL migrations are append-only once deployed. The tb_ table prefix isolates this implementation from the older prototype.

Demo mode is explicitly labelled, uses local data and IndexedDB files, and never impersonates Supabase authentication. Do not silently switch cloud errors to demo mode. Preserve data on errors and on reload. Test real flows, role separation and cross-project constraints before shipping.
