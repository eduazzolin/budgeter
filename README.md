# Budgeter - Contagem Regressiva de Orçamento

> **Produção:** Acesse o aplicativo ao vivo em [https://db-budgeter.web.app/](https://db-budgeter.web.app/)

> **Nota:** Este é um projeto **Vibe Coded** 🔮✨ construído de forma iterativa com foco na experiência e estética, utilizando inteligência artificial para orquestrar o código.

O **Budgeter** é um aplicativo de planejamento e contagem regressiva financeira minimalista e moderno, projetado em React + TypeScript com Vite e integrado ao Firebase. Ele ajuda usuários a controlarem seus gastos de forma linear ao longo de períodos customizados.

![Budgeter Screenshot](./public/screenshot.png)

---

## ⚙️ Como o Sistema Funciona

O Budgeter funciona baseado em um princípio simples: **distribuição linear do seu orçamento disponível pelos dias restantes do seu ciclo.**

1. **Definição de Período e Orçamento:** Você insere a data de início e fim do seu ciclo financeiro (ex: mês, quinzena) e a quantia que deseja economizar ou que está disponível para gasto.
2. **Cálculo Diário:** O sistema divide automaticamente o valor total pelo número de dias do período, gerando uma "meta" fixa de gasto/economia por dia.
3. **Acompanhamento de Saldo Real:** Você pode registrar seu saldo em conta a qualquer momento.
4. **Margem de Desempenho:** A aplicação cruza o Saldo Real atual com o Saldo Esperado daquele dia, indicando instantaneamente se você está acima (verde) ou abaixo (vermelho) do planejado.
5. **Previsão de Alta:** Com base no seu comportamento de gastos recentes, o sistema calcula quando a sua Margem voltará a ficar positiva.

Os dados são salvos preferencialmente offline-first no navegador (`localStorage`) para velocidade e privacidade, mas podem ser sincronizados na nuvem usando Firebase via Login com o Google.

---

## 📖 Glossário de Termos do Sistema

Para garantir clareza e evitar ambiguidades, o **Budgeter** adota a seguinte terminologia padrão:

*   **Saldo Real:** O dinheiro de fato que você possui na conta bancária (o valor físico lançado).
*   **Saldo Esperado:** O valor ideal (alvo) que você deveria ter na conta em um dia específico para terminar o período exatamente dentro da meta estabelecida.
*   **Margem ou Desempenho:** A diferença calculada entre o Saldo Real e o Saldo Esperado (`Saldo Real - Saldo Esperado`). Se positivo, indica economia; se negativo, indica que gastou a mais.
*   **Saldo Projetado:** A projeção matemática (linha de tendência) indicando como o seu Saldo Real vai se comportar no futuro se a taxa de gastos atual for mantida.
*   **Previsão de Alta (Ponto de Equilíbrio):** A data prevista em que a linha do Saldo Projetado cruza a linha do Saldo Esperado, indicando quando a Margem deixará de ser negativa e voltará a ficar positiva.

---

## ✨ Funcionalidades Principais

*   **Contagem Regressiva Visual**: Veja exatamente quantos dias restam e o percentual de tempo decorrido do período.
*   **Estimativa de Gasto Diário**: Calcula de forma automática o limite diário dividindo a redução necessária do orçamento pela quantidade de dias totais.
*   **Evolução do Orçamento**: Mostra o Saldo Esperado que você deve ter ao acordar e ao encerrar o dia de hoje, além de uma tabela interativa para acompanhamento.
*   **Lançamento Rápido de Saldo Real**: Registre seu dinheiro em conta a qualquer momento do período.
*   **Fórmula de Projeção Fixa**: O Saldo Real é usado exclusivamente para indicar a sua Margem de desempenho em relação à estimativa ideal daquele dia, sem alterar as metas base.
*   **Tabela de Prospecção Diária**: Exibe uma listagem completa dia-a-dia do período, destacando o dia atual ("Hoje") com comparação direta de valores e diferença visual (+/-).
*   **Tema Claro Moderno (Alto Contraste)**: Interface limpa e minimalista com contraste reforçado (WCAG Compliant) para máxima legibilidade.
*   **100% Otimizado para Mobile**: Cabeçalhos responsivos que se reorganizam em blocos e tabela de prospecção com rolagem horizontal nativa para evitar cortes em smartphones.

---

## 🔒 Arquitetura de Sincronização & Segurança

*   **Offline-First**: Por padrão, o aplicativo salva e lê todos os períodos localmente no `localStorage` do navegador. Nenhuma conta temporária é gerada no Firebase, economizando recursos e protegendo a privacidade.
*   **Login Exclusivo com o Google**:
    *   **Desktop**: Autenticação limpa via janela pop-up.
    *   **Mobile**: Redirecionamento nativo (`signInWithRedirect`) para contornar bloqueadores de pop-ups em navegadores móveis.
*   **Sincronização Manual**: Ao logar com o Google, o usuário pode clicar em **Enviar dados do navegador para nuvem** para migrar com segurança seus contadores locais para sua conta do Firebase Firestore.

---

## ⚖️ Conformidade com a LGPD (Lei Geral de Proteção de Dados)

O Budgeter adota práticas de "Privacy by Design" para garantir total conformidade com a LGPD:
*   **Transparência e Termos de Uso:** Política de Privacidade clara e acessível a qualquer momento via interface, detalhando exatamente quais dados são salvos.
*   **Gestão de Consentimento (Cookies):** Banner explícito solicitando o consentimento do usuário para uso do `localStorage` e autenticação Firebase na primeira visita.
*   **Direito ao Esquecimento:** Os usuários que realizam login com o Google podem, através da aba de Configurações da Conta, **Excluir a Conta e todos os Dados** com um único clique. Isso remove instantaneamente as coleções do Firestore e a conta de Autenticação, não deixando rastros.

---

## 🛠️ Como Executar Localmente

1.  Instale as dependências do projeto:
    ```bash
    npm install
    ```
2.  Renomeie o arquivo `.env.example` para `.env` e preencha com as credenciais do seu projeto Firebase (obrigatório apenas se quiser habilitar o Login com Google e salvar na nuvem):
    ```env
    VITE_FIREBASE_API_KEY=sua_api_key
    VITE_FIREBASE_AUTH_DOMAIN=seu-app.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=seu-projeto-id
    VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
    VITE_FIREBASE_APP_ID=seu-app-id
    ```
3.  Execute o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```
4.  Abra `http://localhost:5173` no navegador.
