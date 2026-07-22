---
name: lwc-pattern-generator
description: >-
  Desenvolvedor de FRONT-END LWC (Lightning Web Components) do projeto: CRIA um
  componente do zero, CLONA e adapta um componente existente para um cenario novo, ou
  EDITA um componente ja existente — sempre alinhado ao design system aprendido pela
  `lwc-pattern-documenter` (Skill 1) em `.lwc-pattern-documenter/lwc-design-system/`.
  Delega o craft de autoria (bundle, @wire, Apex/GraphQL, a11y, Jest) para
  `experience-lwc-generate` e o styling/tokens SLDS para `design-systems-slds-apply`.
  Tem um GUIA INICIAL obrigatorio (nunca "recebe input e sai processando"): escolhe
  explicitamente um dos 3 modos, exige jornada de referencia confirmada, mostra
  diff/preview antes de escrever, nunca "corrige" convencao antiga sem pedido. TRIGGER
  quando o usuario pedir para CRIAR um LWC novo, CLONAR/duplicar um LWC existente para
  um cenario parecido, ou EDITAR/ajustar um LWC ja existente, alinhado aos padroes da
  org. DO NOT TRIGGER para APRENDER/documentar padroes de LWC (isso e a
  `lwc-pattern-documenter`), autorar Apex puro, criar campos/objetos, ou mexer em Flow.
---

# LWC Pattern Generator — cria, clona e edita LWC alinhado ao design system da org

Objetivo: dado um requisito do usuario, gerar ou editar um Lightning Web Component que
seja **indistinguivel dos componentes que a org ja tem** — porque segue a receita
documentada pela `lwc-pattern-documenter` (Skill 1) na jornada/produto de referencia, em
vez de inventar convencao ou copiar um boilerplate generico.

Cobre **3 modos de operacao**, cada um com perfil de risco e fluxo proprio (ver
`references/guided-mode.md`):

1. **Criar** — componente novo do zero, numa jornada existente. Risco baixo.
2. **Clonar e Adaptar** — parte de um componente-fonte real e adapta para um cenario
   novo mas parecido. Risco medio.
3. **Editar** — ajusta um componente ja existente (producao). Risco alto.

## 🚫 NUNCA FACA (proibicoes absolutas)

1. **Nunca gera (nem no modo Criar) sem uma jornada de referencia CONFIRMADA.** Se
   `.lwc-pattern-documenter/lwc-design-system/journeys-index.json` estiver vazio ou
   ausente, **recuse** e direcione o usuario a rodar a `lwc-pattern-documenter` primeiro.
   Gerar sem padrao de referencia contraria o proprio motivo desta skill existir.
2. **Nunca confia em qual "modo" o proprio agente alega estar executando** ao decidir
   se uma escrita e segura. O `guard.mjs` (Camada 2) decide `ask`/`allow` olhando SO a
   existencia factual do arquivo/bundle no disco — nunca uma auto-declaracao. Um bundle
   que ja tem QUALQUER arquivo no disco e tratado como existente (Camada 2, `guard.mjs`).
3. **Nunca escreve um bundle pela metade.** Se o guard pedir aprovacao para um arquivo
   do bundle, trate o BUNDLE INTEIRO como pendente de aprovacao — nao escreva os demais
   arquivos "porque ainda nao bateram no guard".
4. **Nunca "corrige" silenciosamente uma convencao que diverge do padrao documentado**
   — nem no modo Editar (codigo legado intocado), nem no modo Clonar (especifico do
   componente-fonte). Diverge do padrao → **avisa e pergunta**, nunca decide sozinha.
5. **Nunca mistura convencoes de jornadas diferentes** sem checkpoint explicito com o
   usuario (ver `references/guided-mode.md`, etapa 2).
6. **Nunca reescreve `design-patterns.md` ou `journeys-index.json`** — esses arquivos
   sao territorio EXCLUSIVO da `lwc-pattern-documenter` (Skill 1). No maximo, sugere ao
   usuario rodar a Skill 1 de novo quando um sinal de "novidade" mensuravel aparecer
   (ver `references/quality-rubric.md`).
7. **Nunca mexe em Flow/Process/Automation, cria managed packages, ou edita Apex** de
   producao diretamente — isso e delegado (ver Ownership & Delegacao).
8. **Nunca aplica uma edicao em modo Editar sem mostrar o diff e obter aprovacao
   explicita** — nem checa a working tree suja como pretexto para pular essa aprovacao.

