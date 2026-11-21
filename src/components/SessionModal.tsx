import { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Stethoscope,
  Video,
  X,
} from 'lucide-react';
import { PRIMARY_DOCTOR } from '../data/clinicData';
import type { Appointment, AppointmentStatus, UserRole } from '../types/clinic';
import { formatDisplayDate, getAppointmentTypeLabel } from '../utils/appointments';

interface SessionModalProps {
  appointment: Appointment | null;
  userRole: UserRole;
  isSaving: boolean;
  onClose: () => void;
  onDoctorUpdate: (
    appointment: Appointment,
    status: AppointmentStatus,
    doctorNotes: string,
  ) => Promise<void>;
}

export function SessionModal({
  appointment,
  userRole,
  isSaving,
  onClose,
  onDoctorUpdate,
}: SessionModalProps) {
  const [doctorNotes, setDoctorNotes] = useState(appointment?.doctorNotes ?? '');

  useEffect(() => {
    setDoctorNotes(appointment?.doctorNotes ?? '');
  }, [appointment]);

  useEffect(() => {
    if (!appointment) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [appointment, onClose]);

  if (!appointment) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-mono-tabular font-semibold text-blue-600">
              #{appointment.id} · {getAppointmentTypeLabel(appointment.appointmentType)}
            </span>
            <h3
              id="session-modal-title"
              className="mt-1 font-display text-xl font-bold text-slate-900"
            >
              {appointment.petName} — {appointment.ownerName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close session details"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Scheduled Date</span>
            <span className="mt-0.5 inline-flex items-center gap-1 font-semibold text-slate-900 font-mono-tabular">
              <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              {formatDisplayDate(appointment.date)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Time Slot</span>
            <span className="mt-0.5 inline-flex items-center gap-1 font-semibold text-slate-900 font-mono-tabular">
              <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              {appointment.time}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Attending Vet</span>
            <span className="mt-0.5 inline-flex items-center gap-1 font-semibold text-slate-900">
              <Stethoscope className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              {PRIMARY_DOCTOR.name}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Location</span>
            <span className="mt-0.5 inline-flex items-center gap-1 font-semibold text-slate-900">
              <MapPin className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              {PRIMARY_DOCTOR.clinicName}
            </span>
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-600">
          <span className="font-semibold text-slate-900 block mb-1">
            Pet Owner Intake Notes
          </span>
          <p className="leading-relaxed">
            {appointment.notes ||
              `${appointment.visitType} prepared for ${appointment.petName} (${appointment.petSpecies}).`}
          </p>
        </div>

        {userRole === 'doctor' ? (
          <div className="mt-4">
            <label
              htmlFor="doctor-clinical-notes"
              className="block text-xs font-semibold text-slate-900 mb-1.5"
            >
              Dr. Elena Vance — Clinical Summary &amp; Care Instructions
            </label>
            <textarea
              id="doctor-clinical-notes"
              rows={3}
              maxLength={500}
              placeholder="Record exam observations, dosage instructions, or follow-up timing…"
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 resize-none"
            />
          </div>
        ) : (
          appointment.doctorNotes && (
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950">
              <span className="font-semibold block mb-1">
                Dr. Elena Vance’s Care Notes
              </span>
              <p className="leading-relaxed">{appointment.doctorNotes}</p>
            </div>
          )
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            Close
          </button>

          {userRole === 'doctor' && (
            <>
              <button
                type="button"
                disabled={isSaving}
                onClick={() =>
                  onDoctorUpdate(appointment, appointment.status, doctorNotes)
                }
                className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer"
              >
                Save Notes
              </button>
              {appointment.status === 'upcoming' && (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => onDoctorUpdate(appointment, 'completed', doctorNotes)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                >
                  {appointment.appointmentType === 'video' ? (
                    <Video className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  Complete Consultation
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
