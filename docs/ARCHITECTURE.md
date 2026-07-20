# Arquitetura — Salesforce LWC Developer Skill

> **Status:** Documento de proposta para discussão. Nenhuma linha de código da skill
> foi escrita ainda — este documento existe para validarmos a arquitetura antes de
> implementar.

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
  1. Scan dos arquivos apontados (não a org inteira — só o que foi informado)
  2. Extrai: naming, CSS/tokens, slots, eventos, imports, composição, a11y, performance
  3. Escreve/acrescenta uma seção "## Padrão: <Jornada/Produto>" no documento de padrões
  4. Se a jornada já existe no documento → ATUALIZA a seção (nunca duplica)
  5. Se é uma jornada nova → ACRESCENTA nova seção (nunca sobrescreve as outras)
  ↓
OUTPUT: docs/design-patterns.md (ou um arquivo por jornada — ver seção 4)
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
- LWC Generation & Editing (novo componente ou edição aprovada), respeitando a
  jornada/produto de referência escolhida pelo usuário
- Onboarding Interativo (modo guiado, perguntas, preview gate)
- Conflict Resolution (padrão vs. requisito → sempre pergunta ao usuário)

**Ambas delegam para:**

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
jornada/produto. A skill extrai: naming conventions, uso de slots, arquitetura CSS
(tokens, scoping), padrões JS (imports, decorators, event naming), composição
(parent-child), acessibilidade (ARIA, foco), performance (`@wire`, lazy load) — **só
dos arquivos apontados**, não da org inteira.

**Armazenamento:** `docs/design-patterns.md` — um único documento Markdown,
versionado em git, legível por humano, organizado em **uma seção por
jornada/produto** (`## Padrão: <Nome da Jornada>`). Cada seção documenta:

