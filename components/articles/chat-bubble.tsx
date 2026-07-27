import Link from "next/link";
import { MessageCircle } from "lucide-react";

export function ChatBubble() {
  return (
    <Link
      href="/chat"
      className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-[0_0_12px_2px_var(--primary-glow)] transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_4px_var(--primary-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:bottom-6 sm:right-6"
      aria-label="Chat with the Practice Assistant"
    >
      <MessageCircle className="h-5 w-5 shrink-0" />
      <span className="hidden sm:inline">Ask the assistant</span>
    </Link>
  );
}
