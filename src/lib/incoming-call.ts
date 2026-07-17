"use client";

import type { Appointment, Patient } from "@prisma/client";

export type IncomingCallDetail = {
  id: string;
  appointmentId: string;
  patientName: string;
  title: string;
  roomUrl: string;
  date: string;
};

type Listener = (call: IncomingCallDetail) => void;

const listeners = new Set<Listener>();

export function onIncomingCall(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitIncomingCall(call: IncomingCallDetail) {
  listeners.forEach((listener) => listener(call));
}

export type AppointmentLike = Appointment & { patient: Patient | null };
