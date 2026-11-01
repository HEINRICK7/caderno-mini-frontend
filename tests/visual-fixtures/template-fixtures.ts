import type { TemplateDefinition } from "../../src/lib/api-contracts";

export const referenceFixtures: Record<string, Record<string, unknown>> = {
  "boas-vindas": {
    recipientName: "Maria",
    title: "Olá, {nome_cliente}!",
    highlightedText: "Que bom ter você por aqui!",
    message: "Estamos felizes em ter você com a gente.\nConte conosco sempre que precisar.",
    detail1Value: "Atendimento próximo",
    detail2Value: "Qualidade em cada detalhe",
    detail3Value: "Pagamento facilitado",
    primaryActionLabel: "Falar com a loja",
    actionLink: "https://visual.example/welcome",
  },
  "agradecimento-compra": {
    recipientName: "Maria",
    title: "Obrigado, {nome_cliente}!",
    highlightedText: "Sua compra foi um sucesso.",
    message: "Agradecemos pela confiança.\nFoi um prazer atender você!",
    detailLabel1: "Produto",
    detailLabel2: "Valor da compra",
    productName: "Conjunto de mesa",
    purchaseAmount: 350,
    primaryActionLabel: "Ver detalhes da compra",
    purchaseLink: "https://visual.example/pedido",
  },
  "parcela-proxima": {
    recipientName: "Maria",
    title: "Olá, {nome_cliente}!",
    subtitle: "Sua parcela vence em",
    highlightedText: "3 dias.",
    detailLabel1: "Valor da parcela",
    detailLabel2: "Vencimento",
    detailLabel3: "Parcela",
    installmentAmount: 70,
    dueDate: "2026-12-04",
    installmentNumber: 1,
    installmentTotal: 4,
    primaryActionLabel: "Ver cobrança",
    paymentLink: "https://visual.example/cobranca",
  },
  "parcela-hoje": {
    recipientName: "Maria",
    title: "Olá, {nome_cliente}!",
    subtitle: "Sua parcela",
    highlightedText: "vence hoje.",
    detailLabel1: "Valor da parcela",
    detailLabel2: "Vencimento",
    detailLabel3: "Parcela",
    installmentAmount: 70,
    dueDate: "2026-12-04",
    installmentNumber: 1,
    installmentTotal: 4,
    primaryActionLabel: "Pagar agora",
    paymentLink: "https://visual.example/pagar",
  },
  "parcela-atrasada": {
    recipientName: "Maria",
    title: "Olá, {nome_cliente}!",
    subtitle: "Sua parcela está",
    highlightedText: "em aberto.",
    message: "Se você já pagou, pode desconsiderar este lembrete.",
    detailLabel1: "Valor da parcela",
    detailLabel2: "Vencimento",
    detailLabel3: "Parcela",
    installmentAmount: 70,
    dueDate: "2026-12-04",
    installmentNumber: 1,
    installmentTotal: 4,
    primaryActionLabel: "Ver cobrança",
    paymentLink: "https://visual.example/cobranca",
  },
  "cobranca-pix": {
    recipientName: "Maria",
    title: "Olá, {nome_cliente}!",
    highlightedText: "Seu Pix está pronto.",
    message: "Sua cobrança está disponível para pagamento.",
    detailLabel1: "Valor da parcela",
    detailLabel2: "Vencimento",
    detailLabel3: "Parcela",
    detailLabel4: "Escaneie o código ou copie o Pix.",
    pixSecurityNote: "Pague com segurança.",
    amount: 70,
    dueDate: "2026-12-04",
    installmentNumber: 1,
    installmentTotal: 4,
    pixCopyPaste: "TEST_ONLY_NOT_PAYABLE_REFERENCE_FIXTURE",
    primaryActionLabel: "Copiar código Pix",
  },
  "pagamento-confirmado": {
    recipientName: "Maria",
    title: "Pagamento",
    highlightedText: "confirmado!",
    message: "Recebemos o pagamento da sua parcela.",
    detailLabel1: "Valor pago",
    detailLabel2: "Data do pagamento",
    detailLabel3: "Parcela",
    amount: 70,
    paidAt: "2026-12-02",
    installmentNumber: 1,
    installmentTotal: 4,
    paymentStatus: "confirmed",
    primaryActionLabel: "Ver detalhes",
  },
  "caderneta-quitada": {
    recipientName: "Maria",
    title: "Parabéns, {nome_cliente}!",
    highlightedText: "Tudo quitado!",
    message: "Sua caderneta foi totalmente paga.\nMuito obrigado pela confiança!",
    settlementLabel: "Situação",
    balanceLabel: "Saldo pendente",
    settlementStatus: "settled",
    outstandingBalance: 0,
    primaryActionLabel: "Ver histórico",
    historyLink: "https://visual.example/historico",
  },
  "servico-contratado": {
    recipientName: "Maria",
    title: "Olá, {nome_cliente}!",
    highlightedText: "Serviço confirmado.",
    message: "Sua contratação foi registrada com sucesso.",
    detailLabel1: "Serviço",
    detailLabel2: "Valor",
    detailLabel3: "Início",
    serviceName: "Manutenção de equipamento",
    servicePrice: 1200,
    scheduledAt: "2026-11-10",
    primaryActionLabel: "Ver detalhes",
    serviceDetailsLink: "https://visual.example/servico",
  },
  "servico-concluido": {
    recipientName: "Maria",
    title: "Olá, {nome_cliente}!",
    highlightedText: "Serviço concluído!",
    message: "Foi um prazer atender você.\nEsperamos que tenha gostado do resultado.",
    detailLabel1: "Serviço realizado",
    detailLabel2: "Conclusão",
    serviceName: "Manutenção de equipamento",
    completionDate: "2026-11-10",
    primaryActionLabel: "Avaliar atendimento",
    evaluationLink: "https://visual.example/avaliar",
  },
  aniversario: {
    recipientName: "Maria",
    title: "Feliz aniversário,",
    highlightedText: "{nome_cliente}!",
    message: "Que seu novo ciclo seja cheio de conquistas e momentos especiais. Obrigado por fazer parte da nossa história!",
    signatureLabel: "Com carinho,",
    signatureName: "equipe Cadernô",
    primaryActionLabel: "Ver novidades",
    actionLink: "https://visual.example/novidades",
  },
  "produto-destaque": {
    title: "Produto em",
    highlightedText: "destaque!",
    subtitle: "Uma delícia que merece sua atenção.",
    productName: "Bolo de Chocolate",
    productPrice: 49.9,
    primaryActionLabel: "Quero ver mais",
    offerLink: "https://visual.example/produto",
  },
  "oferta-especial": {
    recipientName: "Maria",
    title: "Oferta especial,",
    highlightedText: "{nome_cliente}!",
    subtitle: "Preparamos uma condição especial por tempo limitado.",
    offerName: "Kit de Doces",
    oldPrice: 99.9,
    newPrice: 79.9,
    validUntil: "2026-12-31",
    primaryActionLabel: "Aproveitar oferta",
    offerLink: "https://visual.example/oferta",
  },
  "novidades-colecao": {
    recipientName: "Maria",
    title: "Chegaram novidades,",
    highlightedText: "{nome_cliente}!",
    subtitle: "Nossa nova coleção já está disponível. Descubra o que preparamos para você.",
    primaryActionLabel: "Ver coleção",
    collectionLink: "https://visual.example/colecao",
  },
  "reativacao-cliente": {
    recipientName: "Maria",
    title: "Sentimos sua falta,",
    highlightedText: "{nome_cliente}!",
    detail1Label: "Passou um tempinho desde a sua última visita.",
    detail1Value: "Temos novidades que podem combinar com você.",
    detail2Value: "Que tal dar uma olhada?",
    primaryActionLabel: "Ver novidades",
    actionLink: "https://visual.example/novidades",
  },
  "lembrete-aprovacao": {
    recipientName: "Maria",
    title: "Olá, {nome_cliente}!",
    highlightedText: "Podemos te contar uma novidade?",
    serviceName: "Condição especial",
    message: "Temos uma condição especial e gostaríamos de compartilhar com você.",
    consentText: "Você escolhe se deseja receber.",
    primaryActionLabel: "Sim, quero",
    secondaryActionLabel: "Agora não",
    approveLink: "https://visual.example/aceitar",
    rejectLink: "https://visual.example/recusar",
  },
};

