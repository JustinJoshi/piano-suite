import { auth } from "@clerk/nextjs/server";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getAllArticles } from "@/lib/articles";

export const runtime = "nodejs";

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

  return `You are a helpful piano-practice tutor for the Anki MIDI Chord Trainer / Piano Suite. Answer questions using only the information in the articles below. Be concise, beginner-friendly, and accurate.

When you make a factual claim, cite the source link from the article immediately after the claim. If a question is not covered by the articles, say so and do not invent information. If the user asks about how to use the site, refer them to the Tools section.

Articles:
${articleContext}`;
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const allowedUserId = process.env.ALLOWED_CLERK_USER_ID;
  if (!allowedUserId || userId !== allowedUserId) {
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

  const { messages } = (await req.json()) as {
    messages?: { role: "user" | "assistant" | "system"; content: string }[];
  };

  if (!messages || messages.length === 0) {
    return new Response("No messages provided", { status: 400 });
  }

  try {
    const result = streamText({
      // Kimi Code exposes OpenAI-compatible chat completions, not the
      // Responses API that @ai-sdk/openai uses by default for kimikode().
      model: kimikode.chat(modelId),
      system: buildSystemPrompt(),
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat streaming error:", error);
    return new Response("Failed to start chat stream", { status: 500 });
  }
}
