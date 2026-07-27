import { clerkSetup } from "@clerk/testing/playwright";
import { createClerkClient } from "@clerk/backend";
import { test as setup } from "@playwright/test";
import fs from "fs";
import path from "path";

// Ensures that Clerk setup is done before any tests run.
setup.describe.configure({ mode: "serial" });

const trackedUsersFile = path.join(__dirname, "../playwright/.clerk/signup-user.json");

setup("global setup", async () => {
  // Clerk handles its own env loading when dotenv is true, but we already load
  // .env.local in playwright.config.ts so we disable duplicate loading here.
  await clerkSetup({ dotenv: false });

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

  // Ensure a deterministic test user exists. Using a +clerk_test email
  // suppresses real email delivery (verification codes, notifications, etc.)
  const email =
    process.env.E2E_CLERK_USER_EMAIL || "e2e-piano-suite+clerk_test@example.com";

  const client = createClerkClient({ secretKey });
  const { data: existing } = await client.users.getUserList({ emailAddress: [email] });

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
      const clerkError = err as { errors?: Array<{ longMessage?: string }>; message?: string } | undefined;
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
    trackUser(user.id, email);
  } else {
    // Keep the password in sync with the environment in case it was changed.
    await client.users.updateUser(existing[0].id, { password });
    trackUser(existing[0].id, email);
  }
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
