function parseRequestBody(req) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return "";
  }

  if (typeof req.body === "string") {
    return req.body;
  }

  if (req.body == null) {
    return "";
  }

  try {
    return JSON.stringify(req.body);
  } catch {
    return "";
  }
}

function normalizeHeaders(headers = {}) {
  const normalized = {};
  for (const [key, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      normalized[key] = value.join(", ");
    } else if (value != null) {
      normalized[key] = String(value);
    }
  }
  return normalized;
}

function normalizeQuery(query = {}) {
  const normalized = {};
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      normalized[key] = value[0];
    } else if (value != null) {
      normalized[key] = String(value);
    }
  }
  return normalized;
}

async function runNetlifyHandler(req, res, netlifyHandler) {
  const event = {
    httpMethod: req.method,
    headers: normalizeHeaders(req.headers),
    queryStringParameters: normalizeQuery(req.query),
    body: parseRequestBody(req),
  };

  const result = await netlifyHandler(event);
  const statusCode = Number(result?.statusCode || 200);
  const headers = result?.headers || {};
  const body = result?.body ?? "";

  Object.entries(headers).forEach(([key, value]) => {
    if (value != null) {
      res.setHeader(key, value);
    }
  });

  res.status(statusCode).send(body);
}

module.exports = {
  runNetlifyHandler,
};

