# Guia inicial — roteiro das 9 etapas (PT)

O principio nao-negociavel: esta skill **nunca "recebe input e sai processando"**.
Mesmo so lendo e documentando, ela toma decisoes (bloquear por poucos componentes,
sinalizar divergencia, evitar duplicata) que exigem checkpoint humano. Conduza uma
etapa por vez, em portugues simples.

## Etapa 1 — Mostrar o estado atual
Leia `docs/journeys-index.json`. Se ja houver jornadas documentadas, liste-as
("Ja temos documentadas: Atendimento ao Cliente (5 comps, scan 2026-07-10), Vendas B2B
(3 comps)..."). Se vazio, diga que este sera o primeiro padrao documentado.

## Etapa 2 — Jornada nova ou atualizacao?
Pergunte o nome da jornada/produto. Compare com o indice (regra 4):
- Nome novo, sem parecido → segue como jornada nova.
- Parecido com um existente ("Atendimento" vs "Atendimento ao Cliente") → **avise**:
  *"Ja existe 'Atendimento ao Cliente'. Voce quer ATUALIZAR essa, ou e uma jornada nova
  mesmo?"* — so prossiga apos a resposta.
- Nome identico a um existente → e atualizacao (vamos re-escanear e atualizar a secao).

## Etapa 3 — Modo de selecao dos componentes (regra 1)
Pergunte: *"Voce ja tem os caminhos dos LWCs que representam essa jornada, ou quer que
eu liste os componentes do projeto para voce escolher?"*
- **Tem os caminhos** → peca a lista.
- **Quer o menu** → rode `--list force-app/main/default/lwc` (ajuste a raiz se o
  projeto usa outro `packageDirectory`), mostre os nomes numerados, e deixe o usuario
  escolher.

## Etapa 4 — Confirmar a lista final
Antes de extrair, repita a lista final de componentes e peca confirmacao:
*"Vou analisar estes 3: userPicker, caseForm, statusTimeline. Confirma?"* Nunca assuma
que a primeira lista e a definitiva.

## Etapa 5 — Extrair e checar o minimo (regra 2)
Rode o extrator (`--components ... --journey "..." > extract.json`). Se
`minComponentsMet` for `false` (menos de 3 validos), **PARE**:
*"So consegui 2 componentes validos. Preciso de pelo menos 3 para documentar um padrao
com confianca — 2 nao provam convencao. Pode apontar mais algum dessa jornada?"* Nao
escreva nada no documento.

## Etapa 6 — Interpretar os sinais
Com `references/extraction-signals.md` na mao, traduza o JSON em convencoes legiveis, na
ordem de prioridade (naming → CSS/tokens → slots → eventos → dados → a11y → metadados).
Use exemplos reais extraidos, nunca inventados.

## Etapa 7 — Tratar divergencia (regra 3)
Para cada item em `aggregate.divergences`, **nao decida**. Prepare a subsecao
"⚠️ Convencoes inconsistentes" com as variantes e quem usa cada uma. Se quiser, comente
ao usuario: *"Achei uma inconsistencia: 2 componentes usam token de cor, 1 usa #fff
hardcoded. Vou documentar as duas e marcar como pendente — voce decide depois qual e a
oficial."*

## Etapa 8 — Preview + aprovacao (obrigatorio)
Mostre o Markdown EXATO da secao que vai escrever, ANTES de salvar:
*"Esta e a secao que vou gravar em docs/design-patterns.md. Confere?"* So prossiga com
o "ok" explicito. Se o usuario ajustar algo, edite e mostre de novo.

## Etapa 9 — Escrever/atualizar
- **Jornada nova** → anexe a secao ao fim de `docs/design-patterns.md`; adicione a
  entrada ao `docs/journeys-index.json`.
- **Atualizacao** → substitua APENAS a secao daquela jornada (nunca duplique, nunca
  crie `-v2`); atualize `lastScan`/`components` no indice.
Feche com o resumo curto (etapa de encerramento do SKILL.md).

---

## Modo automatico?
Diferente da Skill 2, aqui NAO ha um "modo automatico" que pule o guia — as 4 regras de
curadoria exigem os checkpoints. O maximo de agilidade e: se o usuario ja informou nome
+ caminhos numa frase so ("documente a jornada Faturas com estes 3: a, b, c"), voce pode
condensar as etapas 2-4 numa unica confirmacao — mas as etapas 5 (minimo), 7
(divergencia) e 8 (preview) permanecem sempre.
