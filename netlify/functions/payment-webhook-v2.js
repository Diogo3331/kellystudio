const crypto = require("crypto");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return response(200, { ok: true });
  }

  if (event.httpMethod !== "POST") {
    return response(405, { error: "Method Not Allowed" });
  }

  const query = event.queryStringParameters || {};
  const body = parseJson(event.body);
  const topic = String(query.type || query.topic || body.type || body.topic || "").toLowerCase();
  const dataId = String(query["data.id"] || query.id || body?.data?.id || body?.id || "").trim();

  if (!dataId) {
    return response(400, { error: "Webhook sem payment id." });
  }

  if (topic && topic !== "payment") {
    return response(200, { received: true, ignored: true, topic });
  }

  const signatureValidation = validateWebhookSignature({
    webhookSecret: process.env.MP_WEBHOOK_SECRET || "",
    signatureHeader: getHeader(event.headers, "x-signature"),
    requestIdHeader: getHeader(event.headers, "x-request-id"),
    dataId,
  });

  if (!signatureValidation.valid) {
    return response(401, {
      error: "Assinatura do webhook invalida.",
      reason: signatureValidation.reason,
    });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return response(500, { error: "MP_ACCESS_TOKEN nao configurado no Netlify." });
  }

  try {
    const payment = await fetchPaymentById(dataId, accessToken);
    const normalized = normalizePaymentStatus(payment);

    await forwardOrderUpdate({
      orderId: normalized.orderId,
      paymentId: normalized.paymentId,
      mpStatus: normalized.mpStatus,
      orderStatus: normalized.orderStatus,
      paymentMethod: normalized.paymentMethod,
      approvedAt: normalized.approvedAt,
      updatedAt: normalized.updatedAt,
      amount: normalized.amount,
      raw: payment,
    });

    console.log(
      JSON.stringify({
        source: "mercado_pago_webhook",
        signatureValidated: signatureValidation.reason,
        paymentId: normalized.paymentId,
        orderId: normalized.orderId,
        mpStatus: normalized.mpStatus,
        orderStatus: normalized.orderStatus,
      })
    );

    return response(200, {
      received: true,
      paymentId: normalized.paymentId,
      orderId: normalized.orderId,
      status: normalized.mpStatus,
      orderStatus: normalized.orderStatus,
    });
  } catch (error) {
    return response(500, {
      error: "Falha ao processar webhook do pagamento.",
      details: String(error?.message || error),
    });
  }
};

function parseJson(value) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function getHeader(headers, name) {
  const source = headers || {};
  const expected = String(name).toLowerCase();
  const entry = Object.entries(source).find(([key]) => String(key).toLowerCase() === expected);
  return entry ? String(entry[1] || "") : "";
}

function validateWebhookSignature({ webhookSecret, signatureHeader, requestIdHeader, dataId }) {
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
  const v1 = (signatureParts.v1 || "").toLowerCase();
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

  const digestMatches = manifestCandidates.some((manifest) => {
    const expected = crypto.createHmac("sha256", webhookSecret).update(manifest).digest("hex").toLowerCase();
    return safeEqualHex(expected, v1);
  });

  if (!digestMatches) {
    return { valid: false, reason: "signature_mismatch" };
  }

  return { valid: true, reason: "validated_with_secret" };
}

function safeEqualHex(a, b) {
  const left = Buffer.from(String(a), "utf8");
  const right = Buffer.from(String(b), "utf8");
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

async function fetchPaymentById(paymentId, accessToken) {
  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const data = await mpRes.json().catch(() => ({}));
  if (!mpRes.ok) {
    throw new Error(`Mercado Pago respondeu com erro ao buscar pagamento: ${JSON.stringify(data)}`);
  }

  return data;
}

function normalizePaymentStatus(payment) {
  const mpStatus = String(payment?.status || "").toLowerCase();
  const orderStatus = mapMpStatusToOrderStatus(mpStatus);

  return {
    paymentId: String(payment?.id || ""),
    orderId: String(payment?.external_reference || ""),
    mpStatus,
    orderStatus,
    paymentMethod: String(payment?.payment_method_id || ""),
    approvedAt: payment?.date_approved || "",
    updatedAt: payment?.date_last_updated || payment?.date_created || "",
    amount: Number(payment?.transaction_amount || 0),
  };
}

function mapMpStatusToOrderStatus(status) {
  if (status === "approved" || status === "authorized") return "Pagamento aprovado";
  if (status === "rejected" || status === "cancelled" || status === "charged_back" || status === "refunded") {
    return "Pagamento recusado";
  }
  return "Aguardando pagamento";
}

async function forwardOrderUpdate(payload) {
  const targetUrl = process.env.ORDER_STATUS_WEBHOOK_URL;
  if (!targetUrl) return;

  try {
    await fetch(targetUrl, {
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

function response(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, x-signature, x-request-id",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    body: JSON.stringify(payload),
  };
}
