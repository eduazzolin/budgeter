# Regras de Terminologia e Domínio do Budgeter

Sempre utilize a seguinte nomenclatura padrão ao lidar com variáveis no código, apresentar informações na interface do usuário (UI), ou se comunicar internamente e com o usuário. Evite usar o termo "Saldo" de forma isolada e ambígua.

## Dicionário Padrão do Sistema

1. **Saldo Real (Real Balance)**
   - **Definição:** O dinheiro de fato que o usuário tem na conta bancária (o valor físico lançado).
   - **Código:** `actualBalance`, `recordedBalance`
   - **UI:** "Saldo Real" ou "Saldo Atual".

2. **Saldo Esperado (Expected Balance / Target)**
   - **Definição:** O valor ideal (alvo) que o usuário deveria ter na conta naquele dia específico para conseguir terminar o período exatamente dentro da meta.
   - **Código:** `expectedBalance`, `targetBalance`
   - **UI:** "Saldo Esperado".

3. **Margem ou Desempenho (Difference / Margin)**
   - **Definição:** A diferença calculada entre o Saldo Real e o Saldo Esperado (`Real - Esperado`). Se positivo, o usuário economizou no orçamento. Se negativo, gastou a mais (está no vermelho do orçamento).
   - **Código:** `budgetDifference`, `margin` (historicamente `difference`).
   - **UI:** "Margem", "Desempenho" ou "Saldo do Orçamento".

4. **Saldo Projetado (Projected Balance)**
   - **Definição:** A extrapolação matemática (linha de tendência) indicando como o Saldo Real vai se comportar no futuro se a taxa de gastos atual for mantida.
   - **Código:** `projectedBalance`
   - **UI:** "Saldo Projetado" ou "Projeção".

5. **Ponto de Equilíbrio (Break-Even Point / Normalization)**
   - **Definição:** O momento (data prevista) em que a linha do Saldo Projetado cruza a linha do Saldo Esperado, indicando quando a Margem deixará de ser negativa e voltará a ficar positiva.
   - **Código:** `breakEvenDate`, `normalizationDate` (historicamente `predictedNormalizationDate`).
   - **UI:** "Previsão de Retomada", "Previsão de Equilíbrio" ou "Previsão de Alta".

## Uso do Playwright e Dados de Teste (Seeder)

Ao testar a aplicação utilizando o Playwright ou ferramentas de automação visual:
1. **Sempre utilize o Seeder/Dados Simulados:** Evite inserir valores manualmente pelos formulários da UI durante os testes de validação visual. Utilize scripts de inicialização (`addInitScript` ou injeção direta via `localStorage` no browser) para carregar os dados definidos no arquivo `tests/seed.spec.ts` (ou equivalentes). Isso garante consistência nos testes visuais, consistência das datas relativas ao dia de hoje, e evita poluição com dados manuais imprevisíveis.
