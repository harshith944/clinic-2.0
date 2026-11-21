import { useState } from 'react';
import {
  Calendar,
  Eye,
  Lock,
  Mail,
  MapPin,
  Phone,
  Stethoscope,
  User,
  Video,
  X,
} from 'lucide-react';
import { BASE_WEEKLY_METRICS, PRIMARY_DOCTOR } from '../data/clinicData';
import type {
  Appointment,
  AppointmentStatus,
  ClinicUserProfile,
  UserRole,
} from '../types/clinic';
import {
  computeWeeklyOverview,
  filterAppointments,
  formatDisplayDate,
  getAppointmentTypeLabel,
} from '../utils/appointments';

interface AppointmentsSectionProps {
  user: ClinicUserProfile | null;
  appointments: Appointment[];
  onStartSession: (appointment: Appointment) => void;
  onCancelAppointment: (appointment: Appointment) => void;
  onOpenAuth: (role: UserRole) => void;
}

export function AppointmentsSection({
  user,
  appointments,
  onStartSession,
  onCancelAppointment,
  onOpenAuth,
}: AppointmentsSectionProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>('all');
  const [chartTab, setChartTab] = useState<'appointments' | 'revenue'>('appointments');
  const [failedAvatars, setFailedAvatars] = useState<Record<string, boolean>>({});

  const visibleAppointments = filterAppointments(appointments, statusFilter);
  const weeklyData = computeWeeklyOverview(BASE_WEEKLY_METRICS, appointments);

  const maxMetricValue = Math.max(
    ...weeklyData.map((d) => (chartTab === 'appointments' ? d.appointments : d.revenue)),
    1,
  );

  const totalWeeklyAppointments = weeklyData.reduce(
    (sum, item) => sum + item.appointments,
    0,
  );
  const totalWeeklyRevenue = weeklyData.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <section
      id="appointments"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-slate-200"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-blue-700">
            {user?.role === 'doctor'
              ? 'Doctor Portal · Dr. Elena Vance'
              : user
                ? 'Patient Portal · Your Pet Visits'
                : 'Patient & Doctor Workspace'}
          </p>
          <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {user?.role === 'doctor'
              ? 'Clinic Appointment Queue'
              : 'Appointments & Visit Schedule'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {user?.role === 'doctor'
              ? 'Review all incoming patient bookings, record clinical notes, and mark visits complete.'
              : 'Manage upcoming consultations with Dr. Elena Vance and track clinic availability.'}
          </p>
        </div>

        {/* Interactive Filter Segmented Control */}
        <div
          role="tablist"
          aria-label="Filter appointments by status"
          className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl self-start sm:self-auto"
        >
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' },
            ] as const
          ).map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Sign-In Gate when logged out, or live Firestore Appointments when signed in */}
        <div className="lg:col-span-8 flex flex-col gap-4" data-testid="appointments-list">
          {!user ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Lock className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-slate-900">
                Sign In to Access Appointments
              </h3>
              <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                Pet owners sign in to view and manage their scheduled visits. Dr. Elena Vance signs in to the Doctor Portal to manage the full clinic queue.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onOpenAuth('patient')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4" aria-hidden="true" />
                  Patient Login
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('doctor')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  <Stethoscope className="w-4 h-4 text-amber-600" aria-hidden="true" />
                  Doctor Login
                </button>
              </div>
            </div>
          ) : visibleAppointments.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
              <p className="text-sm font-semibold text-slate-900">
                No {statusFilter === 'all' ? '' : statusFilter} appointments found
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {user.role === 'doctor'
                  ? 'New patient bookings with Dr. Elena Vance will appear here automatically.'
                  : 'Use the booking form above to schedule your first visit with Dr. Elena Vance.'}
              </p>
            </div>
          ) : (
            visibleAppointments.map((apt) => {
              const avatarFailed = !apt.avatarUrl || failedAvatars[apt.id];

              const statusColor =
                apt.status === 'upcoming'
                  ? 'text-amber-700'
                  : apt.status === 'completed'
                    ? 'text-emerald-700'
                    : 'text-slate-500';

              const statusLabel =
                apt.status === 'upcoming'
                  ? 'Upcoming'
                  : apt.status === 'completed'
                    ? 'Completed'
                    : 'Cancelled';

              return (
                <article
                  key={apt.id}
                  data-testid={`appointment-card-${apt.id}`}
                  className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {avatarFailed ? (
                        <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                          <User className="w-6 h-6" aria-hidden="true" />
                        </div>
                      ) : (
                        <img
                          src={apt.avatarUrl}
                          alt={`${apt.ownerName} and ${apt.petName}`}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setFailedAvatars((prev) => ({ ...prev, [apt.id]: true }))
                          }
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                        />
                      )}

                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono-tabular font-semibold text-blue-600">
                            #{apt.id}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{apt.patientTag}</span>
                          <span aria-hidden="true">·</span>
                          <span className={`font-semibold ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </div>

                        <h3 className="mt-1 text-base font-bold text-slate-900">
                          {apt.ownerName}{' '}
                          <span className="font-normal text-slate-500">
                            ({apt.petName} · {apt.petSpecies})
                          </span>
                        </h3>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                            {apt.email}
                          </span>
                          <span className="inline-flex items-center gap-1 font-mono-tabular">
                            <Phone className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                            {apt.phone}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[11px] text-slate-400 block">
                          Type of Appointment
                        </span>
                        <span className="text-xs font-semibold text-emerald-700">
                          {getAppointmentTypeLabel(apt.appointmentType)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">
                          Consultation Fees
                        </span>
                        <span className="text-sm font-bold font-mono-tabular text-slate-900">
                          ${apt.fee}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Metadata Strip & Primary Actions */}
                  <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    <div className="sm:col-span-9 grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                      <div className="sm:col-span-5">
                        <span className="text-slate-400 block">Date &amp; Time</span>
                        <span className="mt-0.5 inline-flex items-center gap-1 font-semibold text-slate-800 font-mono-tabular whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                          {formatDisplayDate(apt.date)} · {apt.time}
                        </span>
                      </div>
                      <div className="sm:col-span-4">
                        <span className="text-slate-400 block">Clinic &amp; Doctor</span>
                        <span className="mt-0.5 inline-flex items-center gap-1 font-semibold text-slate-800 truncate max-w-full">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                          <span className="truncate">{PRIMARY_DOCTOR.clinicName}</span>
                        </span>
                        <span className="block text-[11px] text-slate-500 truncate">
                          {PRIMARY_DOCTOR.name}
                        </span>
                      </div>
                      <div className="sm:col-span-3">
                        <span className="text-slate-400 block">Visit Type</span>
                        <span className="mt-0.5 font-semibold text-slate-800 block truncate">
                          {apt.visitType}
                        </span>
                      </div>
                    </div>

                    <div className="sm:col-span-3 flex items-center justify-end gap-2">
                      {apt.status === 'upcoming' && (
                        <>
                          <button
                            type="button"
                            onClick={() => onCancelAppointment(apt)}
                            aria-label={`Cancel appointment ${apt.id}`}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onStartSession(apt)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            {apt.appointmentType === 'video' && (
                              <Video className="w-3.5 h-3.5" aria-hidden="true" />
                            )}
                            {user.role === 'doctor' ? 'Manage Visit' : 'Start Session'}
                          </button>
                        </>
                      )}

                      {apt.status !== 'upcoming' && (
                        <button
                          type="button"
                          onClick={() => onStartSession(apt)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          View Summary
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Right 4 Cols: Dribbble-Inspired Weekly Overview Card */}
        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Weekly Overview</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {PRIMARY_DOCTOR.name} · Nov 20 – Nov 26
              </p>
            </div>
            <span className="text-xs font-mono-tabular font-semibold text-blue-700">
              {chartTab === 'appointments'
                ? `${totalWeeklyAppointments} visits`
                : `$${totalWeeklyRevenue.toLocaleString()}`}
            </span>
          </div>

          <div
            role="tablist"
            aria-label="Weekly metric view"
            className="mt-4 flex items-center gap-4 border-b border-slate-200 text-xs font-semibold"
          >
            <button
              type="button"
              role="tab"
              aria-selected={chartTab === 'appointments'}
              onClick={() => setChartTab('appointments')}
              className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
                chartTab === 'appointments'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Appointments
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={chartTab === 'revenue'}
              onClick={() => setChartTab('revenue')}
              className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
                chartTab === 'revenue'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Revenue
            </button>
          </div>

          {/* M-S Bar Chart */}
          <div className="mt-6 h-52 flex items-end justify-between gap-2.5 px-1">
            {weeklyData.map((item, idx) => {
              const value =
                chartTab === 'appointments' ? item.appointments : item.revenue;
              const pct = Math.max(14, Math.round((value / maxMetricValue) * 100));
              const isPeak = Boolean(item.isHighlight);

              return (
                <div
                  key={`${item.day}-${idx}`}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                >
                  <span className="text-[11px] font-mono-tabular font-semibold text-slate-700">
                    {chartTab === 'appointments' ? value : `$${value}`}
                  </span>
                  <div className="w-full max-w-[26px] flex-1 flex items-end">
                    <div
                      title={`${item.fullDay}: ${
                        chartTab === 'appointments'
                          ? `${value} appointments`
                          : `$${value}`
                      }`}
                      style={{ height: `${pct}%` }}
                      className={`w-full rounded-t-lg transition-all duration-200 ${
                        isPeak ? 'bg-amber-400' : 'bg-blue-600'
                      }`}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Thursday peak capacity</span>
            <span className="font-semibold text-amber-700">High Demand</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
