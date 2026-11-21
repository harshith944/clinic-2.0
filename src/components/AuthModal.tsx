import { useEffect, useState } from 'react';
import { ShieldCheck, Stethoscope, User, X } from 'lucide-react';
import { DOCTOR_EMAIL } from '../data/clinicData';
import type { UserRole } from '../types/clinic';
import { ClinicLogo } from './ClinicLogo';

interface AuthModalProps {
  isOpen: boolean;
  initialRole: UserRole;
  isSigningIn: boolean;
  authNotice: string | null;
  onClose: () => void;
  onSignInWithGoogle: (intendedRole: UserRole) => Promise<void>;
}

export function AuthModal({
  isOpen,
  initialRole,
  isSigningIn,
  authNotice,
  onClose,
  onSignInWithGoogle,
}: AuthModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);

  useEffect(() => {
    setSelectedRole(initialRole);
  }, [initialRole, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <ClinicLogo showText={false} size="sm" />
              <p className="text-xs font-semibold text-blue-700">
                Ajith Clinic Secure Portal
              </p>
            </div>
            <h2
              id="auth-modal-title"
              className="mt-2 font-display text-2xl font-bold text-slate-900"
            >
              Sign In to Your Clinic Account
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-600 leading-relaxed">
          Choose whether you are signing in as a pet owner booking with Dr. Elena Vance or accessing the Doctor Schedule Console.
        </p>

        {/* Role Selector Cards */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSelectedRole('patient')}
            aria-pressed={selectedRole === 'patient'}
            className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
              selectedRole === 'patient'
                ? 'border-blue-600 bg-blue-50/70'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <User className="w-4 h-4" aria-hidden="true" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900">
              Pet Owner Login
            </h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Book clinic, video, or home visits and manage your pet’s upcoming schedule.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('doctor')}
            aria-pressed={selectedRole === 'doctor'}
            className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
              selectedRole === 'doctor'
                ? 'border-blue-600 bg-blue-50/70'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" aria-hidden="true" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900">
              Doctor Portal Login
            </h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Manage all patient bookings, record clinical notes, and complete consultations.
            </p>
          </button>
        </div>

        {selectedRole === 'doctor' && (
          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Doctor workspace access is restricted to verified clinic email{' '}
              <span className="font-mono-tabular font-semibold text-slate-900">
                {DOCTOR_EMAIL}
              </span>
              . Other Google accounts automatically sign into the Patient Portal.
            </span>
          </div>
        )}

        {authNotice && (
          <div
            role="alert"
            className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-medium text-amber-900"
          >
            {authNotice}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            disabled={isSigningIn}
            onClick={() => onSignInWithGoogle(selectedRole)}
            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
          >
            {isSigningIn
              ? 'Connecting Google Sign-In…'
              : selectedRole === 'doctor'
                ? 'Continue to Doctor Portal with Google'
                : 'Continue as Pet Owner with Google'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Continue Browsing 3D Clinic Tour
          </button>
        </div>
      </div>
    </div>
  );
}
