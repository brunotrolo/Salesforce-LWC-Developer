# Resolucao de Conflito — padrao da jornada vs. requisito do usuario

Principio central (herdado da Skill 1, regra 3): **a skill nunca decide sozinha qual
convencao "vale mais"**. Quando o requisito do usuario diverge do que a jornada
documenta, a skill **apresenta as opcoes** — nunca escolhe silenciosamente.

## Quando isso acontece

- O usuario pede um componente com um contrato `@api` diferente do `commonApiMembers`
  da jornada (ex.: pede `accountId` quando a jornada inteira usa `recordId`).
- O usuario pede uma forma de chamada Apex diferente da dominante (`apexCallStyle`).
- O usuario pede para NAO usar um utilitario compartilhado (`sharedUtils`) que a
  jornada usa amplamente.
- No modo Clonar, o cenario novo genuinamente precisa de algo que nao existe em nenhum
  componente da jornada (nem como convencao compartilhada, nem como
  `componentSpecifics` de nenhum componente-fonte).
- No modo Editar, a mudanca pedida **removeria** uma convencao documentada (ver
  `references/edit-mode-guide.md`, secao de regressao).

## Como apresentar o conflito

Nunca "corrija" silenciosamente o requisito para bater com o padrao, e nunca ignore o
padrao para atender o requisito ao pe da letra. Sempre mostre as duas opcoes e pergunte:

*"A jornada '<Nome>' usa `<X>` como convencao (ex.: contrato `@api` com `recordId`),
mas voce pediu `<Y>`. Quer que eu: (a) siga o padrao da jornada (`<X>`), (b) siga
exatamente o que voce pediu (`<Y>`, documentando como uma divergencia intencional), ou
(c) alguma outra coisa que voce tinha em mente?"*

## Casos especificos

### Contrato `@api` divergente
Se o usuario insiste no nome divergente, gere com o nome pedido — mas avise que isso
pode disparar a flag de **novidade** (`pattern-scorer.mjs`) e sugerir documentar via
Skill 1 depois, se for para virar a nova convencao.

### Forma de chamada Apex divergente
Idem — gere como pedido, mas registre a divergencia no resumo de encerramento (etapa 9
do guia) para o usuario decidir se quer padronizar isso na jornada.

### Utilitario compartilhado — usuario quer reinventar a logica
Avise explicitamente: *"A jornada tem `c/consorcioUtil` com a funcao `fmt(x)`, que
parece cobrir o que voce esta pedindo. Quer reaproveitar, ou tem um motivo para nao
usar aqui?"* — nunca decida por conta propria que o usuario "esta errado".

### Modo Clonar — cenario precisa de algo genuinamente novo
Isso NAO e um conflito no sentido usual (nao ha convencao para violar) — e uma lacuna
legitima. Gere a solucao necessaria, documentando claramente no preview que este e um
elemento **novo**, nao parte do padrao conhecido (a flag de novidade vai capturar isso
automaticamente).

### Modo Editar — a mudanca pedida remove uma convencao
Ver `references/edit-mode-guide.md`. Regra: **sempre confirme a intencao antes de
aplicar** — "a mudanca que voce pediu remove o toast de erro, que e convencao desta
jornada. Confirma que e intencional?"

## O que NUNCA fazer

- Nunca decidir silenciosamente por "a maioria" ou por "o que parece mais correto".
- Nunca gerar sem avisar quando ha divergencia (mesmo que pequena).
- Nunca reescrever `design-patterns.md` para "corrigir" a documentacao com base numa
  unica conversa — isso e territorio da Skill 1, com o proprio guia dela (curadoria
  deliberada, minimo de 3 componentes, etc.).
