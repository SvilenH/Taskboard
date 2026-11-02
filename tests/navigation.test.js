import test from 'node:test';
import assert from 'node:assert/strict';
import { safeReturnPath } from '../src/utils/navigation.js';

test('sign-in returns to both hosted and local private routes, preserving query parameters', () => {
  for (const page of ['dashboard','projects','project-edit','board','tasks','files','admin']) {
    for (const extension of ['', '.html']) {
      const path = `/${page}${extension}?project=123&q=launch%20notes`;
      assert.equal(safeReturnPath(path), path);
    }
  }
});

test('untrusted return paths cannot redirect to external or unknown destinations', () => {
  for (const path of [null,undefined,'','https://example.com','//example.com','javascript:alert(1)',
    '/unknown','/board/extra','/board\\example.com','/board?x=1\r\n//example.com',
    '/board%2f%2fexample.com',' /board','/board#//example.com']) {
    assert.equal(safeReturnPath(path), '/dashboard.html');
  }
});
