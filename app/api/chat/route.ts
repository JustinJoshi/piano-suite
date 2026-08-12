import { auth } from "@clerk/nextjs/server";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getAllArticles } from "@/lib/articles";
import { authorizeChatAccess } from "@/lib/chat-auth";

export const runtime = "nodejs";
// Long tutor answers stream for a while; without this Vercel kills the
// function mid-stream at the default timeout.
export const maxDuration = 30;

const MAX_MESSAGES = 50;
const MAX_MESSAGE_CHARS = 4000;

const kimikode = createOpenAI({
  baseURL: process.env.KIMI_CODE_BASE_URL ?? "https://api.kimi.com/coding/v1",
  apiKey: process.env.KIMI_CODE_API_KEY,
});

function buildSystemPrompt(): string {
  const articles = getAllArticles();
  const articleContext = articles
    .map(
      (article) =>
        `---\nTitle: ${article.title}\nSlug: ${article.slug}\n\n${article.content}`,
    )
    .join("\n\n");

  return `You are a helpful piano-practice tutor for Piano Suite. Answer questions using only the information in the articles below. Be concise, beginner-friendly, and accurate.

When you make a factual claim, cite the source link from the article immediately after the claim. If a question is not covered by the articles, say so and do not invent information. If the user asks about how to use the site, refer them to the Tools section.

Articles:
${articleContext}`;
}

let cachedSystemPrompt: string | null = null;

/**
 * Article content only changes at deploy, so read it from disk once per
 * server instance instead of on every POST. Lazy (not module-load) so the
 * fs reads never run if this module is evaluated during build.
 */
function getSystemPrompt(): string {
  if (cachedSystemPrompt === null) {
    cachedSystemPrompt = buildSystemPrompt();
  }
  return cachedSystemPrompt;
}

export async function POST(req: Request) {
  // Chat always requires a verified session + allowlist. The
  // NEXT_PUBLIC_AUTH_DISABLED route-gate bypass never opens this paid LLM
  // endpoint (and deployments using the bypass have no KIMI_CODE_* keys
  // anyway).
  const decision = authorizeChatAccess({
    userId: (await auth()).userId,
    allowedUserId: process.env.ALLOWED_CLERK_USER_ID,
  });

  if (decision === "unauthorized") {
    return new Response("Unauthorized", { status: 401 });
  }
  if (decision === "forbidden") {
    return new Response("Forbidden", { status: 403 });
  }

  const apiKey = process.env.KIMI_CODE_API_KEY;
  const modelId = process.env.KIMI_CODE_MODEL;

  if (!apiKey) {
    return new Response("Kimi Code API key is not configured", { status: 500 });
  }

  if (!modelId) {
    return new Response("Kimi Code model is not configured", { status: 500 });
  }

  const body = (await req.json()) as {
    messages?: { role: string; content: string }[];
  };

  // Strip client-supplied system/other roles so a crafted request cannot
  // append its own system prompt alongside the article-grounded one.
  const messages = (body.messages ?? []).filter(
    (m): m is { role: "user" | "assistant"; content: string } =>
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string",
  );

  if (messages.length === 0) {
    return new Response("No messages provided", { status: 400 });
  }
  if (messages.length > MAX_MESSAGES) {
    return new Response("Too many messages", { status: 400 });
  }
  if (messages.some((m) => m.content.length > MAX_MESSAGE_CHARS)) {
    return new Response("Message too long", { status: 400 });
  }

  try {
    const result = streamText({
      // Kimi Code exposes OpenAI-compatible chat completions, not the
      // Responses API that @ai-sdk/openai uses by default for kimikode().
      model: kimikode.chat(modelId),
      system: getSystemPrompt(),
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat streaming error:", error);
    return new Response("Failed to start chat stream", { status: 500 });
  }
}
