import { useState } from 'react';
import { LogOut, Menu, Stethoscope, User, X } from 'lucide-react';
import type { ClinicUserProfile } from '../types/clinic';

interface NavbarProps {
  user: ClinicUserProfile | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export function Navbar({ user, onOpenAuth, onSignOut }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          CityVet
        </a>

        {/* Zone 2: 4 concise single-line nav links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          <a
            href="#clinic-tour"
            className="hover:text-blue-600 transition-colors whitespace-nowrap shrink-0"
          >
            3D Clinic Tour
          </a>
          <a
            href="#book-appointment"
            className="hover:text-blue-600 transition-colors whitespace-nowrap shrink-0"
          >
            Book Appointment
          </a>
          <a
            href="#appointments"
            className="hover:text-blue-600 transition-colors whitespace-nowrap shrink-0"
          >
            {user?.role === 'doctor' ? 'Doctor Schedule' : 'My Visits'}
          </a>
          <a
            href="#veterinarians"
            className="hover:text-blue-600 transition-colors whitespace-nowrap shrink-0"
          >
            Dr. Elena Vance
          </a>
        </nav>

        {/* Zone 3: 1 primary auth action */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <button
              type="button"
              onClick={onSignOut}
              aria-label={`Sign out ${user.displayName}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {user.role === 'doctor' ? (
                <Stethoscope className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
              ) : (
                <User className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
              )}
              <span className="max-w-[140px] truncate">
                {user.role === 'doctor' ? 'Dr. Portal' : user.displayName}
              </span>
              <LogOut className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Patient &amp; Doctor Login
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-2 text-sm font-medium text-slate-700"
        >
          <a
            href="#clinic-tour"
            onClick={() => setMobileOpen(false)}
            className="py-2 px-2 rounded-lg hover:bg-slate-50"
          >
            3D Clinic Tour
          </a>
          <a
            href="#book-appointment"
            onClick={() => setMobileOpen(false)}
            className="py-2 px-2 rounded-lg hover:bg-slate-50"
          >
            Book Appointment
          </a>
          <a
            href="#appointments"
            onClick={() => setMobileOpen(false)}
            className="py-2 px-2 rounded-lg hover:bg-slate-50"
          >
            {user?.role === 'doctor' ? 'Doctor Schedule' : 'My Visits'}
          </a>
          <a
            href="#veterinarians"
            onClick={() => setMobileOpen(false)}
            className="py-2 px-2 rounded-lg hover:bg-slate-50"
          >
            Dr. Elena Vance
          </a>
        </nav>
      )}
    </header>
  );
}
