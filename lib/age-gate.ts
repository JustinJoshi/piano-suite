// COPPA age gate. A neutral 13+ check whose answer is stored BEFORE any
// tracking loads; `shouldLoadTracking()` is the single switch that PostHog
// (initAnalytics) and client Sentry consult. Under-13 visitors must never be
// tracked — see IMPORTANT-NOTICES.md.

export const AGE_GATE_STORAGE_KEY = "piano-suite.age-gate";
export const AGE_GATE_ELIGIBLE = "eligible";
export const AGE_GATE_UNDERAGE = "underage";

export const MIN_AGE_YEARS = 13;

export type AgeGateStatus = "unknown" | typeof AGE_GATE_ELIGIBLE | typeof AGE_GATE_UNDERAGE;

export function ageFromBirthdate(birthdate: string, now: Date): number | null {
  const birth = new Date(birthdate);
  if (Number.isNaN(birth.getTime())) {
    return null;
  }

  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
  const dayDiff = now.getUTCDate() - birth.getUTCDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age;
}

export function statusForBirthdate(birthdate: string, now: Date): AgeGateStatus {
  const age = ageFromBirthdate(birthdate, now);
  if (age === null) {
    return "unknown";
  }
  return age >= MIN_AGE_YEARS ? AGE_GATE_ELIGIBLE : AGE_GATE_UNDERAGE;
}

function storedValue(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(AGE_GATE_STORAGE_KEY);
}

export function readAgeGateStatus(): AgeGateStatus {
  const value = storedValue();
  if (value === AGE_GATE_ELIGIBLE || value === AGE_GATE_UNDERAGE) {
    return value;
  }
  return "unknown";
}

export function saveAgeGateStatus(status: typeof AGE_GATE_ELIGIBLE | typeof AGE_GATE_UNDERAGE): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(AGE_GATE_STORAGE_KEY, status);
}

// Single tracking switch: true only for visitors who passed the gate.
export function shouldLoadTracking(): boolean {
  return readAgeGateStatus() === AGE_GATE_ELIGIBLE;
}
