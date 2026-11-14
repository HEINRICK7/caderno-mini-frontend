import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal-document-page";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Regras para usar o Cadernô Express, criar mensagens e publicar seus links.",
};

export default function TermsPage() {
  return (
    <LegalDocumentPage
      description="Leia as regras para criar, publicar e compartilhar mensagens pelo Cadernô Express."
      title="Termos de Uso"
    >
      <section>
        <h2>1. Quem oferece o serviço</h2>
        <p>
          O Cadernô Express é uma plataforma digital para pequenos negócios, operada sob o CNPJ
          46.770.466/0001-77. Para falar conosco, escreva para{" "}
          <a href="mailto:contato@otimizanegocio.com">contato@otimizanegocio.com</a> ou use o
          WhatsApp <a href="https://wa.me/5586995389481" rel="noreferrer" target="_blank">(86) 99538-9481</a>.
        </p>
        <p>Ao criar uma conta ou usar os recursos da plataforma, você concorda com estes termos.</p>
      </section>

      <section>
        <h2>2. O que o Cadernô Express faz</h2>
        <p>
          Você pode escolher modelos, preencher e editar mensagens, conferir uma prévia e, quando
          tiver acesso ativo, publicar links e compartilhar cartões. Alguns modelos permitem baixar
          uma imagem. O compartilhamento é iniciado por você; a plataforma não envia mensagens
          automaticamente nem em massa.
        </p>
        <p>
          O Cadernô Express não é banco ou instituição financeira, não recebe pagamentos feitos aos
          negócios que usam a plataforma e não inicia nem confirma transferências Pix. O QR Code Pix
          estático é montado no navegador com os dados informados pelo usuário. Confira a chave, o
          recebedor e o valor no aplicativo do banco antes de publicar ou pagar.
        </p>
      </section>

      <section>
        <h2>3. Conta e acesso</h2>
        <p>
          Para acessar a área privada, informe um e-mail válido e use o link de entrada enviado para
          esse endereço. O link de entrada expira em 15 minutos e a sessão tem validade de até 30
          dias. Mantenha acesso ao seu e-mail e avise-nos se suspeitar de uso indevido da conta.
        </p>
        <p>
          Ao completar o perfil, informe dados corretos e atualizados. Você é responsável por revisar
          os dados inseridos nos modelos antes de salvar, publicar ou compartilhar.
        </p>
      </section>

      <section>
        <h2>4. Preço, pagamento e duração do acesso</h2>
        <p>
          Criar rascunhos e conferir prévias é gratuito. O plano anual atualmente anunciado custa
          R$ 47,00 em pagamento único e libera, por 12 meses após a confirmação do pagamento, a
          criação, edição, publicação e compartilhamento de cards ilimitados. Não há renovação
          automática.
        </p>
        <p>
          O checkout é processado pela AbacatePay. A liberação do acesso depende da confirmação do
          pagamento recebida pelo Cadernô Express. O pagamento acontece no checkout hospedado pela
          AbacatePay; o Cadernô registra o status e os identificadores necessários para administrar
          a compra e não oferece formulário próprio para coletar os dados completos do cartão.
        </p>
        <p>
          Quando o período de acesso termina, rascunhos permanecem na conta. Links publicados podem
          deixar de abrir se não houver outro acesso ativo. Reembolsos e demais direitos do consumidor
          seguem a legislação aplicável; para solicitar ajuda, entre em contato pelos canais acima.
        </p>
      </section>

      <section>
        <h2>5. Conteúdo e responsabilidade de quem usa</h2>
        <p>
          Você mantém os direitos que possui sobre os textos, imagens, marcas e demais materiais que
          enviar. Você nos autoriza a armazená-los e processá-los na medida necessária para salvar
          rascunhos, gerar prévias, renderizar imagens e disponibilizar publicações que você solicitar.
        </p>
        <p>
          Você declara que tem autorização para usar os materiais e dados pessoais que inserir, que
          informou as pessoas envolvidas quando necessário e que revisará o conteúdo antes de
          compartilhá-lo. Não use a plataforma para fraude, falsidade, violação de direitos de
          terceiros, spam, assédio ou atividades proibidas por lei.
        </p>
        <p>
          Um link publicado pode ser aberto por qualquer pessoa que o receba ou obtenha. Não inclua
          nele dados que devam permanecer confidenciais. Você decide com quem compartilhar e pode
          interromper a publicação pelos recursos disponíveis na sua conta.
        </p>
      </section>

      <section>
        <h2>6. Serviços de terceiros</h2>
        <p>
          O checkout, a entrega de e-mails, a hospedagem e outros recursos podem depender de serviços
          de terceiros, sujeitos a disponibilidade e condições próprias. O uso do checkout da
          AbacatePay também está sujeito às condições informadas por ela.
        </p>
      </section>

      <section>
        <h2>7. Disponibilidade, mudanças e encerramento</h2>
        <p>
          Podemos atualizar recursos e estes termos para refletir mudanças no serviço ou na lei. A
          versão vigente ficará disponível nesta página com sua data de atualização. Podemos limitar
          ou suspender o acesso quando necessário para cumprir a lei, proteger a plataforma ou
          responder a uso que viole estes termos.
        </p>
        <p>
          Você pode parar de usar o serviço e solicitar ajuda para encerrar sua conta pelo e-mail de
          contato. Registros que precisem ser mantidos por obrigação legal ou para resolver uma
          questão pendente poderão ser conservados pelo tempo necessário.
        </p>
      </section>

      <section>
        <h2>8. Legislação aplicável</h2>
        <p>
          Estes termos são regidos pelas leis brasileiras. Eles não afastam os direitos que a
          legislação assegura a consumidores e titulares de dados pessoais.
        </p>
      </section>
    </LegalDocumentPage>
  );
}
