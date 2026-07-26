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

  // Ensure a deterministic test user exists. Using a +clerk_test email
  // suppresses real email delivery (verification codes, notifications, etc.)
  const email =
    process.env.E2E_CLERK_USER_EMAIL || "e2e-piano-suite+clerk_test@example.com";

  const client = createClerkClient({ secretKey });
  const { data: existing } = await client.users.getUserList({ emailAddress: [email] });

  if (existing.length === 0) {
    const user = await client.users.createUser({
      emailAddress: [email],
      password,
      // This instance requires a phone number for user creation. Use a fixed,
      // synthetic E.164 number for the deterministic test user.
      phoneNumber: ["+14155552671"],
      firstName: "Test",
      lastName: "User",
    });
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
