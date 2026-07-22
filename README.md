<p align="center">
  <img src="assets/banner.svg" width="880" alt="Salesforce LWC Developer">
</p>

<p align="center">
  <em>Aprende o design system de LWC da sua org e documenta os padrões &#8212; por jornada, com curadoria sua.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/brunotrolo/Salesforce-LWC-Developer?style=flat-square&color=00A1E0&label=stars" alt="Stars">
  <img src="https://img.shields.io/badge/skill%201-documenter-9C6BFF?style=flat-square" alt="Skill 1: documenter">
  <img src="https://img.shields.io/badge/skill%202-generator%20(3%20modos)-9C6BFF?style=flat-square" alt="Skill 2: generator">
  <img src="https://img.shields.io/badge/works%20with-Claude%20Code%20%C2%B7%20OpenCode-032D60?style=flat-square" alt="Works with Claude Code and OpenCode">
  <img src="https://img.shields.io/badge/craft-Salesforce%20sf--skills-00A1E0?style=flat-square" alt="Salesforce sf-skills">
  <img src="https://img.shields.io/badge/license-MIT-111111?style=flat-square" alt="MIT license">
</p>

<p align="center">
  <b>📄 README</b> &nbsp;·&nbsp; <a href="./docs/ARCHITECTURE.md">🏛️ Arquitetura</a> &nbsp;·&nbsp; <a href="./docs/PLANEJAMENTO.md">🧭 Planejamento</a> &nbsp;·&nbsp; <a href="./LICENSE">⚖️ MIT License</a>
</p>

---

Skills para o Claude Code que **aprendem o design system de LWC da sua org** (padrões construídos ao longo de anos) e, no futuro, **geram componentes** que já nascem alinhados a ele. Tudo com **curadoria sua**: você aponta os arquivos, agrupa por **jornada/produto**, e o documento cresce incrementalmente.

```
você aponta os LWCs de uma jornada  →  extrai os sinais  →  você revisa o preview
        ↑                                                            ↓
        +--- documenta a seção da jornada em Markdown vivo ----------+
```

**Como funciona (duas skills):**
- **Skill 1 — `lwc-pattern-documenter`** ✅ *(esta, implementada):* aprende e **documenta** os padrões por jornada num Markdown vivo. **Só lê e documenta** — nunca gera nem edita componentes.
- **Skill 2 — `lwc-pattern-generator`** ✅ *(implementada):* **cria, clona/adapta ou edita** LWCs (3 modos de operação) respeitando a jornada de referência, **delegando o craft** às skills oficiais da Salesforce (`experience-lwc-generate` + `design-systems-slds-apply`, já importadas neste repo) e pontuando aderência ao padrão da sua org, aprendido pela Skill 1.

