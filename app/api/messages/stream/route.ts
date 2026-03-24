import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Store active SSE connections
const clients = new Map<string, ReadableStreamController<Uint8Array>>();

// Broadcast function to send messages to all connected clients
export function broadcastToClients(data: unknown) {
  const encoder = new TextEncoder();
  const message = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach((controller) => {
    try {
      controller.enqueue(encoder.encode(message));
    } catch {
      // Client disconnected
    }
  });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const clientId = `${user.id}-${Date.now()}`;
      clients.set(clientId, controller);

      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      );

      // Clean up on close
      const cleanup = () => {
        clients.delete(clientId);
      };

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "heartbeat" })}\n\n`)
          );
        } catch {
          clearInterval(heartbeat);
          cleanup();
        }
      }, 30000);

      // Handle client disconnect
      const signal = new AbortController();
      signal.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
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
