export function whatsappShareUrl(publicUrl: string, businessName = ""): string {
  const normalizedBusinessName = businessName.trim().slice(0, 80);
  const introduction = normalizedBusinessName
    ? `Olá! ${normalizedBusinessName} preparou este cartão digital no Cadernô Express.`
    : "Olá! Você recebeu um cartão digital do Cadernô Express.";
  const message = [
    introduction,
    `Confira: ${publicUrl}`,
    "Se houver cobrança, confira o recebedor e o valor.",
  ].join("\n");

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
