# Cadernô Express — Design técnico do frontend

## Objetivo

Construir a experiência de criação e compartilhamento de mensagens do Cadernô Express. O brand kit em `CADERNO_EXPRESS_BRANDKIT/` é a referência visual. Os contratos publicados pelo backend em `/api/v1` determinam quais dados, ações e estados a interface pode apresentar.

## Decisões

- Next.js App Router, React e TypeScript para a home e as telas do fluxo. As telas buscam dados do backend no navegador por `/api/v1/*`, encaminhado pelo Next.
- O navegador chama `/api/v1/*` na mesma origem do frontend; o Next encaminha essas chamadas para `API_BASE_URL`. Assim, os cookies de sessão HTTP-only permanecem sob controle do servidor.
- Páginas públicas usam a rota `/p/[slug]`, alinhada ao `publicPath` devolvido pelo backend. A página lê `/api/v1/publications/:slug` sem cache; a imagem é entregue por `/api/v1/publications/:slug.png`.
- Respostas e erros da API são validados em tempo de execução. Campos de edição são derivados exclusivamente de `template.definition.fields`; aparência é limitada a `template.definition.visual`.
- Nenhum fluxo de checkout, confirmação, licença ou publicação será decidido pelo browser. O frontend só exibe sucesso depois de consultar o status autenticado e obter a resposta de publicação do backend.
- CI roda lint, testes, verificação de tipos e build em pushes e pull requests para `dev`, `staging` e `main`.

## Rotas e contratos atuais

| Tela/fluxo | Contrato do backend |
|---|---|
| Catálogo | `GET /api/v1/templates` |
| Detalhe e validação | `GET /api/v1/templates/:id`; `POST /api/v1/templates/:id/validate` |
| Sessão por e-mail | `POST /api/v1/auth/magic-link`; `POST /api/v1/auth/verify`; `GET/DELETE /api/v1/auth/session` |
| Criar, recuperar e salvar rascunho | `POST /api/v1/drafts`; `GET/PUT /api/v1/drafts/:id` |
| Prévia gratuita | `GET /api/v1/drafts/:id/preview.png` |
| Checkout e situação | `POST /api/v1/checkout`; `GET /api/v1/purchases/:id` |
| Publicar/remover | `POST/PUT/DELETE /api/v1/drafts/:id/publication` |
| Mensagem pública e PNG | `GET /api/v1/publications/:slug`; `GET /api/v1/publications/:slug.png` |

## Limites de produto visíveis no contrato

- O catálogo devolve nome, descrição, definição e versão; não devolve segmento, tags, categorias nem ilustrações. Não separar Produtos/Serviços nem afirmar metadados até o backend fornecê-los.
- Campos suportados pelo domínio hoje: `text`, `textarea`, `number`, `boolean`, `select`, `url`, `color` e `date`. Os campos do editor vêm da definição retornada pelo backend.
- O rascunho é identificado por UUID e não há `editToken` no contrato. Não criar esse campo no frontend.
- Criar e editar rascunhos aceita usuário anônimo; checkout, consulta de compra e publicação exigem sessão. O frontend autentica por magic link ao receber `AUTH_REQUIRED` e solicita o checkout novamente. A confirmação por webhook associa o rascunho quando o e-mail da compra corresponde a um usuário existente.
- O contrato de checkout não permite ao frontend definir ou conferir o e-mail preenchido no checkout da Cakto. O cliente precisa usar o mesmo e-mail da sessão para que a associação prevista pelo backend funcione; esse vínculo não será simulado no frontend.
- O endpoint de status existe apenas para uma sessão proprietária. Retorno do checkout, query string ou aba de obrigado não substituem essa consulta.

## Segurança e dados

- Cookies de sessão são HTTP-only; nenhum token de sessão ou segredo Cakto é armazenado em `localStorage` ou enviado ao JavaScript.
- Requisições mutáveis preservam a origem do frontend e tratam erros estruturados `{ error: { code, message, details? } }`.
- Dados de rascunho e publicações são carregados sem cache para que atualizações, revogações e ausência de licença apareçam imediatamente.
- Links de compartilhamento são derivados de `publicUrl`/`publicPath` retornados pelo servidor. `navigator.share` e WhatsApp apenas abrem o compartilhamento no dispositivo do usuário.
- A tela pública `/p/[slug]` renderiza os valores publicados no React com os campos e tokens visuais presentes na definição atual do template; o frontend não interpreta HTML arbitrário vindo da API.

## Implantação

O host do frontend precisa encaminhar `/api/v1/*` ao backend. O backend deve configurar `PUBLIC_API_URL` com a origem pública do frontend para que `publicUrl` aponte à rota `/p/:slug`; o proxy do frontend deve encaminhar os caminhos `/api/v1/*` usados pelos metadados e pelas imagens ao backend. Credenciais de Cakto continuam exclusivamente no backend.
