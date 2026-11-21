import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  ArrowRight,
  CalendarCheck2,
  MessageCircle,
  ShieldCheck,
  Stethoscope,
  User,
} from 'lucide-react';
import { AppointmentTypesBar } from './components/AppointmentTypesBar';
import { AppointmentsSection } from './components/AppointmentsSection';
import { AuthModal } from './components/AuthModal';
import { BookingWizard } from './components/BookingWizard';
import { ClinicViewport3D } from './components/ClinicViewport3D';
import { DoctorsSection } from './components/DoctorsSection';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { PatientDoubtsSection } from './components/PatientDoubtsSection';
import { SessionModal } from './components/SessionModal';
import { WhatsAppQuickChat } from './components/WhatsAppQuickChat';
import { DOCTOR_EMAIL, PRIMARY_DOCTOR } from './data/clinicData';
import { auth, googleProvider, testFirestoreConnection } from './lib/firebase';
import {
  cancelAppointmentInFirestore,
  createAppointmentInFirestore,
  createPatientDoubtInFirestore,
  doctorUpdateAppointmentInFirestore,
  resolveEffectiveRole,
  subscribeAppointments,
  subscribeBookedSlots,
  subscribePatientDoubts,
  syncUserProfile,
  verifyPatientDoubtInFirestore,
} from './services/clinicService';
import type {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  BookedSlot,
  BookingFormInput,
  ClinicUserProfile,
  ClinicZoneId,
  PatientDoubt,
  PatientDoubtInput,
  UserRole,
} from './types/clinic';

