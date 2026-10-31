# Cadernô Express — Frontend

Aplicação web para criar cartões digitais personalizados e compartilhá-los por um link público. O backend Fastify é a fonte da verdade para modelos, rascunhos, pagamentos e publicações; o frontend não decide aprovação de pagamento nem acesso.

## Requisitos

- Node.js 24
- npm
- Backend local disponível em `http://localhost:3000`

## Desenvolvimento local

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Abra [http://localhost:3001](http://localhost:3001). O Next encaminha chamadas `/api/v1/*` para `API_BASE_URL`.
O link público de cada cartão vem do backend pela configuração `PUBLIC_APP_URL`; configure esse valor com a origem do frontend em cada ambiente.

As prévias no editor e na página pública são montadas em HTML/SVG a partir da composição e da paleta versionadas pelo backend. O frontend não exibe o PNG do endpoint de preview; o backend mantém a renderização PNG para exportação e para a prévia automática do link no WhatsApp.

## Validação

```bash
npm run lint
npm test
npm run typecheck
npm run build
```

O GitHub Actions executa essas etapas em pushes e pull requests para `dev`, `staging` e `main`.

## Contratos e decisões

- [Design técnico](docs/frontend-technical-design.md)
- [ADR 0001: Next.js App Router](docs/adr/0001-next-app-router.md)
- [Brand kit aprovado](CADERNO_EXPRESS_BRANDKIT/BRANDING_FRONTEND_MASTER.md)

O navegador usa apenas os campos retornados por `/api/v1`. A API atual não fornece categorias ou tags no catálogo. Links públicos usam o caminho `/p/:slug` retornado pelo backend. Segredos e configuração da Cakto permanecem no backend.
