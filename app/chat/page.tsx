"use client";

import { useState } from "react";
import { Send, Bot, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/navbar";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    setError(null);
    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: text,
    };
    const assistantMessage: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: "",
    };

    const nextMessages = [...messages, userMessage];
    setMessages([...nextMessages, assistantMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          response.status === 403
            ? "This feature is restricted to the owner account."
            : body || `Request failed with status ${response.status}`,
        );
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "assistant") {
            return [...prev.slice(0, -1), { ...last, content }];
          }
          return prev;
        });
      }

      // flush any remaining bytes
      content += decoder.decode();
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === "assistant") {
          return [...prev.slice(0, -1), { ...last, content }];
        }
        return prev;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      // remove the empty assistant message on error
      setMessages((prev) =>
        prev.filter(
          (m) => m.role !== "assistant" || m.content !== "" || m.id !== assistantMessage.id,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="border-b border-border/50 bg-background">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-primary">
                <Bot className="h-5 w-5" />
              </div>
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Practice Assistant
              </h1>
            </div>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Ask questions about the practice articles, spaced repetition, or
              how to use the suite. Answers are grounded in the site&apos;s own
              research articles.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Unable to send message</p>
                <p className="text-sm opacity-90">{error}</p>
              </div>
            </div>
          )}

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-lg font-semibold">
                Chat
              </CardTitle>
            </CardHeader>
            <Separator className="bg-border" />
            <CardContent className="flex flex-col gap-4 p-4 sm:p-6">
              <div className="flex max-h-[60vh] min-h-[300px] flex-col gap-4 overflow-y-auto rounded-xl bg-muted/30 p-4">
                {messages.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
                    <p>
                      Start a conversation about the articles — for example,
                      &quot;Why is active recall better than re-reading?&quot;
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-primary"
                        }`}
                      >
                        {message.role === "user" ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-background text-foreground"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 rounded-xl border border-border bg-background p-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about active recall, spaced repetition, or woodshedding..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoading || !input.trim()}
                  className="rounded-lg"
                >
                  <Send className="mr-1.5 h-4 w-4" />
                  Send
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
