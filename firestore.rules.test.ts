import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rulesText = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');

test('firestore.rules begins with global default-deny catch-all', () => {
  assert.match(rulesText, /match \/\{document=\*\*\} \{\s*allow read, write: if false;\s*\}/);
});

test('firestore.rules enforces email_verified == true and valid ID guards', () => {
  assert.match(rulesText, /request\.auth\.token\.email_verified == true/);
  assert.match(rulesText, /function isValidId\(id\)/);
  assert.match(rulesText, /isValidId\(appointmentId\)/);
  assert.match(rulesText, /isValidId\(userId\)/);
});

test('firestore.rules enforces single-doctor dr-elena and prevents self-assigned doctor role', () => {
  assert.match(rulesText, /data\.doctorId == 'dr-elena'/);
  assert.match(rulesText, /\(data\.role == 'patient' \|\| isDoctor\(\)\)/);
});

test('firestore.rules enforces split PII isolation and server timestamps', () => {
  assert.match(rulesText, /match \/private\/info/);
  assert.match(rulesText, /incoming\(\)\.createdAt == request\.time/);
  assert.match(rulesText, /incoming\(\)\.updatedAt == request\.time/);
  assert.match(rulesText, /affectedKeys\(\)\.hasOnly\(/);
});
