import { getSiteUrl, jsonResponse, methodNotAllowed, mpRequestJson, simplifyMpError } from "./_utils.js";

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return jsonResponse({ ok: true });
  }

  if (request.method !== "GET") {
    return methodNotAllowed();
  }

  const provider = String(env.PAYMENT_PROVIDER || "mercado_pago");
  const siteUrl = getSiteUrl(env, request);
  const accessToken = String(env.MP_ACCESS_TOKEN || "");
  const webhookSecret = String(env.MP_WEBHOOK_SECRET || "");

  const diagnostic = {
    provider,
    siteUrl,
    env: {
      hasAccessToken: Boolean(accessToken),
      hasWebhookSecret: Boolean(webhookSecret),
      accessTokenPrefix: accessToken ? accessToken.slice(0, 8) : "",
      accessTokenLength: accessToken.length,
    },
    mercadoPago: {
      tokenValid: false,
      account: null,
      error: null,
    },
  };

  if (!accessToken) {
    return jsonResponse({
      ok: false,
      reason: "missing_access_token",
      diagnostic,
    });
  }

  try {
    const mp = await mpRequestJson("https://api.mercadopago.com/users/me", accessToken, {
      method: "GET",
    });

    if (!mp.ok) {
      diagnostic.mercadoPago.error = {
        status: mp.status,
        body: simplifyMpError(mp.data),
      };
      return jsonResponse({
        ok: false,
        reason: "invalid_or_unavailable_token",
        diagnostic,
      });
    }

    diagnostic.mercadoPago.tokenValid = true;
    diagnostic.mercadoPago.account = {
      id: mp.data?.id || null,
      nickname: mp.data?.nickname || "",
      email: mp.data?.email || "",
      countryId: mp.data?.country_id || "",
      siteStatus: mp.data?.site_status || "",
    };

    return jsonResponse({
      ok: true,
      reason: "diagnostic_success",
      diagnostic,
    });
  } catch (error) {
    diagnostic.mercadoPago.error = {
      status: "network_error",
      body: String(error?.message || error),
    };
    return jsonResponse({
      ok: false,
      reason: "network_error",
      diagnostic,
    });
  }
}

