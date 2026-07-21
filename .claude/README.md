# `.claude/` — configuração de skills para Claude Code / OpenCode

Esta pasta carrega automaticamente as skills deste projeto a partir de
[`skills/`](skills/). Cada subpasta em `skills/` com um `SKILL.md` é uma skill.

## Conteúdo

- [`skills/lwc-pattern-documenter/`](skills/lwc-pattern-documenter/) — **nossa** skill
  (Skill 1): aprende e documenta os padrões de design de LWC por jornada/produto.
- `skills/experience-lwc-generate/` e `skills/design-systems-slds-apply/` — skills
  **oficiais da Salesforce** (`forcedotcom/sf-skills`, Apache-2.0) importadas na íntegra
  como o *craft* de LWC. Atribuição em [`skills/VENDOR-ATTRIBUTION.md`](skills/VENDOR-ATTRIBUTION.md).
- Índice das skills: [`skills/README.md`](skills/README.md).

## ⚠️ Sem `settings.json` aqui (de propósito)

Este projeto **não traz um `.claude/settings.json`**. Isso é intencional: a Skill 1 só
lê arquivos e escreve Markdown/JSON — não precisa de guard/hook/permissões próprias. Ao
instalar estas skills num projeto que **já usa a `apex-test-loop`** (que tem o próprio
`settings.json` com guard e regras de segurança), **nunca sobrescreva** o `settings.json`
existente — copie apenas as pastas de skill. Instalação puramente aditiva. Detalhes na
seção "🤝 Coexistência" de `skills/lwc-pattern-documenter/SKILL.md`.
