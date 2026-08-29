import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readFileSync } from "fs";
import path from "path";
import { Navbar } from "@/components/navbar";
import { RouteGuide } from "@/components/routes/route-guide";
import { getLearningRoute } from "@/lib/routes";
import type { AnkiDeckFile } from "@/lib/anki-setup-prompt";

type RoutePageProps = {
  params: Promise<{ routeId: string }>;
};

const DECK_FILES = [
  "chord-symbols-CGDAEno11.txt",
  "chord-symbols-CGDAE.txt",
];

export async function generateMetadata({
  params,
}: RoutePageProps): Promise<Metadata> {
  const { routeId } = await params;
  const route = getLearningRoute(routeId);
  return {
    title: route ? `${route.title} · Piano Suite` : "Guided route · Piano Suite",
    description: route?.description,
  };
}

function loadDeckFiles(): AnkiDeckFile[] {
  try {
    return DECK_FILES.map((filename) => ({
      title: filename,
      filename,
      content: readFileSync(
        path.join(process.cwd(), "public", filename),
        "utf8"
      ),
    }));
  } catch {
    // Deck files are static; a failed read should never blank the guide.
    return [];
  }
}

export default async function RoutePage({ params }: RoutePageProps) {
  const { routeId } = await params;
  const route = getLearningRoute(routeId);
  if (!route) notFound();

  const needsDecks = route.steps.some((step) => step.kind === "anki-setup");
  const decks = needsDecks ? loadDeckFiles() : [];

  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-4 pb-20 pt-12 sm:px-6 lg:px-8">
        {/* routeId only: the icon component cannot cross the RSC boundary. */}
        <RouteGuide routeId={route.id} decks={decks} />
      </main>
    </div>
  );
}
