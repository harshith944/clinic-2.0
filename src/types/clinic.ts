export type AppointmentType = 'clinic' | 'video' | 'audio' | 'chat' | 'home';

export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled';

export type ClinicZoneId = 'overview' | 'reception' | 'exam' | 'diagnostics' | 'recovery';

export type LightingPreset = 'daylight' | 'evening';

export type UserRole = 'patient' | 'doctor';

export interface ClinicUserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
}

export interface AppointmentTypeOption {
  id: AppointmentType;
  label: string;
  shortLabel: string;
  fee: number;
  durationMinutes: number;
  description: string;
  recommendedZone: ClinicZoneId;
}

export interface Veterinarian {
  id: 'dr-elena';
  name: string;
  credentials: string;
  specialty: string;
  experienceYears: number;
  rating: number;
  clinicName: string;
  clinicAddress: string;
  clinicHours: string;
  avatarUrl: string;
  bio: string;
  certifications: string[];
  availableDays: string[];
}

export interface ClinicZoneInfo {
  id: ClinicZoneId;
  label: string;
  title: string;
  summary: string;
  equipment: string[];
  linkedAppointmentType: AppointmentType;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
}

export interface Appointment {
  id: string;
  patientUid?: string;
  doctorId: 'dr-elena';
  ownerName: string;
  email: string;
  phone: string;
  petName: string;
  petSpecies: string;
  appointmentType: AppointmentType;
  visitType: string;
  date: string;
  time: string;
  fee: number;
  status: AppointmentStatus;
  patientTag: 'New Patient' | 'Returning';
  notes?: string;
  doctorNotes?: string;
  avatarUrl?: string;
}

export interface BookedSlot {
  slotId: string;
  doctorId: 'dr-elena';
  date: string;
  time: string;
  appointmentId: string;
  bookedByUid: string;
  status: 'reserved' | 'released';
}

export interface WeeklyMetric {
  day: string;
  fullDay: string;
  appointments: number;
  revenue: number;
  isHighlight?: boolean;
}

export interface BookingFormInput {
  appointmentType: AppointmentType;
  visitType: string;
  date: string;
  time: string;
  ownerName: string;
  email: string;
  phone: string;
  petName: string;
  petSpecies: string;
  notes: string;
}

export interface BookingValidationErrors {
  ownerName?: string;
  email?: string;
  phone?: string;
  petName?: string;
  petSpecies?: string;
  date?: string;
  time?: string;
  conflict?: string;
}
