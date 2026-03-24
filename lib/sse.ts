// SSE client registry for message streaming
const clients = new Map<string, { controller: ReadableStreamController<Uint8Array>; lastPing: number }>();

// Periodic cleanup of stale connections (every 60s)
setInterval(() => {
  const now = Date.now();
  for (const [key, client] of clients) {
    if (now - client.lastPing > 120000) {
      try { client.controller.close(); } catch {}
      clients.delete(key);
    }
  }
}, 60000);

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

export function addClient(id: string, controller: ReadableStreamController<Uint8Array>) {
  clients.set(id, { controller, lastPing: Date.now() });
}

export function removeClient(id: string) {
  clients.delete(id);
}

export function getClientCount() {
  return clients.size;
}
