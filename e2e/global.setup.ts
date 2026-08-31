import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { createClerkClient } from "@clerk/backend";
import { test as setup } from "@playwright/test";
import fs from "fs";
import path from "path";
import { ONBOARDING_STORAGE_KEY } from "@/lib/onboarding";
import { AGE_GATE_STORAGE_KEY } from "@/lib/age-gate";

// Ensures that Clerk setup is done before any tests run.
setup.describe.configure({ mode: "serial" });

const authDir = path.join(__dirname, "../playwright/.auth");
const authFile = path.join(authDir, "user.json");
const testingTokenFile = path.join(authDir, "clerk-testing.json");
const trackedUsersFile = path.join(__dirname, "../playwright/.clerk/signup-user.json");

setup("global setup", async ({ page }) => {
  // Clerk handles its own env loading when dotenv is true, but we already load
  // .env.local in playwright.config.ts so we disable duplicate loading here.
  // clerkSetup populates CLERK_FAPI and CLERK_TESTING_TOKEN in process.env.
  await clerkSetup({ dotenv: false });
  const CLERK_FAPI = process.env.CLERK_FAPI;
  const CLERK_TESTING_TOKEN = process.env.CLERK_TESTING_TOKEN;
  if (!CLERK_FAPI || !CLERK_TESTING_TOKEN) {
    throw new Error("clerkSetup did not produce CLERK_FAPI / CLERK_TESTING_TOKEN.");
  }

  // Auth verification specs expect real Clerk route protection. Bypass must be
  // off for local e2e (Production may still use the Hobby workaround until
  // custom domain + Clerk production keys are live).
  if (
    process.env.NEXT_PUBLIC_AUTH_DISABLED === "true" &&
    process.env.E2E_ALLOW_AUTH_DISABLED !== "true"
  ) {
    throw new Error(
      "NEXT_PUBLIC_AUTH_DISABLED=true is set. Unset it in .env.local and restart " +
        "so e2e can verify sign-in redirects and protected routes. " +
        "Set E2E_ALLOW_AUTH_DISABLED=true only to skip this guard intentionally."
    );
  }

  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;
  const password = process.env.E2E_CLERK_USER_PASSWORD;

  if (!publishableKey?.startsWith("pk_")) {
    throw new Error(
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (or CLERK_PUBLISHABLE_KEY) must be set and start with pk_."
    );
  }
  if (!secretKey?.startsWith("sk_")) {
    throw new Error("CLERK_SECRET_KEY must be set and start with sk_.");
  }
  if (!password || password.length < 8) {
    throw new Error("E2E_CLERK_USER_PASSWORD must be at least 8 characters.");
  }

  // Fail fast if the Convex dev server is not reachable. Authenticated tests
  // depend on the local backend, and without this check they hang on the first
  // mutation instead of reporting a clear error.
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (convexUrl) {
    try {
      const res = await fetch(convexUrl);
      if (!res.ok) {
        throw new Error(`Convex returned HTTP ${res.status}`);
      }
    } catch {
      throw new Error(
        `Convex dev server does not appear to be running at ${convexUrl}. ` +
          "Start it with `npx convex dev` before running tests."
      );
    }
  }

  // Use a unique test email per run so concurrent or back-to-back CI runs do
  // not fight over the same Clerk user. The +clerk_test sub-address suppresses
  // real email delivery on Clerk's test instances.
  const baseEmail =
    process.env.E2E_CLERK_USER_EMAIL || "e2e-piano-suite+clerk_test@example.com";
  const runSuffix = process.env.GITHUB_RUN_ID || Date.now().toString();
  const email = baseEmail.replace("@", `+${runSuffix}@`);

  const client = createClerkClient({ secretKey });
  const { data: existing } = await client.users.getUserList({ emailAddress: [email] });

  let userId: string;
  if (existing.length === 0) {
    // Try creating the user without a phone number first. Some Clerk instances
    // require phone numbers; if creation fails because of that, retry with a
    // fixed synthetic test number.
    let user;
    try {
      user = await client.users.createUser({
        emailAddress: [email],
        password,
        firstName: "Test",
        lastName: "User",
      });
    } catch (err: unknown) {
      const clerkError = err as
        | { errors?: Array<{ longMessage?: string }>; message?: string }
        | undefined;
      const message = clerkError?.errors?.[0]?.longMessage || clerkError?.message || "";
      if (message.toLowerCase().includes("phone")) {
        user = await client.users.createUser({
          emailAddress: [email],
          password,
          phoneNumber: ["+14155552671"],
          firstName: "Test",
          lastName: "User",
        });
      } else {
        throw err;
      }
    }
    userId = user.id;
    trackUser(userId, email);
  } else {
    // Keep the password in sync with the environment in case it was changed.
    userId = existing[0].id;
    await client.users.updateUser(userId, { password });
    trackUser(userId, email);
  }

  // Sign in once and persist the session so every authenticated test can start
  // already logged in. This avoids dozens of ticket-based sign-ins per run,
  // which are slow and can race with Clerk's user lookup under load.
  fs.mkdirSync(authDir, { recursive: true });
  // The age gate renders before Clerk (COPPA); seed a passed gate before the
  // first navigation so the Clerk sign-in UI mounts, then the saved storage
  // state carries the flag to every authenticated test. The real gate flow is
  // covered by e2e/age-gate.spec.ts with an empty storage state.
  await page.addInitScript(
    ({ onboardingKey, ageGateKey }) => {
      localStorage.setItem(onboardingKey, "true");
      localStorage.setItem(ageGateKey, "eligible");
    },
    { onboardingKey: ONBOARDING_STORAGE_KEY, ageGateKey: AGE_GATE_STORAGE_KEY }
  );
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: email });
  await page.waitForFunction(() => window.Clerk?.user !== null, { timeout: 10000 });
  await page.context().storageState({ path: authFile });

  // Propagate the testing token to the test workers in case they need to
  // install the FAPI bypass route on a fresh context.
  fs.writeFileSync(
    testingTokenFile,
    JSON.stringify({ CLERK_FAPI, CLERK_TESTING_TOKEN, email }, null, 2)
  );
});

function trackUser(userId: string, email: string) {
  fs.mkdirSync(path.dirname(trackedUsersFile), { recursive: true });
  const existing: Array<{ userId: string; email: string }> = fs.existsSync(trackedUsersFile)
    ? JSON.parse(fs.readFileSync(trackedUsersFile, "utf-8"))
    : [];
  if (!existing.some((u) => u.email === email)) {
    existing.push({ userId, email });
    fs.writeFileSync(trackedUsersFile, JSON.stringify(existing, null, 2));
  }
}
