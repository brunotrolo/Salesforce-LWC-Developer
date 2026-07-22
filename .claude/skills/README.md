# Skills deste repositório

Skills para Claude Code / OpenCode que compõem o **Salesforce LWC Developer**. Cada
skill vive na própria pasta abaixo de `.claude/skills/` e é carregada automaticamente
pela ferramenta a partir do frontmatter do seu `SKILL.md`.

### Nossas skills

| Skill | Estado | O que faz |
|---|---|---|
| [`lwc-pattern-documenter/`](lwc-pattern-documenter/) | ✅ Implementada | Aprende e **documenta** os padrões de design de LWC, por jornada/produto, num Markdown vivo. Só lê e documenta — nunca gera componentes. |
| [`lwc-pattern-generator/`](lwc-pattern-generator/) | ✅ Implementada | **Cria, clona/adapta ou edita** LWCs respeitando a jornada de referência (3 modos de operação), delegando o craft às skills oficiais abaixo, e pontuando aderência ao padrão da org aprendido pela Skill 1. |

### Skills oficiais da Salesforce importadas (craft — `forcedotcom/sf-skills`, Apache-2.0)

Importadas **na íntegra** (snapshot `v1.31.0`), sem modificação. Atribuição e obrigações
da licença em [`VENDOR-ATTRIBUTION.md`](VENDOR-ATTRIBUTION.md).

| Skill oficial | Para que serve |
|---|---|
| [`experience-lwc-generate/`](experience-lwc-generate/) | Craft de autoria/edição de LWC (bundle, `@wire`, Apex/GraphQL, SLDS2, a11y, Jest). |
| [`design-systems-slds-apply/`](design-systems-slds-apply/) | Craft de styling/tokens SLDS (Lightning Base Components > Blueprints > Styling Hooks > CSS). |

Arquitetura completa das duas skills e as decisões de design: [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md).

## Coexistência com a `apex-test-loop`

Estas skills foram desenhadas para conviver no MESMO projeto Salesforce que a
[`apex-test-loop`](https://github.com/brunotrolo/Salesforce-LoopAgentApex) **sem
sobrescrever nada**: a `lwc-pattern-documenter` **não traz `.claude/settings.json`**
(instalação puramente aditiva) e escreve apenas em `.lwc-pattern-documenter/lwc-design-system/`. Detalhes
na seção "🤝 Coexistência" do `lwc-pattern-documenter/SKILL.md`.