export default function App() {
  const [activeZone, setActiveZone] = useState<ClinicZoneId>('overview');
  const [selectedType, setSelectedType] = useState<AppointmentType>('clinic');

  const [user, setUser] = useState<ClinicUserProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [doubts, setDoubts] = useState<PatientDoubt[]>([]);
  const [activeSession, setActiveSession] = useState<Appointment | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<UserRole>('patient');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [isSubmittingDoubt, setIsSubmittingDoubt] = useState(false);
  const [isSavingSession, setIsSavingSession] = useState(false);

  const bookingRef = useRef<HTMLElement | null>(null);
  const appointmentsRef = useRef<HTMLDivElement | null>(null);
  const doubtsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void testFirestoreConnection();

    let unsubscribeAppointments: (() => void) | null = null;
    let unsubscribeBookedSlots: (() => void) | null = null;
    let unsubscribeDoubts: (() => void) | null = null;
    let active = true;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeAppointments) {
        unsubscribeAppointments();
        unsubscribeAppointments = null;
      }
      if (unsubscribeBookedSlots) {
        unsubscribeBookedSlots();
        unsubscribeBookedSlots = null;
      }
      if (unsubscribeDoubts) {
        unsubscribeDoubts();
        unsubscribeDoubts = null;
      }

      if (!firebaseUser) {
        if (active) {
          setUser(null);
          setAppointments([]);
          setBookedSlots([]);
          setDoubts([]);
        }
        return;
      }

      let profile: ClinicUserProfile;
      try {
        profile = await syncUserProfile(firebaseUser);
      } catch {
        profile = {
          uid: firebaseUser.uid,
          displayName: (firebaseUser.displayName || 'Clinic Guest').slice(0, 100),
          email: (firebaseUser.email || '').slice(0, 160),
          photoURL: firebaseUser.photoURL || undefined,
          role: resolveEffectiveRole(firebaseUser.email),
        };
      }

      if (!active) return;
      setUser(profile);

      unsubscribeAppointments = subscribeAppointments(profile, (items) => {
        if (active) setAppointments(items);
      });

      unsubscribeBookedSlots = subscribeBookedSlots((slots) => {
        if (active) setBookedSlots(slots);
      });

      unsubscribeDoubts = subscribePatientDoubts(profile, (items) => {
        if (active) setDoubts(items);
      });
    });

    return () => {
      active = false;
      unsubscribeAuth();
      if (unsubscribeAppointments) unsubscribeAppointments();
      if (unsubscribeBookedSlots) unsubscribeBookedSlots();
      if (unsubscribeDoubts) unsubscribeDoubts();
    };
  }, []);

  const scrollToBooking = () => {
    bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToAppointments = () => {
    appointmentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToDoubts = () => {
    doubtsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openAuthModal = (role: UserRole = 'patient') => {
    setAuthModalRole(role);
    setAuthNotice(null);
    setAuthModalOpen(true);
  };

  const handleSignInWithGoogle = async (intendedRole: UserRole) => {
    setIsSigningIn(true);
    setAuthNotice(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const effectiveRole = resolveEffectiveRole(result.user.email);

      if (intendedRole === 'doctor' && effectiveRole !== 'doctor') {
        setAuthNotice(
          `Signed in as ${result.user.email ?? 'patient account'} in the Pet Owner Portal. Doctor Console access requires ${DOCTOR_EMAIL}.`,
        );
        return;
      }

      setAuthModalOpen(false);
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code?: unknown }).code)
          : '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setAuthNotice('Google Sign-In was closed before finishing. Please try again.');
      } else {
        setAuthNotice('Unable to complete Google Sign-In right now. Please try again.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setActiveSession(null);
  };

  const handleBookFromZone = (type: AppointmentType) => {
    setSelectedType(type);
    scrollToBooking();
  };

  const handleCreateAppointment = async (
    input: BookingFormInput,
  ): Promise<Appointment> => {
    if (!user) {
      openAuthModal('patient');
      throw new Error('Authentication required');
    }
    setIsSubmittingBooking(true);
    try {
      return await createAppointmentInFirestore(user.uid, input, appointments);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleCreateDoubt = async (
    input: PatientDoubtInput,
  ): Promise<PatientDoubt> => {
    if (!user) {
      openAuthModal('patient');
      throw new Error('Authentication required');
    }
    setIsSubmittingDoubt(true);
    try {
      return await createPatientDoubtInFirestore(user.uid, input, doubts.length);
    } finally {
      setIsSubmittingDoubt(false);
    }
  };

  const handleVerifyDoubt = async (doubtId: string, doctorReply: string) => {
    await verifyPatientDoubtInFirestore(doubtId, doctorReply);
  };

  const handleCancelAppointment = async (appointment: Appointment) => {
    await cancelAppointmentInFirestore(appointment);
  };

  const handleDoctorUpdate = async (
    appointment: Appointment,
    status: AppointmentStatus,
    doctorNotes: string,
  ) => {
    setIsSavingSession(true);
    try {
      await doctorUpdateAppointmentInFirestore(appointment, status, doctorNotes);
      setActiveSession(null);
    } finally {
      setIsSavingSession(false);
    }
  };

  const upcomingCount = appointments.filter((item) => item.status === 'upcoming').length;

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F5F7FB] text-slate-900">
      <Navbar
        user={user}
        onOpenAuth={() => openAuthModal('patient')}
        onSignOut={handleSignOut}
      />

      <main className="flex-1">
        {/* Hero & Interactive 3D Clinic Tour */}
        <section
          id="clinic-tour"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-7">
            <div className="lg:col-span-7">
              <p className="text-xs font-semibold text-blue-700 tracking-wide">
                {PRIMARY_DOCTOR.clinicName} · Dedicated Single-Doctor Care
              </p>
              <h1 className="mt-2 font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-slate-900 leading-[1.12] text-balance">
                Tour Our 3D Veterinary Pavilion &amp; Book Directly with {PRIMARY_DOCTOR.name}
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                Inspect our reception lounge, surgical exam suite, imaging bay, and comfort recovery area in real-time 3D. Sign in as a Pet Owner or Doctor to book visits or verify patient doubts on WhatsApp.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={scrollToBooking}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Book with Dr. Elena
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
                {user ? (
                  <button
                    type="button"
                    onClick={scrollToAppointments}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <CalendarCheck2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                    {user.role === 'doctor' ? 'Open Doctor Queue' : 'View My Appointments'}
                    <span className="font-mono-tabular text-blue-700">({upcomingCount})</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAuthModal('patient')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <User className="w-4 h-4 text-blue-600" aria-hidden="true" />
                    Patient &amp; Doctor Login
                  </button>
                )}
                <button
                  type="button"
                  onClick={scrollToDoubts}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                  WhatsApp &amp; Verify Doubts
                </button>
              </div>
            </div>

            {/* Clean Typographic Clinic Highlights */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 grid grid-cols-3 gap-3 sm:gap-4 divide-x divide-slate-100">
              <div>
                <span className="font-mono-tabular text-lg sm:text-xl font-bold text-slate-900 block whitespace-nowrap">
                  {PRIMARY_DOCTOR.rating.toFixed(1)} ★
                </span>
                <span className="mt-1 text-xs font-semibold text-slate-800 block">
                  Single Vet
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {PRIMARY_DOCTOR.name}
                </span>
              </div>
              <div className="pl-3 sm:pl-4">
                <span className="font-mono-tabular text-lg sm:text-xl font-bold text-blue-600 block whitespace-nowrap">
                  5 Modes
                </span>
                <span className="mt-1 text-xs font-semibold text-slate-800 block">
                  Flexible Care
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Clinic to WhatsApp
                </span>
              </div>
              <div className="pl-3 sm:pl-4">
                <span className="font-mono-tabular text-lg sm:text-xl font-bold text-emerald-700 block whitespace-nowrap">
                  &lt; 15m
                </span>
                <span className="mt-1 text-xs font-semibold text-slate-800 block">
                  Diagnostics
                </span>
                <span className="text-[11px] text-slate-500 block">
                  In-House Lab
                </span>
              </div>
            </div>
          </div>

          {/* Active Portal Bar when Signed In */}
          {user && (
            <div className="mb-5 bg-white border border-slate-200 rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    user.role === 'doctor'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {user.role === 'doctor' ? (
                    <Stethoscope className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user.role === 'doctor'
                      ? 'Doctor Schedule Console Active'
                      : 'Pet Owner Portal Active'}{' '}
                    · {user.displayName}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {user.email} · {upcomingCount} upcoming visit
                    {upcomingCount === 1 ? '' : 's'} synced live
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={scrollToAppointments}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap cursor-pointer"
              >
                {user.role === 'doctor' ? 'Manage Queue →' : 'View My Visits →'}
              </button>
            </div>
          )}

          <ClinicViewport3D
            activeZone={activeZone}
            onSelectZone={setActiveZone}
            onBookZone={handleBookFromZone}
          />
        </section>

        {/* Appointment Types & Single-Doctor Interactive Booking Section */}
        <section
          id="book-appointment"
          ref={bookingRef}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6"
        >
          <AppointmentTypesBar
            selectedType={selectedType}
            onSelectType={setSelectedType}
          />

          <BookingWizard
            user={user}
            selectedType={selectedType}
            onSelectType={setSelectedType}
            appointments={appointments}
            bookedSlots={bookedSlots}
            isSubmitting={isSubmittingBooking}
            onCreateAppointment={handleCreateAppointment}
            onOpenAuth={openAuthModal}
            onViewAppointments={scrollToAppointments}
          />
        </section>

        {/* Appointments Queue & Weekly Overview */}
        <div ref={appointmentsRef}>
          <AppointmentsSection
            user={user}
            appointments={appointments}
            onStartSession={setActiveSession}
            onCancelAppointment={handleCancelAppointment}
            onOpenAuth={openAuthModal}
          />
        </div>

        {/* WhatsApp Chat & Doctor Doubt Verification */}
        <div ref={doubtsRef}>
          <PatientDoubtsSection
            user={user}
            doubts={doubts}
            isSubmitting={isSubmittingDoubt}
            onCreateDoubt={handleCreateDoubt}
            onVerifyDoubt={handleVerifyDoubt}
            onOpenAuth={openAuthModal}
          />
        </div>

        {/* Dedicated Veterinarian Spotlight */}
        <DoctorsSection onBookWithDoctor={scrollToBooking} />
      </main>

      <Footer />

      <WhatsAppQuickChat onJumpToDoubts={scrollToDoubts} />

      <AuthModal
        isOpen={authModalOpen}
        initialRole={authModalRole}
        isSigningIn={isSigningIn}
        authNotice={authNotice}
        onClose={() => setAuthModalOpen(false)}
        onSignInWithGoogle={handleSignInWithGoogle}
      />

      <SessionModal
        appointment={activeSession}
        userRole={user?.role ?? 'patient'}
        isSaving={isSavingSession}
        onClose={() => setActiveSession(null)}
        onDoctorUpdate={handleDoctorUpdate}
      />
    </div>
  );
}
