export type ShareLinkMetadataInput = {
  businessName: string;
  templateName: string;
  templateDescription?: string | null;
  purpose?: "message" | "pix-charge";
};

export function shareLinkMetadata({ businessName, templateName, templateDescription, purpose = "message" }: ShareLinkMetadataInput) {
  const companyName = businessName.trim().slice(0, 80);
  const displayCompanyName = companyName.length > 42
    ? `${companyName.slice(0, 41).trimEnd()}…`
    : companyName;

  if (purpose === "pix-charge") {
    return {
      title: companyName
        ? `Cobrança Pix de ${displayCompanyName} | Cadernô Express`
        : "Cobrança Pix | Cadernô Express",
      description: "Acesse o link para ver o QR Code Pix e o código Pix Copia e Cola.",
    };
  }

  return {
    title: companyName
      ? `Cartão de ${displayCompanyName} | Cadernô Express`
      : `${templateName} | Cadernô Express`,
    description: companyName
      ? `Cartão digital de ${companyName}, criado com o Cadernô Express. Confira o conteúdo e valide os dados antes de pagar.`
      : `Você recebeu uma mensagem criada com o Cadernô Express. Abra o link para conferir o cartão${templateDescription ? `: ${templateDescription}` : ""}.`,
  };
}
