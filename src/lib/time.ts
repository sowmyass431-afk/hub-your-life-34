import type { ClassSlot, Day } from "./types";
import { DAYS } from "./types";

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const dayName = (d = new Date()) => DAYS[(d.getDay() + 6) % 7] as Day;

export const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

export const fmtTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const hour = ((h ?? 0) % 12) || 12;
  const ampm = (h ?? 0) < 12 ? "AM" : "PM";
  return `${hour}:${String(m ?? 0).padStart(2, "0")} ${ampm}`;
};

export const sortSlots = (slots: ClassSlot[]) =>
  [...slots].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

export function classesFor(day: Day, classes: ClassSlot[]) {
  return sortSlots(classes.filter((c) => c.day === day));
}

export function nowMinutes(d = new Date()) {
  return d.getHours() * 60 + d.getMinutes();
}

export function currentClass(classes: ClassSlot[], now = new Date()) {
  const mins = nowMinutes(now);
  return (
    classesFor(dayName(now), classes).find(
      (c) => toMinutes(c.start) <= mins && mins < toMinutes(c.end),
    ) ?? null
  );
}

/** Next upcoming class within the next 7 days. */
export function nextClass(classes: ClassSlot[], now = new Date()) {
  const mins = nowMinutes(now);
  for (let offset = 0; offset < 8; offset += 1) {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    const list = classesFor(dayName(d), classes);
    const hit = list.find((c) => offset > 0 || toMinutes(c.start) > mins);
    if (hit) return { slot: hit, offset };
  }
  return null;
}

export const daysUntil = (iso: string) => {
  const a = new Date(`${todayISO()}T00:00:00`);
  const b = new Date(`${iso}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
};

export const prettyDate = (iso: string) => {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
};
