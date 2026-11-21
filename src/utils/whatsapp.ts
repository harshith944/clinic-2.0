import { CLINIC_WHATSAPP_NUMBER, PRIMARY_DOCTOR } from '../data/clinicData';
import type {
  PatientDoubtInput,
  PatientDoubtValidationErrors,
} from '../types/clinic';

export const DOUBT_LIMITS = {
  patientNameMax: 100,
  whatsappPhoneMax: 32,
  petNameMax: 60,
  topicMax: 60,
  questionMax: 600,
  doctorReplyMax: 800,
  verifiedByMax: 100,
} as const;

export function sanitizeWhatsAppDigits(phone?: string): string {
  if (!phone) return CLINIC_WHATSAPP_NUMBER;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 ? digits : CLINIC_WHATSAPP_NUMBER;
}

export function buildWhatsAppChatUrl(message: string, targetPhone?: string): string {
  const digits = sanitizeWhatsAppDigits(targetPhone);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildPatientDoubtWhatsAppMessage(params: {
  patientName?: string;
  petName?: string;
  topic?: string;
  question?: string;
}): string {
  const owner = params.patientName?.trim() || 'Pet Owner';
  const pet = params.petName?.trim() || 'my pet';
  const topic = params.topic?.trim() || 'General Care';
  const question = params.question?.trim();

  if (!question) {
    return `Hello ${PRIMARY_DOCTOR.clinicName} (${PRIMARY_DOCTOR.name}), I am ${owner} and I have a ${topic} question regarding ${pet}.`;
  }

  return `Hello ${PRIMARY_DOCTOR.clinicName} (${PRIMARY_DOCTOR.name}), I am ${owner}.\nPet: ${pet}\nTopic: ${topic}\nQuestion for verification: ${question}`;
}

export function buildVerifiedReplyWhatsAppMessage(params: {
  patientName: string;
  petName: string;
  topic: string;
  question: string;
  doctorReply: string;
}): string {
  return `Hello ${params.patientName}, ${PRIMARY_DOCTOR.name} at ${PRIMARY_DOCTOR.clinicName} has verified your ${params.topic} question for ${params.petName}:\n\n"${params.question}"\n\nVerified Answer: ${params.doctorReply}`;
}

export function generateDoubtId(existingCount = 0): string {
  const rand = Math.floor(1000 + Math.random() * 8999);
  const seq = (existingCount + 10) % 9000;
  const num = String((rand + seq) % 90000 + 1000);
  return `Doubt${num.slice(0, 5)}`;
}

export function validatePatientDoubtForm(
  input: PatientDoubtInput,
): PatientDoubtValidationErrors {
  const errors: PatientDoubtValidationErrors = {};

  const name = input.patientName.trim();
  if (!name || name.length < 2) {
    errors.patientName = 'Please enter your name.';
  } else if (name.length > DOUBT_LIMITS.patientNameMax) {
    errors.patientName = `Name must be ${DOUBT_LIMITS.patientNameMax} characters or fewer.`;
  }

  const digits = input.whatsappPhone.replace(/\D/g, '');
  if (digits.length < 7 || input.whatsappPhone.trim().length > DOUBT_LIMITS.whatsappPhoneMax) {
    errors.whatsappPhone = 'Enter a valid WhatsApp number (at least 7 digits).';
  }

  const pet = input.petName.trim();
  if (!pet || pet.length > DOUBT_LIMITS.petNameMax) {
    errors.petName = 'Please enter your pet’s name.';
  }

  const topic = input.topic.trim();
  if (!topic || topic.length < 2 || topic.length > DOUBT_LIMITS.topicMax) {
    errors.topic = 'Please select a care topic.';
  }

  const question = input.question.trim();
  if (!question || question.length < 5) {
    errors.question = 'Please enter your question (at least 5 characters).';
  } else if (question.length > DOUBT_LIMITS.questionMax) {
    errors.question = `Question must be ${DOUBT_LIMITS.questionMax} characters or fewer.`;
  }

  return errors;
}
