import { redirect } from "next/navigation";

/** Phase 1.5: one settings page — the old paths redirect there. */
export default function SettingsRedirect() {
  redirect("/settings");
}
