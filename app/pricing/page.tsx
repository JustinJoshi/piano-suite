import type { Metadata } from "next";
import { PricingPage } from "@/components/pricing/pricing-page";

export const metadata: Metadata = {
  title: "Pricing · Piano Suite",
  description:
    "Free forever for local piano drills. Pro syncs personal bests and practice history across devices.",
};

export default function PricingRoute() {
  return <PricingPage />;
}
