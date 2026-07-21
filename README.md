# Salesforce-LWC-Developer

Skill para Claude Code que **aprende o design system de LWCs da sua org** (padrões
construídos ao longo de anos de desenvolvimento customizado) e **gera/edita
componentes Lightning Web Components** respeitando esses padrões — com fluxo
interativo de requisitos, preview antes de deploy, e um registro vivo de padrões
aprendidos.

> **Status:** a **Skill 1 (`lwc-pattern-documenter`)** está implementada — Tier 0
> (MVP). Ela **aprende e documenta** os padrões de design por jornada/produto num
> Markdown vivo. A **Skill 2 (`lwc-pattern-generator`)**, que gera/edita componentes,
> ainda não foi construída. Veja [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## As duas skills

**Skill 1 — `lwc-pattern-documenter` (implementada):** você aponta um conjunto de LWCs
que representam uma jornada/produto (ex.: "Atendimento ao Cliente") + o nome dela, e a
skill extrai as convenções (naming, CSS/tokens, slots, eventos, imports, acessibilidade)
e **escreve/atualiza uma seção** em [`docs/lwc-design-system/design-patterns.md`](docs/lwc-design-system/design-patterns.md).
O documento cresce incrementalmente, uma jornada por vez. Ela **só lê e documenta** —
nunca gera nem edita componentes.

- **Guia inicial obrigatório** — nunca "recebe input e sai processando": confirma a
  jornada, exige mínimo de 3 componentes, documenta divergência em vez de decidir
  sozinha, e evita jornada duplicada.
- **Sinal determinístico** — o script `pattern-extractor.mjs` faz a extração mecânica
  dos sinais e emite JSON (mesma filosofia do `apex-coverage.mjs` do apex-test-loop).
- **Preview antes de gravar** — nada vai para o documento sem você ver e aprovar.

**Skill 2 — `lwc-pattern-generator` (a construir):** dado um requisito + qual
jornada/produto usar como referência, gera um LWC que respeita aquele padrão —
delegando o craft de LWC às skills oficiais `experience-lwc-generate` e
`design-systems-slds-apply` do `forcedotcom/sf-skills`. Com preview antes de deploy.

## Por que existe

Este projeto nasce da experiência com a skill
[`apex-test-loop`](https://github.com/brunotrolo/Salesforce-LoopAgentApex) (agent
loop de cobertura de testes Apex) — reaproveitando as lições de segurança em 3
camadas, autoaprendizado via ledger local, e modo guiado em português — aplicadas
agora ao domínio de LWC.

## Documentação

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — arquitetura proposta: fluxo,
  modelo de ownership/delegação, segurança em 3 camadas, sistema de aprendizado de
  padrões, rubrica de qualidade, estrutura de repositório e decisões de design.
- [`docs/PLANEJAMENTO.md`](docs/PLANEJAMENTO.md) — trilha de pesquisa que embasou a
  arquitetura: comparação com `apex-test-loop` e com o repositório oficial
  `forcedotcom/sf-skills`, matriz de decisão (reusar/adaptar/manter) e o "porquê"
  por trás de cada escolha.

## Licença

[MIT](LICENSE)
