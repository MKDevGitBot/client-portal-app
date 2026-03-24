import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Store active SSE connections with timestamps
const clients = new Map<string, { controller: ReadableStreamController<Uint8Array>; lastPing: number }>();

// Periodic cleanup of stale connections (every 60s)
setInterval(() => {
  const now = Date.now();
  for (const [key, client] of clients) {
    if (now - client.lastPing > 120000) { // 2 min stale
      try { client.controller.close(); } catch {}
      clients.delete(key);
    }
  }
}, 60000);

// Broadcast function to send messages to all connected clients
export function broadcastToClients(data: unknown) {
  const encoder = new TextEncoder();
  const message = `data: ${JSON.stringify(data)}\n\n`;
  for (const [key, client] of clients) {
    try {
      client.controller.enqueue(encoder.encode(message));
      client.lastPing = Date.now();
    } catch {
      clients.delete(key);
    }
  }
}

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
      clients.set(clientId, { controller, lastPing: Date.now() });

      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      );

      // Cleanup function
      const cleanup = () => {
        if (heartbeat) clearInterval(heartbeat);
        clients.delete(clientId);
      };

      // Heartbeat to keep connection alive
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "heartbeat" })}\n\n`)
          );
          const c = clients.get(clientId);
          if (c) c.lastPing = Date.now();
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
