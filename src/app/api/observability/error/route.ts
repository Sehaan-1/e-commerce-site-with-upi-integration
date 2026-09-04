import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id") || undefined;

  let body: unknown = null;
  try {
    body = await req.json();
  } catch (err) {
    logger.warn("observability.error.invalid_json", { requestId }, err);
    return Response.json({ ok: false }, { status: 400 });
  }

  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  logger.error("observability.error.client", {
    requestId,
    name: typeof payload.name === "string" ? payload.name : undefined,
    message: typeof payload.message === "string" ? payload.message : undefined,
    digest: typeof payload.digest === "string" ? payload.digest : undefined,
    stack: typeof payload.stack === "string" ? payload.stack : undefined,
    url: typeof payload.url === "string" ? payload.url : undefined,
    userAgent: typeof payload.userAgent === "string" ? payload.userAgent : undefined,
  });

  return Response.json({ ok: true });
}

