import { Navbar } from "@/components/navbar";
import { ChatBubble } from "@/components/articles/chat-bubble";

export default function ArticlesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {children}
      <ChatBubble />
    </div>
  );
}
