import { useState } from 'react';
import { Award, CalendarCheck, MapPin, Stethoscope } from 'lucide-react';
import { PRIMARY_DOCTOR } from '../data/clinicData';

interface DoctorsSectionProps {
  onBookWithDoctor: () => void;
}

export function DoctorsSection({ onBookWithDoctor }: DoctorsSectionProps) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <section
      id="veterinarians"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-slate-200"
    >
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Left Portrait */}
        <div className="lg:col-span-5 bg-slate-100 min-h-[320px]">
          {imgFailed ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 text-blue-700 p-8">
              <Stethoscope className="w-12 h-12 mb-3" aria-hidden="true" />
              <span className="font-display text-lg font-bold">
                {PRIMARY_DOCTOR.name}
              </span>
            </div>
          ) : (
            <img
              src={PRIMARY_DOCTOR.avatarUrl}
              alt={`${PRIMARY_DOCTOR.name}, ${PRIMARY_DOCTOR.specialty}`}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Right Profile & Single-Doctor Care Standards */}
        <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-blue-700">
                Lead Clinic Veterinarian · Single-Doctor Practice
              </span>
              <span className="font-mono-tabular font-semibold text-amber-600">
                {PRIMARY_DOCTOR.rating.toFixed(1)} ★ Patient Satisfaction
              </span>
            </div>

            <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {PRIMARY_DOCTOR.name}, {PRIMARY_DOCTOR.credentials}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-600">
              {PRIMARY_DOCTOR.specialty} · {PRIMARY_DOCTOR.experienceYears} Years Clinical Experience
            </p>
            <p className="mt-4 text-sm text-slate-600 leading-relaxed max-w-2xl">
              {PRIMARY_DOCTOR.bio} Whether you visit our sunlit Austin pavilion in person or connect over a live video triage call, every chart, ultrasound scan, and follow-up stays directly with Dr. Vance.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-100 text-xs">
              <div className="flex items-start gap-2.5">
                <Award className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="font-semibold text-slate-900 block">
                    Fear-Free Certified
                  </span>
                  <span className="text-slate-500">Calm handling &amp; low-stress rooms</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CalendarCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="font-semibold text-slate-900 block">
                    6 Days a Week
                  </span>
                  <span className="text-slate-500">{PRIMARY_DOCTOR.availableDays.join(' · ')}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="font-semibold text-slate-900 block">
                    {PRIMARY_DOCTOR.clinicName}
                  </span>
                  <span className="text-slate-500">Austin, TX · Step-free entry</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs font-medium text-emerald-700">
              Accepting new dogs &amp; cats for clinic, video, and home visits
            </span>
            <button
              type="button"
              onClick={onBookWithDoctor}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Book with Dr. Elena Vance
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
