import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { learningRoutes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Guided routes · Piano Suite",
  description:
    "Pick a path — music theory or finger flexibility — and go from knowing nothing about piano to a daily practice habit.",
};

export default function RoutesPage() {
  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 pb-20 pt-12 sm:px-6 lg:px-8">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Pick a route
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            New to the piano? Choose the thing you want to get good at first.
            Each route is a short checklist of steps — set up your tools,
            play your first drills, and finish with a practice page ready
            for tomorrow.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {learningRoutes.map((route) => {
              const Icon = route.icon;
              return (
                <Link
                  key={route.id}
                  href={`/routes/${route.id}`}
                  data-testid={`route-card-${route.id}`}
                  className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  <Icon className="h-7 w-7 text-primary" />
                  <h2 className="mt-3 text-lg font-semibold text-foreground">
                    {route.title}
                  </h2>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {route.tagline}
                  </p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {route.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                    Start the route
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
