import { useEffect, useState, type FormEvent } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Lock,
  MapPin,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import {
  PRIMARY_DOCTOR,
  TIME_SLOTS,
  VISIT_REASONS,
} from '../data/clinicData';
import type {
  Appointment,
  AppointmentType,
  BookedSlot,
  BookingFormInput,
  BookingValidationErrors,
  ClinicUserProfile,
  UserRole,
} from '../types/clinic';
import {
  formatDisplayDate,
  getAppointmentTypeLabel,
  getConsultationFee,
  hasSlotConflict,
  validateBookingForm,
} from '../utils/appointments';

interface BookingWizardProps {
  user: ClinicUserProfile | null;
  selectedType: AppointmentType;
  onSelectType: (type: AppointmentType) => void;
  appointments: Appointment[];
  bookedSlots: BookedSlot[];
  isSubmitting: boolean;
  onCreateAppointment: (input: BookingFormInput) => Promise<Appointment>;
  onOpenAuth: (role: UserRole) => void;
  onViewAppointments: () => void;
}

export function BookingWizard({
  user,
  selectedType,
  onSelectType,
  appointments,
  bookedSlots,
  isSubmitting,
  onCreateAppointment,
  onOpenAuth,
  onViewAppointments,
}: BookingWizardProps) {
  const [visitType, setVisitType] = useState(VISIT_REASONS[0]);
  const [date, setDate] = useState('2026-11-26');
  const [time, setTime] = useState('10:00 AM');
  const [ownerName, setOwnerName] = useState(user?.displayName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [petName, setPetName] = useState('');
  const [petSpecies, setPetSpecies] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<BookingValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(
    null,
  );
  const [docImageFailed, setDocImageFailed] = useState(false);

  useEffect(() => {
    if (user) {
      setOwnerName((prev) => prev || user.displayName);
      setEmail((prev) => prev || user.email);
    }
  }, [user]);

  const selectedFee = getConsultationFee(selectedType);
  const openSlotsCount = TIME_SLOTS.filter(
    (slot) => !hasSlotConflict(appointments, date, slot, bookedSlots),
  ).length;

  const clearError = (field: keyof BookingValidationErrors) => {
    if (errors[field] || errors.conflict) {
      setErrors((prev) => ({ ...prev, [field]: undefined, conflict: undefined }));
    }
    if (submitError) setSubmitError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const payload: BookingFormInput = {
      appointmentType: selectedType,
      visitType,
      date,
      time,
      ownerName,
      email,
      phone,
      petName,
      petSpecies,
      notes,
    };

    const validation = validateBookingForm(payload, appointments, bookedSlots);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    if (!user) {
      onOpenAuth('patient');
      return;
    }

    setErrors({});
    try {
      const created = await onCreateAppointment(payload);
      setConfirmedAppointment(created);
      setPhone('');
      setPetName('');
      setPetSpecies('');
      setNotes('');
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? 'Could not complete booking right now. Please try another time slot.'
          : 'Could not complete booking.',
      );
    }
  };

  if (confirmedAppointment) {
    return (
      <div
        data-testid="booking-confirmation"
        className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 text-center max-w-xl mx-auto shadow-sm"
      >
        <div className="w-14 h-14 mx-auto rounded-full bg-blue-600 text-white flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
        </div>
        <h3 className="mt-5 font-display text-2xl font-bold text-slate-900">
          Appointment Accepted
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Your {getAppointmentTypeLabel(confirmedAppointment.appointmentType).toLowerCase()} for{' '}
          <span className="font-semibold text-slate-900">
            {confirmedAppointment.petName}
          </span>{' '}
          with{' '}
          <span className="font-semibold text-slate-900">
            {PRIMARY_DOCTOR.name}
          </span>{' '}
          is confirmed for{' '}
          <span className="font-semibold text-slate-900">
            {formatDisplayDate(confirmedAppointment.date)} at {confirmedAppointment.time}
          </span>
          .
        </p>

        <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs text-slate-600 grid grid-cols-2 gap-3">
          <div>
            <span className="text-slate-400 block">Appointment ID</span>
            <span className="font-mono-tabular font-semibold text-slate-900">
              #{confirmedAppointment.id}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Consultation Fee</span>
            <span className="font-mono-tabular font-semibold text-slate-900">
              ${confirmedAppointment.fee}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Veterinarian</span>
            <span className="font-semibold text-slate-900">
              {PRIMARY_DOCTOR.name}, {PRIMARY_DOCTOR.credentials}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Clinic Location</span>
            <span className="font-semibold text-slate-900">
              {PRIMARY_DOCTOR.clinicName}
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onViewAppointments}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Go to Appointments
          </button>
          <button
            type="button"
            onClick={() => setConfirmedAppointment(null)}
            className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Book Another Visit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left Column: Dedicated Single Veterinarian Card */}
      <aside className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
            <span className="font-semibold text-blue-700">
              Dedicated Clinic Veterinarian
            </span>
            <span className="font-mono-tabular font-semibold text-amber-600">
              {PRIMARY_DOCTOR.rating.toFixed(1)} ★ Rated
            </span>
          </div>

          <div className="mt-4 flex items-center gap-4">
            {docImageFailed ? (
              <div className="w-20 h-20 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Stethoscope className="w-8 h-8" aria-hidden="true" />
              </div>
            ) : (
              <img
                src={PRIMARY_DOCTOR.avatarUrl}
                alt={`${PRIMARY_DOCTOR.name}, ${PRIMARY_DOCTOR.specialty}`}
                referrerPolicy="no-referrer"
                onError={() => setDocImageFailed(true)}
                className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-slate-200"
              />
            )}
            <div>
              <h3 className="font-display text-xl font-bold text-slate-900">
                {PRIMARY_DOCTOR.name}
              </h3>
              <p className="text-xs font-medium text-blue-700 mt-0.5">
                {PRIMARY_DOCTOR.credentials} · {PRIMARY_DOCTOR.experienceYears} Years Exp
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {PRIMARY_DOCTOR.specialty}
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-600 leading-relaxed">
            {PRIMARY_DOCTOR.bio}
          </p>

          <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col gap-3 text-xs">
            <div className="flex items-start gap-2.5 text-slate-700">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="font-semibold text-slate-900 block">
                  {PRIMARY_DOCTOR.clinicName}
                </span>
                <span className="text-slate-500">{PRIMARY_DOCTOR.clinicAddress}</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-slate-700">
              <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="font-semibold text-slate-900 block">
                  Clinic &amp; Telehealth Hours
                </span>
                <span className="text-slate-500">{PRIMARY_DOCTOR.clinicHours}</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="font-semibold text-slate-900 block">
                  {openSlotsCount} of {TIME_SLOTS.length} Slots Open on {formatDisplayDate(date)}
                </span>
                <span className="text-slate-500">
                  {PRIMARY_DOCTOR.certifications.join(' · ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Access Summary */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          {user ? (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-emerald-700 block">
                  Signed in as {user.role === 'doctor' ? 'Doctor' : 'Pet Owner'}
                </span>
                <span className="text-xs font-semibold text-slate-900 truncate block">
                  {user.displayName} · {user.email}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
                <Lock className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                Sign in required to confirm booking
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Both pet owners and Dr. Elena Vance sign in securely to save and manage appointments.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onOpenAuth('patient')}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  Patient Login
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('doctor')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Doctor Login
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Right Column: Schedule & Pet Details Form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between"
      >
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Book with {PRIMARY_DOCTOR.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {getAppointmentTypeLabel(selectedType)} · {PRIMARY_DOCTOR.clinicName}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Consultation Fee</span>
              <span className="text-xl font-bold font-mono-tabular text-slate-900">
                ${selectedFee}
              </span>
            </div>
          </div>

          {(errors.conflict || submitError) && (
            <div
              role="alert"
              className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-medium text-amber-900"
            >
              {errors.conflict || submitError}
            </div>
          )}

          {/* Date, Visit Type & Time Slot */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="booking-date"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Preferred Date
              </label>
              <div className="relative">
                <Calendar
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="booking-date"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    clearError('date');
                  }}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
              {errors.date && (
                <p className="mt-1 text-xs text-red-600">{errors.date}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="visit-reason"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Visit Type
              </label>
              <select
                id="visit-reason"
                value={visitType}
                onChange={(e) => setVisitType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-blue-600"
              >
                {VISIT_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <span className="block text-xs font-semibold text-slate-700 mb-2">
              Available Time Slots with {PRIMARY_DOCTOR.name}
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {TIME_SLOTS.map((slot) => {
                const taken = hasSlotConflict(appointments, date, slot, bookedSlots);
                const isSelected = time === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={taken}
                    onClick={() => {
                      setTime(slot);
                      clearError('time');
                    }}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      taken
                        ? 'border-slate-100 bg-slate-50 text-slate-400 line-through cursor-not-allowed'
                        : isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Clock className="w-3 h-3 inline mr-1" aria-hidden="true" />
                    {slot}
                  </button>
                );
              })}
            </div>
            {errors.time && (
              <p className="mt-1 text-xs text-red-600">{errors.time}</p>
            )}
          </div>

          {/* Owner & Pet Inputs */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="owner-name"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Owner Full Name
              </label>
              <input
                id="owner-name"
                type="text"
                placeholder="e.g. Kelly Joseph"
                value={ownerName}
                onChange={(e) => {
                  setOwnerName(e.target.value);
                  clearError('ownerName');
                }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
              {errors.ownerName && (
                <p className="mt-1 text-xs text-red-600">{errors.ownerName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="owner-email"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Email Address
              </label>
              <input
                id="owner-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError('email');
                }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="owner-phone"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Phone Number
              </label>
              <input
                id="owner-phone"
                type="tel"
                placeholder="+1 512 555 0140"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  clearError('phone');
                }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="pet-name"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Pet Name
                </label>
                <input
                  id="pet-name"
                  type="text"
                  placeholder="Barnaby"
                  value={petName}
                  onChange={(e) => {
                    setPetName(e.target.value);
                    clearError('petName');
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                />
                {errors.petName && (
                  <p className="mt-1 text-xs text-red-600">{errors.petName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="pet-species"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Breed / Species
                </label>
                <input
                  id="pet-species"
                  type="text"
                  placeholder="Golden Retriever"
                  value={petSpecies}
                  onChange={(e) => {
                    setPetSpecies(e.target.value);
                    clearError('petSpecies');
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                />
                {errors.petSpecies && (
                  <p className="mt-1 text-xs text-red-600">{errors.petSpecies}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="visit-notes"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Symptoms or Care Notes (optional)
            </label>
            <textarea
              id="visit-notes"
              rows={2}
              placeholder="Share any allergies, appetite changes, or questions for Dr. Elena…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 resize-none"
            />
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Free rescheduling up to 4 hours before visit · Direct care with Dr. Elena
          </div>
          <div className="flex items-center gap-3">
            {selectedType !== 'clinic' && (
              <button
                type="button"
                onClick={() => onSelectType('clinic')}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Switch to Clinic Visit
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {isSubmitting
                ? 'Saving Booking…'
                : user
                  ? 'Confirm Appointment'
                  : 'Sign In & Confirm'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
