import { RollFrame } from "@/components/roll/roll-frame";
import { ChatBubble } from "@/components/articles/chat-bubble";

export default function ArticlesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <RollFrame>{children}</RollFrame>
      <ChatBubble />
    </>
  );
}
