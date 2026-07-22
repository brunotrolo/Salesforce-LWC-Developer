# Modo Editar — guia detalhado

O modo de **maior risco**: mexe num componente que ja existe (potencialmente em
producao). Duas garantias centrais que nao podem ser puladas: (1) diff/preview
obrigatorio antes de escrever; (2) o score de aderencia avalia **so o que a edicao
mudou**, nunca o arquivo inteiro — para nao "corrigir" ou penalizar codigo legado que
a edicao nao tocou.

## 1. Descobrir a jornada de referencia (lookup reverso)

```bash
node .claude/skills/lwc-pattern-generator/scripts/pattern-reader.mjs \
  --find-journey force-app/main/default/lwc/nomeDoComponente
```
Trate `count: 0` (documentar/craft-only/jornada aproximada) e `count > 1` (perguntar
qual usar) conforme `references/guided-mode.md`, etapa 0.

## 2. Capturar o baseline (antes da edicao)

Antes de tocar no arquivo, guarde uma copia do estado atual — precisa dela intacta para
o diff estrutural depois:
```bash
mkdir -p /tmp/baseline-<nomeDoComponente>
cp force-app/main/default/lwc/<nomeDoComponente>/*.{js,html,css,js-meta.xml} /tmp/baseline-<nomeDoComponente>/
```
(Ou, se preferir, use `git show HEAD:<caminho>` para cada arquivo — o que for mais
simples dado o estado da working tree.)

Confirme a working tree limpa antes de aplicar a edicao de verdade:
```bash
git status --short force-app/main/default/lwc/<nomeDoComponente>
```
Se houver mudancas nao commitadas alheias a esta edicao, avise o usuario antes de
prosseguir — o rollback via `git checkout -- <arquivo>` so e seguro numa tree limpa.

## 3. Mostrar o diff proposto (aprovacao obrigatoria)

Aplique a edicao (ou prepare o conteudo proposto) e mostre o diff real (`git diff` ou
equivalente) para os arquivos alterados. **So prossiga apos o "ok" explicito.**

## 4. Pontuar so o diff estrutural

```bash
node .claude/skills/lwc-pattern-generator/scripts/pattern-scorer.mjs \
  --journey "Nome da Jornada" \
  --baseline /tmp/baseline-<nomeDoComponente> \
  --component force-app/main/default/lwc/<nomeDoComponente>
```

### Como funciona por baixo (para interpretar o resultado)

O `pattern-scorer.mjs` roda o `pattern-extractor.mjs` da Skill 1 **duas vezes**
(baseline e proposto) e compara os dois JSONs de sinais **por chave**, nao por linha:

- **`score.dimensions`** — so as dimensoes onde algo **realmente mudou** (adicionado ou
  removido) entre antes/depois. Pontuadas usando **so os itens novos** (o "delta") —
  um `@api` que ja existia e continua igual nao entra na conta.
- **`score.skippedUnchanged`** — as dimensoes onde **nada mudou**. Ficam de fora do
  `total`/`max` por completo (nem somam a favor, nem penalizam). Isso e o mecanismo
  que garante "codigo legado intocado, mesmo que ja divergisse do padrao antes da
  edicao, nao vira penalidade nova".
- **`regressions`** (campo separado do `score`) — itens **removidos** pela edicao que
  eram convencao documentada da jornada (ex.: um `@api` do contrato comum, o toast de
  erro, o estado de loading, um evento do `eventContracts`). **Sempre apresente como
  aviso explicito e confirme a intencao** — nunca aceite nem bloqueie silenciosamente.
- **`novelty`** — se a edicao introduziu algo que nao existe em nenhum lugar
  documentado da jornada (nem compartilhado, nem `componentSpecifics` de nenhum
  componente). Gatilho objetivo para sugerir rodar a Skill 1 de novo (etapa 9 do guia).

### Exemplo de leitura do resultado

```json
{
  "score": {
    "total": 8, "max": 20,
    "dimensions": [
      { "label": "Contrato @api (nomes + defaults)", "points": 8, "max": 20, "note": "..." }
    ],
    "skippedUnchanged": ["Estrutura (tag raiz)", "Vocabulario SLDS", "..."]
  },
  "regressions": [
    "REGRESSAO: removeu o membro @api \"recordId\", que faz parte do contrato comum da jornada."
  ],
  "novelty": { "novel": true, "items": ["somethingBrandNewNotInJourney"] }
}
```
Leitura: a edicao só mexeu no contrato `@api` (as outras 10 dimensões nem entram na
conta — não foram tocadas); ela **removeu** um `@api` que era convenção comum (avisar e
confirmar); e **introduziu** um `@api` novo desconhecido da jornada (sugerir documentar
depois, se for virar convenção).

## 5. Nunca "corrigir" convencao antiga fora do escopo pedido

Se durante a edicao voce notar que o componente JA divergia do padrao antes (por
exemplo, usa `.then()` quando a jornada e dominantemente `async/await`, mas isso nao
tem nada a ver com o que foi pedido) — **nao mexa nisso**. Mencione no resumo de
encerramento como observacao, mas a edicao deve fazer SO o que foi pedido. "Aproveitar
que estou editando" para alinhar mais coisas ao padrao é uma ampliação de escopo não
autorizada (Camada 3, "NUNCA FAÇA").
