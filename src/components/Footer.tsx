import { PRIMARY_DOCTOR } from '../data/clinicData';
import { ClinicLogo } from './ClinicLogo';

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <ClinicLogo size="sm" />
          <p className="mt-2 text-xs text-slate-500">
            {PRIMARY_DOCTOR.clinicAddress} · {PRIMARY_DOCTOR.clinicHours}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-600">
          <a href="#clinic-tour" className="hover:text-blue-600 transition-colors">
            3D Clinic Tour
          </a>
          <a href="#book-appointment" className="hover:text-blue-600 transition-colors">
            Book Appointment
          </a>
          <a href="#appointments" className="hover:text-blue-600 transition-colors">
            Appointments
          </a>
          <a href="#whatsapp-doubts" className="hover:text-blue-600 transition-colors">
            WhatsApp &amp; Doubts
          </a>
          <a href="#veterinarians" className="hover:text-blue-600 transition-colors">
            {PRIMARY_DOCTOR.name}
          </a>
        </div>

        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} Ajith Clinic. Dedicated Single-Doctor Veterinary Care.
        </p>
      </div>
    </footer>
  );
}
