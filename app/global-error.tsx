"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0c0a08] text-[#ede6d6] antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Something went wrong
          </h2>
          <p className="max-w-md text-sm opacity-80">
            The app hit an unexpected error. Try again, or refresh the page.
          </p>
          <button
            type="button"
            className="rounded-md bg-[#c9a227] px-4 py-2 text-sm font-medium text-[#0c0a08]"
            onClick={() => reset()}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