Na duvida sobre qualquer acao que nao seja gerar/editar um bundle LWC seguindo o
guia: PARE e pergunte.

## Ownership & Delegation

**Esta skill OWNS:** leitura do snapshot estruturado da jornada
(`pattern-reader.mjs`), selecao de modo, injecao do padrao da org na geracao/edicao,
scoring de aderencia ao design pattern (`pattern-scorer.mjs`), resolucao de conflito
(padrao vs. requisito → sempre pergunta), diff/preview obrigatorio no modo Editar.

**Delega:**

| Tarefa | Delega para |
|---|---|
| Craft de autoria de LWC (bundle, `@wire`, Apex/GraphQL, a11y, Jest) | `experience-lwc-generate` |
| Styling/tokens SLDS (verificar hooks/classes/icones reais antes de usar) | `design-systems-slds-apply` |
| Apex `@AuraEnabled` novo (inclusive ANTES da geracao LWC no modo Clonar, se precisar) | `platform-apex-generate` |
| Deploy de metadata | `platform-metadata-deploy` |
| Campos/objetos custom faltantes | `platform-custom-field-generate` / `platform-custom-object-generate` |

**Sem motor de templates proprio.** Esta skill nao tem um "gerador" (`.mustache` ou
similar) que produz o bundle mecanicamente — quem escreve o codigo e o **agente**,
usando o sinal do `pattern-reader.mjs` (a receita da jornada) + o craft delegado
(`experience-lwc-generate`/`design-systems-slds-apply`). Um motor de templates rigido
duplicaria os templates que a `experience-lwc-generate/assets/` ja tem oficialmente, e
nao se adaptaria bem a estrutura especifica de cada jornada
(`representativeSkeleton`/`modalSkeleton` variam por jornada, nao sao genericos).

## Os 3 Modos de Operacao

| | **Criar** | **Clonar e Adaptar** | **Editar** |
|---|---|---|---|
| Risco | Baixo | Medio | Alto |
| Arquivo-alvo | Novo | Novo | Existente (producao) |
| Referencia | `aggregate` da jornada | Jornada + 1 componente-fonte real | Jornada descoberta a partir do componente |
| Guard (`classifyWrite`) | `allow` | `allow` (checa colisao de nome antes) | `ask` obrigatorio |

Detalhes completos de cada modo — o que reaproveitar vs adaptar, como descobrir a
jornada de referencia, o passo a passo — em `references/guided-mode.md`,
`references/clone-adapt-guide.md` e `references/edit-mode-guide.md`.

## Segurança em 3 Camadas

Herdado da `apex-test-loop`, adaptado para bundles LWC (ver
`references/security-gates.md` para o detalhamento completo):

- **Camada 1 — `permissions.deny`:** bloqueia `sf project delete`, `sf org delete`,
  `sf data delete` no nivel do shell.
- **Camada 2 — hook `guard.mjs`:** `classify()` bloqueia (`deny`) comandos destrutivos
  sobre `force-app/**/lwc/**` (rm/mv/find -delete); `classifyWrite()` decide `ask` vs
  `allow` olhando **so a existencia factual** de qualquer arquivo do bundle-alvo no
  disco — nunca confia em qual "modo" o agente alega estar executando (ver NUNCA FACA).
- **Camada 3 — "NUNCA FACA" (acima):** proibicoes explicitas em linguagem humana.

## Sinal determinístico — `pattern-reader.mjs` e `pattern-scorer.mjs`

Mesma filosofia da Skill 1 (`pattern-extractor.mjs`/`pattern-writer.mjs`): scripts
EXTRAEM/PONTUAM de forma mecanica; o agente JULGA e escreve o codigo.

```bash
# Ler o snapshot estruturado de uma jornada (gravado pela Skill 1 com --data):
node .claude/skills/lwc-pattern-generator/scripts/pattern-reader.mjs \
  --journey "Consorcio"

# Lookup reverso: a quais jornadas um componente pertence? (modo Editar, etapa 0)
node .claude/skills/lwc-pattern-generator/scripts/pattern-reader.mjs \
  --find-journey force-app/main/default/lwc/consorcioLances

# Pontuar aderencia de um componente (novo ou editado) contra a jornada:
node .claude/skills/lwc-pattern-generator/scripts/pattern-scorer.mjs \
  --journey "Consorcio" --component force-app/main/default/lwc/novoComponente
```

