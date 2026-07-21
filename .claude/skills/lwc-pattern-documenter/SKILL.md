---
name: lwc-pattern-documenter
description: >-
  Documenta o DESIGN SYSTEM de Lightning Web Components (LWC) de uma org, por
  JORNADA/PRODUTO, num Markdown vivo e incremental. Dado um conjunto de LWCs que o
  usuario aponta (caminho manual OU menu interativo) + um nome de jornada/produto,
  extrai padroes (naming, CSS/tokens, slots, eventos, imports, acessibilidade,
  composicao) e ESCREVE/ATUALIZA uma secao em docs/design-patterns.md — nunca gera
  nem edita componentes, so LE e DOCUMENTA. Tem um GUIA INICIAL obrigatorio (nunca
  "recebe input e sai processando"): confirma jornada, exige minimo de 3 componentes,
  documenta divergencia em vez de decidir sozinha, evita jornada duplicada. TRIGGER
  quando o usuario pedir "documente/aprenda os padroes de LWC da jornada X",
  "registre o design system desses componentes", invocar /lwc-pattern-documenter, ou
  pedir para atualizar uma jornada ja documentada. DO NOT TRIGGER para GERAR/editar
  um LWC (isso e a futura lwc-pattern-generator), autorar Apex, criar campos/objetos,
  ou mexer em Flow.
---

# LWC Pattern Documenter — aprende e registra o design system, por jornada

Objetivo: dado um conjunto de LWCs que o usuario aponta como representativos de uma
**jornada/produto** (ex.: "Atendimento ao Cliente", "Vendas B2B"), extrair os padroes
de design e **escrever/atualizar uma secao** em `docs/design-patterns.md`. O documento
cresce **incrementalmente** — uma jornada por vez — e vira a referencia canonica que a
futura `lwc-pattern-generator` (Skill 2) usara para gerar novos componentes alinhados.

Esta skill **so le e documenta**. Ela **nunca** gera, edita ou deploya componentes.
E uma skill de risco baixo de proposito (a validacao do "cerebro" — extracao de
padroes — antes de arriscar o "corpo" — geracao de codigo). Veja `docs/ARCHITECTURE.md`.

## 🚫 NUNCA FACA (proibicoes absolutas)

Esta skill escreve APENAS dois arquivos: `docs/design-patterns.md` e
`docs/journeys-index.json`. Voce **NUNCA**:

1. **Escreve, edita, cria, move, apaga ou deploya** qualquer arquivo de componente LWC
   (`.js`/`.html`/`.css`/`.js-meta.xml`) — a leitura desses arquivos e **somente
   leitura**. Gerar/editar LWC e trabalho da futura `lwc-pattern-generator`, nao desta.
2. **Autora Apex, cria campos/objetos, mexe em Flow/Process/Automation** ou qualquer
   outro metadata. Fora do escopo total desta skill.
3. **Decide sozinha qual convencao "vale mais"** quando os componentes divergem — voce
   DOCUMENTA as variantes e sinaliza (regra 3 abaixo); a decisao e do usuario.
4. **Documenta uma jornada com menos de 3 componentes** (regra 2) — bloqueie e peca mais.
5. **Escreve no documento sem passar pelo GUIA INICIAL** (as 9 etapas) e sem o preview
   aprovado pelo usuario (etapa 8).

Na duvida sobre tocar em qualquer coisa que nao seja os dois arquivos de saida: PARE.

## As 4 regras de curadoria (o coracao da skill)

Decididas com o usuario (ver `docs/ARCHITECTURE.md`, secao 4). Elas tornam o guia
inicial obrigatorio — cada uma exige uma checagem ANTES de escrever:

1. **Selecao hibrida.** O usuario informa os caminhos dos LWCs diretamente OU pede que
   voce liste os componentes do projeto para escolher de um menu. **Sempre pergunte
   qual dos dois** — nunca assuma.
2. **Minimo de 3 componentes por jornada.** Menos de 3 nao prova convencao, prova
   coincidencia. Se vier menos, **bloqueie a extracao** e peca mais exemplos.
3. **Divergencia e documentada, nunca decidida.** Se os componentes usam convencoes
   diferentes entre si (ex.: 2 com token de cor, 1 com cor hardcoded), **registre as
   variantes** na secao e marque como "convencao inconsistente nesta jornada". Nunca
   escolha a maioria automaticamente.
4. **Lista canonica de jornadas.** Antes de criar uma secao nova, cheque o
   `docs/journeys-index.json`: se o nome novo se parece com um ja existente
   ("Atendimento" vs "Atendimento ao Cliente"), **avise e confirme** antes de criar —
   evita fragmentar o documento por variacao de digitacao.

## Delegacao

