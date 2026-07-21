# Arquitetura — Salesforce LWC Developer Skill

> **Status:** Skill 1 (`lwc-pattern-documenter`) **implementada** — SKILL.md, os scripts
> `pattern-extractor.mjs` (extração) e `pattern-writer.mjs` (escrita determinística) e as
> referências existem e estão testados. A Skill 2 (`lwc-pattern-generator`) segue como
> proposta a implementar depois. Este documento descreve a arquitetura das duas.

## Contexto

Este projeto nasce da experiência com a skill
[`apex-test-loop`](https://github.com/brunotrolo/Salesforce-LoopAgentApex) (agent loop
de cobertura de testes Apex, com 3 camadas de segurança e autoaprendizado) e da
análise do repositório oficial [`forcedotcom/sf-skills`](https://github.com/forcedotcom/sf-skills)
(Apache-2.0), que define um modelo de *Ownership & Delegation* entre skills.

O objetivo aqui é diferente: em vez de testes, esta skill deve **aprender o design
system de LWCs de uma org com anos de desenvolvimento customizado** e **gerar/editar
componentes que respeitem esses padrões**, com um fluxo interativo, preview antes de
deploy, e um registro vivo de padrões aprendidos.

## 0. Decisão de Escopo — Duas Skills Sequenciais (revisão pós-validação com o usuário)

> Esta seção substitui a visão original de "uma skill monolítica com 5 fases" por uma
> abordagem **incremental em 2 skills independentes**, decidida após discussão com o
> usuário (ver `docs/PLANEJAMENTO.md`, seção "Refinamento — Duas Skills Sequenciais").

O motivo da mudança: em vez de escanear a org inteira de uma vez (arriscado, difícil de
validar, "big bang"), o usuário quer **controlar manualmente qual conjunto de
componentes alimenta qual padrão**, agrupado por **jornada ou produto** (ex.:
"Atendimento ao Cliente", "Vendas B2B") — e crescer o conhecimento **incrementalmente**,
uma jornada por vez, revisando cada documento gerado antes de confiar nele.

### Skill 1 — `lwc-pattern-documenter` (MVP, a implementar PRIMEIRO)

**Responsabilidade única:** dado um conjunto de arquivos LWC + um nome de
jornada/produto, extrair os padrões de design e **escrever/atualizar um documento
Markdown legível por humano**. Não gera código, não deploya, não decide nada sozinha —
só observa e documenta.

```
INPUT:
  - Lista de arquivos LWC (o usuário aponta quais componentes representam bem a jornada)
  - Nome da jornada/produto (ex.: "Atendimento ao Cliente")
  ↓
PROCESSO:
  1. Scan dos arquivos apontados (não a org inteira — só o que foi informado), via
     pattern-extractor.mjs (extração determinística; código comentado é ignorado)
  2. Extrai: estrutura/composição (skeleton, modalSkeleton, sharedUtils), naming,
     CSS/tokens/SLDS, slots + wiring pai↔filho, eventos (bubbles/composed/detail),
     @api + defaults + getters + @wire + forma do Apex, loading/erro, i18n, a11y, metadata
  3. O agente interpreta os sinais e monta a seção "## Padrão: <Jornada/Produto>"
  4. pattern-writer.mjs grava de forma DETERMINÍSTICA: jornada nova → ACRESCENTA;
     existente → substitui SÓ a seção dela; upsert do índice; trava aborta se perderia
     alguma jornada. A escrita nunca depende do modelo lembrar de preservar o resto.
  ↓
OUTPUT: .lwc-pattern-documenter/lwc-design-system/design-patterns.md + journeys-index.json
```

### Skill 2 — `lwc-pattern-generator` (a implementar DEPOIS, quando a Skill 1 estiver validada)

**Responsabilidade única:** dado um requisito de componente + qual jornada/produto usar
como referência, gerar um LWC que respeita o padrão **daquela jornada específica**.

```
INPUT:
  - Requisito do usuário ("preciso de um seletor de usuário filtrado por departamento")
  - Jornada/produto de referência ("seguir o padrão de Atendimento ao Cliente")
  ↓
PROCESSO: consulta a seção correspondente do documento de padrões → gera → valida
(rubrica 100pt) → preview → deploy (com aprovação)
```

Esta skill só entra em cena depois que o usuário validar, na prática, que a Skill 1
está extraindo padrões corretos o suficiente para servir de referência confiável.

### Por que essa ordem importa

- **Risco assimétrico:** Skill 1 é só leitura + escrita de Markdown (zero risco de
  quebrar produção). Skill 2 gera/edita código (risco maior — por isso as 3 camadas de
  segurança, seção 3). Validar a Skill 1 primeiro é o caminho mais seguro.
- **Curadoria manual no ponto certo:** o usuário escolhe quais arquivos representam bem
  uma jornada — não é um scan automático "confie em mim" da org inteira. Cada padrão
  documentado tem uma origem clara e auditável.
- **Crescimento incremental:** hoje documenta "Atendimento", semana que vem
  "Vendas B2B", mês que vem "Onboarding de Parceiros" — o documento cresce por seção,
  nunca é reescrito do zero.

## 1. Visão Geral do Fluxo (fluxo completo, quando as duas skills existirem)

```
FASE 1 (Skill 1): Pattern Documentation por Jornada/Produto
  Usuário aponta arquivos + nome da jornada → extrai padrões → escreve/acrescenta
  seção no documento Markdown de padrões
  ↓
  (repete para cada jornada/produto — incremental, sob demanda do usuário)
  ↓
FASE 2 (Skill 2): Onboarding Interativo
  Requirement gathering (passo-a-passo) → qual jornada/produto seguir → preview gate
  ↓
FASE 3 (Skill 2): Geração com Validação de Padrão
  Gera arquivos LWC → valida contra a seção da jornada escolhida → score 100pt →
  gate ≥80 mostra preview
  ↓
FASE 4 (Skill 2): Preview & Aprovação
  Live Preview (scratch org) → aprovação do usuário → resolução de conflitos
  ↓
FASE 5 (Skill 2): Deploy & Aprendizado
  Deploy (delega a platform-metadata-deploy) → atualiza a seção da jornada no
  documento de padrões → RECOMMENDATIONS.md
```

## 2. Ownership & Delegation

Padrão adotado do `sf-skills`: cada skill tem domínio único de ownership, com
hand-offs nomeados para skills peer — evita conflito quando múltiplos devs usam a
skill em paralelo. Com a divisão em 2 skills (seção 0), o ownership também se divide.

**`lwc-pattern-documenter` OWNS (autoridade exclusiva):**
- Extração de padrões a partir de arquivos apontados pelo usuário (não scan automático
  de toda a org)
- Escrita/atualização incremental do documento Markdown de padrões, por jornada/produto
- Nunca gera, edita ou deploya componentes — só lê e documenta

**`lwc-pattern-generator` OWNS (autoridade exclusiva, quando implementada):**
- Injeção dos padrões específicos da org (aprendidos pela Skill 1) na geração —
  isso NÃO é delegável, é o próprio motivo da skill existir
- Onboarding Interativo (modo guiado, perguntas, preview gate)
- Conflict Resolution (padrão vs. requisito → sempre pergunta ao usuário)

**`lwc-pattern-generator` delega o CRAFT de LWC para skills oficiais do `sf-skills`**
(confirmado por pesquisa factual no repositório — ver `docs/PLANEJAMENTO.md`, seção
"Pesquisa — Skills Oficiais de LWC/Design System no sf-skills"; nenhuma skill oficial
faz o que a `lwc-pattern-documenter` faz, então só a Skill 2 delega craft):

| Craft | Delega para | Razão |
|---|---|---|
| Autoria de LWC (bundle, `@wire`, Apex/GraphQL, a11y, Jest) | `experience-lwc-generate` | Mesmo princípio do `apex-test-loop`: não reinventar o "como escrever bem" — vem da skill oficial |
| Styling/tokens SLDS (Lightning Base Components > Blueprints > Styling Hooks > CSS) | `design-systems-slds-apply` | Craft de compliance visual vem da skill oficial, não de heurística nossa |

Ambas importadas **na íntegra** para `.claude/skills/` (Apache-2.0, com
`VENDOR-ATTRIBUTION.md` — ver seção 6), no Tier 2 (fundação da Skill 2). A
`lwc-pattern-documenter` (Skill 1) **não delega craft** — ela só lê e documenta, não
gera nada.

**Ambas as skills (1 e 2) também delegam para:**

| Tarefa | Delega para | Razão |
|---|---|---|
| Deploy de metadata | `platform-metadata-deploy` (ou `sf` direto) | Expertise em deployment |
| Criar campos custom faltantes | `platform-custom-field-generate` | Validação, picklist, etc. |
| Criar objetos custom faltantes | `platform-custom-object-generate` | Schema, sharing |
| Apex `@AuraEnabled` handlers | `platform-apex-generate` | Domínio Apex separado |
| Testes Jest/LWC | (futuro) | Fora do escopo inicial |

**Hard Boundaries (nenhuma das duas skills faz):**
- Não mexe em Flow/Process/Automation
- Não cria managed packages
- Não deleta/move/renomeia diretórios LWC
- Não edita Apex
- (`lwc-pattern-documenter` especificamente) Não escreve nem edita nenhum arquivo
  `.js`/`.html`/`.css` de componente — só o Markdown de padrões

## 3. Segurança em 3 Camadas

Herdado diretamente da lição mais cara do `apex-test-loop` (o incidente de
sobrescrever uma classe de produção). As 3 camadas são redundantes de propósito.

**Camada 1 — `permissions.deny`:** bloqueia `sf project delete`, `sf org delete`,
`rm -rf **/lwc/**` no nível do shell.

**Camada 2 — hook `guard.mjs`:**
- `classify()`: bloqueia (`deny`) comandos destrutivos sobre `/lwc/` (rm, mv,
  `find -delete`)
- `classifyWrite()`: sobrescrita de LWC **existente** → `ask` (pede aprovação);
  arquivo novo ou teste → permitido sem prompt

**Camada 3 — "NUNCA FAÇA" (escrito no `SKILL.md`):** proibições explícitas em
linguagem humana — nunca apagar/mover LWC, nunca sobrescrever sem aprovação, nunca
editar Apex, nunca criar Flow, nunca "resolver" um erro de conformidade de padrão
editando silenciosamente (sempre negocia com o usuário).

## 4. Sistema de Aprendizado de Padrões — por Jornada/Produto (revisado)

> Substitui o "scan automático da org inteira em um `patterns.json`" pela abordagem
> incremental e curada da seção 0: o usuário aponta os arquivos, nomeia a jornada, e o
> documento cresce por seção.

**Descoberta (Skill 1):** o usuário roda a `lwc-pattern-documenter` informando (a) uma
lista de arquivos LWC que representam bem uma jornada/produto e (b) o nome dessa
jornada/produto. A skill extrai: estrutura/composição (skeleton, modalSkeleton,
sharedUtils), naming conventions, uso de slots + wiring pai↔filho, arquitetura CSS
(tokens, scoping), padrões JS (imports, decorators, contrato `@api` + defaults, getters,
eventos com bubbles/composed/detail, `@wire`, forma do Apex), acessibilidade (ARIA, foco)
— **só dos arquivos apontados**, não da org inteira.

**Armazenamento:** `.lwc-pattern-documenter/lwc-design-system/design-patterns.md` — um único documento Markdown,
versionado em git, legível por humano, organizado em **uma seção por
jornada/produto** (`## Padrão: <Nome da Jornada>`). Cada seção documenta:

- Componentes-fonte usados como referência (rastreabilidade — "de onde veio esse
  padrão")
- Data do último scan daquela jornada
- Estrutura/composição, naming, CSS/tokens, slots + wiring pai↔filho, eventos
  (contratos), dados (@api + defaults, getters, @wire, Apex), a11y — com exemplos de
  código reais extraídos dos componentes apontados
- **Elementos específicos de um componente** (pedido do usuário): itens que aparecem
  em UM só componente da jornada (um slot, evento, token, import que só aquele arquivo
  tem) são registrados numa subseção "Elementos específicos por componente", atrelados
  ao arquivo de origem — separados dos padrões compartilhados e das divergências. O
  `pattern-extractor.mjs` os detecta em `aggregate.componentSpecifics` (frequência 1
  entre os componentes analisados). Objetivo: registrar TUDO que foi identificado, sem
  perder o que é específico de um arquivo.

**Comportamento incremental (a regra central):**
- Jornada nova → **acrescenta** uma seção nova ao final do documento
- Jornada já existente, rodada de novo (ex.: mais componentes adicionados) →
  **atualiza** a seção existente (nunca duplica, nunca cria `design-patterns-v2.md`)
- Jornadas diferentes podem ter convenções diferentes entre si — isso é esperado e
  documentado, não "corrigido" automaticamente

### Regras de Confiança e Curadoria (decididas com o usuário em sessão de validação)

Antes de partir para o `SKILL.md` de verdade, 4 pontos em aberto foram validados
diretamente com o usuário — resolvem ambiguidades que mudariam o comportamento do
guia inicial:

1. **Seleção de arquivos — modo híbrido.** O usuário pode informar os caminhos
   diretamente (já sabe onde estão) OU pedir que a skill liste os LWCs existentes no
   projeto para escolher de um menu. O guia inicial (seção 7) sempre pergunta qual
   dos dois o usuário prefere — nunca assume.
2. **Quantidade saudável por jornada: piso 3 (hard), teto ~10 (soft).** Abaixo de 3
   componentes a skill **bloqueia a extração** (menos que isso não gera confiança para
   virar "padrão documentado"). Acima de ~10 (`recommendedMax`), a skill **não bloqueia**,
   mas **sugere dividir em sub-jornadas coesas** — listas longas aumentam o risco de o
   modelo (em especial os mais fracos) esquecer itens ao interpretar. Se o usuário
   preferir manter a lista inteira, a skill respeita e interpreta o resultado por seção.
3. **Divergência entre componentes da mesma jornada → documentada, nunca decidida
   pela skill.** Se os arquivos apontados para uma jornada usarem convenções
   diferentes entre si (ex.: 2 componentes com prefixo `c_` e 3 com `x_`), a skill
   **não escolhe a maioria automaticamente** — ela registra as variantes encontradas
   na seção do documento e sinaliza explicitamente como "convenção inconsistente
   nesta jornada", deixando a decisão para o usuário resolver quando quiser.
4. **Lista canônica de jornadas/produtos.** A skill mantém um índice de jornadas já
   documentadas no `journeys-index.json` e, ao receber um nome novo, verifica
   similaridade com os já existentes (ex.: "Atendimento" vs. "Atendimento ao
   Cliente") — avisando o usuário antes de criar uma seção potencialmente duplicada
   por variação de digitação.

Essas 4 regras são o que torna o guia inicial (seção 7) obrigatório: a skill nunca
pode simplesmente "receber input e sair processando" — cada uma delas exige uma
checagem ou pergunta antes da extração acontecer.

**Aplicação (Skill 2, quando existir):** ao gerar um componente, o usuário informa
qual jornada/produto usar como referência ("seguir o padrão de Atendimento ao
Cliente"); a skill consulta **apenas aquela seção** do documento — nunca mistura
convenções de jornadas diferentes sem perguntar.

**Resolução de conflito:** quando o requisito do usuário diverge do padrão
documentado para aquela jornada, a skill **sempre apresenta as opções** (adotar
padrão / usar preferência custom / pedir de novo) — nunca decide sozinha nem
sobrescreve silenciosamente.

### Exemplo de estrutura do documento

```markdown
# Design Patterns — Referências por Jornada/Produto

## Padrão: Atendimento ao Cliente
**Componentes-fonte:** c_userPicker, c_caseForm, c_statusTimeline
**Último scan:** 2026-07-20

### Naming Convention
Prefixo `c_`, kebab-case. Ex.: `c_userPicker`, `c_caseForm`.

### CSS & Design Tokens
CSS custom properties + tokens SLDS, nunca cor hardcoded.
\`\`\`css
:host { --color-primary: var(--slds-c-brand-border-color-default); }
\`\`\`

### Slots
`slot-header` (opcional), `slot-content` (obrigatório), `slot-footer` (opcional).

### Eventos
Padrão `on<Action>`: `onSelect`, `onSave`, `onCancel`.

---

## Padrão: Vendas B2B
**Componentes-fonte:** c_opportunityCard, c_accountSelector, c_dealTracker
**Último scan:** 2026-07-21

(seção independente — pode ter convenções diferentes de Atendimento)
```

## 5. Quality Gate — Rubrica de 100 Pontos

| Dimensão | Pontos | Critério |
|---|---|---|
| Naming | 15 | Segue prefixo/estilo da org |
| Slots | 10 | Usa slots quando aplicável |
| CSS | 15 | Escopado, usa tokens, sem cor hardcoded |
| JavaScript | 15 | Imports padrão, event naming, sem anti-padrão |
| Acessibilidade | 15 | ARIA, navegação por teclado, foco |
| Composição | 10 | Parent-child conforme padrão da org |
| Performance | 10 | Sem anti-padrão óbvio (`@wire` correto, lazy load) |
| Documentação | 5 | JSDoc em métodos/slots públicos |
| Sem anti-padrões | 5 | Sem ID hardcoded, sem `eval`/`innerHTML` |

**Gate:** score ≥ 80 → mostra preview; 60–79 → gera local só (sem preview); < 60 →
bloqueia, pede ajuste ao usuário.

> Nota: diferente do piso ≥99% do `apex-test-loop`. Ali é cobertura de teste
> (tudo-ou-nada, mensurável objetivamente); aqui é UI — "mínimo viável deployável" é
> funcionar + casar com o padrão, e a validação fina de verdade acontece no preview
> visual, não só no score.

## 6. Estrutura de Repositório Proposta

```
Salesforce-LWC-Developer/
├── .claude/
│   ├── (SEM settings.json na Skill 1 — instalacao aditiva; NAO sobrescrever o do projeto)
│   └── skills/
│       ├── lwc-pattern-documenter/             # SKILL 1 — MVP, implementar primeiro
│       │   ├── SKILL.md                        # Triggers, owns, workflow de extração+escrita
│       │   ├── scripts/
│       │   │   ├── pattern-extractor.mjs       # Le arquivos apontados, extrai padroes (determinístico)
│       │   │   └── pattern-writer.mjs          # Grava/mescla design-patterns.md + índice (determinístico)
│       │   └── references/
│       │       ├── extraction-signals.md       # O que extrair (estrutura, naming, css, eventos, dados...)
│       │       └── guided-mode.md              # Fluxo do guia inicial (secao 7) — passo a passo
│       │
│       ├── lwc-pattern-generator/              # SKILL 2 — depois de validar a Skill 1
│       │   ├── SKILL.md                        # Triggers, owns/delegates, workflow completo
│       │   ├── RECOMMENDATIONS.md              # Ledger de autoaprendizado (R-XXXX)
│       │   ├── scripts/
│       │   │   ├── guard.mjs                   # Camada 2 de seguranca
│       │   │   ├── pattern-scorer.mjs          # Rubrica 100pt
│       │   │   └── lwc-generator.mjs           # Motor de templates (geracao)
│       │   ├── assets/
│       │   │   ├── templates/                  # .mustache: component.js/html/css/meta.xml
│       │   │   └── examples/                   # LWCs de referencia
│       │   ├── references/
│       │   │   ├── quality-rubric.md
│       │   │   ├── guided-mode.md
│       │   │   ├── preview-integration.md
│       │   │   ├── security-gates.md
│       │   │   └── conflict-resolution.md
│       │   └── tests/                          # guard.test.mjs, pattern-scorer.test.mjs
│       │
│       ├── experience-lwc-generate/            # IMPORTADA na integra (sf-skills v1.31.0, Apache-2.0) ✅
│       ├── design-systems-slds-apply/          # IMPORTADA na integra (sf-skills v1.31.0, Apache-2.0) ✅
│       ├── VENDOR-ATTRIBUTION.md               # Atribuicao Apache-2.0 das 2 skills acima (padrao apex-test-loop)
│       ├── VENDOR-sf-skills-LICENSE-Apache-2.0.txt  # Texto da licenca Apache-2.0 do upstream
│       └── README.md                           # Indice das skills deste repo
├── .lwc-pattern-documenter/                     # SAIDA runtime da Skill 1 (criada no projeto, como .apex-test-loop/)
│   └── lwc-design-system/
│       ├── design-patterns.md                   # Documento vivo — 1 secao por jornada/produto
│       └── journeys-index.json                  # Lista canonica de jornadas/produtos ja documentados
├── force-app/main/default/lwc/                 # LWCs da org (Skill 1 le; Skill 2 gera)
└── LICENSE                                     # MIT
```

> **Nota:** a pasta `.lwc-pattern-documenter/` é criada **no projeto do usuário** em
> tempo de execução (não é versionada aqui, neste repo da skill) — exatamente como a
> `apex-test-loop` cria `.apex-test-loop/state/` no projeto, não no repo dela. É uma
> pasta **oculta, própria da ferramenta**, na raiz do projeto — nunca em `docs/`.

### Coexistência com a `apex-test-loop` (mesmo projeto Salesforce)

O usuário quer as duas skills lado a lado no mesmo projeto. Regras que garantem que
uma nunca sobrescreve a outra:

- **`.claude/settings.json` é território da `apex-test-loop`** (guard hook +
  `permissions.deny` + `bypassPermissions`). A **Skill 1 não traz settings.json** —
  instalação puramente aditiva. Quando a **Skill 2** for construída e precisar do seu
  próprio guard, o correto é **MESCLAR** no `settings.json` existente (adicionar as
  regras/hook), **nunca substituir o arquivo** — senão o guard da apex-test-loop morre.
- **Caminhos de saída isolados:** a Skill 1 escreve só em `.lwc-pattern-documenter/lwc-design-system/`; a
  apex-test-loop usa `.apex-test-loop/state/`. Sem interseção.
- **O guard da apex-test-loop, se presente, libera** as escritas `.md`/`.json` e a
  leitura de LWC desta skill (ele só mira `.cls`/`.trigger`/`force-app/classes`) —
  rede de segurança extra, não bloqueio.
- **Sem colisão de gatilhos:** os blocos TRIGGER/DO NOT TRIGGER escopam cada skill ao
  seu domínio (documentação de LWC × cobertura de teste Apex).

## 7. Fluxo Interativo — Skill 1 (`lwc-pattern-documenter`), Guia Inicial Obrigatório

> **Princípio não-negociável (reforçado pelo usuário):** esta skill nunca "recebe
> input e sai processando". Toda execução abre com um guia — mesmo sendo uma skill
> só de leitura/documentação, ela decide coisas importantes (bloquear por poucos
> componentes, sinalizar divergência, evitar jornada duplicada) que exigem checkpoint
> humano antes de escrever qualquer coisa.

1. **Abre mostrando o estado atual:** lista as jornadas/produtos já documentadas em
   `design-patterns.md` (via `journeys-index.json`), se houver alguma.
2. **Pergunta: jornada nova ou atualizar uma existente?** Se o nome informado for
   parecido com uma jornada já indexada, avisa e confirma antes de prosseguir (regra
   4 da seção 4).
3. **Pergunta: você já tem os caminhos dos arquivos, ou quer que eu liste os LWCs do
   projeto para escolher?** — modo híbrido (regra 1 da seção 4).
4. **Confirma a lista final de arquivos antes de extrair** — checkpoint explícito,
   nunca assume que a primeira lista informada é a definitiva.
5. **Verifica o mínimo de 3 componentes** (regra 2 da seção 4). Se não bater, **para
   aqui** e pede mais exemplos — não escreve nada no documento.
6. **Extrai os padrões** dos arquivos confirmados (estrutura/composição, naming,
   CSS/tokens, slots + wiring pai↔filho, eventos, dados @api/getters/@wire/Apex, a11y —
   ver `extraction-signals.md`).
7. **Se encontrar divergência** entre os componentes da mesma jornada, documenta as
   variantes e sinaliza — nunca decide sozinha qual é a "oficial" (regra 3 da
   seção 4).
8. **Mostra um preview do que vai escrever** na seção do Markdown ANTES de salvar —
   aprovação explícita do usuário.
9. **Grava de forma determinística via `pattern-writer.mjs`** (nunca reescrevendo o
   arquivo à mão): jornada nova → ACRESCENTA a seção; existente → substitui só a seção
   dela; upsert do `journeys-index.json` (nome/componentes/data); trava de integridade
   aborta se o merge fosse perder qualquer jornada. Isso elimina a classe de bug em que
   um modelo, reescrevendo o arquivo inteiro, apaga uma jornada já documentada.

Detalhamento completo desse fluxo (mensagens exatas, formato das perguntas) fica em
`references/guided-mode.md` da própria skill, a escrever no Tier 0.

## 8. Fluxo Interativo — Skill 2 (`lwc-pattern-generator`), Resumo

1. **Escolha de modo:** Automático / Guiado (passo-a-passo) / Learn Patterns
2. **Requirement gathering:** propósito, fonte de dados, slots, nível de acessibilidade
3. **Escolha da jornada/produto de referência** (consultando o `journeys-index.json`
   da Skill 1) — a geração só usa a seção correspondente do `design-patterns.md`.
4. **Preview de padrão:** mostra nome/estrutura proposta ANTES de gerar (ex.: "seu
   padrão usa prefixo `c_`, seu componente ficaria `c_userPicker`")
5. **Gate de geração:** checklist + score antes de liberar preview
6. **Live Preview:** deploy em scratch org (`--test-only`), abre no browser, aprovação
7. **Deploy final:** só após aprovação explícita; delega a `platform-metadata-deploy`
8. **Aprendizado:** atualiza a seção da jornada em `design-patterns.md` +
   `RECOMMENDATIONS.md` se houve fricção

## 9. Arquivos Críticos — Ordem de Implementação

- **Tier 0 (MVP — Skill 1, `lwc-pattern-documenter`):** `SKILL.md` +
  `pattern-extractor.mjs` + `pattern-writer.mjs` + `extraction-signals.md` + `guided-mode.md` +
  `.lwc-pattern-documenter/lwc-design-system/design-patterns.md` + `.lwc-pattern-documenter/lwc-design-system/journeys-index.json` (arquivos iniciais
  vazios/template). Sem segurança de escrita de componente (não aplicável — a skill
  só lê arquivos e escreve Markdown/JSON de índice).
- **Tier 1 (validação do MVP):** usar a Skill 1 em 2-3 jornadas reais da org do
  usuário, revisar manualmente se os padrões extraídos batem com a realidade, ajustar
  `extraction-signals.md` conforme necessário. **Só avança pro Tier 2 depois desse
  ciclo de validação.**
- **Tier 2 (fundação da Skill 2, `lwc-pattern-generator`):** `SKILL.md`, `guard.mjs`,
  **+ importar na íntegra `experience-lwc-generate` e `design-systems-slds-apply`**
  do `sf-skills` (snapshot v1.31.0, Apache-2.0) para `.claude/skills/`, com
  `VENDOR-ATTRIBUTION.md` (mesmo padrão do `apex-test-loop`)
- **Tier 3 (geração):** `pattern-scorer.mjs`, `lwc-generator.mjs`, templates
  `.mustache`
- **Tier 4 (UX):** `guided-mode.md` (da Skill 2), `quality-rubric.md`,
  `conflict-resolution.md`
- **Tier 5 (aprendizado):** `RECOMMENDATIONS.md`, wiring em `settings.json`

## 10. Reuso de `apex-test-loop` e `sf-skills`

| Componente | Origem | Adaptação |
|---|---|---|
| Estrutura SKILL.md (Owns/Delegates/NUNCA FAÇA) | sf-skills + apex-test-loop | Direto, adaptado ao domínio LWC |
| `guard.mjs` (classify/classifyWrite) | apex-test-loop | Regex adaptada para `/lwc/**` em vez de `.cls` |
| State file por item | apex-test-loop | `.apex-lwc-developer/state/<Componente>.md` |
| `RECOMMENDATIONS.md` (R-XXXX) | apex-test-loop | Mesmo formato, local-only, sem git push |
| Modo guiado PT passo-a-passo | apex-test-loop | Adaptado para perguntas de LWC |
| Templates + references estruturados | sf-skills | `assets/templates` + `references/*.md` |
| Rubrica de pontuação como gate | sf-skills (120pt) | Adaptado para 100pt, gate em 80 (não 99%) |
| Decision tree de root cause | sf-skills (`apex-test-run`) | A criar: LWC não renderiza / lento / falha validação |
| **Craft de autoria de LWC** (bundle, `@wire`, a11y, Jest, PICKLES) | sf-skills (`experience-lwc-generate`) | **Importada na íntegra** para a Skill 2 — mesmo princípio do `apex-test-loop` com as skills de teste Apex |
| **Craft de styling/tokens SLDS** | sf-skills (`design-systems-slds-apply`) | **Importada na íntegra** para a Skill 2 (Lightning Base Components > Blueprints > Styling Hooks > CSS) |

`sf-skills` é licenciado Apache-2.0 — qualquer trecho de texto/código reaproveitado
literalmente deve manter atribuição (NOTICE) no momento da implementação.
Confirmado por pesquisa direta no repositório (94 skills, v1.31.0, LICENSE.txt
Apache-2.0): **nenhuma skill oficial cobre o que a `lwc-pattern-documenter` faz**
(aprender padrões específicos da org, por jornada/produto) — só o craft de geração
(`experience-lwc-generate`) e de styling (`design-systems-slds-apply`) tem
equivalente oficial, e ambos ficam restritos à Skill 2. Detalhes da pesquisa em
`docs/PLANEJAMENTO.md`.

## 11. Decisões de Design (e porquês)

- **Gate em 80pt, não 99%:** LWC é UI — "mínimo viável deployável" é funcionar + casar
  com o padrão; validação de acessibilidade fina acontece no preview visual, não é
  tudo-ou-nada como cobertura de teste.
- **`guard` responde `ask` (não `deny`) para sobrescrita:** o usuário pode
  legitimamente querer refatorar um LWC existente; a skill não pode saber a intenção
  sozinha, então pede aprovação em vez de bloquear.
- **Registry em JSON:** legível, versionável, fácil de diffar em PRs.
- **Preview obrigatório antes de deploy:** prática padrão de desenvolvimento
  Salesforce para UI (Live Preview / Local Dev).
- **Conflito de padrão é sempre decisão do usuário** — a skill nunca decide sozinha
  qual convenção "vale mais".
- **Seleção de arquivos híbrida (caminho manual OU menu interativo):** cobre tanto o
  usuário que já sabe exatamente o que quer apontar quanto o que prefere que a skill
  ajude a descobrir os LWCs do projeto.
- **Mínimo de 3 componentes por jornada:** abaixo disso a extração vira "achismo" —
  um único componente não prova convenção, prova coincidência. Bloquear e pedir mais
  exemplos é mais barato que documentar um padrão falso que a Skill 2 usaria depois.
- **Divergência é documentada, nunca resolvida por maioria automática:** decidir por
  frequência esconderia uma inconsistência real da org por trás de uma escolha
  arbitrária do agente. Melhor deixar visível e permitir que o usuário decida com
  contexto que a skill não tem.
- **Lista canônica de jornadas/produtos:** sem ela, pequenas variações de digitação
  (“Atendimento” vs. “Atendimento ao Cliente”) fragmentariam o documento em seções
  redundantes — o índice existe só para evitar esse acidente, não para restringir
  nomes livres.
- **Guia inicial obrigatório mesmo numa skill "só leitura":** as 4 regras acima geram
  decisões (bloquear, sinalizar, confirmar, avisar duplicidade) que não podem
  acontecer silenciosamente — por isso a Skill 1 também tem um fluxo guiado (seção 7),
  não é "aponta arquivo e sai processando".
- **Craft de LWC delegado, não reinventado (só na Skill 2):** pesquisa confirmou que
  `experience-lwc-generate` e `design-systems-slds-apply` do `sf-skills` já cobrem
  autoria de LWC e styling/tokens SLDS com qualidade oficial — reinventar isso seria
  duplicar esforço sem ganho. A `lwc-pattern-generator` importa as 2 na íntegra (só
  as essenciais, sem `design-systems-slds-validate` por ora) e foca seu próprio
  valor em injetar os padrões específicos da org, que não têm equivalente oficial.

## Próximos Passos

Este documento é o ponto de partida para discussão. Estado da validação item a item:

1. ✅ **Decidido:** escopo dividido em 2 skills sequenciais (seção 0) — Skill 1
   (`lwc-pattern-documenter`) documenta padrões por jornada/produto em Markdown;
   Skill 2 (`lwc-pattern-generator`) gera código depois, usando a Skill 1 como
   referência. Implementação começa pela Skill 1 (Tier 0).
2. ✅ **Decidido:** regras de confiança e curadoria da Skill 1 (seção 4.1) —
   seleção híbrida de arquivos, mínimo de 3 componentes por jornada, divergência
   documentada (nunca decidida pela skill), lista canônica de jornadas/produtos.
3. ✅ **Decidido:** a Skill 1 tem um guia inicial obrigatório (seção 7) — nunca
   executa direto a partir do input bruto; sempre passa pelos 9 passos de checkpoint
   antes de escrever no documento.
4. ✅ **Decidido:** a Skill 2 (`lwc-pattern-generator`, Tier 2+) importa na íntegra
   `experience-lwc-generate` + `design-systems-slds-apply` do `sf-skills` para
   delegar o craft de LWC — confirmado por pesquisa que nenhuma skill oficial cobre
   o pattern-learning específico da org (seção 2 e 10). A Skill 1 não delega craft
   (só lê e documenta).
5. Confirmar formato exato do `.lwc-pattern-documenter/lwc-design-system/design-patterns.md` (seção 4, "Exemplo de
   estrutura") e do `journeys-index.json` (seção 6) — os templates propostos servem,
   ou precisam de mais/menos campos?
6. Confirmar quais sinais de extração entram no `extraction-signals.md` e em que
   ordem de prioridade, usando a primeira jornada real que o usuário for documentar
   como teste de validação (Tier 1).
7. (Só relevante quando a Skill 2 entrar em cena) Confirmar as 3 camadas de segurança
   (seção 3) e a rubrica de 100 pontos (seção 5) — nenhuma mudança aqui ainda, ficam
   validadas quando chegar a hora do Tier 2+.

Próximo passo prático: implementar o Tier 0 (Skill 1) — `SKILL.md`,
`pattern-extractor.mjs`, `extraction-signals.md`, `guided-mode.md`,
`design-patterns.md` e `journeys-index.json` — e validar com uma jornada real da org
do usuário.
