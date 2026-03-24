import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addClient, removeClient } from "@/lib/sse";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const clientId = `${user.id}-${Date.now()}`;
      addClient(clientId, controller);

      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      );

      // Cleanup function
      const cleanup = () => {
        if (heartbeat) clearInterval(heartbeat);
        removeClient(clientId);
      };

      // Heartbeat to keep connection alive
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "heartbeat" })}\n\n`)
          );
        } catch {
          cleanup();
        }
      }, 30000);

      // Handle client disconnect via request abort
      request.signal.addEventListener("abort", () => {
        cleanup();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
