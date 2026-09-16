import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Page not found",
  description: "That page does not exist — head back to Piano Suite.",
};

export default function NotFound() {
  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="text-center">
          <p className="measure-number text-sm font-semibold text-primary">
            404
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground">
            Page not found
          </h1>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            That page is not on the staff. Head back and pick a door — your
            practice is waiting.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-primary underline-offset-4 hover:underline"
          >
            Back to the home page
          </Link>
        </div>
      </main>
    </div>
  );
}
