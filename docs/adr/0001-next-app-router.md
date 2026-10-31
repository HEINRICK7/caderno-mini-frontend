# ADR 0001: Next.js App Router para o frontend

- **Status:** Aceita
- **Contexto:** As páginas públicas compartilhadas precisam ser renderizadas com metadados de Open Graph, enquanto o editor precisa de interações de formulário e integração com uma API Fastify separada.
- **Decisão:** Usar Next.js App Router com componentes de servidor para páginas públicas e metadados, e componentes de cliente apenas nas interações de catálogo, autenticação e edição. Encaminhar `/api/v1/*` por rewrite do servidor Next para a API.
- **Consequências:** URLs públicas podem renderizar o modelo completo e metadados a partir do slug; a UI deve validar dados recebidos e não replicar a autoridade de pagamento do backend. O servidor Next passa a ser parte do caminho de publicação e precisa compartilhar a configuração de domínio público com o backend.
