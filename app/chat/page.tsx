"use client";

import { useState } from "react";
import { Send, Bot, User, AlertCircle, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/navbar";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatPage() {
  const [input, setInput] = useState("");

  const {
    messages,
    status,
    stop,
    error,
    regenerate,
    sendMessage,
  } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    await sendMessage({ text });
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
              <div className="flex-1">
                <p className="font-medium">Unable to send message</p>
                <p className="text-sm opacity-90">{error.message}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => regenerate()}
                className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Retry
              </Button>
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
                  messages.map((message) => {
                    const text = message.parts
                      .filter((part) => part.type === "text")
                      .map((part) => part.text)
                      .join("");

                    return (
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
                          {message.role === "assistant" ? (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => (
                                  <p className="mb-3 last:mb-0 leading-relaxed">
                                    {children}
                                  </p>
                                ),
                                a: ({ href, children }) => (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                                  >
                                    {children}
                                  </a>
                                ),
                                ul: ({ children }) => (
                                  <ul className="mb-3 ml-4 list-disc space-y-1">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="mb-3 ml-4 list-decimal space-y-1">
                                    {children}
                                  </ol>
                                ),
                                li: ({ children }) => (
                                  <li className="leading-relaxed">{children}</li>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-semibold">
                                    {children}
                                  </strong>
                                ),
                                code: ({ children }) => (
                                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                                    {children}
                                  </code>
                                ),
                              }}
                            >
                              {text}
                            </ReactMarkdown>
                          ) : (
                            text
                          )}
                        </div>
                      </div>
                    );
                  })
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
                {status === "streaming" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={stop}
                    className="rounded-lg"
                  >
                    <Square className="mr-1.5 h-4 w-4" />
                    Stop
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isLoading || !input.trim()}
                    className="rounded-lg"
                  >
                    <Send className="mr-1.5 h-4 w-4" />
                    Send
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
