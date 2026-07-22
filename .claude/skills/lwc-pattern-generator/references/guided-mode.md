# Modo guiado — as 10 etapas, com mensagens (PT)

Roteiro detalhado do GUIA INICIAL obrigatorio do `SKILL.md`. Mesmo principio da Skill 1:
nunca "recebe input e sai processando" — cada modo tem checkpoints humanos antes de
gerar/editar qualquer coisa.

## Gate antes de tudo — existe alguma jornada documentada?

Antes da etapa 0, confirme que `.lwc-pattern-documenter/lwc-design-system/journeys-index.json`
existe e tem pelo menos uma jornada:
```bash
node .claude/skills/lwc-pattern-generator/scripts/pattern-reader.mjs --list
```
Se vier vazio ou o arquivo nao existir, **PARE**:

*"Ainda nao ha nenhuma jornada documentada. Esta skill nunca gera sem uma referencia de
design pattern confirmada — isso e o proprio motivo dela existir. Rode a
`lwc-pattern-documenter` (Skill 1) primeiro para documentar a jornada que voce quer usar
como base."*

## Etapa 0 — [SO modo Editar] Lookup reverso componente→jornada

Se o usuario ja disse "editar o componente X", descubra a jornada de referencia ANTES
de perguntar qualquer outra coisa:
```bash
node .claude/skills/lwc-pattern-generator/scripts/pattern-reader.mjs \
  --find-journey force-app/main/default/lwc/nomeDoComponente
```
- **`count: 0`** (nenhum match) → apresente 3 saidas, sem decidir sozinho:
  *"O componente 'X' nao esta em nenhuma jornada documentada. Quer que eu (a) rode a
  Skill 1 pra documentar a jornada dele primeiro, (b) siga so com o craft delegado
  (sem gate de aderencia, ja que nao ha padrao pra comparar), ou (c) voce escolhe
  manualmente uma jornada parecida como referencia aproximada?"*
- **`count: 1`** → confirme com o usuario e prossiga com essa jornada.
- **`count > 1`** (o componente aparece em mais de uma jornada) → **NUNCA escolha a
  primeira sozinho**: *"O componente 'X' aparece em N jornadas diferentes: A, B, C.
  Qual delas devo usar como referencia para esta edicao?"*

## Etapa 1 — Escolha explicita de modo

Nunca assuma o modo pelo jeito que o usuario pediu. Pergunte (ou confirme, se ja ficou
implicito no pedido):

*"Isso e para: (a) criar um componente novo do zero, (b) clonar um componente existente
e adaptar para um cenario novo, ou (c) editar um componente que ja existe?"*

## Etapa 2 — Jornada de referencia

- **Criar:** liste as jornadas via `--list` e pergunte qual usar como referencia (ou
  confirme se o usuario ja apontou uma).
- **Clonar:** confirme a jornada E o componente-fonte. Selecao **hibrida** (regra 1 da
  Skill 1): pergunte se o usuario ja sabe qual componente quer clonar, ou se quer que
  voce liste os candidatos daquela jornada (`journey.components` no `journeys-index.json`).
- **Editar:** ja descoberta na etapa 0 — so confirme.

**Mistura de jornadas:** se o requisito claramente pede elementos de mais de uma jornada
(ex.: "quero o layout da jornada A mas o contrato de dados da jornada B"), pare e
pergunte explicitamente qual e a jornada de referencia PRINCIPAL — nunca misture
convencoes de duas jornadas silenciosamente.

## Etapa 3 — Coleta de requisito

Varia por modo:
- **Criar:** proposito do componente, fonte de dados (LDS/Apex/GraphQL/LMS), slots
  necessarios, nivel de acessibilidade esperado.
- **Clonar:** qual componente-fonte, o que muda no cenario novo (objeto/campo
  diferente? contrato `@api` diferente?). **Se o cenario precisar de Apex novo ou
  diferente do original, dispare `platform-apex-generate` ANTES de gerar o LWC** —
  o LWC depende do controller existir.
