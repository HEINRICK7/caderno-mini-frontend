# Evidências visuais dos 16 templates

Cada comparação mostra o PNG aprovado à esquerda e o cartão renderizado à direita, em largura de 430 px. Os previews de comparação usam fixtures exclusivas. No editor, os dados demonstrativos ficam separados em `definition.exampleData`, aparecem como ponto de partida e podem ser substituídos; somente os campos editáveis são enviados ao criar uma mensagem.

## Arquivos

- [`all-16-reference-comparisons.png`](./all-16-reference-comparisons.png): visão geral das 16 comparações lado a lado.
- [`all-16-personalized.png`](./all-16-personalized.png): visão geral dos 16 conteúdos personalizados, diferentes dos exemplos das referências.
- `{template}-comparison.webp`: comparação ampliada de cada template.
- `{template}-personalized.webp`: captura completa de cada conteúdo personalizado.
- [`responsive-check.json`](./responsive-check.json): medidas em 360, 390 e 430 px para cada template.

As telas foram capturadas com Google Chrome headless, aguardando as fontes locais e limitando o recorte ao cartão. O PNG de referência foi redimensionado para a mesma largura para a comparação. Os 48 registros responsivos confirmam largura do documento igual à janela e nenhum elemento interno fora da viewport. As capturas registram a comparação que orientou esta rodada; depois delas, o ajuste fino de boas-vindas, parcela próxima e Pix foi conferido na prévia local.

## Resultado e limites visuais

- Os 16 cartões usam os 16 recortes do sprite de status original, sem substituir as ilustrações 3D por emojis ou ícones genéricos. A pequena folha do Pix foi isolada do PNG 06 aprovado e aparece como sobreposição transparente na ilustração.
- A composição, as áreas de conteúdo, os painéis e as ações acompanham a estrutura de cada referência; textos longos podem aumentar a altura do cartão para continuar legíveis.
- Poppins e Manrope são servidas localmente. Como os PNGs não têm arquivo de design ou metadados de fonte, não é possível identificar a fonte que gerou cada raster. As capturas mostram a implementação usando as famílias escolhidas e os ajustes de tamanho, peso, tracking e espaçamento aplicados por template; diferenças de rasterização e algumas quebras de linha continuam possíveis.
- O QR do template de Pix nas capturas de referência é uma fixture de teste recortada do PNG. O preview publicado só mostra código ou QR entregues pela aplicação; este repositório não inclui integração com provedor Pix.

## Critérios funcionais relacionados

O editor atualiza o preview com os campos editáveis e um teste percorre os 16 templates com dados personalizados diferentes das referências. Os testes de frontend também cobrem variáveis, campos opcionais, segurança de texto, imagens, desconto e edição salva/reaberta. O domínio do backend valida estados de pagamento e saldo, coerência dos descontos e a posição do vencimento para os lembretes de parcela antes de publicar/exportar. Versões financeiras antigas sem estado verificável são bloqueadas em vez de serem tratadas como confirmadas. Os valores financeiros usados para demonstrar o visual não podem confirmar pagamento, quitação ou cobrança: a publicação continua sujeita ao estado validado pelo domínio.
