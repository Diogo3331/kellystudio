import {
  constantTimeEqualHex,
  getHeaderCaseInsensitive,
  hmacSha256Hex,
  jsonResponse,
  mapMpStatusToOrderStatus,
  methodNotAllowed,
  mpRequestJson,
  parseJsonSafe,
  stringifyMpError,
} from "./_utils.js";

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return jsonResponse({ ok: true });
  }

  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  const url = new URL(request.url);
  const query = url.searchParams;
  const body = parseJsonSafe(await request.text());
  const topic = String(query.get("type") || query.get("topic") || body.type || body.topic || "").toLowerCase();
  const dataId = String(
    query.get("data.id") || query.get("id") || body?.data?.id || body?.id || ""
  ).trim();

  if (!dataId) {
    return jsonResponse({ error: "Webhook sem payment id." }, 400);
  }

  if (topic && topic !== "payment") {
    return jsonResponse({ received: true, ignored: true, topic });
  }

  const signatureValidation = await validateWebhookSignature({
    webhookSecret: String(env.MP_WEBHOOK_SECRET || ""),
    signatureHeader: getHeaderCaseInsensitive(request.headers, "x-signature"),
    requestIdHeader: getHeaderCaseInsensitive(request.headers, "x-request-id"),
    dataId,
  });

  if (!signatureValidation.valid) {
    return jsonResponse(
      {
        error: "Assinatura do webhook invalida.",
        reason: signatureValidation.reason,
      },
      401
    );
  }

  const accessToken = String(env.MP_ACCESS_TOKEN || "");
  if (!accessToken) {
    return jsonResponse({ error: "MP_ACCESS_TOKEN nao configurado no Cloudflare." }, 500);
  }

  try {
    const mp = await mpRequestJson(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`,
      accessToken,
      { method: "GET" }
    );

    if (!mp.ok) {
      throw new Error(`Mercado Pago Payment [${mp.status}]: ${stringifyMpError(mp.data)}`);
    }

    const payment = mp.data;
    const mpStatus = String(payment?.status || "").toLowerCase();
    const orderStatus = mapMpStatusToOrderStatus(mpStatus);
    const payload = {
      paymentId: String(payment?.id || ""),
      orderId: String(payment?.external_reference || ""),
      mpStatus,
      orderStatus,
      paymentMethod: String(payment?.payment_method_id || ""),
      approvedAt: payment?.date_approved || "",
      updatedAt: payment?.date_last_updated || payment?.date_created || "",
      amount: Number(payment?.transaction_amount || 0),
      raw: payment,
    };

    const forwardUrl = String(env.ORDER_STATUS_WEBHOOK_URL || "").trim();
    if (forwardUrl) {
      try {
        await fetch(forwardUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.log(`order-update-forward-failed: ${String(error?.message || error)}`);
      }
    }

    return jsonResponse({
      received: true,
      paymentId: payload.paymentId,
      orderId: payload.orderId,
      status: payload.mpStatus,
      orderStatus: payload.orderStatus,
      signatureValidation: signatureValidation.reason,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: "Falha ao processar webhook do pagamento.",
        details: String(error?.message || error),
      },
      500
    );
  }
}

async function validateWebhookSignature({ webhookSecret, signatureHeader, requestIdHeader, dataId }) {
  if (!webhookSecret) {
    return { valid: true, reason: "secret_not_configured" };
  }

  if (!signatureHeader) {
    return { valid: false, reason: "missing_signature_header" };
  }

  const signatureParts = Object.fromEntries(
    signatureHeader
      .split(",")
      .map((part) => part.trim().split("=").map((value) => value.trim()))
      .filter((tuple) => tuple.length === 2)
  );

  const ts = signatureParts.ts || "";
  const v1 = String(signatureParts.v1 || "").toLowerCase();
  if (!ts || !v1) {
    return { valid: false, reason: "invalid_signature_format" };
  }

  const manifestCandidates = [
    `id:${dataId};request-id:${requestIdHeader};ts:${ts};`,
    `id:${dataId};request-id:${requestIdHeader};ts:${ts}`,
    `id:${dataId};x-request-id:${requestIdHeader};ts:${ts};`,
    `id:${dataId};x-request-id:${requestIdHeader};ts:${ts}`,
    `id:${dataId};ts:${ts};`,
    `id:${dataId};ts:${ts}`,
  ];

  for (const manifest of manifestCandidates) {
    const expected = await hmacSha256Hex(webhookSecret, manifest);
    if (constantTimeEqualHex(expected, v1)) {
      return { valid: true, reason: "validated_with_secret" };
    }
  }

  return { valid: false, reason: "signature_mismatch" };
}
