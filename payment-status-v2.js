import { jsonResponse, mapMpStatusToOrderStatus, methodNotAllowed, mpRequestJson, stringifyMpError } from "./_utils.js";

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return jsonResponse({ ok: true });
  }

  if (request.method !== "GET") {
    return methodNotAllowed();
  }

  const orderId = String(new URL(request.url).searchParams.get("order_id") || "").trim();
  if (!orderId) {
    return jsonResponse({ error: "order_id e obrigatorio." }, 400);
  }

  const accessToken = String(env.MP_ACCESS_TOKEN || "");
  if (!accessToken) {
    return jsonResponse({ error: "MP_ACCESS_TOKEN nao configurado no Cloudflare." }, 500);
  }

  try {
    const searchUrl =
      "https://api.mercadopago.com/v1/payments/search" +
      `?external_reference=${encodeURIComponent(orderId)}` +
      "&sort=date_created&criteria=desc&limit=1";

    const mp = await mpRequestJson(searchUrl, accessToken, { method: "GET" });
    if (!mp.ok) {
      throw new Error(`Mercado Pago Search [${mp.status}]: ${stringifyMpError(mp.data)}`);
    }

    const results = Array.isArray(mp.data?.results) ? mp.data.results : [];
    if (results.length === 0) {
      return jsonResponse({
        found: false,
        orderId,
        orderStatus: "Aguardando pagamento",
      });
    }

    const payment = results[0];
    const mpStatus = String(payment?.status || "").toLowerCase();

    return jsonResponse({
      found: true,
      paymentId: String(payment?.id || ""),
      orderId: String(payment?.external_reference || ""),
      mpStatus,
      statusDetail: String(payment?.status_detail || ""),
      orderStatus: mapMpStatusToOrderStatus(mpStatus),
      paymentMethod: String(payment?.payment_method_id || ""),
      approvedAt: payment?.date_approved || "",
      updatedAt: payment?.date_last_updated || payment?.date_created || "",
      amount: Number(payment?.transaction_amount || 0),
    });
  } catch (error) {
    return jsonResponse(
      {
        error: "Falha ao consultar status do pagamento.",
        details: String(error?.message || error),
      },
      500
    );
  }
}

