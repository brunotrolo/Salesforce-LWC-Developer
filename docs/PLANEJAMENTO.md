# Planejamento — Trilha de Pesquisa e Decisão

> **O que é este documento:** o registro completo do processo de planejamento que
> gerou a [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) — incluindo a pesquisa comparativa
> com o `apex-test-loop` e com o repositório oficial `forcedotcom/sf-skills` que
> embasou as decisões de arquitetura. Mantido aqui como referência futura: se uma
> decisão parecer estranha mais tarde, o "porquê" está registrado neste arquivo.
>
> Para a arquitetura final proposta (sem o histórico de pesquisa), veja
> [`docs/ARCHITECTURE.md`](ARCHITECTURE.md).

## Contexto

O usuário completou a skill `apex-test-loop` (agent loop de cobertura de testes Apex,
repositório [`Salesforce-LoopAgentApex`](https://github.com/brunotrolo/Salesforce-LoopAgentApex))
e quis criar uma nova skill complexa em repositório separado: **Salesforce LWC
Developer**. Esta skill deveria:
- Analisar padrões de design LWC da org (4-5 anos de desenvolvimento customizado)
- Gerar/editar LWCs respeitando o design system existente
- Fornecer workflow interativo para capturar requisitos
- Manter registro de padrões aprendidos
- Suportar preview (Live Preview ou Local Dev)

Antes de desenhar a arquitetura, o objetivo foi **analisar padrões oficiais
(sf-skills) e a experiência de `apex-test-loop`**, para não repetir erros iniciais e
aproveitar as lições de segurança em 3 camadas + autoaprendizado.

## Fase 1 — Estado Atual do `apex-test-loop` (o que já tínhamos)

Mapa de capacidades (de `.claude/skills/apex-test-loop/` no repo `Salesforce-LoopAgentApex`):
- **Loop de cobertura** auto-corretivo (deploy→run test→ler linhas não cobertas→
  melhorar), meta ≥99% com asserts reais; modos automático e guiado; `--test-only`
  e modo scaffold (dev/treino).
- **Segurança em 3 camadas** (o que NÃO podia se perder):
  - `SKILL.md` "🚫 NUNCA FAÇA";
  - `permissions.deny` (`sf project/org/data delete`);
  - hook `PreToolUse` `guard.mjs`: `classify` (comandos destrutivos) + `classifyWrite`
    (bloqueia sobrescrever `.cls`/`.trigger` de produção **existente**; libera arquivo
    novo e classe de teste).
- **Scripts**: `apex-coverage.mjs` (contrato JSON determinístico: `uncoveredLines`,
  `blockedByDependency`, `otherClassesTouched`, `--test-only`/`--deploy`/`--scaffold`);
  `guard.mjs` (funções exportadas e testadas).
- **Autoaprendizado**: `RECOMMENDATIONS.md` (ledger de recomendações) + fase de
  retrospectiva.

**Específico daquele projeto (perde-se se substituído por skill externa genérica):** o
modelo de segurança em 3 camadas + o contrato do `apex-coverage.mjs` + `--test-only` +
modo scaffold + o ledger de autoaprendizado + o modo guiado em PT.

**Genérico/sobreponível (bom candidato a vir de lib oficial):** o craft de teste Apex
em si (mocks, asserts, bulk, DML, async).

## Fase 1 — Inventário do Repositório Oficial da Salesforce

Existem **dois** repositórios oficiais candidatos; o relevante NÃO foi o citado
inicialmente.

### A) [`forcedotcom/sf-skills`](https://github.com/forcedotcom/sf-skills) — o que realmente importa

- Org oficial de engenharia da Salesforce (mesma de CLI/LWC). **730★, 268 forks,
  v1.31.0 (jul/2026), 49 releases, muito ativo.**
- **Licença: Apache-2.0** → reuso comercial OK com atribuição + NOTICE.
  Reuso-friendly.
- **Formato:** Agent Skills spec aberto — pasta com `SKILL.md` (frontmatter com
  triggers) + `assets/` + `references/*.md` + `scripts/*.py`. Compatível com Claude
  Code. Instala via `npx skills add forcedotcom/sf-skills`.
- **96+ skills** em 11+ categorias: Apex (4), Agentforce (5), Flow/Automation,
  Platform Customization, SOQL/Dados, Experience Cloud/LWC (13), OmniStudio (8), DX
  (13), Integration, Data360, Commerce B2B, Design Systems, Mobile.
- **Aviso explícito no README:** "Expect frequent changes; the Salesforce skills
  library is evolving rapidly" — não segue estabilidade de API GA.

### B) [`SalesforceAIResearch/agentforce-adlc`](https://github.com/SalesforceAIResearch/agentforce-adlc) (o que se suspeitava inicialmente)

- Org de **pesquisa** oficial (não engenharia). ~89★, v0.9 (pré-1.0).
- **Licença: CC BY-NC 4.0 → NÃO-COMERCIAL.** Não copiar código/texto para produto
  comercial.
- Foco no ciclo de vida de **agentes Agentforce** (DSL `.agent`), não TDD Apex. Apex é
  periférico (só scaffold de invocable). **~Zero sobreposição** com `apex-test-loop`.

**Decisão:** alvo correto de estudo = `forcedotcom/sf-skills`. O `agentforce-adlc`
ficou de fora (não-comercial, sem Apex) — no máximo inspiração conceitual, nunca
código copiado.

## Fase 1 — Análise Skill-a-Skill (comparando com `apex-test-loop`)

### `platform-apex-test-generate` (sf-skills)

Gera classes de teste production-ready com ciclo geração→run→análise→fix.

| Aspecto | sf-skills | apex-test-loop |
|---|---|---|
| Meta de cobertura | 75% mín / 90%+ rec | **≥99% piso fixo** |
| Loop iterations | Max 3 | Max 6 (dinâmico até plateau) |
| Security layers | 0 explícitas | **3 camadas** |
| Modo guiado | Não mencionado | PT, passo-a-passo |
| Test-only mode | Não | Sim, `--test-only` + `--scaffold` |
| Ledger/retrospectiva | Não | `RECOMMENDATIONS.md` |
| Assertion rigor | Exatas (com mensagens) | MVP allow guards; `--rigoroso` proíbe |

**Veredito:** `ADAPTAR` — pegar estrutura de assets/templates; manter as 3 camadas +
meta 99%.

### `platform-apex-test-run` (sf-skills)

Executa testes, análise de cobertura, fix loop com rubrica de 120 pontos.

| Aspecto | sf-skills | apex-test-loop |
|---|---|---|
| Métrica | 120-point score | % linhas (≥99%) |
| Parser | Python JSON determinístico | `apex-coverage.mjs` (JS, determinístico) |
| Root cause tree | Explícita (NullPtr, Dml, Limit, Query, Type) | Heurístico |
| Cross-skill delegation | Sim (→ apex-generate) | Opcional |
| Scope discovery | Narrowest first | Inventário no Passo 0 |

**Veredito:** `ADAPTAR` — pegar decision tree de root cause + conceito de scoring
rubric; manter parser próprio + meta 99%.

### Padrão arquitetônico chave do repositório: Ownership & Delegation Model

Cada skill tem **domínio único de ownership**, com **hand-offs nomeados** para skills
peer. Exemplo do fluxo Apex:

```
platform-apex-generate (autoria de código)
  → platform-apex-test-generate (autoria de teste)
  ↔ platform-apex-test-run (execução de teste)
  ↔ platform-apex-logs-debug (diagnóstico)
```

**Hard Boundaries:** cada skill documenta explicitamente o que NÃO faz (ex.:
`platform-apex-generate`: "Does NOT deploy, run tests, query metadata"). Isso garante
foco e evita duplicação — especialmente relevante quando vários desenvolvedores usam
a mesma skill em paralelo.

**Metadados de `SKILL.md`:** `Triggers`, `Owns`, `Delegates To`, `Hard Constraints`,
workflow steps com validation gates.

**Quality Scoring:** cada skill usa uma rubrica de pontos (120, 130, 165 conforme a
skill) como gate de progressão antes de considerar o trabalho pronto.

## Matriz Comparativa — Decisão REUSAR / ADAPTAR / MANTER (para o `apex-test-loop`)

| Capacidade | sf-skills | apex-test-loop | Veredito |
|---|---|---|---|
| Meta de Cobertura | 75% mín / 90%+ rec | ≥99% (piso) | **MANTER NOSSO** |
| Loop Iterations | Max 3 | Max 6 (dinâmico) | **MANTER NOSSO** |
| Security (3 camadas) | 0 explícitas | guard.mjs + deny + NUNCA FAÇA | **MANTER NOSSO** |
| Assertion Rigor | Exatas + mensagens | MVP allow guards; `--rigoroso` proíbe | **MANTER NOSSO** |
| Test Data Templates | test-class, data-factory, bulk-251+ | Templates + TestDataFactory | **ADAPTAR** |
| Mocking Patterns | HttpCalloutMock, DML mock, SOSL | Similar | **ADAPTAR** |
| Async Testing | Batch, Queueable, scheduled, platform event | Similar | **ADAPTAR** |
| Parser JSON | Python | `apex-coverage.mjs` (JS) | **MANTER NOSSO** |
| Root Cause Decision Tree | Explícita | Heurístico | **ADAPTAR** |
| Quality Scoring Rubric | 120/165-point | % linhas | **ADAPTAR** (conceito, sem substituir piso 99%) |
| Modo Guiado | Não mencionado | PT, passo-a-passo | **MANTER NOSSO** |
| Test-Only Mode | Não | `--test-only`, `--scaffold` | **MANTER NOSSO** |
| Ledger Autoaprendizado | Não | `RECOMMENDATIONS.md` | **MANTER NOSSO** |
| Ownership & Delegation | Explícito | Implícito | **ADAPTAR** |

Esta matriz gerou uma recomendação separada para o `apex-test-loop` em si (fora do
escopo deste repositório) — registrada aqui só como contexto de origem, já que foi
essa análise que revelou o padrão de Ownership & Delegation reaproveitado na
arquitetura do LWC Developer.

## Fase 2 — Estado do Repositório no Início do Projeto

No início deste projeto, `brunotrolo/Salesforce-LWC-Developer` estava **vazio**: só
README com o título, 1 commit inicial, sem LICENSE, sem `.claude/`, sem estrutura —
pronto para construir do zero.

## Fase 2 — Como as Lições Viraram Arquitetura

As "Lições de sf-skills" abaixo foram o ponte entre a pesquisa (Fase 1) e a proposta
final em [`docs/ARCHITECTURE.md`](ARCHITECTURE.md):

1. **Ownership & Delegation Model** → seção 2 do ARCHITECTURE.md (Owns/Delegates/Hard
   Boundaries do LWC Developer).
2. **Hard Constraints & Quality Scoring** → seção 5 do ARCHITECTURE.md (rubrica de
   100 pontos, gate em 80).
3. **Templates + References Estruturados** → seção 6 do ARCHITECTURE.md (estrutura
   de repositório com `assets/templates`, `assets/patterns`, `references/`).
4. **Decision Tree para Root Cause** → adaptado para os cenários de LWC (não
   renderiza / lento / falha de validação de design system) — a formalizar em
   `references/` quando a skill for implementada.
5. **3 camadas de segurança + autoaprendizado do `apex-test-loop`** → seção 3
   (segurança) e seção 4 (registry de padrões + `RECOMMENDATIONS.md`) do
   ARCHITECTURE.md.

## Decisões Confirmadas com o Usuário

- **Alvo de pesquisa:** `forcedotcom/sf-skills` (Apache-2.0), não `agentforce-adlc`
  (CC BY-NC, fora do escopo Apex).
- **Uso pessoal/estudo** — reuso flexível, mas com atribuição/NOTICE quando trechos
  literais do `sf-skills` forem incorporados.
- **Estratégia:** análise skill-a-skill primeiro (matriz de decisão), decisão de
  integração/implementação como passo posterior.
- **Registro da arquitetura:** commit direto na `main` do repositório (sem
  branch/PR), já que o repo estava vazio e o documento é material de discussão, não
  código funcional.
- **Licença do novo repositório:** MIT — mesma do `apex-test-loop`, simples e
  consistente entre os dois projetos.

## Verificação da Fase de Pesquisa

- ✅ Análise skill-a-skill das 2 skills Apex mais próximas + overview do repositório
  oficial completo.
- ✅ Cada afirmação sobre o conteúdo do `sf-skills` citou a URL/arquivo real (via
  WebFetch no GitHub público), não memória.
- ✅ Matriz de decisão com veredito explícito (REUSAR/ADAPTAR/MANTER) para cada
  capacidade comparada.
- ✅ Nenhuma mudança de código foi feita no `apex-test-loop` durante esta fase — só
  análise e, depois, o novo documento de arquitetura neste repositório.
- ✅ Requisitos de atribuição Apache-2.0 (NOTICE) documentados para quando templates
  do `sf-skills` forem de fato incorporados na implementação.

## Próximos Passos (no momento em que este documento foi escrito)

Este planejamento e o `docs/ARCHITECTURE.md` formam a base de discussão antes de
qualquer código da skill ser escrito. Os pontos em aberto para validação (replicados
da seção "Próximos Passos" do ARCHITECTURE.md):

1. Confirmar o modelo de Ownership & Delegation — faz sentido para o workflow real da
   org do usuário?
2. Confirmar as 3 camadas de segurança — algum ajuste necessário para o contexto de
   LWC (vs. Apex)?
3. Validar o algoritmo de descoberta de padrões — quais sinais são mais importantes
   para a org específica do usuário?
4. Validar a rubrica de 100 pontos — os pesos fazem sentido, ou precisam de ajuste
   por prioridade (ex.: acessibilidade pesando mais)?
5. Confirmar estrutura de repositório e ordem de implementação.
