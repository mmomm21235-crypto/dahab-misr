import { createHash } from "crypto";

const PROJECT_NAME = "Dahab Misr";
const WATERMARK_VERSION = "1.0.0";

// ── Server-Side Response Watermarking ────────────────────────────────

export interface ResponseWatermark {
  id: string;
  project: string;
  version: string;
  timestamp: number;
  fingerprint: string;
}

function generateFingerprint(): string {
  const env = process.env.NODE_ENV || "unknown";
  const timestamp = Math.floor(Date.now() / 86400000);
  return createHash("sha256")
    .update(`${PROJECT_NAME}-${env}-${timestamp}`)
    .digest("hex")
    .slice(0, 12);
}

function generateWatermarkId(): string {
  return createHash("sha256")
    .update(`${PROJECT_NAME}-${Date.now()}-${Math.random().toString(36)}`)
    .digest("hex")
    .slice(0, 16);
}

export function createResponseWatermark(): ResponseWatermark {
  return {
    id: generateWatermarkId(),
    project: PROJECT_NAME,
    version: WATERMARK_VERSION,
    timestamp: Date.now(),
    fingerprint: generateFingerprint(),
  };
}

export function addServerWatermark(
  data: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...data,
    _watermark: createResponseWatermark(),
  };
}

export function addInvisibleWatermarkToResponse(response: Response): Response {
  const wm = createResponseWatermark();
  response.headers.set("X-Watermark-Id", wm.id);
  response.headers.set("X-Watermark-Fingerprint", wm.fingerprint);
  return response;
}

// ── Trace Watermark ──────────────────────────────────────────────────

export interface TraceWatermark {
  traceId: string;
  project: string;
  sessionId: string;
  issuedAt: number;
}

let traceSessionId: string | null = null;

function getTraceSessionId(): string {
  if (!traceSessionId) {
    traceSessionId = createHash("sha256")
      .update(`${PROJECT_NAME}-${Date.now()}-${Math.random()}`)
      .digest("hex")
      .slice(0, 20);
  }
  return traceSessionId;
}

export function createTraceWatermark(source: string): TraceWatermark {
  return {
    traceId: createHash("sha256")
      .update(`${source}-${Date.now()}-${Math.random().toString(36)}`)
      .digest("hex")
      .slice(0, 24),
    project: PROJECT_NAME,
    sessionId: getTraceSessionId(),
    issuedAt: Date.now(),
  };
}

export function embedTraceWatermark(
  data: Record<string, unknown>,
  source: string
): Record<string, unknown> {
  return {
    ...data,
    _trace: createTraceWatermark(source),
  };
}

export function extractTraceWatermark(
  data: Record<string, unknown>
): TraceWatermark | null {
  const trace = data._trace as TraceWatermark | undefined;
  if (
    trace &&
    typeof trace.traceId === "string" &&
    typeof trace.project === "string" &&
    typeof trace.sessionId === "string"
  ) {
    return trace;
  }
  return null;
}

// ── Client-Side DOM Watermarking ─────────────────────────────────────

export function addDomWatermark(): void {
  if (typeof document === "undefined") return;

  const comment = document.createComment(
    ` ${PROJECT_NAME} v${WATERMARK_VERSION} | ${generateWatermarkId()} | ${new Date().toISOString().slice(0, 10)} `
  );
  document.documentElement.appendChild(comment);

  const meta = document.createElement("meta");
  meta.name = "generator";
  meta.content = `${PROJECT_NAME} ${WATERMARK_VERSION}`;
  document.head.appendChild(meta);
}

export function addInvisibleTextWatermark(): void {
  if (typeof document === "undefined") return;

  const watermark = document.createElement("div");
  watermark.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: 1px;
    height: 1px;
    opacity: 0.001;
    font-size: 1px;
    color: transparent;
    user-select: none;
    pointer-events: none;
    z-index: -1;
  `;
  watermark.setAttribute("aria-hidden", "true");
  watermark.setAttribute("data-watermark", generateWatermarkId());
  watermark.textContent = `${PROJECT_NAME} - Licensed Application`;
  document.body.appendChild(watermark);
}

// ── JSON Response Watermarking ───────────────────────────────────────

export function addWatermarkToJsonResponse(body: string): string {
  try {
    const parsed = JSON.parse(body);
    const watermarked = {
      ...parsed,
      _wm: createResponseWatermark(),
    };
    return JSON.stringify(watermarked);
  } catch {
    return body;
  }
}

// ── HTML Watermarking ────────────────────────────────────────────────

export function addWatermarkToHtml(html: string): string {
  const wm = createResponseWatermark();
  const comment = `<!-- ${PROJECT_NAME} v${wm.version} | ${wm.id} | ${wm.fingerprint} -->`;

  const closingHead = html.indexOf("</head>");
  if (closingHead !== -1) {
    const metaTag = `<meta name="generator" content="${PROJECT_NAME} ${wm.version}" data-wm="${wm.id}">`;
    html = html.slice(0, closingHead) + metaTag + "\n" + html.slice(closingHead);
  }

  const closingBody = html.indexOf("</body>");
  if (closingBody !== -1) {
    const hiddenDiv = `<div style="position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0.001;font-size:1px;color:transparent;user-select:none;pointer-events:none;z-index:-1" aria-hidden="true" data-watermark="${wm.id}">${PROJECT_NAME}</div>`;
    html = html.slice(0, closingBody) + hiddenDiv + "\n" + html.slice(closingBody);
  }

  return comment + "\n" + html;
}
