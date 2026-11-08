import { checkoutPlanDetails, type CheckoutPlan } from "@/domain/checkout-plan";

export function PlanTermsNotice({ plan }: { plan?: CheckoutPlan }) {
  const detail = plan ? checkoutPlanDetails[plan] : checkoutPlanDetails.annual;

  return (
    <aside aria-label="Pagamento e política de reembolso" className="plan-terms-notice plan-terms-notice--selected">
      <span className="plan-terms-notice__eyebrow">Resumo antes do pagamento</span>
      <h3>Você está prestes a contratar o {detail.name} do Cadernô Express.</h3>
      <p><strong>{detail.price}</strong> · pagamento único · {detail.access}.</p>
      <p>A compra só é concluída depois do pagamento no checkout seguro da Cakto.</p>
      <p>Você pode solicitar reembolso em até 7 dias corridos após a compra pelo portal da Cakto. Conforme o fluxo disponível para a compra, a Cakto pode processar o pedido ou direcionar você ao produtor.</p>
      <p>Quando o pedido segue o fluxo automático da Cakto, o estorno é processado em até 24 horas. Durante esse período, o acesso continua ativo e você pode cancelar a solicitação. O acesso termina quando o reembolso é concluído.</p>
      <p>Se a Cakto direcionar o pedido ao produtor, siga as instruções e o contato exibidos no portal.</p>
      <a href="https://reembolso.cakto.com.br/" rel="noreferrer" target="_blank">
        Acessar o portal de reembolso da Cakto <span aria-hidden="true">↗</span>
      </a>
    </aside>
  );
}
