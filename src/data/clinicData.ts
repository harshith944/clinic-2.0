import type {
  Appointment,
  AppointmentTypeOption,
  ClinicZoneInfo,
  Veterinarian,
  WeeklyMetric,
} from '../types/clinic';

export const DOCTOR_EMAIL = 'infinitysoftwaresolutions0@gmail.com';

export const PRIMARY_DOCTOR: Veterinarian = {
  id: 'dr-elena',
  name: 'Dr. Elena Vance',
  credentials: 'DVM, DACVIM',
  specialty: 'Small Animal Medicine & Fear-Free Care',
  experienceYears: 9,
  rating: 4.9,
  clinicName: 'CityVet Main Pavilion',
  clinicAddress: '1011 W 5th St, Suite 120, Austin, TX',
  clinicHours: 'Mon–Sat · 08:30 AM – 06:30 PM',
  avatarUrl: '/src/assets/images/vet_doctor_elena_1795280651805.jpg',
  bio: 'Dedicated single-clinician practice ensuring every dog and cat sees the same trusted veterinarian from preventive wellness through rapid diagnostics.',
  certifications: [
    'Fear-Free Certified Practitioner',
    'In-House Doppler Ultrasound',
    'Preventive & Dental Medicine',
  ],
  availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

export const APPOINTMENT_TYPES: AppointmentTypeOption[] = [
  {
    id: 'clinic',
    label: 'Clinic Visit',
    shortLabel: 'Clinic',
    fee: 65,
    durationMinutes: 30,
    description: 'In-person physical exam, diagnostics, and preventive care with Dr. Elena Vance.',
    recommendedZone: 'exam',
  },
  {
    id: 'video',
    label: 'Video Call',
    shortLabel: 'Video Call',
    fee: 45,
    durationMinutes: 20,
    description: 'Face-to-face live video consultation with Dr. Elena Vance from home.',
    recommendedZone: 'reception',
  },
  {
    id: 'audio',
    label: 'Audio Call',
    shortLabel: 'Audio Call',
    fee: 35,
    durationMinutes: 15,
    description: 'Focused phone triage, medication check-ins, and nutrition guidance.',
    recommendedZone: 'reception',
  },
  {
    id: 'chat',
    label: 'Live Chat',
    shortLabel: 'Chat',
    fee: 25,
    durationMinutes: 24,
    description: 'Photo sharing and rapid clinical advice directly from Dr. Elena Vance.',
    recommendedZone: 'recovery',
  },
  {
    id: 'home',
    label: 'Home Visit',
    shortLabel: 'Home Visit',
    fee: 95,
    durationMinutes: 45,
    description: 'Stress-free mobile veterinary exam right in your living room.',
    recommendedZone: 'overview',
  },
];

export const VISIT_REASONS: string[] = [
  'General Checkup',
  'Vaccination & Booster',
  'Diagnostic Screening',
  'Dental Care',
  'Skin & Allergy Relief',
  'Follow-Up Review',
];

export const TIME_SLOTS: string[] = [
  '09:00 AM',
  '10:00 AM',
  '11:30 AM',
  '01:30 PM',
  '03:00 PM',
  '04:30 PM',
];

export const CLINIC_ZONES: ClinicZoneInfo[] = [
  {
    id: 'overview',
    label: 'Overview',
    title: 'CityVet Architectural Pavilion',
    summary:
      'Sunlit single-doctor veterinary pavilion designed to keep pets calm with acoustic timber slats, natural glass daylighting, and direct suite access.',
    equipment: ['Step-Free Pet Entry', 'Acoustic Timber Canopy', 'Separated Cat & Dog Flow'],
    linkedAppointmentType: 'home',
    cameraPosition: [14.5, 9.5, 14.5],
    cameraTarget: [0, 1.0, 0],
  },
  {
    id: 'reception',
    label: 'Reception',
    title: 'Warm Check-In & Triage Lounge',
    summary:
      'Stress-free arrival desk with instant digital check-in, weight-tracking floor scale, and quiet seating away from clinical traffic.',
    equipment: ['Digital Check-In Kiosk', 'Walk-On Pet Scale', 'Calming Waiting Nook'],
    linkedAppointmentType: 'video',
    cameraPosition: [-0.6, 3.6, 4.3],
    cameraTarget: [-3.4, 1.0, 2.2],
  },
  {
    id: 'exam',
    label: 'Exam Suite',
    title: 'Dr. Elena’s Exam Suite',
    summary:
      'Hydraulic stainless examination table with warm non-slip topper, overhead articulated LED exam light, and real-time vitals telemetry.',
    equipment: ['Hydraulic Exam Table', 'Articulated LED Lamp', 'ECG Vitals Console'],
    linkedAppointmentType: 'clinic',
    cameraPosition: [5.4, 3.3, 4.2],
    cameraTarget: [3.0, 1.1, 0.2],
  },
  {
    id: 'diagnostics',
    label: 'Diagnostics',
    title: 'Imaging & In-House Lab Bay',
    summary:
      'Point-of-care ultrasound scanner, rapid blood chemistry centrifuge, and digital radiography for same-visit results in under 15 minutes.',
    equipment: ['Color Doppler Ultrasound', 'Rapid Blood Analyzer', 'Digital Lab Cabinet'],
    linkedAppointmentType: 'clinic',
    cameraPosition: [5.5, 3.6, -0.8],
    cameraTarget: [3.1, 1.1, -3.2],
  },
  {
    id: 'recovery',
    label: 'Recovery',
    title: 'Quiet Recovery & Comfort Nook',
    summary:
      'Warm oak-slatted recovery bays with orthopedic pet beds, gentle ambient warmth, and dedicated hydration stations for post-visit rest.',
    equipment: ['Orthopedic Recovery Beds', 'Timber Privacy Louvers', 'Heated Comfort Mat'],
    linkedAppointmentType: 'chat',
    cameraPosition: [-0.8, 3.6, -0.4],
    cameraTarget: [-3.4, 0.9, -2.5],
  },
];

export const SAMPLE_PREVIEW_APPOINTMENTS: Appointment[] = [
  {
    id: 'Apt0001',
    doctorId: 'dr-elena',
    ownerName: 'Kelly Joseph',
    email: 'kelly.joseph@example.com',
    phone: '+1 504 368 6874',
    petName: 'Barnaby',
    petSpecies: 'Golden Retriever',
    appointmentType: 'clinic',
    visitType: 'General Checkup',
    date: '2026-11-23',
    time: '11:30 AM',
    fee: 65,
    status: 'upcoming',
    patientTag: 'New Patient',
    notes: 'Annual wellness exam and seasonal booster.',
    avatarUrl: '/src/assets/images/vet_owner_kelly_1795280653135.jpg',
  },
  {
    id: 'Apt0007',
    doctorId: 'dr-elena',
    ownerName: 'Peter Anderson',
    email: 'peter.anderson@example.com',
    phone: '+1 512 440 1928',
    petName: 'Mochi',
    petSpecies: 'Scottish Fold Cat',
    appointmentType: 'video',
    visitType: 'Follow-Up Review',
    date: '2026-11-24',
    time: '09:00 AM',
    fee: 45,
    status: 'upcoming',
    patientTag: 'Returning',
    notes: 'Post-dental recovery check and diet review.',
  },
  {
    id: 'Apt0004',
    doctorId: 'dr-elena',
    ownerName: 'Hannah Brooks',
    email: 'hannah.brooks@example.com',
    phone: '+1 512 882 3104',
    petName: 'Luna',
    petSpecies: 'French Bulldog',
    appointmentType: 'clinic',
    visitType: 'Skin & Allergy Relief',
    date: '2026-11-20',
    time: '03:00 PM',
    fee: 65,
    status: 'completed',
    patientTag: 'Returning',
    notes: 'Skin flare-up around paws.',
    doctorNotes: 'Prescribed hypoallergenic soothing balm and 14-day oatmeal rinse.',
  },
];

export const BASE_WEEKLY_METRICS: WeeklyMetric[] = [
  { day: 'M', fullDay: 'Monday', appointments: 8, revenue: 520 },
  { day: 'T', fullDay: 'Tuesday', appointments: 7, revenue: 455 },
  { day: 'W', fullDay: 'Wednesday', appointments: 6, revenue: 390 },
  { day: 'T', fullDay: 'Thursday', appointments: 11, revenue: 745, isHighlight: true },
  { day: 'F', fullDay: 'Friday', appointments: 8, revenue: 540 },
  { day: 'S', fullDay: 'Saturday', appointments: 9, revenue: 615 },
  { day: 'S', fullDay: 'Sunday', appointments: 4, revenue: 260 },
];
