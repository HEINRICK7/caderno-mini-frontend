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
O Pixel da Meta é opcional e fica desativado sem `NEXT_PUBLIC_META_PIXEL_ID`. Use o ID numérico no `.env.local` durante o desenvolvimento e na variável `NEXT_PUBLIC_META_PIXEL_ID` do ambiente GitHub usado pelo deploy de produção. O workflow valida o formato e o injeta no build do container. Com o Pixel configurado, a medição fica desativada até o visitante permitir; o banner oferece rejeição e personalização e mantém um atalho para alterar ou revogar a escolha. O site registra PageView nas páginas institucionais e de modelos, `InitiateCheckout` ao iniciar um checkout e `Purchase` somente depois que a API confirma o pagamento pelo webhook validado da AbacatePay. Todos esses eventos dependem da permissão de medição salva neste navegador.

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

O navegador usa apenas os campos retornados por `/api/v1`. A API atual não fornece categorias ou tags no catálogo. Links públicos usam o caminho `/p/:slug` retornado pelo backend. Credenciais e configuração da AbacatePay permanecem no backend.

## Deploy na Hostinger

O deploy de produção é acionado somente por push em `main`, após CI verde e com `PRODUCTION_DEPLOY_ENABLED=true` nas variáveis do repositório. No ambiente GitHub `production`, configure `HOSTINGER_HOST`, `HOSTINGER_USER`, `HOSTINGER_SSH_PORT`, `HOSTINGER_APP_PATH`, `HOSTINGER_WEB_PORT` e `PUBLIC_URL`, além dos segredos `HOSTINGER_SSH_PRIVATE_KEY` e `HOSTINGER_KNOWN_HOSTS`. O caminho deve ser exclusivo e terminar em `/caderno-mini/frontend`; a porta deve estar livre e ligada somente ao loopback.

O workflow se recusa a sincronizar sobre uma pasta preenchida sem marcador Cadernô, não usa `rsync --delete`, não altera o proxy e só atualiza o projeto Docker `caderno-mini-production-frontend`. A rede privada `caderno-mini-production` deve ser criada pelo deploy do backend ou pelo próprio workflow. Faça o deploy do backend antes do frontend; o proxy HTTPS existente deve encaminhar o domínio para `127.0.0.1:HOSTINGER_WEB_PORT`. O workflow testa a saúde do container antes de concluir.

Não habilite o deploy nem altere domínio, proxy ou DNS até confirmar o destino no painel Hostinger. Isso mantém os outros sites e aplicações da VPS fora da área de deploy.
