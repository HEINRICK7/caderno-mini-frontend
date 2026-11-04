# Auditoria de prontidão para produção — 2026-11-04

## Estado

Frontend e backend estão publicados em `main`. A política de reembolso foi confirmada na documentação da Cakto, os produtos e checkouts foram comparados com a configuração de produção, e os fluxos de pagamento foram revisados. A página de vendas do produto Anual foi preenchida e confirmada na Cakto. Restam quatro itens: garantia explícita nos produtos, entrega de teste do webhook, configuração do Meta Pixel e validação autenticada da lista de clientes em produção.

Revalidação em 2026-11-04 às 13:20 UTC: homepage, rotas `/como-funciona`, `/para-seu-negocio`, `/depoimentos`, `/templates`, `/entrar`, `/conta` e `/admin`, API de saúde e os dois links de checkout responderam HTTP 200. As leituras MCP de produção confirmaram os dois produtos, ofertas, checkouts padrão e o webhook abaixo. O histórico de eventos da Cakto continuava vazio.

## Política da Cakto

A [Central de Ajuda da Cakto](https://ajuda.cakto.com.br/pt-br/articles/116-como-pedir-reembolso-de-uma-compra) (lida novamente via MCP às 13:11 UTC) informa que o comprador pode solicitar reembolso em até sete dias corridos. No fluxo automático, o reembolso integral é processado em até 24 horas sem depender de aprovação do produtor; o acesso continua ativo durante esse período, e o comprador pode cancelar a solicitação. Para compras que exibem a opção de reembolso com o produtor, o portal fornece o contato para tratar o pedido. O artigo diz que não existe opção de recusar um pedido feito dentro dos sete dias.

O aviso publicado no frontend apresenta esses dois fluxos e está em [plan-terms-notice.tsx](../src/components/plan-terms-notice.tsx). Ele é usado na página inicial, nos planos, no fluxo de criação e nas páginas de modelo.

## Produtos e checkouts Cakto

Dados conferidos via MCP oficial da Cakto em produção em 2026-11-04 às 13:11–13:12 UTC. Os IDs de produto e URLs abaixo também correspondem às variáveis de produção do backend. As ofertas e checkouts foram lidos individualmente; os checkouts são os padrões e cada um contém a oferta correspondente.

| Plano | Produto | Oferta padrão | Checkout padrão | URL configurada | Verificação |
|---|---|---|---:|---|---|
| Anual, acesso por 12 meses | `0a728d53-2cd0-4e01-9a2b-2eda7a233ac3`, ativo, BRL 33,50, pagamento único | `fjosmuq`, ativa e padrão, intervalo `year`, 1 | `1273751`, padrão, contém `fjosmuq` | `https://pay.cakto.com.br/fjosmuq_1273751` | HTTP 200; produto, oferta, checkout e variável do backend correspondem |
| Vitalício | `d74e1d7c-3200-4ff5-b074-4789940fb621`, ativo, BRL 67,00, pagamento único | `34d9gvc`, ativa e padrão, intervalo `lifetime`, 1 | `1271612`, padrão, contém `34d9gvc` | `https://pay.cakto.com.br/34d9gvc_1271612` | HTTP 200; produto, oferta, checkout e variável do backend correspondem |

O schema da [API de produtos da Cakto](https://docs.cakto.com.br/api-reference/products/retrieve.md) define o campo `guarantee` como o número de dias aceitos para reembolso. As leituras atuais dos dois produtos não retornaram esse campo. Há um preview MCP pronto para definir `guarantee: 7` nos dois produtos; a alteração não foi executada e aguarda aprovação explícita.

O campo `salesPage` dos produtos Anual e Vitalício aponta para `https://caderno-express.otimizanegocio.com/`. Em 2026-11-04 às 18:06 UTC, após aprovação, a Cakto confirmou o PATCH do produto Anual (`0a728d53-2cd0-4e01-9a2b-2eda7a233ac3`) e retornou o valor salvo. Nenhum outro campo do produto foi alterado nesta operação.

## Webhook e estado do acesso

- Webhook Cakto `80994`, ativo, relido via MCP às 13:12 UTC, recebe em `https://api.caderno-express.otimizanegocio.com/api/v1/webhooks/cakto` e inclui os dois produtos.
- Eventos inscritos incluem `purchase_approved`, `refund`, `refund_requested` e `chargeback`.
- O backend só concede acesso após compra aprovada com estado `paid`. Uma solicitação de reembolso não revoga acesso; o estorno confirmado e o chargeback aplicam as transições de acesso correspondentes. O plano anual expira após 12 meses; o vitalício não tem expiração.
- O [histórico oficial de eventos da Cakto](https://docs.cakto.com.br/api-reference/webhooks/event-history.md) retornou zero entregas na consulta de 13:11 UTC. Assim, produto e endpoint estão conectados na configuração, mas ainda não há prova de uma entrega ponta a ponta. O preview de um evento `refund_requested` para testar a entrega está pronto, mas não foi enviado porque registra um evento de teste em produção e aguarda aprovação.
- A central de ajuda da Cakto confirmou a política pelo artigo oficial. A busca do índice da central via MCP falhou; a página oficial foi consultada diretamente.

## Meta Pixel e Facebook Ads

- O componente [meta-pixel.tsx](../src/components/meta-pixel.tsx) exige consentimento antes de carregar o Pixel ou enviar `PageView`, `InitiateCheckout` e `Purchase`.
- A variável `NEXT_PUBLIC_META_PIXEL_ID` não está configurada no ambiente de produção. A página publicada não carrega `connect.facebook.net` nem `fbq`.
- O conector Windsor.ai não tem uma conta Facebook/Meta conectada. Não foi encontrado um ID de Pixel nem uma sessão autorizada do Events Manager.
- O Pixel não foi criado nem ativado. A configuração aguarda o ID numérico do Pixel ou acesso autorizado ao Events Manager.

## Painel administrativo

O endpoint autenticado de listagem de clientes tinha um erro 500 reportado anteriormente. O código atual contém as correções de consulta SQLite; foi adicionado o teste de integração [admin-users-api.test.ts](https://github.com/HEINRICK7/caderno-mini-backend/blob/main/apps/api/tests/integration/admin-users-api.test.ts), cobrindo autenticação administrativa, filtro e resposta resumida dos clientes. A rota passou localmente. Não foi feita uma consulta autenticada à lista em produção nesta auditoria.

## Validação e deploys

- Frontend: 57 testes, lint, typecheck e build passaram. O código da política está em `660b58a`; o relatório anterior `3494289` também passou verificação e deploy no [CI de produção](https://github.com/HEINRICK7/caderno-mini-frontend/actions/runs/41836123052). Frontend revalidado com HTTP 200.
- Backend: 70 testes unitários, 53 de integração, 1 end-to-end, lint e build passaram. [PR #23](https://github.com/HEINRICK7/caderno-mini-backend/pull/23) foi mesclado; [CI e deploy de produção](https://github.com/HEINRICK7/caderno-mini-backend/actions/runs/41834076343) concluídos com sucesso; commit `21f9cf1`.
- Rotas públicas principais, rota `/admin`, API de saúde e os dois checkouts responderam HTTP 200 na revalidação de 13:20 UTC. A resposta HTTP 200 da rota `/admin` não comprova a listagem autenticada de clientes, que não foi consultada em produção.

## Pendências para a próxima fase

1. Aprovar ou recusar a configuração `guarantee: 7` nos dois produtos Cakto.
2. Aprovar ou recusar o envio do evento de teste `refund_requested` ao webhook de produção.
3. Fornecer o ID numérico do Meta Pixel ou disponibilizar acesso autorizado ao Events Manager.
4. Abrir o painel `/admin` autenticado e validar a listagem de clientes contra a base de produção.
