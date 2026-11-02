import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const pages = ['index', 'login', 'register', 'dashboard', 'projects', 'project-edit', 'board', 'tasks', 'files', 'admin'];
export default defineConfig({
  build: { rollupOptions: { input: Object.fromEntries(pages.map(name => [name, resolve(import.meta.dirname, `${name}.html`)])) } },
  server: { port: 5180, strictPort: true },
});