export const referenceImages: Record<string, Record<string, string>> = {
  "cobranca-pix": { pixQrImage: "reference-pix-qr.png" },
  "produto-destaque": { productImage: "reference-product.png" },
  "oferta-especial": { offerImage: "reference-offer.png" },
  "novidades-colecao": {
    collectionImage1: "reference-collection-1.png",
    collectionImage2: "reference-collection-2.png",
    collectionImage3: "reference-collection-3.png",
  },
};

export const personalizedImages: Record<string, Record<string, string>> = {
  "produto-destaque": { productImage: "personalized-product.png" },
  "oferta-especial": { offerImage: "personalized-offer.png" },
  "novidades-colecao": {
    collectionImage1: "personalized-card.png",
    collectionImage2: "personalized-product.png",
    collectionImage3: "personalized-offer.png",
  },
};

export function personalizedData(definition: TemplateDefinition): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const field of definition.fields) {
    if (field.editable === false) {
      if (field.id === "paymentStatus") data[field.id] = "confirmed";
      if (field.id === "settlementStatus") data[field.id] = "settled";
      if (field.id === "outstandingBalance") data[field.id] = 0;
      if (field.id === "paidAt") data[field.id] = "2027-03-15";
      if (field.id === "amount") data[field.id] = 123.45;
      if (field.id === "installmentNumber") data[field.id] = 2;
      if (field.id === "installmentTotal") data[field.id] = 3;
      continue;
    }
    if (field.id === "title") data[field.id] = "Uma mensagem personalizada para {nome_cliente}";
    else if (field.id === "highlightedText") data[field.id] = "um recado com a sua identidade";
    else if (field.id === "subtitle") data[field.id] = "Criado para outro momento e outra pessoa";
    else if (field.id === "message") data[field.id] = "A equipe pode adaptar esta descrição sem alterar a estrutura visual aprovada.";
    else if (field.type === "text" || field.type === "textarea") data[field.id] = `Conteúdo personalizado: ${field.label ?? field.id}`;
    else if (field.type === "number" && field.format === "currency") data[field.id] = field.id === "oldPrice" ? 160 : 123.45;
    else if (field.type === "number") data[field.id] = field.id === "installmentTotal" ? 3 : 2;
    else if (field.type === "date") data[field.id] = "2027-03-15";
    else if (field.type === "url") data[field.id] = `https://personalized.example/${field.id}`;
    else if (field.type === "select") data[field.id] = field.options?.[0] ?? "";
    else if (field.type === "boolean") data[field.id] = true;
  }
  return data;
}
