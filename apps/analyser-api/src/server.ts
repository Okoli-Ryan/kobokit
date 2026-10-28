import { createServer, type Server, type ServerResponse } from 'node:http';
import { getHealth } from './health';

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
}

/** Placeholder HTTP server. TODO: pick a framework in week 5 if routing grows. */
export function createApiServer(): Server {
  return createServer((request, response) => {
    if (request.method === 'GET' && request.url === '/health') {
      sendJson(response, 200, getHealth());
      return;
    }
    sendJson(response, 404, { error: 'not_found' });
  });
}
