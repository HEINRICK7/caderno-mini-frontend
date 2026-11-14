import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal-document-page";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Saiba quais dados o Cadernô Express utiliza, para quê e como exercer seus direitos.",
};

export default function PrivacyPage() {
  return (
    <LegalDocumentPage
      description="Esta página explica quais dados são usados pelo Cadernô Express, para quais finalidades e como você pode exercer seus direitos."
      title="Política de Privacidade"
    >
      <section>
        <h2>1. Quem trata os dados e como falar conosco</h2>
        <p>
          O Cadernô Express, CNPJ 46.770.466/0001-77, opera a plataforma. Para dados de conta,
          acesso, compras e funcionamento do serviço, define as finalidades e os meios do
          tratamento. Nos registros de clientes que você inclui para uso no seu negócio, você
          decide a finalidade e, em regra, atua como controlador; o Cadernô trata os dados para
          fornecer os recursos solicitados, como operador, conforme o contexto e a legislação
          aplicável. Para dúvidas ou solicitações, escreva para{" "}
          <a href="mailto:contato@otimizanegocio.com">contato@otimizanegocio.com</a> ou fale pelo
          WhatsApp <a href="https://wa.me/5586995389481" rel="noreferrer" target="_blank">(86) 99538-9481</a>.
        </p>
      </section>

      <section>
        <h2>2. Dados que podemos tratar</h2>
        <ul>
          <li>
            <strong>Conta e perfil:</strong> e-mail, nome, WhatsApp, data de nascimento e dados
            técnicos de sessão, usados para entrada e funcionamento da área privada.
          </li>
          <li>
            <strong>Mensagens e arquivos:</strong> textos, nomes de clientes e negócios, imagens e
            logos, links de redes sociais, valores, datas e dados Pix que você inserir em rascunhos
            ou publicações.
          </li>
          <li>
            <strong>Registros comerciais:</strong> informações de clientes que você cadastra, como
            nome, WhatsApp, e-mail, endereço e observações; produtos ou serviços, vendas, parcelas,
            vencimentos, pagamentos registrados manualmente e recorrências.
          </li>
          <li>
            <strong>Compra do plano:</strong> e-mail associado à compra, plano, valor, status e
            identificadores da transação necessários para confirmar o pagamento e administrar o
            acesso.
          </li>
          <li>
            <strong>Preferências de medição:</strong> a escolha de permitir ou recusar o Meta Pixel,
            salva neste navegador, e os dados de navegação enviados à Meta somente quando a medição
            estiver permitida.
          </li>
          <li>
            <strong>Suporte:</strong> informações que você enviar ao falar conosco por e-mail ou
            WhatsApp, usadas para responder e acompanhar sua solicitação.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Para que usamos os dados</h2>
        <ul>
          <li>Criar e proteger sua conta, autenticar seu acesso e prestar os recursos solicitados.</li>
          <li>Salvar rascunhos, gerar prévias e imagens, publicar links e administrar seu acesso premium.</li>
          <li>Disponibilizar registros de clientes, catálogo, vendas, parcelas e pagamentos que você mantém na plataforma.</li>
          <li>Processar e conferir compras, responder a solicitações e cumprir obrigações legais.</li>
          <li>Medir visitas e resultados de anúncios com o Meta Pixel, somente após sua permissão.</li>
        </ul>
        <p>
          Usamos os dados conforme a finalidade de cada recurso e as bases legais aplicáveis, como a
          execução do serviço contratado, o cumprimento de obrigações legais e, para a medição
          opcional de anúncios, o seu consentimento. Também podemos tratar dados para proteger a
          segurança do serviço e prevenir fraude, conforme as hipóteses legais aplicáveis.
        </p>
      </section>

      <section>
        <h2>4. Dados de clientes que você cadastra</h2>
        <p>
          O titular da conta decide quais dados de seus clientes inserir e como usar os registros,
          mensagens e cobranças. O Cadernô Express trata essas informações para fornecer os recursos
          escolhidos. Antes de inserir dados de outra pessoa, use apenas o necessário, informe-a
          quando exigido e confirme que você tem uma base legal para esse uso.
        </p>
      </section>

      <section>
        <h2>5. Compartilhamento</h2>
        <p>
          Podemos compartilhar os dados estritamente necessários com fornecedores que apoiam a
          operação do serviço, como hospedagem e armazenamento, entrega de e-mails e checkout. A
          compra é feita no checkout hospedado pela AbacatePay. O Cadernô recebe e registra os dados
          necessários para associar e confirmar a compra, como e-mail, valor, identificador e status.
          Os dados completos do cartão são informados e processados no checkout da AbacatePay; o
          Cadernô não oferece um formulário próprio para coletá-los.
        </p>
        <p>
          Se você permitir a medição de anúncios, o Meta Pixel pode compartilhar com a Meta páginas
          visitadas, eventos de checkout ou compra, nome do plano, valor, moeda e dados técnicos do
          navegador, conforme descrito nas preferências de cookies. Também poderemos compartilhar
          informações quando isso for exigido por lei ou necessário para proteger direitos e a
          segurança do serviço.
        </p>
      </section>

      <section>
        <h2>6. Publicações e links</h2>
        <p>
          Rascunhos ficam associados à conta. Quando você publica uma mensagem, ela passa a ser
          acessível por um link sem exigência de login. Quem receber ou encontrar esse link poderá
          ver as informações que você colocou no cartão, inclusive imagens e dados de cobrança.
          Você controla o compartilhamento e deve revisar o conteúdo antes de publicar.
        </p>
        <p>
          Os botões de WhatsApp apenas abrem o aplicativo ou site para você concluir o envio. O
          Cadernô Express não envia mensagens em seu nome nem acessa sua lista de contatos.
        </p>
      </section>

      <section>
        <h2>7. Cookies e medição</h2>
        <p>
          Usamos armazenamento técnico necessário para manter sua sessão autenticada. A sessão
          expira em até 30 dias. A preferência de medição de anúncios fica salva no navegador; o
          Meta Pixel só é carregado quando você permite. Você pode recusar ou alterar essa escolha
          em “Preferências de cookies” quando essa opção estiver disponível no site.
        </p>
        <p>
          A Meta pode definir seus próprios cookies e tratar os dados conforme as políticas dela.
          Para conhecer seus direitos como titular, consulte as orientações da{" "}
          <a href="https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados/direito-dos-titulares" rel="noreferrer" target="_blank">ANPD</a>.
        </p>
      </section>

      <section>
        <h2>8. Armazenamento, segurança e eliminação</h2>
        <p>
          Mantemos os dados enquanto forem necessários para fornecer o serviço e atender às
          finalidades descritas. Alguns registros podem ser conservados pelo período exigido por
          lei ou necessário para resolver obrigações e disputas. Quando a finalidade terminar,
          eliminaremos ou manteremos os dados apenas nas hipóteses permitidas pela legislação.
        </p>
        <p>
          Adotamos medidas técnicas e administrativas para proteger as informações contra acesso
          não autorizado, perda ou uso indevido. Nenhum meio de transmissão ou armazenamento é
          totalmente livre de riscos; se houver incidente que possa causar risco ou dano relevante,
          adotaremos as medidas cabíveis e as comunicações exigidas.
        </p>
      </section>

      <section>
        <h2>9. Seus direitos</h2>
        <p>
          Você pode solicitar confirmação e acesso aos dados, correção, informação sobre o uso,
          informação sobre entidades com as quais os dados são compartilhados, anonimização,
          bloqueio ou eliminação quando cabível, portabilidade nos termos da lei e revogação do
          consentimento. Você também pode apresentar uma reclamação à ANPD. Alguns pedidos podem ter
          limites quando houver obrigação legal de conservar registros.
        </p>
        <p>
          Envie sua solicitação para{" "}
          <a href="mailto:contato@otimizanegocio.com">contato@otimizanegocio.com</a>. Podemos pedir
          informações para confirmar sua identidade antes de atender ao pedido.
        </p>
      </section>

      <section>
        <h2>10. Atualizações desta política</h2>
        <p>
          Podemos atualizar esta política quando o serviço ou as práticas de tratamento mudarem. A
          versão vigente e sua data de atualização ficarão disponíveis nesta página.
        </p>
      </section>
    </LegalDocumentPage>
  );
}
