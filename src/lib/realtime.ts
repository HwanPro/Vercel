import { EventEmitter } from "events";

declare global {
  // mantener una sola instancia en hot-reload
  // eslint-disable-next-line no-var
  var __rtEmitter: EventEmitter | undefined;
}

export const rt = global.__rtEmitter ?? new EventEmitter();
if (!global.__rtEmitter) global.__rtEmitter = rt;

// Tipos de eventos que mandaremos
export type AttendanceEvent = {
  kind: "attendance";
  type: "checkin" | "checkout" | "already_open";
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  daysLeft: number | null;
  debt: number | null;
  at: number;
};

export type CommandEvent = {
  kind: "command";
  cmd: "start-scan" | "checkout";
  at: number;
};

export type RTEvent = AttendanceEvent | CommandEvent;
