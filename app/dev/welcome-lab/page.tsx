import { notFound } from "next/navigation";
import { WelcomeLab } from "./lab-client";

export default function WelcomeLabPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <WelcomeLab />;
}
