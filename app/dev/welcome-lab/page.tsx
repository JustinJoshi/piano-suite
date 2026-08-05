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

  if (!isDevToolsUserAllowed()) {
    notFound();
  }

  return <WelcomeLab />;
}
