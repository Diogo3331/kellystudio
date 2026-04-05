# Estrutura de Pagamentos (Netlify + Mercado Pago)

Esta loja já está com a base pronta para iniciar pagamentos com checkout seguro.

## O que já foi criado

- Frontend chama `/.netlify/functions/create-payment` ao confirmar pedido.
- Função serverless cria checkout no Mercado Pago (`checkout/preferences`).
- Webhook inicial em `/.netlify/functions/payment-webhook`.
- Configuração Netlify Functions em `netlify.toml`.

## 1) Configurar variáveis no Netlify

No painel do Netlify, em `Site configuration > Environment variables`, adicione:

- `PAYMENT_PROVIDER=mercado_pago`
- `MP_ACCESS_TOKEN=SEU_ACCESS_TOKEN_DO_MERCADO_PAGO`
- `SITE_URL=https://seu-site.netlify.app` (ou domínio final)

## 2) Publicar

Faça deploy normalmente no Netlify.

## 3) Testar fluxo

1. Adicione itens no carrinho.
2. Vá para checkout.
3. Informe CEP, nome, telefone e e-mail.
4. Clique em `Confirmar pedido`.
5. O sistema abre o checkout do Mercado Pago em nova aba.

## 4) Próximo passo recomendado (produção)

- Validar assinatura do webhook.
- Persistir pedidos e status em banco (Supabase/Firebase/Planetscale).
- Atualizar status dos pedidos automaticamente via webhook.
- Criar página de retorno (`success`, `pending`, `failure`) com UX melhor.

