import { createClerkClient } from "@clerk/backend";
import { test as teardown } from "@playwright/test";
import fs from "fs";
import path from "path";

const trackedUsersFile = path.join(__dirname, "../playwright/.clerk/signup-user.json");

teardown("cleanup test users", async () => {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.warn("CLERK_SECRET_KEY not set; skipping test-user cleanup.");
    return;
  }

  if (!fs.existsSync(trackedUsersFile)) {
    return;
  }

  const client = createClerkClient({ secretKey });
  const tracked: Array<{ userId: string; email: string }> = JSON.parse(
    fs.readFileSync(trackedUsersFile, "utf-8")
  );

  for (const { userId, email } of tracked) {
    try {
      await client.users.deleteUser(userId);
    } catch {
      // Fallback to lookup by email if the userId is stale.
      const { data: found } = await client.users.getUserList({ emailAddress: [email] });
      for (const user of found) {
        await client.users.deleteUser(user.id);
      }
    }
  }

  fs.unlinkSync(trackedUsersFile);
});
