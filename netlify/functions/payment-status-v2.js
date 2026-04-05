exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return response(200, { ok: true });
  }

  if (event.httpMethod !== "GET") {
    return response(405, { error: "Method Not Allowed" });
  }

  const orderId = String(event.queryStringParameters?.order_id || "").trim();
  if (!orderId) {
    return response(400, { error: "order_id e obrigatorio." });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return response(500, { error: "MP_ACCESS_TOKEN nao configurado no Netlify." });
  }

  try {
    const payment = await fetchLatestPaymentByOrderId(orderId, accessToken);
    if (!payment) {
      return response(200, {
        found: false,
        orderId,
        orderStatus: "Aguardando pagamento",
      });
    }

    const normalized = normalizePaymentStatus(payment);
    return response(200, {
      found: true,
      ...normalized,
    });
  } catch (error) {
    return response(500, {
      error: "Falha ao consultar status do pagamento.",
      details: String(error?.message || error),
    });
  }
};

async function fetchLatestPaymentByOrderId(orderId, accessToken) {
  const searchUrl =
    "https://api.mercadopago.com/v1/payments/search" +
    `?external_reference=${encodeURIComponent(orderId)}` +
    "&sort=date_created&criteria=desc&limit=1";

  const mpRes = await fetch(searchUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const data = await mpRes.json().catch(() => ({}));
  if (!mpRes.ok) {
    throw new Error(`Mercado Pago respondeu com erro: ${JSON.stringify(data)}`);
  }

  const results = Array.isArray(data.results) ? data.results : [];
  if (results.length === 0) return null;
  return results[0];
}

function normalizePaymentStatus(payment) {
  const mpStatus = String(payment?.status || "").toLowerCase();
  const orderStatus = mapMpStatusToOrderStatus(mpStatus);

  return {
    paymentId: String(payment?.id || ""),
    orderId: String(payment?.external_reference || ""),
    mpStatus,
    statusDetail: String(payment?.status_detail || ""),
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

function response(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
    body: JSON.stringify(payload),
  };
}
