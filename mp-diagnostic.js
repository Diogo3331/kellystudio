exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return response(200, { ok: true });
  }

  if (event.httpMethod !== "GET") {
    return response(405, { error: "Method Not Allowed" });
  }

  const provider = String(process.env.PAYMENT_PROVIDER || "mercado_pago");
  const siteUrl = String(process.env.SITE_URL || "").replace(/\/+$/, "");
  const accessToken = String(process.env.MP_ACCESS_TOKEN || "");
  const webhookSecret = String(process.env.MP_WEBHOOK_SECRET || "");

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
    return response(200, {
      ok: false,
      reason: "missing_access_token",
      diagnostic,
    });
  }

  try {
    const mpRes = await fetch("https://api.mercadopago.com/users/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const mpData = await mpRes.json().catch(() => ({}));

    if (!mpRes.ok) {
      diagnostic.mercadoPago.error = {
        status: mpRes.status,
        body: simplifyMpError(mpData),
      };
      return response(200, {
        ok: false,
        reason: "invalid_or_unavailable_token",
        diagnostic,
      });
    }

    diagnostic.mercadoPago.tokenValid = true;
    diagnostic.mercadoPago.account = {
      id: mpData?.id || null,
      nickname: mpData?.nickname || "",
      email: mpData?.email || "",
      countryId: mpData?.country_id || "",
      siteStatus: mpData?.site_status || "",
    };

    return response(200, {
      ok: true,
      reason: "diagnostic_success",
      diagnostic,
    });
  } catch (error) {
    diagnostic.mercadoPago.error = {
      status: "network_error",
      body: String(error?.message || error),
    };

    return response(200, {
      ok: false,
      reason: "network_error",
      diagnostic,
    });
  }
};

function simplifyMpError(data) {
  if (!data || typeof data !== "object") return data;
  return {
    message: data.message || "",
    error: data.error || "",
    status: data.status || "",
    cause: Array.isArray(data.cause) ? data.cause : [],
  };
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