- **Editar:** qual a mudanca especifica pedida. Nunca amplie o escopo sozinho ("já que
  estou aqui, vou aproveitar e...") — só o que foi pedido.

## Etapa 4 — Checagem proativa de colisao de nome/path

Antes do guard entrar em acao (que so bloqueia na hora de escrever), confira se o nome
do componente-alvo ja existe:
```bash
ls force-app/main/default/lwc/<nomeProposto> 2>/dev/null
```
Se existir e o modo for Criar/Clonar: *"Ja existe um componente chamado '<nome>'. Quer
usar outro nome, ou voce quis dizer editar esse componente existente?"* — isso e uma
decisao de produto, nao so o bloqueio tecnico de ultima hora do `guard.mjs`.

## Etapa 5 — Preview do que sera reaproveitado/adaptado, ou diff proposto

- **Clonar** (ver `references/clone-adapt-guide.md` para o detalhamento): mostre
  explicitamente duas listas — o que vem da **convencao da jornada** (reaproveitar tal
  qual) e o que e **especifico do componente-fonte** (adaptar para o cenario novo, via
  `aggregate.componentSpecifics` da Skill 1 ou diff ao vivo se o componente-fonte nao
  fez parte da amostra documentada). Peça confirmação antes de gerar.
- **Editar** (ver `references/edit-mode-guide.md`): mostre o **diff proposto** (arquivo
  por arquivo) ANTES de escrever. Aprovacao explicita obrigatoria. Confirme que a
  working tree esta limpa (`git status --short <path-do-componente>`) antes de aplicar
  — garante que `git checkout -- <arquivo>` seja um rollback seguro se algo der errado.

## Etapa 6 — Gera/edita (delega craft)

Escreva o codigo usando:
- A receita da jornada (`pattern-reader.mjs --journey "..."` — `representativeSkeleton`/
  `modalSkeleton`, naming, `commonSldsClasses`, contrato `@api`+defaults, `sharedUtils`,
  `eventContracts`, `apexCallStyle`, loading/toast, i18n, a11y).
- O craft de `experience-lwc-generate` (bundle scaffolding, wire, Apex/GraphQL, a11y).
- A verificacao de SLDS de `design-systems-slds-apply` (rode os scripts de busca antes
  de usar qualquer hook/classe/blueprint/icone — nunca "inventar" pelo nome).

**Inclua o `.test.js` companheiro** se `aggregate.tests.componentsWithTests` mostrar que
a jornada padroniza teste Jest.

**Escrita atomica do bundle:** prepare todos os arquivos do componente antes de
confirmar a escrita final — nao deixe um bundle pela metade se algo falhar no meio.

## Etapa 7 — Score de aderencia + score de craft/SLDS lado a lado

```bash
# Modo Criar/Clonar (componente inteiro):
node .claude/skills/lwc-pattern-generator/scripts/pattern-scorer.mjs \
  --journey "Nome da Jornada" --component force-app/main/default/lwc/novoComponente

# Modo Editar (so o diff estrutural):
node .claude/skills/lwc-pattern-generator/scripts/pattern-scorer.mjs \
  --journey "Nome da Jornada" \
  --baseline <copia-do-componente-ANTES-da-edicao> \
  --component force-app/main/default/lwc/componenteEditado
```
Mostre o `score.total/score.max` (aderencia ao padrao da org) **junto com** o resultado
do craft delegado (rubrica PICKLES 165pt da `experience-lwc-generate`, checklist/lint da
`design-systems-slds-apply`) — os dois lado a lado no preview, nao so um.

Se `regressions` (modo Editar) tiver itens: apresente-os como avisos explicitos,
distintos do score — pergunte se a remocao foi intencional.

## Etapa 8 — Deploy com aprovacao explicita

Delegue a `platform-metadata-deploy`. So prossiga apos o "ok" explicito do usuario sobre
o preview (score + diff + craft).

## Etapa 9 — Aprendizado

- Se houve friccao relevante sobre a propria skill, anote em `RECOMMENDATIONS.md`.
- **Sugestao de "rode a Skill 1 de novo"**: so se `novelty.novel === true` no resultado
  do `pattern-scorer.mjs` (um `@api`/evento/classe SLDS que nao aparece nem nos padroes
  compartilhados nem em `componentSpecifics` de nenhum componente da jornada). Se
  disparar: *"Este componente introduz `<item>`, que ainda nao esta documentado nesta
  jornada. Vale rodar a Skill 1 de novo incluindo este componente, para o padrao
  refletir essa novidade?"*
- **Nunca reescreva `design-patterns.md`/`journeys-index.json`/`journeys/*.json`** —
  isso e territorio exclusivo da Skill 1. No maximo sugira ao usuario rodar a Skill 1.

---

## Resumo de riscos por modo (para nao esquecer no meio do fluxo)

| Modo | Arquivo-alvo | Guard | O que NUNCA fazer |
|---|---|---|---|
| Criar | novo | `allow` | gerar sem jornada confirmada |
| Clonar | novo | `allow` (checar colisao antes) | copiar cegamente o que e especifico do componente-fonte |
| Editar | existente | `ask` obrigatorio | ampliar o escopo, "corrigir" convencao antiga sem pedido, pular o diff |
