# Sinais de extracao — o que documentar, em que prioridade

Referencia do que o `pattern-extractor.mjs` extrai e como o agente deve traduzir isso
em convencoes legiveis na secao do `docs/design-patterns.md`. A ordem abaixo e a
**prioridade** — os primeiros sinais sao os que mais definem "o jeito da org" e os que
a futura `lwc-pattern-generator` mais vai consultar ao gerar.

## Prioridade 1 — Naming

- **`naming.style`** por componente (camelCase, PascalCase, kebab-case...) e
  **`aggregate.naming.dominantStyle`**. LWC exige camelCase na pasta, mas o sinal pega
  desvios.
- **`aggregate.naming.commonPrefix`** — prefixo compartilhado (ex.: todos comecam com
  `invoice`, ou um prefixo de namespace). Se existir, e uma convencao forte da jornada.
- **Divergencia** (`naming.style`): estilos diferentes entre componentes → documentar
  as variantes, nao escolher.

## Prioridade 2 — CSS & Design Tokens

- **`css.customPropsConsumed`** (`var(--x)`) e **`css.usesSlds`** — a org usa tokens
  SLDS/custom properties? Quais tokens aparecem (`aggregate.css.allTokensSeen`)?
- **`css.hardcodedColors`** — cores hardcoded (`#fff`, `rgb(...)`) sao o anti-sinal:
  quebram tema/dark mode e fogem do design system.
- **`css.usesHost`** — escopo via `:host` (boa pratica de encapsulamento).
- **Divergencia** (`css.colorStrategy`): uns usam token, outros hardcoded → a jornada
  tem convencao de cor inconsistente. Documentar as duas, marcar.

## Prioridade 3 — Slots & Composicao

- **`html.slots`** — slots nomeados (`header`, `content`, `footer`) e default. O padrao
  de slots define como os componentes sao compostos/reusados.
- **`aggregate.html.componentsWithSlots`** — quantos usam slots (nem todo componente
  precisa; informativo).
- **`html.lightningTags`** — base components `lightning-*` usados: revela se a org
  prefere Lightning Base Components (recomendado pelo SLDS) vs HTML cru.

## Prioridade 4 — Eventos (JavaScript)

- **`js.events`** (nomes em `new CustomEvent('...')`) e **`aggregate.js.allEvents`**. A
  convencao de nome de evento e chave para composicao parent-child.
- **Divergencia** (`js.eventNaming`): mistura de estilos (uns com prefixo `on`, outros
  sem) → documentar o conflito.

## Prioridade 5 — Data & Decorators

- **`js.decorators`** (`@api`, `@track`, `@wire`) — como o componente expoe API e
  consome dados. `aggregate.js.wireUsers`/`apexUsers` mostram a estrategia de dados
  dominante (wire adapters vs Apex imperativo).
- **`js.imports`** — bibliotecas/modulos recorrentes (uiRecordApi, navigation, toast,
  Apex controllers). Imports repetidos entre componentes = convencao da org.
- **`js.lifecycle`** — hooks usados.

## Prioridade 6 — Acessibilidade (a11y)

- **`html.aria`**, **`html.roles`**, **`html.hasTabindex`**, **`html.hasAlt`** e o
  **`aggregate.html.a11yAvg`** (media de sinais de a11y por componente). Baixo = a org
  provavelmente nao padroniza acessibilidade (registrar como observacao, nao inventar).

## Prioridade 7 — Metadados

- **`meta.apiVersion`** (divergencia de versao entre componentes e sinal de idade
  distinta), **`meta.isExposed`**, **`meta.targets`** (onde o componente aparece:
  RecordPage, App, Home, Community).

---

## Template da secao no `docs/design-patterns.md`

Ao escrever (etapa 9), use esta estrutura por jornada:

```markdown
## Padrao: <Nome da Jornada/Produto>

**Componentes-fonte:** compA, compB, compC
**Componentes analisados:** 3
**Ultimo scan:** AAAA-MM-DD

### Naming
<estilo dominante + prefixo comum, com exemplo real>

### CSS & Design Tokens
<usa tokens/SLDS? quais? :host? cores hardcoded?>

### Slots & Composicao
<slots nomeados; base components lightning-* preferidos>

### Eventos
<convencao de nome de evento, com exemplos reais>

### Dados (decorators & imports)
<@wire vs Apex imperativo; imports recorrentes>

### Acessibilidade
<nivel observado de ARIA/role/alt — sem inventar o que nao existe>

### Metadados
<apiVersion, targets tipicos>

<!-- SO se `aggregate.componentSpecifics` tiver itens: -->
### Elementos especificos por componente
Itens que aparecem em UM SO componente desta jornada (nao sao padrao compartilhado,
mas foram identificados e devem ficar registrados atrelados ao componente de origem):
- **compA:** <slots/eventos/tokens/imports/tags/diretivas exclusivos deste componente>
- **compB:** <...>

<!-- SO se houver divergencias no aggregate: -->
### ⚠️ Convencoes inconsistentes nesta jornada
- **<sinal>:** <as variantes encontradas, com quais componentes usam cada uma>.
  _Decisao pendente do usuario — a skill nao escolheu._
```

**Distincao importante (compartilhado × especifico × divergente):**
- **Padrao compartilhado** = o sinal aparece em varios componentes (vai nas secoes de
  Naming, CSS, Slots, Eventos... como a convencao da jornada).
- **Elemento especifico** (`aggregate.componentSpecifics`) = so UM componente tem
  aquele item; nao e conflito, e so unico. Vai em "Elementos especificos por
  componente", atrelado ao arquivo. (Pedido explicito do usuario: registrar tudo, e o
  que for muito especifico de um arquivo fica marcado como daquele arquivo.)
- **Divergencia** (`aggregate.divergences`) = os componentes DISCORDAM sobre a mesma
  convencao (ex.: uns com token, outros com cor hardcoded). Vai em "⚠️ Convencoes
  inconsistentes", com a decisao deixada para o usuario.

Registre **todos** os elementos identificados — nao resuma a ponto de perder itens.
O documento e a fonte que a Skill 2 vai usar; o que nao for registrado, ela nao vera.

**Regras de escrita:**
- Use **exemplos reais** extraidos dos componentes (o token real, o nome de evento
  real), nunca inventados.
- Nao afirme o que os sinais nao mostram (ex.: se `a11yAvg` e 0, escreva "nenhum sinal
  de a11y padronizado observado", nao "a org caprichou em acessibilidade").
- Divergencia SEMPRE vira subsecao "⚠️ Convencoes inconsistentes" — nunca some numa
  escolha silenciosa.
