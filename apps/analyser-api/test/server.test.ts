import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { createApiServer } from '../src/server';

let server: Server;

/** Listen on a free port (0) so tests never clash with a running API. */
function startServer(): Promise<string> {
  server = createApiServer();
  return new Promise((resolve) => {
    server.listen(0, () => {
      const { port } = server.address() as AddressInfo;
      resolve(`http://127.0.0.1:${port}`);
    });
  });
}

afterEach(
  () =>
    new Promise<void>((resolve) => {
      server.close(() => resolve());
    }),
);

describe('analyser-api server', () => {
  it('answers GET /health with status ok', async () => {
    const baseUrl = await startServer();
    const response = await fetch(`${baseUrl}/health`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('answers unknown paths with 404', async () => {
    const baseUrl = await startServer();
    const response = await fetch(`${baseUrl}/nope`);

    expect(response.status).toBe(404);
  });
});
