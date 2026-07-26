"use client";

import Link from "next/link";
import { Music } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Tools", href: "/tools" },
  { label: "Articles", href: "/articles" },
  { label: "Chat", href: "/chat" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <Music className="h-5 w-5 text-primary" />
          <span className="font-heading text-lg font-semibold tracking-tight">
            Anki MIDI Chord Trainer
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            Sign in
          </Button>
          <Button
            size="sm"
            className="rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90"
          >
            Try it free
          </Button>
        </div>
      </div>
    </header>
  );
}
