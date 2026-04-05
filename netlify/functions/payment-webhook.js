exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed"
    };
  }

  // Estrutura inicial: recepção do webhook.
  // Próximo passo recomendado:
  // 1) validar assinatura do provedor
  // 2) buscar detalhes do pagamento via API
  // 3) atualizar status do pedido no banco de dados
  console.log("payment-webhook:", event.body || "");

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true })
  };
};

