"use client";

import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OnboardingResource } from "@/lib/onboarding";

interface ResourceCardProps {
  resource: OnboardingResource;
  visible: boolean;
  delayIndex: number;
  isInstant: boolean;
}

export function ResourceCard({
  resource,
  visible,
  delayIndex,
  isInstant,
}: ResourceCardProps) {
  return (
    <a
      href={resource.href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative block overflow-hidden rounded-xl bg-card ring-1 ring-border transition-all",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0",
        !isInstant && "duration-700 ease-out"
      )}
      style={
        !isInstant
          ? { transitionDelay: `${delayIndex * 120 + 200}ms` }
          : undefined
      }
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
  );
}
