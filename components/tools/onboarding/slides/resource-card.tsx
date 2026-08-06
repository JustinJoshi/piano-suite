"use client";

import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WelcomeOnboardingResourceConfig } from "@/lib/welcome-config";

interface ResourceCardProps {
  resource: WelcomeOnboardingResourceConfig;
  visible: boolean;
  delayIndex: number;
  isInstant: boolean;
  variant?: "image-card" | "compact-list";
}

function cardTransitionClasses(visible: boolean, isInstant: boolean) {
  return cn(
    visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
    !isInstant && "duration-700 ease-out"
  );
}

function cardDelayStyle(delayIndex: number, isInstant: boolean) {
  return !isInstant ? { transitionDelay: `${delayIndex * 120 + 200}ms` } : undefined;
}

function ResourceCardContent({
  resource,
  visible,
  delayIndex,
  isInstant,
}: Omit<ResourceCardProps, "variant">) {
  return (
    <>
      {/* Desktop image card */}
      <a
        href={resource.href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "group relative hidden overflow-hidden rounded-xl bg-card ring-1 ring-border transition-all sm:block",
          cardTransitionClasses(visible, isInstant)
        )}
        style={cardDelayStyle(delayIndex, isInstant)}
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resource.imageSrc}
            alt={resource.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <ExternalLink className="absolute right-2 top-2 h-4 w-4 text-white/80 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <div className="p-3">
          <h4 className="text-sm font-medium text-foreground">{resource.title}</h4>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {resource.description}
          </p>
        </div>
      </a>

      {/* Mobile compact list */}
      <a
        href={resource.href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "group flex items-center gap-3 rounded-xl border border-border bg-card p-3 ring-1 ring-border transition-all sm:hidden",
          cardTransitionClasses(visible, isInstant)
        )}
        style={cardDelayStyle(delayIndex, isInstant)}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
          <ExternalLink className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-medium text-foreground">
            {resource.title}
          </h4>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {resource.description}
          </p>
        </div>
      </a>
    </>
  );
}

export function ResourceCard({
  resource,
  visible,
  delayIndex,
  isInstant,
  variant = "image-card",
}: ResourceCardProps) {
  if (variant === "compact-list") {
    return (
      <a
        href={resource.href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "group flex items-center gap-3 rounded-xl border border-border bg-card p-3 ring-1 ring-border transition-all",
          cardTransitionClasses(visible, isInstant)
        )}
        style={cardDelayStyle(delayIndex, isInstant)}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
          <ExternalLink className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-medium text-foreground">
            {resource.title}
          </h4>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {resource.description}
          </p>
        </div>
      </a>
    );
  }

  return (
    <ResourceCardContent
      resource={resource}
      visible={visible}
      delayIndex={delayIndex}
      isInstant={isInstant}
    />
  );
}
