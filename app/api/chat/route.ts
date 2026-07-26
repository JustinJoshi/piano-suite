export const runtime = "nodejs";

// This route is a stub for the future AI chatbot.
// Replace with a real model provider (OpenAI, Anthropic, etc.) via the Vercel
// AI SDK and wire RAG against embedded article chunks from Convex or a vector store.
export async function POST(req: Request) {
  const { messages } = (await req.json()) as {
    messages?: { role: string; content: string }[];
  };
  const lastMessage = messages?.at(-1)?.content ?? "Hello";

  const text = `This is a placeholder response. You asked: "${lastMessage}". Configure a real LLM provider to enable the practice assistant.`;
  const chunks = text.split(" ");
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let i = 0;
      const interval = setInterval(() => {
        if (i >= chunks.length) {
          controller.close();
          clearInterval(interval);
          return;
        }
        controller.enqueue(
          encoder.encode(
            `0:"${chunks[i] + (i < chunks.length - 1 ? " " : "")}"\n`
          )
        );
        i++;
      }, 60);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "x-vercel-ai-data-stream": "v1",
    },
  });
}
