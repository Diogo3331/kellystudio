# Webhook e Status Real (Mercado Pago)

## O que foi implementado

- `netlify/functions/payment-webhook-v2.js`
  - valida assinatura do webhook (quando `MP_WEBHOOK_SECRET` estiver configurado)
  - consulta pagamento real na API do Mercado Pago
  - normaliza status do pedido (`Aguardando pagamento`, `Pagamento aprovado`, `Pagamento recusado`)
  - opcionalmente encaminha atualizacao para outro endpoint (`ORDER_STATUS_WEBHOOK_URL`)

- `netlify/functions/payment-status-v2.js`
  - consulta o ultimo pagamento por `order_id` (external_reference)
  - retorna status real para o frontend

- `netlify/functions/create-payment-v2.js`
  - notificacao do Mercado Pago apontando para `payment-webhook-v2`

- Frontend (`js/script.js`)
  - sincroniza status real em `Meus pedidos` chamando `payment-status-v2`

## Variaveis de ambiente (Netlify)

- `PAYMENT_PROVIDER=mercado_pago`
- `MP_ACCESS_TOKEN=SEU_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET=SEU_WEBHOOK_SECRET`
- `SITE_URL=https://seu-site.netlify.app` (ou dominio final)
- `ORDER_STATUS_WEBHOOK_URL=` (opcional)

## Configurar webhook no Mercado Pago

1. Acesse seu painel Mercado Pago.
2. Configure notificacao para:
   - URL: `https://SEU_SITE/.netlify/functions/payment-webhook-v2`
   - Evento: pagamentos (`payment`)
3. Copie o segredo (secret key) do webhook.
4. Coloque esse segredo em `MP_WEBHOOK_SECRET` no Netlify.

## Como fica o fluxo

1. Cliente cria pagamento (Pix/Cartao).
2. Mercado Pago chama `payment-webhook-v2`.
3. Seu site sincroniza status real ao abrir `Meus pedidos`.
