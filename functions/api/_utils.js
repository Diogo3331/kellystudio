export function jsonResponse(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, x-signature, x-request-id",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      ...extraHeaders,
    },
  });
}

export function methodNotAllowed() {
  return jsonResponse({ error: "Method Not Allowed" }, 405);
}

export function parseJsonSafe(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export function normalizePaymentMethod(value) {
  const method = String(value || "").toLowerCase();
  if (method === "pix" || method === "card" || method === "boleto") return method;
  return "card";
}

export function getSafeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (email.includes("@")) return email;
  return "cliente@kellystudio.com.br";
}

export function normalizeCpf(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 11);
}

export function mapMpStatusToOrderStatus(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "approved" || normalized === "authorized") return "Pagamento aprovado";
  if (
    normalized === "rejected" ||
    normalized === "cancelled" ||
    normalized === "charged_back" ||
    normalized === "refunded"
  ) {
    return "Pagamento recusado";
  }
  return "Aguardando pagamento";
}

export function simplifyMpError(data) {
  if (!data || typeof data !== "object") return data;
  return {
    message: data.message || "",
    error: data.error || "",
    status: data.status || "",
    cause: Array.isArray(data.cause) ? data.cause : [],
  };
}

export function stringifyMpError(data) {
  try {
    return JSON.stringify(simplifyMpError(data));
  } catch {
    return "unknown_error";
  }
}

export async function mpRequestJson(url, accessToken, options = {}) {
  const method = options.method || "GET";
  const body = options.body || undefined;
  const idempotencyKey = options.idempotencyKey || "";

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
  if (idempotencyKey) {
    headers["X-Idempotency-Key"] = idempotencyKey;
  }

  const mpRes = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const mpData = await mpRes.json().catch(() => ({}));
  return { ok: mpRes.ok, status: mpRes.status, data: mpData };
}

export function getSiteUrl(env, request) {
  const configured = String(env?.SITE_URL || "").trim().replace(/\/+$/, "");
  if (configured) return configured;
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export function getHeaderCaseInsensitive(headers, name) {
  const target = String(name || "").toLowerCase();
  for (const [key, value] of headers.entries()) {
    if (String(key).toLowerCase() === target) {
      return String(value || "");
    }
  }
  return "";
}

export async function hmacSha256Hex(secret, message) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function constantTimeEqualHex(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  if (left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i += 1) {
    result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return result === 0;
}

