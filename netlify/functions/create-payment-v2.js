exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return response(200, { ok: true });
  }

  if (event.httpMethod !== "POST") {
    return response(405, { error: "Method Not Allowed" });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return response(400, { error: "JSON invalido." });
  }

  const provider = String(body.provider || process.env.PAYMENT_PROVIDER || "mercado_pago");
  const order = body.order || {};

  if (!order.id || !Array.isArray(order.items) || order.items.length === 0) {
    return response(400, { error: "Pedido invalido para pagamento." });
  }

  if (provider !== "mercado_pago") {
    return response(400, { error: "Gateway ainda nao configurado para este provider." });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return response(500, { error: "MP_ACCESS_TOKEN nao configurado no Netlify." });
  }

  const siteUrl = String(process.env.SITE_URL || "https://www.kellystudio.com.br").replace(/\/+$/, "");
  const paymentMethod = normalizePaymentMethod(order.paymentMethod);
  const safeEmail = getSafeEmail(order.customerEmail);
  const payerFirstName = String(order.customerName || "Cliente").trim().split(" ")[0] || "Cliente";
  const metadata = {
    order_id: order.id,
    customer_name: order.customerName || "",
    customer_phone: order.customerPhone || "",
    shipping_location: order.shippingLocation || "",
    payment_method_selected: paymentMethod,
  };

  try {
    if (paymentMethod === "pix") {
      const pixResult = await createPixPayment({
        accessToken,
        siteUrl,
        order,
        safeEmail,
        payerFirstName,
        metadata,
      });
      return response(200, pixResult);
    }

    const preferenceResult = await createCheckoutPreference({
      accessToken,
      siteUrl,
      order,
      paymentMethod,
      safeEmail,
      payerFirstName,
      metadata,
    });
    return response(200, preferenceResult);
  } catch (error) {
    return response(500, {
      error: "Falha inesperada ao criar pagamento.",
      details: String(error?.message || error),
    });
  }
};

async function createPixPayment({ accessToken, siteUrl, order, safeEmail, payerFirstName, metadata }) {
  const total = Number(order.total);
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("Total invalido para gerar Pix.");
  }

  const dateOfExpiration = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const payload = {
    transaction_amount: Number(total.toFixed(2)),
    description: `Pedido ${order.id} - Kelly Studio`,
    payment_method_id: "pix",
    payer: {
      email: safeEmail,
      first_name: payerFirstName,
    },
    external_reference: order.id,
    notification_url: `${siteUrl}/.netlify/functions/payment-webhook-v2`,
    date_of_expiration: dateOfExpiration,
    metadata,
  };

  const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `pix-${order.id}-${Date.now()}`,
    },
    body: JSON.stringify(payload),
  });

  const mpData = await mpRes.json();
  if (!mpRes.ok) {
    throw new Error(`Erro ao gerar Pix no Mercado Pago: ${JSON.stringify(mpData)}`);
  }

  const transactionData = mpData?.point_of_interaction?.transaction_data || {};
  const qrCode = String(transactionData.qr_code || "");
  const qrCodeBase64 = String(transactionData.qr_code_base64 || "");

  if (!qrCode) {
    throw new Error("Mercado Pago nao retornou codigo Pix.");
  }

  return {
    provider: "mercado_pago",
    paymentType: "pix",
    paymentId: mpData.id,
    status: mpData.status,
    qrCode,
    qrCodeBase64,
    ticketUrl: transactionData.ticket_url || "",
    expiresAt: mpData.date_of_expiration || dateOfExpiration,
  };
}

async function createCheckoutPreference({
  accessToken,
  siteUrl,
  order,
  paymentMethod,
  safeEmail,
  payerFirstName,
  metadata,
}) {
  const preferencePayload = {
    external_reference: order.id,
    statement_descriptor: "KELLYSTUDIO",
    notification_url: `${siteUrl}/.netlify/functions/payment-webhook-v2`,
    back_urls: {
      success: `${siteUrl}/?payment=success`,
      pending: `${siteUrl}/?payment=pending`,
      failure: `${siteUrl}/?payment=failure`,
    },
    auto_return: "approved",
    items: order.items.map((item) => ({
      title: item.name,
      quantity: Math.max(1, Number(item.qty) || 1),
      unit_price: Number(item.price) || 0,
      currency_id: "BRL",
    })),
    payer: {
      email: safeEmail,
      first_name: payerFirstName,
    },
    metadata,
  };

  if (paymentMethod === "card") {
    const installments = Math.min(12, Math.max(1, Number(order.installments) || 1));
    preferencePayload.payment_methods = {
      default_installments: installments,
      installments: 12,
      excluded_payment_types: [
        { id: "ticket" },
        { id: "atm" },
        { id: "bank_transfer" },
      ],
    };
  } else if (paymentMethod === "boleto") {
    preferencePayload.payment_methods = {
      excluded_payment_types: [{ id: "bank_transfer" }],
      excluded_payment_methods: [{ id: "pix" }],
    };
  }

  const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `pref-${order.id}-${Date.now()}`,
    },
    body: JSON.stringify(preferencePayload),
  });

  const mpData = await mpRes.json();
  if (!mpRes.ok) {
    throw new Error(`Erro ao criar checkout no Mercado Pago: ${JSON.stringify(mpData)}`);
  }

  return {
    provider: "mercado_pago",
    paymentType: paymentMethod,
    preferenceId: mpData.id,
    checkoutUrl: mpData.init_point,
    sandboxInitPoint: mpData.sandbox_init_point,
  };
}

function normalizePaymentMethod(value) {
  const method = String(value || "").toLowerCase();
  if (method === "pix" || method === "card" || method === "boleto") return method;
  return "card";
}

function getSafeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (email.includes("@")) return email;
  return "cliente@kellystudio.com.br";
}

function response(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    body: JSON.stringify(payload),
  };
}
