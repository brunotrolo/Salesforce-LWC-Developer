# `.claude/` — configuração de skills para Claude Code / OpenCode

Esta pasta carrega automaticamente as skills deste projeto a partir de
[`skills/`](skills/). Cada subpasta em `skills/` com um `SKILL.md` é uma skill.

## Conteúdo

- [`skills/lwc-pattern-documenter/`](skills/lwc-pattern-documenter/) — **nossa** skill
  (Skill 1): aprende e documenta os padrões de design de LWC por jornada/produto. Só lê
  e documenta — não precisa de guard/hook próprios.
- [`skills/lwc-pattern-generator/`](skills/lwc-pattern-generator/) — **nossa** skill
  (Skill 2): cria, clona/adapta ou edita LWCs alinhados a essa documentação (3 modos),
  delegando o craft às skills oficiais abaixo.
- `skills/experience-lwc-generate/` e `skills/design-systems-slds-apply/` — skills
  **oficiais da Salesforce** (`forcedotcom/sf-skills`, Apache-2.0) importadas na íntegra
  como o *craft* de LWC. Atribuição em [`skills/VENDOR-ATTRIBUTION.md`](skills/VENDOR-ATTRIBUTION.md).
- Índice das skills: [`skills/README.md`](skills/README.md).
- `settings.json` — segurança da Skill 2 (ver abaixo).
- [`agent-memory-local/`](agent-memory-local/) — memória local por skill (fatos
  operacionais do projeto/org), nunca versionada. Detalhes em
  [`agent-memory-local/README.md`](agent-memory-local/README.md).

## `settings.json` — só a Skill 2 precisa dele

Este projeto **traz um `.claude/settings.json`**, mas ele existe só por causa da
**Skill 2** (`lwc-pattern-generator`): `permissions.deny` (bloqueio duro de
`sf project/org/data delete`) + o hook `PreToolUse` do `guard.mjs` dela (trava contra
sobrescrita de bundle LWC existente). A **Skill 1** continua sem precisar de nada disso
— ela só lê arquivos e escreve Markdown/JSON.

Ao instalar estas skills num projeto que **já usa a `apex-test-loop`** (que tem o
próprio `settings.json` com guard e regras de segurança para Apex), **nunca sobrescreva
o `settings.json` existente** — **mescle os dois**: uma única lista `deny` com as regras
das duas skills, e um array `hooks.PreToolUse` com os dois hooks lado a lado (cada um
com seu próprio `matcher`/`command`). Os dois guards não competem — o desta skill mira
`force-app/**/lwc/**`, o da `apex-test-loop` mira `.cls`/`.trigger`. Detalhes em
[`../INFORMACOES.md`](../INFORMACOES.md), seção "Coexistência com a `apex-test-loop`".
