# Skills deste repositório

Skills para Claude Code / OpenCode que compõem o **Salesforce LWC Developer**. Cada
skill vive na própria pasta abaixo de `.claude/skills/` e é carregada automaticamente
pela ferramenta a partir do frontmatter do seu `SKILL.md`.

| Skill | Estado | O que faz |
|---|---|---|
| [`lwc-pattern-documenter/`](lwc-pattern-documenter/) | ✅ Implementada (Tier 0) | Aprende e **documenta** os padrões de design de LWC, por jornada/produto, num Markdown vivo. Só lê e documenta — nunca gera componentes. |
| `lwc-pattern-generator/` | ⏳ A construir (Tier 2+) | **Gera/edita** LWCs respeitando a jornada de referência, delegando o craft às skills oficiais `experience-lwc-generate` e `design-systems-slds-apply` do `forcedotcom/sf-skills`. |

Arquitetura completa das duas skills e as decisões de design: [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md).

## Coexistência com a `apex-test-loop`

Estas skills foram desenhadas para conviver no MESMO projeto Salesforce que a
[`apex-test-loop`](https://github.com/brunotrolo/Salesforce-LoopAgentApex) **sem
sobrescrever nada**: a `lwc-pattern-documenter` **não traz `.claude/settings.json`**
(instalação puramente aditiva) e escreve apenas em `docs/lwc-design-system/`. Detalhes
na seção "🤝 Coexistência" do `lwc-pattern-documenter/SKILL.md`.
