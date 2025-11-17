import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export async function proxyRequest(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
  url: string,
  init?: RequestInit
) {
  // Timeout (5 secondes)
  const timeoutMs = (init as any)?.timeout ?? 5000;
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const mergedInit = Object.assign({}, init || {}, { signal: controller.signal });
    const response: Response = await (app as any).fetchInternal(request, url, mergedInit);

    clearTimeout(timeoutHandle);

    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      reply.header("set-cookie", setCookie);
    }

    const contentType = response.headers.get("content-type") || "";

    // Log proxy request + response status
    const userName = (request.headers as any)["x-user-name"] || null;
    app.log.info({ event: 'proxy', url, method: init?.method || 'GET', status: response.status, user: userName });

    // Forward status code Service -> Gateway -> Client
    reply.code(response.status);

    if (contentType.includes("application/json")) {
      try {
        const body = await response.json();
        if (response.status >= 400) {
          return body || { error: { message: 'Upstream error', code: 'UPSTREAM_ERROR', upstreamStatus: response.status } };
        }
        return body;
      } catch (jsonErr) {
        const errorMessage = (jsonErr as Error)?.message || 'Unknown JSON error';
        app.log.warn({ event: 'proxy_json_error', url, err: errorMessage });
        reply.code(502);
        return { error: { message: 'Invalid JSON from upstream', code: 'BAD_GATEWAY', details: errorMessage } };
      }
    }

    try {
      const text = await response.text();
      if (response.status >= 400) {
        return { error: { message: text || 'Upstream error', code: 'UPSTREAM_ERROR', upstreamStatus: response.status } };
      }
      return text;
    } catch (textErr) {
      const errorMessage = (textErr as Error)?.message || 'Unknown text error';
      app.log.warn({ event: 'proxy_text_error', url, err: errorMessage });
      reply.code(502);
      return { error: { message: 'Error reading upstream response', code: 'BAD_GATEWAY', details: errorMessage } };
    }
  } catch (err: any) {
    clearTimeout(timeoutHandle);
    const isAbort = err && (err.name === 'AbortError' || err.type === 'aborted');
    const errorMessage = (err as Error)?.message || 'Unknown network error';
    app.log.warn({ event: 'proxy_error', url, err: errorMessage, timeout: isAbort });
    reply.code(502);
    if (isAbort) {
      return { error: { message: 'Upstream request timed out', code: 'BAD_GATEWAY', details: errorMessage } };
    }
    return { error: { message: 'Bad gateway', code: 'BAD_GATEWAY', details: errorMessage } };
  }
}