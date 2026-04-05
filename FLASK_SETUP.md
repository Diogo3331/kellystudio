# Flask + Mercado Pago

## O que foi preparado

- Backend Flask em `backend/app.py`
- Rotas prontas:
  - `POST /api/create-payment-v2`
  - `GET /api/payment-status-v2`
  - `POST /api/payment-webhook-v2`
  - `GET /api/health`

## Variaveis necessarias

Crie um arquivo `.env` na raiz com:

```env
PAYMENT_PROVIDER=mercado_pago
MP_ACCESS_TOKEN=APP_USR-SEU_TOKEN_DE_PRODUCAO
MP_WEBHOOK_SECRET=
SITE_URL=http://127.0.0.1:5000
FRONTEND_ORIGIN=http://127.0.0.1:5500
ORDER_STATUS_WEBHOOK_URL=
PORT=5000
```

## Como rodar

1. Instale Python 3.
2. No terminal, na pasta do projeto:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python backend\app.py
```

3. Abra seu front em um servidor local.
4. O site vai chamar o Flask em `http://127.0.0.1:5000/api`.

## Mercado Pago

Para teste local, o Pix e o checkout funcionam, mas o webhook automatico nao consegue bater em `localhost`.

No webhook de producao ou teste publicado, use:

```text
https://SEU_BACKEND_PUBLICO/api/payment-webhook-v2
```

## Publicar no Render

Os arquivos `render.yaml` e `Procfile` ja foram preparados.

1. Suba este projeto para um repositorio Git.
2. No Render, clique em `New +` > `Blueprint`.
3. Conecte o repositorio.
4. O Render vai ler o `render.yaml` e criar o servico `kellystudio-api`.
5. Preencha as variaveis:

```env
PAYMENT_PROVIDER=mercado_pago
SITE_URL=https://SEU_BACKEND.onrender.com
FRONTEND_ORIGIN=https://kellystudio.netlify.app
MP_ACCESS_TOKEN=APP_USR-SEU_TOKEN_DE_PRODUCAO
MP_WEBHOOK_SECRET=SEU_SEGREDO_WEBHOOK
ORDER_STATUS_WEBHOOK_URL=
```

6. Publique o servico.
7. No Mercado Pago, configure o webhook com:

```text
https://SEU_BACKEND.onrender.com/api/payment-webhook-v2
```

8. No arquivo `site-config.js`, troque para:

```js
window.KELLY_RUNTIME_CONFIG = {
  paymentApiBase: "https://SEU_BACKEND.onrender.com/api",
};
```

9. Publique novamente o front na Netlify para ele passar a usar o Flask em producao.

## Importante

- Se seu site continuar na Netlify, o Flask precisa ficar publicado em outro lugar, como Render, Railway ou VPS.
- O `SITE_URL` deve apontar para a URL publica do backend Flask, nao para a Netlify, quando voce migrar de vez.
