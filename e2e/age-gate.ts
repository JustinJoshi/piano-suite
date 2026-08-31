import { AGE_GATE_STORAGE_KEY } from "@/lib/age-gate";

// Storage state that has already passed the age gate. Specs which bypass the
// signed-in auth state (and therefore miss the seeded flag from global setup)
// need this to see the app instead of the gate. The origin is built at load
// time so it matches the E2E_PORT the config chose.
export function eligibleAgeGateState() {
  const port = process.env.E2E_PORT || "3000";
  return {
    cookies: [] as never[],
    origins: [
      {
        origin: `http://localhost:${port}`,
        localStorage: [{ name: AGE_GATE_STORAGE_KEY, value: "eligible" }],
      },
    ],
  };
}
