import { afterEach, describe, expect, it } from "vitest";
import {
  AGE_GATE_STORAGE_KEY,
  ageFromBirthdate,
  readAgeGateStatus,
  saveAgeGateStatus,
  shouldLoadTracking,
  statusForBirthdate,
} from "@/lib/age-gate";

const NOW = new Date("2026-08-29T12:00:00Z");

describe("ageFromBirthdate", () => {
  it("returns 13 on the 13th birthday", () => {
    expect(ageFromBirthdate("2013-08-29", NOW)).toBe(13);
  });

  it("returns 12 the day before the 13th birthday", () => {
    expect(ageFromBirthdate("2013-08-30", NOW)).toBe(12);
  });

  it("returns null for invalid or empty input", () => {
    expect(ageFromBirthdate("", NOW)).toBeNull();
    expect(ageFromBirthdate("not-a-date", NOW)).toBeNull();
    expect(ageFromBirthdate("2013-13-45", NOW)).toBeNull();
  });
});

describe("statusForBirthdate", () => {
  it("marks adults eligible", () => {
    expect(statusForBirthdate("2000-01-01", NOW)).toBe("eligible");
  });

  it("marks under-13 underage", () => {
    expect(statusForBirthdate("2015-01-01", NOW)).toBe("underage");
  });

  it("is unknown for invalid input", () => {
    expect(statusForBirthdate("junk", NOW)).toBe("unknown");
  });
});

describe("stored status", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("reads unknown when nothing is saved", () => {
    expect(readAgeGateStatus()).toBe("unknown");
  });

  it("reads unknown for a corrupted value", () => {
    window.localStorage.setItem(AGE_GATE_STORAGE_KEY, "hacker");
    expect(readAgeGateStatus()).toBe("unknown");
  });

  it("saves and reads eligible, which allows tracking", () => {
    saveAgeGateStatus("eligible");
    expect(readAgeGateStatus()).toBe("eligible");
    expect(shouldLoadTracking()).toBe(true);
  });

  it("saves and reads underage, which never allows tracking", () => {
    saveAgeGateStatus("underage");
    expect(readAgeGateStatus()).toBe("underage");
    expect(shouldLoadTracking()).toBe(false);
  });

  it("never allows tracking while the gate is unanswered", () => {
    expect(shouldLoadTracking()).toBe(false);
  });
});
