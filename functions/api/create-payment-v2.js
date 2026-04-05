import {
  getSafeEmail,
  getSiteUrl,
  jsonResponse,
  mapMpStatusToOrderStatus,
  methodNotAllowed,
  mpRequestJson,
  normalizeCpf,
  normalizePaymentMethod,
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

  const body = parseJsonSafe(await request.text());
  const provider = String(body.provider || env.PAYMENT_PROVIDER || "mercado_pago");
  const order = body.order || {};

  if (!order.id || !Array.isArray(order.items) || order.items.length === 0) {
    return jsonResponse({ error: "Pedido invalido para pagamento." }, 400);
  }

  if (provider !== "mercado_pago") {
    return jsonResponse({ error: "Gateway ainda nao configurado para este provider." }, 400);
  }

  const accessToken = String(env.MP_ACCESS_TOKEN || "");
  if (!accessToken) {
    return jsonResponse({ error: "MP_ACCESS_TOKEN nao configurado no Cloudflare." }, 500);
  }

  const siteUrl = getSiteUrl(env, request);
  const paymentMethod = normalizePaymentMethod(order.paymentMethod);
  const safeEmail = getSafeEmail(order.customerEmail);
  const payerDocument = normalizeCpf(order.customerDocument || order.customerCpf || order.customer_document);
  const payerFirstName = String(order.customerName || "Cliente").trim().split(" ")[0] || "Cliente";
  const metadata = {
    order_id: order.id,
    customer_name: order.customerName || "",
    customer_phone: order.customerPhone || "",
    customer_document: payerDocument,
    shipping_location: order.shippingLocation || "",
    payment_method_selected: paymentMethod,
  };

  if (paymentMethod === "pix" && payerDocument.length !== 11) {
    return jsonResponse({ error: "Para pagar com Pix, informe um CPF valido com 11 digitos." }, 400);
  }

  try {
    if (paymentMethod === "pix") {
      const pixResult = await createPixPayment({
        accessToken,
        siteUrl,
        order,
        safeEmail,
        payerFirstName,
        payerDocument,
        metadata,
      });
      return jsonResponse(pixResult);
    }

    const preferenceResult = await createCheckoutPreference({
      accessToken,
      siteUrl,
      order,
      paymentMethod,
      safeEmail,
      payerFirstName,
      payerDocument,
      metadata,
    });
    return jsonResponse(preferenceResult);
  } catch (error) {
    const errorMessage = String(error?.message || error || "Falha inesperada ao criar pagamento.");
    return jsonResponse({ error: errorMessage, details: errorMessage }, 500);
  }
}

async function createPixPayment({ accessToken, siteUrl, order, safeEmail, payerFirstName, payerDocument, metadata }) {
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
      last_name: "Cliente",
      identification: {
        type: "CPF",
        number: payerDocument,
      },
    },
    external_reference: order.id,
    notification_url: `${siteUrl}/api/payment-webhook-v2`,
    date_of_expiration: dateOfExpiration,
    metadata,
  };

  const mp = await mpRequestJson("https://api.mercadopago.com/v1/payments", accessToken, {
    method: "POST",
    body: payload,
    idempotencyKey: `pix-${order.id}-${Date.now()}`,
  });

  if (!mp.ok) {
    throw new Error(`Mercado Pago PIX [${mp.status}]: ${stringifyMpError(mp.data)}`);
  }

  const transactionData = mp.data?.point_of_interaction?.transaction_data || {};
  const qrCode = String(transactionData.qr_code || "");
  const qrCodeBase64 = String(transactionData.qr_code_base64 || "");

  if (!qrCode) {
    throw new Error("Mercado Pago nao retornou codigo Pix.");
  }

  return {
    provider: "mercado_pago",
    paymentType: "pix",
    paymentId: mp.data.id,
    status: mp.data.status,
    orderStatus: mapMpStatusToOrderStatus(mp.data.status),
    qrCode,
    qrCodeBase64,
    ticketUrl: transactionData.ticket_url || "",
    expiresAt: mp.data.date_of_expiration || dateOfExpiration,
  };
}

async function createCheckoutPreference({
  accessToken,
  siteUrl,
  order,
  paymentMethod,
  safeEmail,
  payerFirstName,
  payerDocument,
  metadata,
}) {
  const payload = {
    external_reference: order.id,
    statement_descriptor: "KELLYSTUDIO",
    notification_url: `${siteUrl}/api/payment-webhook-v2`,
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
      ...(payerDocument
        ? {
            identification: {
              type: "CPF",
              number: payerDocument,
            },
          }
        : {}),
    },
    metadata,
  };

  if (paymentMethod === "card") {
    const installments = Math.min(12, Math.max(1, Number(order.installments) || 1));
    payload.payment_methods = {
      default_installments: installments,
      installments: 12,
      excluded_payment_types: [{ id: "ticket" }, { id: "atm" }, { id: "bank_transfer" }],
    };
  } else if (paymentMethod === "boleto") {
    payload.payment_methods = {
      excluded_payment_types: [{ id: "bank_transfer" }],
      excluded_payment_methods: [{ id: "pix" }],
    };
  }

  const mp = await mpRequestJson("https://api.mercadopago.com/checkout/preferences", accessToken, {
    method: "POST",
    body: payload,
    idempotencyKey: `pref-${order.id}-${Date.now()}`,
  });

  if (!mp.ok) {
    throw new Error(`Mercado Pago Checkout [${mp.status}]: ${stringifyMpError(mp.data)}`);
  }

  return {
    provider: "mercado_pago",
    paymentType: paymentMethod,
    preferenceId: mp.data.id,
    checkoutUrl: mp.data.init_point,
    sandboxInitPoint: mp.data.sandbox_init_point,
  };
}

