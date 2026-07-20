# Salesforce-LWC-Developer

Skill para Claude Code que **aprende o design system de LWCs da sua org** (padrões
construídos ao longo de anos de desenvolvimento customizado) e **gera/edita
componentes Lightning Web Components** respeitando esses padrões — com fluxo
interativo de requisitos, preview antes de deploy, e um registro vivo de padrões
aprendidos.

> **Status:** em fase de design. Ainda não há código de skill implementado — veja
> [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) para a proposta de arquitetura em
> discussão.

## O que esta skill vai fazer

- **Aprender padrões existentes** — varre os LWCs da sua org e extrai convenções de
  naming, slots, CSS/design tokens, imports/eventos JavaScript, composição de
  componentes e acessibilidade.
- **Gerar/editar LWCs a partir de requisitos** — você descreve o que precisa, a
  skill propõe um componente que já nasce alinhado ao seu design system.
- **Fluxo interativo (modo guiado)** — perguntas passo a passo para entender o
  contexto antes de gerar qualquer código.
- **Preview antes de deploy** — nada vai para a org sem você ver e aprovar.
- **Registro de padrões** — um `patterns.json` versionado, que cresce a cada
  execução e serve de referência para os próximos componentes.

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

## Licença

[MIT](LICENSE)
