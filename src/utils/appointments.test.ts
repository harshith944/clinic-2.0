import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSlotId,
  computeWeeklyOverview,
  createAppointmentRecord,
  filterAppointments,
  getConsultationFee,
  hasSlotConflict,
  validateBookingForm,
} from './appointments';
import { BASE_WEEKLY_METRICS, SAMPLE_PREVIEW_APPOINTMENTS } from '../data/clinicData';
import type { BookedSlot, BookingFormInput } from '../types/clinic';

const validInput: BookingFormInput = {
  appointmentType: 'video',
  visitType: 'General Checkup',
  date: '2026-11-26',
  time: '10:00 AM',
  ownerName: 'Liam Carter',
  email: 'liam.carter@example.com',
  phone: '+1 512 555 0199',
  petName: 'Oliver',
  petSpecies: 'Beagle',
  notes: 'Routine wellness check',
};

test('getConsultationFee returns exact fees per appointment type', () => {
  assert.equal(getConsultationFee('clinic'), 65);
  assert.equal(getConsultationFee('video'), 45);
  assert.equal(getConsultationFee('audio'), 35);
  assert.equal(getConsultationFee('chat'), 25);
  assert.equal(getConsultationFee('home'), 95);
});

test('validateBookingForm catches missing fields and invalid email/phone', () => {
  const errors = validateBookingForm(
    {
      ...validInput,
      ownerName: ' ',
      email: 'invalid-email',
      phone: '123',
      petName: '',
      petSpecies: '',
    },
    SAMPLE_PREVIEW_APPOINTMENTS,
  );
  assert.ok(errors.ownerName);
  assert.ok(errors.email);
  assert.ok(errors.phone);
  assert.ok(errors.petName);
  assert.ok(errors.petSpecies);
});

test('hasSlotConflict detects conflict from appointments or reserved bookedSlots', () => {
  const existing = SAMPLE_PREVIEW_APPOINTMENTS[0];
  assert.equal(
    hasSlotConflict(SAMPLE_PREVIEW_APPOINTMENTS, existing.date, existing.time),
    true,
  );

  const reservedSlots: BookedSlot[] = [
    {
      slotId: buildSlotId('2026-11-26', '10:00 AM'),
      doctorId: 'dr-elena',
      date: '2026-11-26',
      time: '10:00 AM',
      appointmentId: 'Apt0022',
      bookedByUid: 'user-abc',
      status: 'reserved',
    },
  ];
  assert.equal(hasSlotConflict([], '2026-11-26', '10:00 AM', reservedSlots), true);
  assert.equal(hasSlotConflict([], '2026-11-26', '01:30 PM', reservedSlots), false);
});

test('createAppointmentRecord locks doctorId to single veterinarian dr-elena', () => {
  const record = createAppointmentRecord(
    validInput,
    SAMPLE_PREVIEW_APPOINTMENTS,
    'uid-123',
  );
  assert.equal(record.doctorId, 'dr-elena');
  assert.equal(record.patientUid, 'uid-123');
  assert.equal(record.status, 'upcoming');
  assert.equal(record.fee, 45);
  assert.match(record.id, /^Apt\d{4,8}$/);
});

test('filterAppointments filters by status and preserves all when requested', () => {
  assert.equal(
    filterAppointments(SAMPLE_PREVIEW_APPOINTMENTS, 'all').length,
    SAMPLE_PREVIEW_APPOINTMENTS.length,
  );
  const upcoming = filterAppointments(SAMPLE_PREVIEW_APPOINTMENTS, 'upcoming');
  assert.equal(upcoming.every((a) => a.status === 'upcoming'), true);
});

test('computeWeeklyOverview reflects newly added appointments in Thursday summary', () => {
  const newRecord = createAppointmentRecord(validInput, SAMPLE_PREVIEW_APPOINTMENTS);
  const updated = computeWeeklyOverview(
    BASE_WEEKLY_METRICS,
    [newRecord, ...SAMPLE_PREVIEW_APPOINTMENTS],
    SAMPLE_PREVIEW_APPOINTMENTS.length,
  );
  assert.equal(updated[3].appointments, BASE_WEEKLY_METRICS[3].appointments + 1);
  assert.equal(updated[3].revenue, BASE_WEEKLY_METRICS[3].revenue + 45);
});