Esta skill (Skill 1) **nao delega craft** — ela so extrai e documenta, nao gera nada.
(A Skill 2, `lwc-pattern-generator`, e que delegara a geracao de LWC para as skills
oficiais `experience-lwc-generate` e `design-systems-slds-apply` — ver ARCHITECTURE.md.)

## Sinal deterministico — `pattern-extractor.mjs`

Em vez de ler cada arquivo e adivinhar, use o script (mesma filosofia do
`apex-coverage.mjs` do apex-test-loop: o script EXTRAI de forma mecanica, voce JULGA e
escreve):

```bash
# Listar os LWCs do projeto (para o menu de selecao — regra 1):
node .claude/skills/lwc-pattern-documenter/scripts/pattern-extractor.mjs \
  --list force-app/main/default/lwc

# Extrair os sinais dos componentes apontados:
node .claude/skills/lwc-pattern-documenter/scripts/pattern-extractor.mjs \
  --components <pasta1>,<pasta2>,<pasta3> --journey "Nome da Jornada"
```

O JSON de extracao traz, por componente e agregado: `naming` (estilo, prefixo comum),
`js` (imports, decorators @api/@track/@wire, eventos, lifecycle), `html` (slots,
diretivas, ARIA/roles, base components `lightning-*`), `css` (custom properties
consumidas/definidas, `:host`, uso de SLDS, cores hardcoded), `meta` (apiVersion,
isExposed, targets), `aggregate.divergences` (convencoes em conflito), `minComponentsMet`
e `warnings`. O que cada sinal significa e a ordem de prioridade estao em
`references/extraction-signals.md`.

> Sempre redirecione a saida para arquivo (`> extract.json`), nunca trunque por
> `tail`/`head` — igual a licao R-0023 do apex-test-loop.

## O GUIA INICIAL (9 etapas obrigatorias)

Nunca pule para a escrita. Toda execucao passa por estas etapas — detalhe e mensagens
em `references/guided-mode.md`:

1. **Mostrar o estado atual** — leia `docs/journeys-index.json` e liste as jornadas ja
   documentadas (se houver).
2. **Jornada nova ou atualizacao?** — receba o nome; se parecer com uma ja indexada,
   avise e confirme (regra 4).
3. **Modo de selecao** — pergunte: "voce tem os caminhos, ou quer que eu liste os LWCs
   do projeto?" (regra 1). Se listar, use `--list`.
4. **Confirmar a lista final** de componentes antes de extrair — checkpoint explicito.
5. **Rodar o extrator e checar o minimo** — `--components ... --journey ...`. Se
   `minComponentsMet` for `false`, **PARE** e peca mais componentes (regra 2). Nao
   escreva nada.
6. **Interpretar os sinais** (usando `references/extraction-signals.md`) — traduza o
   JSON em convencoes legiveis (naming, CSS/tokens, slots, eventos, a11y, composicao).
7. **Tratar divergencia** — para cada item em `aggregate.divergences`, documente as
   variantes e marque "inconsistente"; nunca decida (regra 3).
8. **Preview + aprovacao** — mostre ao usuario o Markdown EXATO que vai escrever na
   secao, ANTES de salvar. So prossiga com o "ok" explicito.
9. **Escrever/atualizar** — grave a secao em `docs/design-patterns.md` (nova → anexa;
   existente → atualiza a secao daquela jornada, nunca duplica) e atualize o
   `docs/journeys-index.json` (nome novo → adiciona; atualizacao → so a data do scan).

## Formato do documento

- `docs/design-patterns.md` — uma secao `## Padrao: <Jornada>` por jornada/produto, com
  componentes-fonte, data do scan, e as convencoes (naming, CSS/tokens, slots, eventos,
  composicao, a11y). Divergencias ficam numa subsecao "⚠️ Convencoes inconsistentes".
  Template e exemplo em `references/extraction-signals.md` e em `docs/ARCHITECTURE.md`
  (secao 4).
- `docs/journeys-index.json` — lista canonica: `[{ "journey", "components", "lastScan" }]`.
  Fonte de verdade da regra 4 (evitar duplicata) e do "estado atual" da etapa 1.

## Encerramento

Resumo curto: qual jornada foi documentada/atualizada, quantos componentes, e se houve
divergencias registradas. Se apareceu uma licao reutilizavel sobre a propria skill,
anote em `RECOMMENDATIONS.md` (quando existir) — mesmo modelo de ledger do apex-test-loop.

## Referencias

- `references/extraction-signals.md` — o que cada sinal significa, ordem de prioridade,
  e o template da secao do documento.
- `references/guided-mode.md` — o roteiro detalhado das 9 etapas (mensagens em PT).
- `docs/ARCHITECTURE.md` (raiz do repo) — a arquitetura completa das 2 skills e as
  decisoes de design por tras destas regras.
