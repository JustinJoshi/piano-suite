import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import {
  isDevToolsEnabled,
  isDevToolsUserAllowed,
} from "@/lib/dev-tools";
import { WelcomeLab } from "./lab-client";

export default async function WelcomeLabPage() {
  if (!isDevToolsEnabled()) {
    notFound();
  }

  const { userId } = await auth();
  if (!isDevToolsUserAllowed(userId)) {
    notFound();
  }

  return <WelcomeLab />;
}
