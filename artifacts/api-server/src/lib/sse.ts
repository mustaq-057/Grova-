import type { Response, Request } from "express";

const clients = new Map<string, { res: Response; userId: string }>();

export function addClient(id: string, res: Response, userId: string): void {
  clients.set(id, { res, userId });
  
  // Clean up on connection close
  res.on('close', () => {
    removeClient(id);
  });
}

export function removeClient(id: string): void {
  clients.delete(id);
}

export function broadcast(event: string, data: unknown, targetUserId?: string): void {
  const chunk = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  
  for (const [id, client] of clients.entries()) {
    try {
      // If targetUserId is specified, only send to that user
      if (targetUserId && client.userId !== targetUserId) {
        continue;
      }
      client.res.write(chunk);
    } catch {
      clients.delete(id);
    }
  }
}

export function getClientCount(): number {
  return clients.size;
}
