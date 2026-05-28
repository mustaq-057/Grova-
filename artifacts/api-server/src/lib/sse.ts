import type { Response } from "express";

const clients = new Map<string, Response>();

export function addClient(id: string, res: Response): void {
  clients.set(id, res);
}

export function removeClient(id: string): void {
  clients.delete(id);
}

export function broadcast(event: string, data: unknown): void {
  const chunk = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const [id, res] of clients.entries()) {
    try {
      res.write(chunk);
    } catch {
      clients.delete(id);
    }
  }
}
