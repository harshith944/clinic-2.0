import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPatientDoubtWhatsAppMessage,
  buildVerifiedReplyWhatsAppMessage,
  buildWhatsAppChatUrl,
  generateDoubtId,
  sanitizeWhatsAppDigits,
  validatePatientDoubtForm,
} from './whatsapp';

test('sanitizeWhatsAppDigits strips formatting or falls back to clinic WhatsApp number', () => {
  assert.equal(sanitizeWhatsAppDigits('+1 (512) 440-1928'), '15124401928');
  assert.equal(sanitizeWhatsAppDigits('123'), '15125550199');
  assert.equal(sanitizeWhatsAppDigits(undefined), '15125550199');
});

test('buildWhatsAppChatUrl constructs encoded wa.me links', () => {
  const msg = buildPatientDoubtWhatsAppMessage({
    patientName: 'Kelly',
    petName: 'Barnaby',
    topic: 'Vaccination Timing',
    question: 'Can Barnaby eat before his rabies booster?',
  });
  const url = buildWhatsAppChatUrl(msg);
  assert.match(url, /^https:\/\/wa\.me\/15125550199\?text=/);
  assert.ok(url.includes(encodeURIComponent('Ajith Clinic')));
  assert.ok(url.includes(encodeURIComponent('Barnaby')));
});

test('buildVerifiedReplyWhatsAppMessage includes doctor verification and answer', () => {
  const reply = buildVerifiedReplyWhatsAppMessage({
    patientName: 'Kelly',
    petName: 'Barnaby',
    topic: 'Vaccination Timing',
    question: 'Can Barnaby eat before his rabies booster?',
    doctorReply: 'Yes, a light breakfast is fine before routine vaccination.',
  });
  assert.ok(reply.includes('Dr. Elena Vance'));
  assert.ok(reply.includes('Ajith Clinic'));
  assert.ok(reply.includes('Verified Answer: Yes, a light breakfast is fine'));
});

test('validatePatientDoubtForm rejects incomplete doubts and accepts valid input', () => {
  const bad = validatePatientDoubtForm({
    patientName: 'A',
    whatsappPhone: '123',
    petName: '',
    topic: 'Diet & Recovery',
    question: 'hi',
  });
  assert.ok(bad.patientName);
  assert.ok(bad.whatsappPhone);
  assert.ok(bad.petName);
  assert.ok(bad.question);

  const ok = validatePatientDoubtForm({
    patientName: 'Kelly Joseph',
    whatsappPhone: '+1 512 555 0140',
    petName: 'Barnaby',
    topic: 'Vaccination Timing',
    question: 'Should we pause allergy tablets 24 hours before the exam?',
  });
  assert.deepEqual(ok, {});
  assert.match(generateDoubtId(3), /^Doubt\d{4,8}$/);
});
