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

## 1. Visão Geral do Fluxo

```
INPUT: Requisitos do usuário
  ↓
FASE 1: Pattern Discovery & Learning
  Scan LWCs existentes da org → extrai padrões → Pattern Registry (patterns.json)
  ↓
FASE 2: Onboarding Interativo
  Requirement gathering (passo-a-passo) → preferência de padrão → preview gate
  ↓
FASE 3: Geração com Validação de Padrão
  Gera arquivos LWC → valida contra patterns → score 100pt → gate ≥80 mostra preview
  ↓
FASE 4: Preview & Aprovação
  Live Preview (scratch org) → aprovação do usuário → resolução de conflitos
  ↓
FASE 5: Deploy & Aprendizado
  Deploy (delega a platform-metadata-deploy) → atualiza registry → RECOMMENDATIONS.md
```

## 2. Ownership & Delegation

Padrão adotado do `sf-skills`: cada skill tem domínio único de ownership, com
hand-offs nomeados para skills peer — evita conflito quando múltiplos devs usam a
skill em paralelo.

**Esta skill OWNS (autoridade exclusiva):**
- Pattern Discovery & Learning (scan, extração, registry)
- LWC Generation & Editing (novo componente ou edição aprovada)
- Onboarding Interativo (modo guiado, perguntas, preview gate)
- Conflict Resolution (padrão vs. requisito → sempre pergunta ao usuário)

**Delega para:**

| Tarefa | Delega para | Razão |
|---|---|---|
| Deploy de metadata | `platform-metadata-deploy` (ou `sf` direto) | Expertise em deployment |
| Criar campos custom faltantes | `platform-custom-field-generate` | Validação, picklist, etc. |
| Criar objetos custom faltantes | `platform-custom-object-generate` | Schema, sharing |
| Apex `@AuraEnabled` handlers | `platform-apex-generate` | Domínio Apex separado |
| Testes Jest/LWC | (futuro) | Fora do escopo inicial |

**Hard Boundaries (nunca faz):**
- Não mexe em Flow/Process/Automation
- Não cria managed packages
- Não deleta/move/renomeia diretórios LWC
- Não edita Apex

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

## 4. Sistema de Aprendizado de Padrões

**Descoberta:** um script `pattern-discovery.mjs` varre `force-app/**/lwc/**` e
extrai: naming conventions, uso de slots, arquitetura CSS (tokens, scoping), padrões
JS (imports, decorators, event naming), composição (parent-child), acessibilidade
(ARIA, foco), performance (`@wire`, lazy load).

**Armazenamento:** `.claude/lwc-patterns/patterns.json` — registry canônico
versionado, com `confidence` score por padrão e `source` (quais componentes
evidenciam o padrão). Complementado por `components-inventory.md` e
`pattern-violations.md`.

**Aplicação:** a geração sempre consulta `patterns.json` antes de nomear/estruturar
um novo componente; nunca inventa convenção.

**Resolução de conflito:** quando o requisito do usuário diverge do padrão da org, a
skill **sempre apresenta as opções** (adotar padrão / usar preferência custom / pedir
de novo) — nunca decide sozinha nem sobrescreve silenciosamente.

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
│   ├── settings.json                    # permissions.deny + guard hook
│   └── skills/lwc-developer/
│       ├── SKILL.md                     # Definição principal (triggers, owns/delegates, workflow)
│       ├── RECOMMENDATIONS.md           # Ledger de autoaprendizado (R-XXXX)
│       ├── scripts/
│       │   ├── guard.mjs                # Camada 2 de segurança
│       │   ├── pattern-discovery.mjs    # Scan + extração de padrões
│       │   ├── pattern-scorer.mjs       # Rubrica 100pt
│       │   └── lwc-generator.mjs        # Motor de templates (geração)
│       ├── assets/
│       │   ├── templates/               # .mustache: component.js/html/css/meta.xml
│       │   ├── patterns/                # accessibility.md, styling.md, composition.md, event-handling.md
│       │   └── examples/                # LWCs de referência
│       ├── references/
│       │   ├── pattern-learning.md
│       │   ├── quality-rubric.md
│       │   ├── guided-mode.md
│       │   ├── preview-integration.md
│       │   ├── security-gates.md
│       │   └── conflict-resolution.md
│       └── tests/                       # guard.test.mjs, pattern-scorer.test.mjs
├── .apex-lwc-developer/state/<Componente>.md   # checkpoint por componente (caminho neutro)
├── force-app/main/default/lwc/          # LWCs gerados
└── LICENSE                              # MIT
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

- **Tier 1 (fundação):** `SKILL.md`, `guard.mjs`, `pattern-discovery.mjs`
- **Tier 2 (geração):** `pattern-scorer.mjs`, `lwc-generator.mjs`, templates `.mustache`
- **Tier 3 (UX):** `guided-mode.md`, `quality-rubric.md`, `assets/patterns/*.md`
- **Tier 4 (aprendizado):** `RECOMMENDATIONS.md`, wiring em `settings.json`

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

1. Confirmar o modelo de Ownership & Delegation (seção 2) — faz sentido para o
   workflow real da sua org?
2. Confirmar as 3 camadas de segurança (seção 3) — algum ajuste necessário para o
   contexto de LWC (vs. Apex)?
3. Validar o algoritmo de descoberta de padrões (seção 4) — quais sinais são mais
   importantes para SUA org especificamente?
4. Validar a rubrica de 100 pontos (seção 5) — pesos fazem sentido, ou precisa
   ajustar por prioridade (ex.: acessibilidade pesa mais)?
5. Confirmar estrutura de repositório (seção 6) e ordem de implementação (seção 8).

Só depois desse alinhamento entramos na implementação de fato.