- `pattern-reader.mjs` le `.lwc-pattern-documenter/lwc-design-system/journeys/<slug>.json`
  (o snapshot que a Skill 1 grava quando roda com `--data`). Avisa se o snapshot esta
  **desatualizado** (compara `lastScan` do snapshot com o de `journeys-index.json`).
  `--find-journey` varre `journeys-index.json` e retorna TODAS as jornadas que contem
  aquele componente — nunca escolhe a primeira silenciosamente se houver mais de uma.
- `pattern-scorer.mjs` pontua **so a aderencia ao design pattern da jornada** (nao
  duplica a rubrica PICKLES 165pt da `experience-lwc-generate` nem o lint da
  `design-systems-slds-apply` — ver `references/quality-rubric.md`). No modo Editar,
  pontua **so o diff estrutural** (baseline vs. proposto, por chave) — nao o arquivo
  inteiro.

O que cada sinal significa e o template de preview estao em
`references/quality-rubric.md`.

## O GUIA INICIAL (10 etapas obrigatorias)

Nunca pule para a geracao/edicao. Toda execucao passa por estas etapas — detalhe e
mensagens em `references/guided-mode.md`:

0. **[So modo Editar] Lookup reverso** componente→jornada (`--find-journey`).
1. **Escolha explicita de modo** (Criar / Clonar / Editar) — nunca assume.
2. **Jornada de referencia** — via `journeys-index.json` (Criar/Clonar) ou ja
   descoberta na etapa 0 (Editar).
3. **Coleta de requisito** (varia por modo).
4. **Checagem proativa de colisao de nome/path** — antes do guard, como decisao
   de produto.
5. **Preview do que sera reaproveitado vs adaptado** (Clonar) ou **diff proposto**
   (Editar) — aprovacao obrigatoria.
6. **Gera/edita** (delega craft) — inclui `.test.js` companheiro se a convencao da
   jornada exigir.
7. **Score de aderencia + score de craft/SLDS lado a lado** → preview final.
8. **Deploy com aprovacao explicita** (delega a `platform-metadata-deploy`).
9. **Aprendizado** — `RECOMMENDATIONS.md` se houve friccao; sugestao de "rode a Skill 1
   de novo" so se a flag de novidade disparar; nunca reescreve `design-patterns.md`.

## 🤝 Coexistencia com outras skills

- **`lwc-pattern-documenter` (Skill 1):** territorio exclusivo do
  `design-patterns.md`/`journeys-index.json`/`journeys/*.json` — esta skill so LE.
- **`apex-test-loop`** (se presente no mesmo projeto): dominios sem intersecao
  (`.apex-test-loop/state/` vs. `force-app/**/lwc/**`); os guards de ambas cobrem
  arquivos diferentes (`.cls`/`.trigger` vs. bundles LWC) e sao aditivos, nao
  conflitantes.
- **`experience-lwc-generate` / `design-systems-slds-apply`:** craft delegado — esta
  skill nunca reescreve o que elas ja fazem bem (templates, scoring PICKLES, busca de
  hooks/blueprints/icones).

## Encerramento

Resumo curto: qual modo foi usado, qual jornada de referencia, o componente
resultante, os dois scores (aderencia + craft/SLDS), e se houve deploy. Se apareceu
uma licao reutilizavel sobre a propria skill, anote em `RECOMMENDATIONS.md`. Se
apareceu um fato **operacional** deste projeto/org (nao uma licao da skill), anote em
`.claude/agent-memory-local/lwc-pattern-generator/MEMORY.md` (ver etapa 9 do guia).

## Referencias

- `references/guided-mode.md` — o roteiro detalhado das 10 etapas, com as mensagens.
- `references/quality-rubric.md` — as dimensoes da rubrica de aderencia + o diff
  estrutural do modo Editar.
- `references/security-gates.md` — o modelo de seguranca completo, com a trava
  factual do guard detalhada.
- `references/conflict-resolution.md` — como negociar quando o requisito diverge do
  padrao documentado.
- `references/clone-adapt-guide.md` — como separar convencao da jornada (reaproveitar)
  de especifico do componente-fonte (adaptar) no modo Clonar.
- `references/edit-mode-guide.md` — a tecnica de diff estrutural e deteccao de
  regressao de convencao no modo Editar.
- `.claude/agent-memory-local/README.md` — memoria local operacional (nao versionada),
  distinta de `RECOMMENDATIONS.md` e `design-patterns.md`.
- `docs/ARCHITECTURE.md` (raiz do repo) — a arquitetura completa das 2 skills.
