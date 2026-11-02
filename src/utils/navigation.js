// Hosting canonicalises .html routes to extensionless URLs. Both forms are local.
export function safeReturnPath(value) {
  const allowed = /^\/(?:dashboard|projects|project-edit|board|tasks|files|admin)(?:\.html)?(?:\?[^#\r\n]*)?$/;
  return typeof value === 'string' && allowed.test(value) ? value : '/dashboard.html';
}
