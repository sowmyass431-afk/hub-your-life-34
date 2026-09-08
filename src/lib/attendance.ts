import type { Subject } from "./types";

export const percent = (attended: number, total: number) =>
  total <= 0 ? 0 : (attended / total) * 100;

export type AttStatus = "Critical" | "Warning" | "Safe";

export function status(p: number): AttStatus {
  if (p < 75) return "Critical";
  if (p <= 80) return "Warning";
  return "Safe";
}

/** How many further classes can be missed while staying >= 75%. */
export function canMiss(attended: number, total: number, threshold = 75) {
  let miss = 0;
  while (percent(attended, total + miss + 1) >= threshold) miss += 1;
  return miss;
}

/** Consecutive classes to attend to reach the target percentage. */
export function needToAttend(attended: number, total: number, target: number) {
  if (target >= 100) return Infinity;
  if (percent(attended, total) >= target) return 0;
  let n = 0;
  while (percent(attended + n, total + n) < target && n < 1000) n += 1;
  return n;
}

export function afterAttending(attended: number, total: number) {
  return percent(attended + 1, total + 1);
}

export function afterMissing(attended: number, total: number) {
  return percent(attended, total + 1);
}

export function overall(subjects: Subject[]) {
  const total = subjects.reduce((s, x) => s + x.total, 0);
  const attended = subjects.reduce((s, x) => s + x.attended, 0);
  return { total, attended, pct: percent(attended, total) };
}
