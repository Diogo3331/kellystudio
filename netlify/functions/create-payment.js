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
    return response(400, { error: "JSON inválido." });
  }

  const provider = body.provider || process.env.PAYMENT_PROVIDER || "mercado_pago";
  const order = body.order || {};

  if (!order.id || !Array.isArray(order.items) || order.items.length === 0) {
    return response(400, { error: "Pedido inválido para pagamento." });
  }

  if (provider !== "mercado_pago") {
    return response(400, { error: "Gateway ainda não configurado para este provider." });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return response(500, { error: "MP_ACCESS_TOKEN não configurado no Netlify." });
  }

  const siteUrl = process.env.SITE_URL || "https://www.kellystudio.com.br";
  const safeEmail = String(order.customerEmail || "").trim() || "cliente@kellystudio.com.br";

  const preferencePayload = {
    external_reference: order.id,
    statement_descriptor: "KELLYSTUDIO",
    notification_url: `${siteUrl}/.netlify/functions/payment-webhook`,
    back_urls: {
      success: `${siteUrl}/?payment=success`,
      pending: `${siteUrl}/?payment=pending`,
      failure: `${siteUrl}/?payment=failure`
    },
    auto_return: "approved",
    items: order.items.map((item) => ({
      title: item.name,
      quantity: Number(item.qty) || 1,
      unit_price: Number(item.price) || 0,
      currency_id: "BRL"
    })),
    payer: {
      email: safeEmail,
      first_name: String(order.customerName || "").split(" ")[0] || "Cliente"
    },
    metadata: {
      order_id: order.id,
      customer_name: order.customerName || "",
      customer_phone: order.customerPhone || "",
      shipping_location: order.shippingLocation || "",
      payment_method_selected: order.paymentMethod || ""
    }
  };

  try {
    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preferencePayload)
    });

    const mpData = await mpRes.json();
    if (!mpRes.ok) {
      return response(502, {
        error: "Erro ao criar checkout no Mercado Pago.",
        details: mpData
      });
    }

    return response(200, {
      provider: "mercado_pago",
      preferenceId: mpData.id,
      checkoutUrl: mpData.init_point,
      sandboxInitPoint: mpData.sandbox_init_point
    });
  } catch (error) {
    return response(500, {
      error: "Falha inesperada ao criar pagamento.",
      details: String(error?.message || error)
    });
  }
};

function response(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    },
    body: JSON.stringify(payload)
  };
}
