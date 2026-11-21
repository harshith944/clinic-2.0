import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { DOCTOR_EMAIL } from '../data/clinicData';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type {
  Appointment,
  AppointmentStatus,
  BookedSlot,
  BookingFormInput,
  ClinicUserProfile,
  UserRole,
} from '../types/clinic';
import {
  BLUEPRINT_LIMITS,
  buildSlotId,
  createAppointmentRecord,
  generateAppointmentId,
} from '../utils/appointments';

export function resolveEffectiveRole(email: string | null | undefined): UserRole {
  if (email && email.toLowerCase() === DOCTOR_EMAIL.toLowerCase()) {
    return 'doctor';
  }
  return 'patient';
}

export async function syncUserProfile(
  user: User,
  phone = '',
): Promise<ClinicUserProfile> {
  const effectiveRole = resolveEffectiveRole(user.email);
  const displayName = (user.displayName || 'Clinic Guest').slice(0, 100);
  const email = (user.email || '').slice(0, 160);

  const publicRef = doc(db, 'users', user.uid);
  const privateRef = doc(db, 'users', user.uid, 'private', 'info');

  try {
    const existingSnap = await getDoc(publicRef);
    if (!existingSnap.exists()) {
      await setDoc(publicRef, {
        uid: user.uid,
        displayName,
        role: effectiveRole,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(publicRef, {
        displayName,
        role: effectiveRole,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }

  try {
    const privSnap = await getDoc(privateRef);
    if (!privSnap.exists()) {
      await setDoc(privateRef, {
        uid: user.uid,
        email,
        phone: phone.slice(0, 32),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(privateRef, {
        email,
        phone: phone.slice(0, 32) || (privSnap.data()?.phone ?? ''),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      `users/${user.uid}/private/info`,
    );
  }

  return {
    uid: user.uid,
    displayName,
    email,
    photoURL: user.photoURL || undefined,
    role: effectiveRole,
  };
}

export function subscribeAppointments(
  profile: ClinicUserProfile,
  onData: (appointments: Appointment[]) => void,
): Unsubscribe {
  const colRef = collection(db, 'appointments');
  const q =
    profile.role === 'doctor'
      ? colRef
      : query(colRef, where('patientUid', '==', profile.uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Appointment[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: String(data.id ?? docSnap.id),
          patientUid: String(data.patientUid ?? ''),
          doctorId: 'dr-elena',
          ownerName: String(data.ownerName ?? ''),
          email: String(data.email ?? ''),
          phone: String(data.phone ?? ''),
          petName: String(data.petName ?? ''),
          petSpecies: String(data.petSpecies ?? ''),
          appointmentType: data.appointmentType ?? 'clinic',
          visitType: String(data.visitType ?? 'General Checkup'),
          date: String(data.date ?? ''),
          time: String(data.time ?? ''),
          fee: Number(data.fee ?? 65),
          status: (data.status as AppointmentStatus) ?? 'upcoming',
          patientTag: data.patientTag === 'Returning' ? 'Returning' : 'New Patient',
          notes: data.notes ? String(data.notes) : undefined,
          doctorNotes: data.doctorNotes ? String(data.doctorNotes) : undefined,
        });
      });

      items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'appointments');
    },
  );
}

export function subscribeBookedSlots(
  onData: (slots: BookedSlot[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'bookedSlots'),
    where('doctorId', '==', 'dr-elena'),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const slots: BookedSlot[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        slots.push({
          slotId: String(data.slotId ?? docSnap.id),
          doctorId: 'dr-elena',
          date: String(data.date ?? ''),
          time: String(data.time ?? ''),
          appointmentId: String(data.appointmentId ?? ''),
          bookedByUid: String(data.bookedByUid ?? ''),
          status: data.status === 'released' ? 'released' : 'reserved',
        });
      });
      onData(slots);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookedSlots');
    },
  );
}

export async function createAppointmentInFirestore(
  patientUid: string,
  input: BookingFormInput,
  existingAppointments: Appointment[],
): Promise<Appointment> {
  const aptId = generateAppointmentId(existingAppointments.length);
  const record = createAppointmentRecord(
    input,
    existingAppointments,
    patientUid,
    aptId,
  );
  const slotId = buildSlotId(record.date, record.time);

  const aptRef = doc(db, 'appointments', aptId);
  const slotRef = doc(db, 'bookedSlots', slotId);

  const batch = writeBatch(db);
  const payload: Record<string, unknown> = {
    id: record.id,
    patientUid,
    doctorId: 'dr-elena',
    ownerName: record.ownerName,
    email: record.email,
    phone: record.phone,
    petName: record.petName,
    petSpecies: record.petSpecies,
    appointmentType: record.appointmentType,
    visitType: record.visitType,
    date: record.date,
    time: record.time,
    fee: record.fee,
    status: 'upcoming',
    patientTag: record.patientTag,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (record.notes) {
    payload.notes = record.notes;
  }

  batch.set(aptRef, payload);
  batch.set(slotRef, {
    slotId,
    doctorId: 'dr-elena',
    date: record.date,
    time: record.time,
    appointmentId: record.id,
    bookedByUid: patientUid,
    status: 'reserved',
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `appointments/${aptId}`);
  }

  return record;
}

export async function cancelAppointmentInFirestore(
  appointment: Appointment,
): Promise<void> {
  const aptRef = doc(db, 'appointments', appointment.id);
  const slotId = buildSlotId(appointment.date, appointment.time);
  const slotRef = doc(db, 'bookedSlots', slotId);

  const batch = writeBatch(db);
  batch.update(aptRef, {
    status: 'cancelled',
    updatedAt: serverTimestamp(),
  });

  try {
    const slotSnap = await getDoc(slotRef);
    if (
      slotSnap.exists() &&
      slotSnap.data()?.appointmentId === appointment.id &&
      slotSnap.data()?.status === 'reserved'
    ) {
      batch.update(slotRef, {
        status: 'released',
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `appointments/${appointment.id}`,
    );
  }
}

export async function doctorUpdateAppointmentInFirestore(
  appointment: Appointment,
  nextStatus: AppointmentStatus,
  doctorNotes: string,
): Promise<void> {
  const aptRef = doc(db, 'appointments', appointment.id);
  const sanitizedNotes = doctorNotes.trim().slice(0, BLUEPRINT_LIMITS.doctorNotesMax);

  try {
    await updateDoc(aptRef, {
      status: nextStatus,
      doctorNotes: sanitizedNotes,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `appointments/${appointment.id}`,
    );
  }
}
