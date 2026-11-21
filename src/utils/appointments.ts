import { APPOINTMENT_TYPES } from '../data/clinicData';
import type {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  BookedSlot,
  BookingFormInput,
  BookingValidationErrors,
  WeeklyMetric,
} from '../types/clinic';

export const BLUEPRINT_LIMITS = {
  ownerNameMax: 100,
  emailMax: 160,
  phoneMax: 32,
  petNameMax: 60,
  petSpeciesMax: 80,
  visitTypeMax: 80,
  notesMax: 500,
  doctorNotesMax: 500,
} as const;

export function getConsultationFee(type: AppointmentType): number {
  const match = APPOINTMENT_TYPES.find((item) => item.id === type);
  return match ? match.fee : 65;
}

export function getAppointmentTypeLabel(type: AppointmentType): string {
  const match = APPOINTMENT_TYPES.find((item) => item.id === type);
  return match ? match.label : 'Clinic Visit';
}

export function buildSlotId(date: string, time: string): string {
  const normalizedTime = time.trim().replace(/[:\s]+/g, '_');
  return `${date}__${normalizedTime}`;
}

export function hasSlotConflict(
  appointments: Appointment[],
  date: string,
  time: string,
  bookedSlots: BookedSlot[] = [],
): boolean {
  const inAppointments = appointments.some(
    (apt) =>
      apt.status !== 'cancelled' &&
      apt.date === date &&
      apt.time === time,
  );
  if (inAppointments) return true;

  const slotId = buildSlotId(date, time);
  return bookedSlots.some(
    (slot) => slot.slotId === slotId && slot.status === 'reserved',
  );
}

export function validateBookingForm(
  input: BookingFormInput,
  existingAppointments: Appointment[] = [],
  bookedSlots: BookedSlot[] = [],
): BookingValidationErrors {
  const errors: BookingValidationErrors = {};

  const owner = input.ownerName.trim();
  if (!owner || owner.length < 2) {
    errors.ownerName = 'Please enter the pet owner full name.';
  } else if (owner.length > BLUEPRINT_LIMITS.ownerNameMax) {
    errors.ownerName = `Owner name must be ${BLUEPRINT_LIMITS.ownerNameMax} characters or fewer.`;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const email = input.email.trim();
  if (!email || !emailPattern.test(email) || email.length > BLUEPRINT_LIMITS.emailMax) {
    errors.email = 'Please enter a valid email address.';
  }

  const digits = input.phone.replace(/\D/g, '');
  if (digits.length < 7 || input.phone.trim().length > BLUEPRINT_LIMITS.phoneMax) {
    errors.phone = 'Please enter a valid phone number (at least 7 digits).';
  }

  const petName = input.petName.trim();
  if (!petName || petName.length > BLUEPRINT_LIMITS.petNameMax) {
    errors.petName = 'Please enter your pet’s name.';
  }

  const petSpecies = input.petSpecies.trim();
  if (!petSpecies || petSpecies.length > BLUEPRINT_LIMITS.petSpeciesMax) {
    errors.petSpecies = 'Please specify species or breed (e.g. Golden Retriever).';
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date.trim())) {
    errors.date = 'Please select a valid appointment date.';
  }

  if (!input.time.trim()) {
    errors.time = 'Please choose an available time slot.';
  }

  if (
    !errors.date &&
    !errors.time &&
    hasSlotConflict(existingAppointments, input.date, input.time, bookedSlots)
  ) {
    errors.conflict = 'Dr. Elena Vance is already booked at this time. Please choose another slot.';
  }

  return errors;
}

export function generateAppointmentId(existingCount = 0): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 8999);
  const seq = (existingCount + 12) % 9000;
  const num = String((randomSuffix + seq) % 90000 + 1000);
  return `Apt${num.slice(0, 5)}`;
}

export function createAppointmentRecord(
  input: BookingFormInput,
  existingAppointments: Appointment[],
  patientUid?: string,
  forcedId?: string,
): Appointment {
  const nextNumber = existingAppointments.length + 12;
  const padded = String(nextNumber).padStart(4, '0');
  const id = forcedId ?? `Apt${padded}`;
  const fee = getConsultationFee(input.appointmentType);

  return {
    id,
    patientUid,
    doctorId: 'dr-elena',
    ownerName: input.ownerName.trim().slice(0, BLUEPRINT_LIMITS.ownerNameMax),
    email: input.email.trim().slice(0, BLUEPRINT_LIMITS.emailMax),
    phone: input.phone.trim().slice(0, BLUEPRINT_LIMITS.phoneMax),
    petName: input.petName.trim().slice(0, BLUEPRINT_LIMITS.petNameMax),
    petSpecies: input.petSpecies.trim().slice(0, BLUEPRINT_LIMITS.petSpeciesMax),
    appointmentType: input.appointmentType,
    visitType: input.visitType.trim().slice(0, BLUEPRINT_LIMITS.visitTypeMax),
    date: input.date.trim(),
    time: input.time.trim(),
    fee,
    status: 'upcoming',
    patientTag: existingAppointments.length > 0 ? 'Returning' : 'New Patient',
    notes: input.notes.trim().slice(0, BLUEPRINT_LIMITS.notesMax) || undefined,
  };
}

export function filterAppointments(
  appointments: Appointment[],
  statusFilter: 'all' | AppointmentStatus,
): Appointment[] {
  if (statusFilter === 'all') {
    return appointments;
  }
  return appointments.filter((apt) => apt.status === statusFilter);
}

export function computeWeeklyOverview(
  baseMetrics: WeeklyMetric[],
  appointments: Appointment[],
  baselineCount = 0,
): WeeklyMetric[] {
  const active = appointments.filter((apt) => apt.status !== 'cancelled');
  const added = active.slice(0, Math.max(0, active.length - baselineCount));

  if (added.length === 0) {
    return baseMetrics.map((m) => ({ ...m }));
  }

  return baseMetrics.map((metric, idx) => {
    if (idx !== 3) {
      return { ...metric };
    }
    const extraRevenue = added.reduce((sum, item) => sum + item.fee, 0);
    return {
      ...metric,
      appointments: metric.appointments + added.length,
      revenue: metric.revenue + extraRevenue,
    };
  });
}

export function formatDisplayDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }
  return parsed.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