- Componentes-fonte usados como referência (rastreabilidade — "de onde veio esse
  padrão")
- Data do último scan daquela jornada
- Naming convention, CSS/tokens, slots, eventos, composição, a11y, performance —
  com exemplos de código reais extraídos dos componentes apontados

**Comportamento incremental (a regra central):**
- Jornada nova → **acrescenta** uma seção nova ao final do documento
- Jornada já existente, rodada de novo (ex.: mais componentes adicionados) →
  **atualiza** a seção existente (nunca duplica, nunca cria `design-patterns-v2.md`)
- Jornadas diferentes podem ter convenções diferentes entre si — isso é esperado e
  documentado, não "corrigido" automaticamente

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
│   ├── settings.json                          # permissions.deny + guard hook (só relevante p/ Skill 2)
│   └── skills/
│       ├── lwc-pattern-documenter/             # SKILL 1 — MVP, implementar primeiro
│       │   ├── SKILL.md                        # Triggers, owns, workflow de extração+escrita
│       │   ├── scripts/
│       │   │   └── pattern-extractor.mjs       # Le arquivos apontados, extrai padroes
│       │   └── references/
│       │       └── extraction-signals.md       # O que extrair (naming, css, slots, eventos...)
│       │
│       └── lwc-pattern-generator/              # SKILL 2 — depois de validar a Skill 1
│           ├── SKILL.md                        # Triggers, owns/delegates, workflow completo
│           ├── RECOMMENDATIONS.md              # Ledger de autoaprendizado (R-XXXX)
│           ├── scripts/
│           │   ├── guard.mjs                   # Camada 2 de seguranca
│           │   ├── pattern-scorer.mjs          # Rubrica 100pt
│           │   └── lwc-generator.mjs           # Motor de templates (geracao)
│           ├── assets/
│           │   ├── templates/                  # .mustache: component.js/html/css/meta.xml
│           │   └── examples/                   # LWCs de referencia
│           ├── references/
│           │   ├── quality-rubric.md
│           │   ├── guided-mode.md
│           │   ├── preview-integration.md
│           │   ├── security-gates.md
│           │   └── conflict-resolution.md
│           └── tests/                          # guard.test.mjs, pattern-scorer.test.mjs
├── docs/
│   └── design-patterns.md                      # Documento vivo — 1 secao por jornada/produto
├── .apex-lwc-developer/state/<Componente>.md   # checkpoint por componente (caminho neutro)
├── force-app/main/default/lwc/                 # LWCs gerados (Skill 2)
└── LICENSE                                     # MIT
```

## 7. Fluxo Interativo (Modo Guiado) — Resumo

1. **Escolha de modo:** Automático / Guiado (passo-a-passo) / Learn Patterns
2. **Requirement gathering:** propósito, fonte de dados, slots, nível de acessibilidade
3. **Preview de padrão:** mostra nome/estrutura proposta ANTES de gerar (ex.: "seu
   padrão usa prefixo `c_`, seu componente ficaria `c_userPicker`")
4. **Gate de geração:** checklist + score antes de liberar preview
5. **Live Preview:** deploy em scratch org (`--test-only`), abre no browser, aprovação
6. **Deploy final:** só após aprovação explícita; delega a `platform-metadata-deploy`
7. **Aprendizado:** atualiza `patterns.json` + `RECOMMENDATIONS.md` se houve fricção

## 8. Arquivos Críticos — Ordem de Implementação

- **Tier 0 (MVP — Skill 1, `lwc-pattern-documenter`):** `SKILL.md` +
  `pattern-extractor.mjs` + `extraction-signals.md` + `docs/design-patterns.md`
  (arquivo inicial vazio/template). Sem segurança de escrita de componente (não
  aplicável — a skill só lê arquivos e escreve Markdown).
- **Tier 1 (validação do MVP):** usar a Skill 1 em 2-3 jornadas reais da org do
  usuário, revisar manualmente se os padrões extraídos batem com a realidade, ajustar
  `extraction-signals.md` conforme necessário. **Só avança pro Tier 2 depois desse
  ciclo de validação.**
- **Tier 2 (fundação da Skill 2, `lwc-pattern-generator`):** `SKILL.md`, `guard.mjs`
- **Tier 3 (geração):** `pattern-scorer.mjs`, `lwc-generator.mjs`, templates
  `.mustache`
- **Tier 4 (UX):** `guided-mode.md`, `quality-rubric.md`, `conflict-resolution.md`
- **Tier 5 (aprendizado):** `RECOMMENDATIONS.md`, wiring em `settings.json`

## 9. Reuso de `apex-test-loop` e `sf-skills`

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

`sf-skills` é licenciado Apache-2.0 — qualquer trecho de texto/código reaproveitado
literalmente deve manter atribuição (NOTICE) no momento da implementação.

## 10. Decisões de Design (e porquês)

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

## Próximos Passos

Este documento é o ponto de partida para discussão. Antes de qualquer código de skill
ser escrito, validar item a item:

1. ✅ **Decidido:** escopo dividido em 2 skills sequenciais (seção 0) — Skill 1
   (`lwc-pattern-documenter`) documenta padrões por jornada/produto em Markdown;
   Skill 2 (`lwc-pattern-generator`) gera código depois, usando a Skill 1 como
   referência. Implementação começa pela Skill 1 (Tier 0).
2. Confirmar o algoritmo de extração de padrões da Skill 1 (seção 4) — quais sinais
   extrair primeiro (naming, CSS/tokens, slots, eventos, a11y, performance) e em que
   ordem de prioridade para a primeira jornada real que o usuário for documentar?
3. Confirmar formato exato do `docs/design-patterns.md` (seção 4, "Exemplo de
   estrutura") — esse template serve, ou precisa de mais/menos campos por seção?
4. Confirmar o modelo de Ownership & Delegation entre as duas skills (seção 2) — faz
   sentido para o workflow real da sua org?
5. (Só relevante quando a Skill 2 entrar em cena) Confirmar as 3 camadas de segurança
   (seção 3) e a rubrica de 100 pontos (seção 5) — nenhuma mudança aqui ainda, ficam
   validadas quando chegar a hora do Tier 2+.

Próximo passo prático: implementar o Tier 0 (Skill 1) e validar com uma jornada real
da org do usuário antes de qualquer outra decisão.
