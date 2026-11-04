# Auditoria de prontidão para produção — 2026-11-04

## Estado

Frontend e backend estão publicados em `main`. A política de reembolso foi confirmada na documentação da Cakto, os produtos e checkouts foram comparados com a configuração de produção, e os fluxos de pagamento foram revisados. A integração ainda tem três verificações externas pendentes: garantia explícita nos produtos, entrega de teste do webhook e configuração do Meta Pixel.

## Política da Cakto

A [Central de Ajuda da Cakto](https://ajuda.cakto.com.br/pt-br/articles/116-como-pedir-reembolso-de-uma-compra) informa que o comprador pode solicitar reembolso em até sete dias corridos. No fluxo automático, a Cakto processa o estorno em até 24 horas; o acesso continua ativo durante esse período, e o comprador pode cancelar a solicitação. O artigo também documenta que algumas compras são encaminhadas ao produtor.

O aviso publicado no frontend apresenta esses dois fluxos e está em [plan-terms-notice.tsx](../src/components/plan-terms-notice.tsx). Ele é usado na página inicial, nos planos, no fluxo de criação e nas páginas de modelo.

## Produtos e checkouts Cakto

Dados conferidos via MCP oficial da Cakto em produção em 2026-11-04. Os IDs de produto e URLs abaixo também correspondem às variáveis de produção do backend.

| Plano | Produto | Oferta padrão | Checkout padrão | URL configurada | Verificação |
|---|---|---|---:|---|---|
| Anual, acesso por 12 meses | `0a728d53-2cd0-4e01-9a2b-2eda7a233ac3`, ativo, BRL 33,50, pagamento único | `fjosmuq`, ativo, intervalo `year`, 1 | `1273751` | `https://pay.cakto.com.br/fjosmuq_1273751` | HTTP 200; ID e preço correspondem |
| Vitalício | `d74e1d7c-3200-4ff5-b074-4789940fb621`, ativo, BRL 67,00, pagamento único | `34d9gvc`, ativo, intervalo `lifetime`, 1 | `1271612` | `https://pay.cakto.com.br/34d9gvc_1271612` | HTTP 200; ID e preço correspondem |

O schema da [API de produtos da Cakto](https://docs.cakto.com.br/api-reference/products/retrieve.md) define o campo `guarantee` como o número de dias aceitos para reembolso. A leitura atual dos dois produtos não retornou esse campo. Há um preview MCP pronto para definir `guarantee: 7` nos dois produtos; a alteração não foi executada e aguarda aprovação explícita.

## Webhook e estado do acesso

- Webhook Cakto `80994`, ativo, recebe em `https://api.caderno-express.otimizanegocio.com/api/v1/webhooks/cakto` e inclui os dois produtos.
- Eventos inscritos incluem `purchase_approved`, `refund`, `refund_requested` e `chargeback`.
- O backend só concede acesso após compra aprovada com estado `paid`. Uma solicitação de reembolso não revoga acesso; o estorno confirmado e o chargeback aplicam as transições de acesso correspondentes. O plano anual expira após 12 meses; o vitalício não tem expiração.
- O [histórico oficial de eventos da Cakto](https://docs.cakto.com.br/api-reference/webhooks/event-history.md) retorna zero entregas para a conta no momento da auditoria. O preview de um evento `refund_requested` para testar a entrega está pronto, mas não foi enviado porque registra um evento de teste em produção e aguarda aprovação.
- A central de ajuda da Cakto confirmou a política pelo artigo oficial. A busca do índice da central via MCP falhou; a página oficial foi consultada diretamente.

## Meta Pixel e Facebook Ads

- O componente [meta-pixel.tsx](../src/components/meta-pixel.tsx) exige consentimento antes de carregar o Pixel ou enviar `PageView`, `InitiateCheckout` e `Purchase`.
- A variável `NEXT_PUBLIC_META_PIXEL_ID` não está configurada no ambiente de produção. A página publicada não carrega `connect.facebook.net` nem `fbq`.
- O conector Windsor.ai não tem uma conta Facebook/Meta conectada. Não foi encontrado um ID de Pixel nem uma sessão autorizada do Events Manager.
- O Pixel não foi criado nem ativado. A configuração aguarda o ID numérico do Pixel ou acesso autorizado ao Events Manager.

## Painel administrativo

O endpoint autenticado de listagem de clientes tinha um erro 500 reportado anteriormente. O código atual contém as correções de consulta SQLite; foi adicionado o teste de integração [admin-users-api.test.ts](https://github.com/HEINRICK7/caderno-mini-backend/blob/main/apps/api/tests/integration/admin-users-api.test.ts), cobrindo autenticação administrativa, filtro e resposta resumida dos clientes. A rota passou localmente. Não foi feita uma consulta autenticada à lista em produção nesta auditoria.

## Validação e deploys

- Frontend: 57 testes, lint, typecheck e build passaram. [CI e deploy de produção](https://github.com/HEINRICK7/caderno-mini-frontend/actions/runs/41832372304) concluídos com sucesso; commit `660b58a`.
- Backend: 70 testes unitários, 53 de integração, 1 end-to-end, lint e build passaram. [PR #23](https://github.com/HEINRICK7/caderno-mini-backend/pull/23) foi mesclado; [CI e deploy de produção](https://github.com/HEINRICK7/caderno-mini-backend/actions/runs/41834076343) concluídos com sucesso; commit `21f9cf1`.
- Frontend público e API de saúde responderam HTTP 200 após os deploys.

## Pendências para a próxima fase

1. Aprovar ou recusar a configuração `guarantee: 7` nos dois produtos Cakto.
2. Aprovar ou recusar o envio do evento de teste `refund_requested` ao webhook de produção.
3. Fornecer o ID numérico do Meta Pixel ou disponibilizar acesso autorizado ao Events Manager.
4. Se necessário confirmar o erro anterior com dados reais, abrir o painel `/admin` autenticado e validar a listagem contra a base de produção.