> Mesmo princípio do [`Salesforce Apex Cover Loop`](https://github.com/brunotrolo/Salesforce-Apex-Cover-Loop): **orquestração nossa + craft oficial da Salesforce**.

---

## ⚡ Começo rápido

### 1. Pré-requisitos

- **Node 18+** (para o extrator de padrões — script sem dependências).
- **Projeto SFDX** com componentes em `force-app/*/lwc/` (os LWCs que a skill vai analisar).
- **[Claude Code](https://docs.claude.com/en/docs/claude-code)** ou **[OpenCode](https://opencode.ai)**.

> **Skill 1 roda 100% local** — ela só **lê** os arquivos de LWC e escreve Markdown. **Não** precisa de Salesforce CLI (`sf`), nem de conexão com a org, nem de deploy. (A Skill 2 usa `sf`/CLI só na etapa final de deploy, delegada à `platform-metadata-deploy` — a geração/edição em si também é local.)

> **Opcional — rodar de graça com [OpenCode](https://opencode.ai)** (sem key, sem GPU):
> ```bash
> npm install -g opencode-ai
> opencode   # no app: /models → escolha "DeepSeek V4 Flash Free" (OpenCode Zen)
> ```
> A skill funciona igual no OpenCode (mesmo `.claude/skills/`).

### 2. Instale — copie **apenas a pasta `.claude`** para o seu projeto

Rode **de dentro da pasta do seu projeto** (onde está `force-app`). O comando clona este repo num diretório temporário, copia **só o `.claude/`** e apaga o resto:

**Windows (PowerShell):**
```powershell
git clone --depth 1 https://github.com/brunotrolo/Salesforce-LWC-Developer.git .skill-tmp; New-Item -ItemType Directory -Force .claude | Out-Null; Copy-Item -Recurse -Force .skill-tmp\.claude\* .claude\; Remove-Item -Recurse -Force .skill-tmp
```

**Mac / Linux / Git Bash:**
```bash
git clone --depth 1 https://github.com/brunotrolo/Salesforce-LWC-Developer.git .skill-tmp && mkdir -p .claude && cp -r .skill-tmp/.claude/. .claude/ && rm -rf .skill-tmp
```

Isso instala a nossa skill (`lwc-pattern-documenter`) **e** as duas skills oficiais de craft, todas sob `.claude/skills/`.

> **Já usa a [`apex-test-loop`](https://github.com/brunotrolo/Salesforce-Apex-Cover-Loop) no mesmo projeto?** A instalação é **aditiva e segura**: este repo **não traz `.claude/settings.json`**, então o comando acima **não sobrescreve** o `settings.json` (guard/segurança) da `apex-test-loop` — só acrescenta as pastas de skill. As duas convivem sem colisão. Detalhes na seção "🤝 Coexistência" de `.claude/skills/lwc-pattern-documenter/SKILL.md`.

> **Para atualizar:** rode o mesmo comando de novo.

### 3. Abra o Claude Code

```bash
claude
```

A skill carrega automaticamente a partir de `.claude/skills/`.

### 4. Use

```
/lwc-pattern-documenter
```

ou naturalmente:
> "documente os padrões de LWC da jornada Faturas"
> "aprenda o design system desses componentes de Atendimento"

A skill conduz um **roteiro de perguntas** (nunca "recebe e sai processando"): pergunta a jornada, quais arquivos analisar, extrai os sinais, mostra um **preview** e só então grava a seção em `.lwc-pattern-documenter/lwc-design-system/design-patterns.md`.

---

## 🧭 O que a skill registra

Para cada jornada/produto, uma seção com:
- **Padrões compartilhados** — naming, CSS/tokens, slots, eventos, dados (`@wire`/Apex), acessibilidade, metadados.
- **Elementos específicos por componente** — o que é único de um só arquivo, atrelado a ele.
- **⚠️ Convenções inconsistentes** — quando os componentes divergem, as variantes ficam registradas e a decisão é **sua** (a skill nunca escolhe sozinha).

Regras de curadoria embutidas: seleção híbrida de arquivos, **mínimo de 3 componentes** por jornada, e lista canônica de jornadas (evita duplicar por variação de nome).

---

## 📖 Documentação Completa

- **→ [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** — arquitetura das duas skills, as 4 regras de curadoria, o guia de 9 etapas, coexistência com a `apex-test-loop`, e as decisões de design.
- **→ [`docs/PLANEJAMENTO.md`](docs/PLANEJAMENTO.md)** — a trilha de pesquisa que embasou tudo (comparação com `apex-test-loop` e com o `forcedotcom/sf-skills`).

---

<p align="center">
  ⭐ <b><a href="https://github.com/brunotrolo/Salesforce-LWC-Developer/stargazers">Dê uma star no repo</a></b> para ser avisado quando a Skill 2 (geração) e novas melhorias saírem.
</p>

<p align="center">
  <sub>
    Craft de LWC vindo das <b><a href="https://github.com/forcedotcom/sf-skills">skills oficiais da Salesforce</a></b> (<code>forcedotcom/sf-skills</code>, Apache-2.0) &nbsp;·&nbsp;
    <a href="https://docs.claude.com/en/docs/claude-code">Claude Code</a>
  </sub>
</p>

<p align="center">
  <sub>Orquestração e aprendizado de padrões © <a href="https://github.com/brunotrolo">brunotrolo</a> · <a href="./LICENSE">MIT</a>. Skills <code>experience-lwc-generate</code> e <code>design-systems-slds-apply</code> redistribuídas sob Apache-2.0 (ver <code>.claude/skills/VENDOR-ATTRIBUTION.md</code>).</sub>
</p>
