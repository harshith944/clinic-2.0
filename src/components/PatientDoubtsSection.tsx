import { useEffect, useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageCircle,
  Send,
  ShieldCheck,
  Stethoscope,
  User,
} from 'lucide-react';
import {
  CLINIC_WHATSAPP_DISPLAY,
  DOUBT_TOPICS,
  PRIMARY_DOCTOR,
} from '../data/clinicData';
import type {
  ClinicUserProfile,
  DoubtStatus,
  PatientDoubt,
  PatientDoubtInput,
  PatientDoubtValidationErrors,
  UserRole,
} from '../types/clinic';
import {
  buildPatientDoubtWhatsAppMessage,
  buildVerifiedReplyWhatsAppMessage,
  buildWhatsAppChatUrl,
  validatePatientDoubtForm,
} from '../utils/whatsapp';

interface PatientDoubtsSectionProps {
  user: ClinicUserProfile | null;
  doubts: PatientDoubt[];
  isSubmitting: boolean;
  onCreateDoubt: (input: PatientDoubtInput) => Promise<PatientDoubt>;
  onVerifyDoubt: (doubtId: string, doctorReply: string) => Promise<void>;
  onOpenAuth: (role: UserRole) => void;
}

export function PatientDoubtsSection({
  user,
  doubts,
  isSubmitting,
  onCreateDoubt,
  onVerifyDoubt,
  onOpenAuth,
}: PatientDoubtsSectionProps) {
  const [patientName, setPatientName] = useState(user?.displayName ?? '');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [petName, setPetName] = useState('');
  const [topic, setTopic] = useState(DOUBT_TOPICS[0]);
  const [question, setQuestion] = useState('');
  const [errors, setErrors] = useState<PatientDoubtValidationErrors>({});
  const [submitBanner, setSubmitBanner] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | DoubtStatus>('all');
  const [doctorDrafts, setDoctorDrafts] = useState<Record<string, string>>({});
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setPatientName((prev) => prev || user.displayName);
    }
  }, [user]);

  const clearError = (field: keyof PatientDoubtValidationErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (submitBanner) setSubmitBanner(null);
  };

  const liveWhatsAppUrl = buildWhatsAppChatUrl(
    buildPatientDoubtWhatsAppMessage({
      patientName,
      petName,
      topic,
      question,
    }),
  );

  const handleSubmitDoubt = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitBanner(null);

    const payload: PatientDoubtInput = {
      patientName,
      whatsappPhone,
      petName,
      topic,
      question,
    };

    const validation = validatePatientDoubtForm(payload);
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
      await onCreateDoubt(payload);
      setQuestion('');
      setPetName('');
      setSubmitBanner(
        'Your question was saved for Dr. Elena Vance to verify. You can also send it directly on WhatsApp below.',
      );
    } catch {
      setSubmitBanner(
        'Unable to submit your question right now. Please try again or message us directly on WhatsApp.',
      );
    }
  };

  const handleVerifySubmit = async (doubt: PatientDoubt) => {
    const reply = (doctorDrafts[doubt.id] ?? doubt.doctorReply ?? '').trim();
    if (reply.length < 3) return;
    setVerifyingId(doubt.id);
    try {
      await onVerifyDoubt(doubt.id, reply);
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredDoubts =
    filterTab === 'all'
      ? doubts
      : doubts.filter((item) => item.status === filterTab);

  return (
    <section
      id="whatsapp-doubts"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-slate-200"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-emerald-700">
            WhatsApp Triage &amp; Doubt Verification · {PRIMARY_DOCTOR.clinicName}
          </p>
          <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            WhatsApp Chat &amp; Verify Patient Doubts
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">
            Ask Dr. Elena Vance any pet care, vaccination, or dosage doubt in-app for verified clinical review—or chat live with Ajith Clinic on WhatsApp at{' '}
            <span className="font-mono-tabular font-semibold text-slate-800">
              {CLINIC_WHATSAPP_DISPLAY}
            </span>
            .
          </p>
        </div>

        <a
          href={buildWhatsAppChatUrl(
            `Hello ${PRIMARY_DOCTOR.clinicName} (${PRIMARY_DOCTOR.name}), I would like to chat about my pet's care.`,
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <MessageCircle className="w-4 h-4" aria-hidden="true" />
          Open Clinic WhatsApp
          <ExternalLink className="w-3.5 h-3.5 opacity-80" aria-hidden="true" />
        </a>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: Doubt Composer + Instant WhatsApp Bridge */}
        <form
          onSubmit={handleSubmitDoubt}
          noValidate
          className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Ask &amp; Verify a Patient Doubt
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified directly by {PRIMARY_DOCTOR.name}
              </p>
            </div>
            <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
          </div>

          {submitBanner && (
            <div
              role="status"
              className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-900"
            >
              {submitBanner}
            </div>
          )}

          {/* Quick Care Topics */}
          <div className="mt-4">
            <span className="block text-xs font-semibold text-slate-700 mb-2">
              Care Topic
            </span>
            <div className="flex flex-wrap gap-1.5">
              {DOUBT_TOPICS.map((item) => {
                const active = topic === item;
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setTopic(item);
                      clearError('topic');
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      active
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="doubt-owner-name"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Your Name
              </label>
              <input
                id="doubt-owner-name"
                type="text"
                placeholder="e.g. Kelly Joseph"
                value={patientName}
                onChange={(e) => {
                  setPatientName(e.target.value);
                  clearError('patientName');
                }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
              {errors.patientName && (
                <p className="mt-1 text-xs text-red-600">{errors.patientName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="doubt-pet-name"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Pet Name
              </label>
              <input
                id="doubt-pet-name"
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
          </div>

          <div className="mt-3.5">
            <label
              htmlFor="doubt-whatsapp-phone"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              WhatsApp Number (for verified clinic reply)
            </label>
            <input
              id="doubt-whatsapp-phone"
              type="tel"
              placeholder="+1 512 555 0140"
              value={whatsappPhone}
              onChange={(e) => {
                setWhatsappPhone(e.target.value);
                clearError('whatsappPhone');
              }}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
            />
            {errors.whatsappPhone && (
              <p className="mt-1 text-xs text-red-600">{errors.whatsappPhone}</p>
            )}
          </div>

          <div className="mt-3.5">
            <label
              htmlFor="doubt-question"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Patient Doubt / Question
            </label>
            <textarea
              id="doubt-question"
              rows={3}
              placeholder="e.g. Can Barnaby eat breakfast before his 10 AM vaccination checkup?"
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                clearError('question');
              }}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 resize-none"
            />
            {errors.question && (
              <p className="mt-1 text-xs text-red-600">{errors.question}</p>
            )}
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
              {isSubmitting
                ? 'Submitting…'
                : user
                  ? 'Submit for Doctor Review'
                  : 'Sign In & Submit Doubt'}
            </button>

            <a
              href={liveWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              Send via WhatsApp
            </a>
          </div>
        </form>

        {/* Right 7 Cols: Doctor Verification Queue / Patient Doubt History */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {user?.role === 'doctor'
                  ? 'Doctor Verification Queue'
                  : 'Verified Patient Doubts & Responses'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {user?.role === 'doctor'
                  ? 'Verify incoming patient doubts and send one-click clinical replies on WhatsApp.'
                  : 'Track questions verified by Dr. Elena Vance and continue chatting on WhatsApp.'}
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Filter patient doubts"
              className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl"
            >
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'verified', label: 'Verified' },
                ] as const
              ).map((tab) => {
                const active = filterTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilterTab(tab.id)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
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

          {!user ? (
            <div className="py-10 px-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" aria-hidden="true" />
              </div>
              <h4 className="mt-4 font-display text-lg font-bold text-slate-900">
                Sign In to Track &amp; Verify Patient Doubts
              </h4>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Patients sign in to view verified clinical answers from Dr. Elena Vance. Dr. Elena signs into the Doctor Portal to verify doubts and send replies on WhatsApp.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onOpenAuth('patient')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" aria-hidden="true" />
                  Patient Login
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('doctor')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl cursor-pointer"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                  Doctor Login
                </button>
              </div>
            </div>
          ) : filteredDoubts.length === 0 ? (
            <div className="py-10 px-4 text-center">
              <p className="text-sm font-semibold text-slate-900">
                No {filterTab === 'all' ? '' : filterTab} patient doubts yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {user.role === 'doctor'
                  ? 'New patient questions submitted in-app will appear here for clinical verification.'
                  : 'Submit a care question on the left or message Ajith Clinic directly on WhatsApp.'}
              </p>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3.5" data-testid="patient-doubts-list">
              {filteredDoubts.map((doubt) => {
                const isVerified = doubt.status === 'verified';
                const draftText = doctorDrafts[doubt.id] ?? doubt.doctorReply ?? '';
                const patientWhatsAppFollowup = buildWhatsAppChatUrl(
                  isVerified && doubt.doctorReply
                    ? buildVerifiedReplyWhatsAppMessage({
                        patientName: doubt.patientName,
                        petName: doubt.petName,
                        topic: doubt.topic,
                        question: doubt.question,
                        doctorReply: doubt.doctorReply,
                      })
                    : buildPatientDoubtWhatsAppMessage({
                        patientName: doubt.patientName,
                        petName: doubt.petName,
                        topic: doubt.topic,
                        question: doubt.question,
                      }),
                  user.role === 'doctor' ? doubt.whatsappPhone : undefined,
                );

                return (
                  <article
                    key={doubt.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2 text-slate-600">
                        <span className="font-mono-tabular font-semibold text-blue-700">
                          #{doubt.id}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-slate-900">
                          {doubt.petName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{doubt.topic}</span>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          isVerified ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {isVerified ? (
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        {isVerified ? 'Verified by Dr. Elena' : 'Pending Verification'}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-900 leading-relaxed">
                      {doubt.question}
                    </p>

                    <div className="mt-2 text-[11px] text-slate-500">
                      Asked by {doubt.patientName} · WhatsApp{' '}
                      <span className="font-mono-tabular">{doubt.whatsappPhone}</span>
                    </div>

                    {isVerified && doubt.doctorReply && (
                      <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
                        <span className="font-semibold block mb-0.5">
                          {doubt.verifiedBy ?? PRIMARY_DOCTOR.name} · Verified Answer
                        </span>
                        <p className="leading-relaxed">{doubt.doctorReply}</p>
                      </div>
                    )}

                    {user.role === 'doctor' && (
                      <div className="mt-3 pt-3 border-t border-slate-200 flex flex-col gap-2">
                        <textarea
                          rows={2}
                          maxLength={800}
                          placeholder="Write clinical verification answer for this pet owner…"
                          value={draftText}
                          onChange={(e) =>
                            setDoctorDrafts((prev) => ({
                              ...prev,
                              [doubt.id]: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:border-blue-600 resize-none"
                        />
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <a
                            href={patientWhatsAppFollowup}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                            Reply via WhatsApp
                          </a>
                          <button
                            type="button"
                            disabled={
                              verifyingId === doubt.id || draftText.trim().length < 3
                            }
                            onClick={() => handleVerifySubmit(doubt)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                            {verifyingId === doubt.id
                              ? 'Verifying…'
                              : isVerified
                                ? 'Update Verified Answer'
                                : 'Verify & Publish'}
                          </button>
                        </div>
                      </div>
                    )}

                    {user.role !== 'doctor' && (
                      <div className="mt-3 flex justify-end">
                        <a
                          href={patientWhatsAppFollowup}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                        >
                          <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          Continue on WhatsApp →
                        </a>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
