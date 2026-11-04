import assert from 'node:assert/strict';

// Read-only deployment checks: no login, credentials or changes to user data.
const base = new URL(process.argv[2] || 'https://svilen-taskboard.netlify.app');
assert.ok(['http:', 'https:'].includes(base.protocol), 'Use an HTTP or HTTPS origin.');
assert.ok(!base.username && !base.password && base.pathname === '/' && !base.search && !base.hash, 'Pass an origin without credentials, path, query or fragment.');
const pages = ['login', 'register', 'dashboard', 'projects', 'project-edit', 'board', 'tasks', 'files', 'admin'];
const routes = [{path:'/', page:'index'}, ...pages.flatMap(page => [{path:`/${page}`,page}, {path:`/${page}.html`,page}]), {path:'/__taskboard_route_check_404__',status:404}];
const assets = new Map();
let passed = 0, failed = 0;

async function responseFor(path) {
  const response = await fetch(new URL(path, base), {signal:AbortSignal.timeout(15_000)});
  assert.equal(new URL(response.url).origin, base.origin, 'Redirected away from the application origin.');
  return response;
}
async function check(label, action) {
  try { await action(); passed++; console.log(`PASS ${label}`); }
  catch (error) { failed++; console.error(`FAIL ${label}: ${error.message}`); }
}
async function batches(items, action) {
  for (let offset = 0; offset < items.length; offset += 5) await Promise.all(items.slice(offset, offset + 5).map(action));
}

console.log(`Checking ${base.origin}`);
await batches(routes, route => check(route.path, async () => {
  const response = await responseFor(route.path);
  assert.equal(response.status, route.status || 200, 'Unexpected HTTP status.');
  if (!route.page) return;
  assert.match(response.headers.get('content-type') || '', /text\/html/i, 'Expected an HTML response.');
  const html = await response.text();
  assert.match(html, /<html\b[^>]*\blang=["']en["']/i, 'Missing English document language.');
  assert.equal(html.match(/\bdata-page=["']([^"']+)["']/i)?.[1], route.page, 'Wrong HTML entry (possible rewrite or access-gate problem).');
  const declared = [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css)(?:\?[^"']*)?)["']/gi)].map(match => new URL(match[1], response.url));
  for (const asset of declared) if (asset.origin === base.origin && asset.pathname.startsWith('/assets/')) assets.set(asset.pathname, asset.pathname.endsWith('.css') ? 'css' : 'js');
  assert.ok(declared.some(asset=>asset.pathname.endsWith('.js')), 'No JavaScript entry found.');
  assert.ok(declared.some(asset=>asset.pathname.endsWith('.css')), 'No stylesheet found.');
}));
await batches([...assets], ([path, kind]) => check(path, async () => {
  const response = await responseFor(path);
  assert.equal(response.status, 200, 'Asset is unavailable.');
  assert.match(response.headers.get('content-type') || '', kind === 'css' ? /text\/css/i : /javascript|ecmascript/i, 'Asset returned the wrong content type.');
  assert.ok((await response.text()).length > 0, 'Asset is empty.');
}));
console.log(`${passed} passed; ${failed} failed. These checks verify public HTML routing and declared assets; they do not replace authenticated CRUD and Storage tests.`);
if (failed) process.exitCode = 1;
