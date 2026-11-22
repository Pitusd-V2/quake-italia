import { SECURITY_HEADERS } from '../../security/headers';

/** La parte di Cloudflare Pages Functions che usiamo. */
export interface PagesContext {
  request: Request;
  params: Record<string, string | string[]>;
  env: { ASSETS: { fetch(input: string | URL | Request): Promise<Response> } };
  next(): Promise<Response>;
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

/** Le risposte delle funzioni devono avere le stesse protezioni delle pagine statiche. */
export function withSecurityHeaders(res: Response): Response {
  if (res.headers.has('content-security-policy')) return res;
  const out = new Response(res.body, res);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) out.headers.set(name, value);
  return out;
}
