#!/usr/bin/env node
// pattern-extractor.mjs
// ---------------------------------------------------------------------------
// Extrator DETERMINISTICO de sinais de design de Lightning Web Components (LWC).
//
// E o "sinal deterministico" da skill lwc-pattern-documenter: em vez de o agente
// ler cada arquivo e adivinhar convencoes, ele recebe um JSON compacto com os
// sinais ja extraidos (naming, imports/decorators/eventos no JS, slots/ARIA/
// diretivas no HTML, custom properties/cores no CSS, metadados) — POR componente
// e AGREGADO, ja com deteccao de DIVERGENCIA entre componentes da mesma jornada.
//
// Filosofia (herdada do apex-test-loop): o SCRIPT mede/extrai de forma mecanica;
// o AGENTE julga, negocia divergencia com o usuario, e escreve o Markdown. O
// script NUNCA escreve arquivo de componente nem de documentacao — so le e emite.
//
// Uso:
//   node pattern-extractor.mjs --components <p1,p2,...> [--journey "Nome"]
//   node pattern-extractor.mjs --list <lwc-root>        (lista LWCs p/ o menu)
//
//   --components  caminhos de PASTAS de LWC (cada uma com .js/.html/.css/.js-meta.xml)
//                 ou de arquivos soltos; separados por virgula.
//   --journey     nome da jornada/produto (so ecoado no output, p/ rastreio).
//   --list        lista os componentes LWC sob uma raiz (para o modo de selecao
//                 interativo — regra 1 da arquitetura: caminho manual OU menu).
//   --min N       minimo de componentes para considerar o padrao confiavel
//                 (padrao 3 — regra 2 da arquitetura; abaixo disso, minComponentsMet=false).
//
// Requisitos: Node 18+. Zero dependencias externas.
// ---------------------------------------------------------------------------

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { basename, join, extname } from 'node:path';

function arg(name, def = undefined) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
}

function emit(obj, code = 0) {
  console.log(JSON.stringify(obj, null, 2));
  process.exit(code);
}

function readSafe(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
}

// Todos os matches de um regex global (retorna o grupo 1, ou o match inteiro).
function allMatches(re, str, group = 1) {
  const out = [];
  let m;
  const rx = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  while ((m = rx.exec(str)) !== null) {
    out.push(m[group] !== undefined ? m[group] : m[0]);
    if (m.index === rx.lastIndex) rx.lastIndex++;
  }
  return out;
}

function uniq(arr) {
  return [...new Set(arr.filter((x) => x != null && x !== ''))];
}

// ---------------------------------------------------------------------------
// MODO --list: enumerar LWCs sob uma raiz (para o menu de selecao interativo)
// ---------------------------------------------------------------------------
function listComponents(root) {
  const found = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    // Uma pasta e um LWC se contem <nome>.js + <nome>.js-meta.xml
    const name = basename(dir);
    const hasBundle =
      existsSync(join(dir, `${name}.js`)) && existsSync(join(dir, `${name}.js-meta.xml`));
    if (hasBundle) {
      found.push({ name, path: dir });
      return; // nao desce dentro de um bundle
    }
    for (const e of entries) {
      if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') {
        walk(join(dir, e.name));
      }
    }
  };
  walk(root);
  return found.sort((a, b) => a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// Resolucao: cada --components pode ser uma PASTA de bundle ou um arquivo solto.
// Retorna { name, path, files: {js, html, css, meta} } por componente.
// ---------------------------------------------------------------------------
function resolveComponent(p) {
  if (!existsSync(p)) return { name: basename(p), path: p, missing: true, files: {} };
  const st = statSync(p);
  if (st.isDirectory()) {
    const name = basename(p);
    const pick = (ext) => {
      const f = join(p, `${name}${ext}`);
      return existsSync(f) ? f : null;
    };
    return {
      name,
      path: p,
      files: {
        js: pick('.js'),
        html: pick('.html'),
        css: pick('.css'),
        meta: pick('.js-meta.xml'),
      },
    };
  }
  // Arquivo solto: agrupa pelos irmaos de mesmo basename
  const dir = p.slice(0, p.length - basename(p).length) || '.';
  const stem = basename(p).replace(/\.(js|html|css)$|\.js-meta\.xml$/i, '');
  const pick = (ext) => {
    const f = join(dir, `${stem}${ext}`);
    return existsSync(f) ? f : null;
  };
  return {
    name: stem,
    path: dir,
    files: { js: pick('.js'), html: pick('.html'), css: pick('.css'), meta: pick('.js-meta.xml') },
  };
}

// ---------------------------------------------------------------------------
// EXTRACAO por linguagem
// ---------------------------------------------------------------------------
function extractJs(src) {
  if (!src) return null;
  const imports = uniq(allMatches(/import\s+[^;]*?from\s+['"]([^'"]+)['"]/g, src));
  const decorators = {
    api: allMatches(/@api\b/g, src).length,
    track: allMatches(/@track\b/g, src).length,
    wire: allMatches(/@wire\b/g, src).length,
  };
  // Eventos customizados: new CustomEvent('nome' | "nome" | `nome`)
  const events = uniq(allMatches(/new\s+CustomEvent\s*\(\s*['"`]([^'"`]+)['"`]/g, src));
  const lifecycle = uniq(
    allMatches(
      /\b(connectedCallback|disconnectedCallback|renderedCallback|errorCallback|constructor)\s*\(/g,
      src
    )
  );
  const usesApex = /@salesforce\/apex\//.test(src);
  const usesGraphql = /lightning\/uiGraphQLApi|graphql/i.test(src);
  return { imports, decorators, events, lifecycle, usesApex, usesGraphql };
}

function extractHtml(src) {
  if (!src) return null;
  // Slots: <slot name="x"> (nomeados) e <slot> (default)
  const named = uniq(allMatches(/<slot\b[^>]*\bname\s*=\s*['"]([^'"]+)['"]/g, src));
  const hasDefaultSlot = /<slot\b(?![^>]*\bname\s*=)[^>]*>/.test(src);
  const slots = [...named];
  if (hasDefaultSlot) slots.push('(default)');
  // Diretivas de template LWC
  const directives = uniq(
    allMatches(/\b(for:each|for:item|iterator:|if:true|if:false|lwc:if|lwc:elseif|lwc:else)\b/g, src, 0)
  );
  // Acessibilidade: atributos aria-* , role, tabindex, alt
  const aria = uniq(allMatches(/\b(aria-[a-z]+)\s*=/g, src));
  const roles = uniq(allMatches(/\brole\s*=\s*['"]([^'"]+)['"]/g, src));
  const hasTabindex = /\btabindex\s*=/.test(src);
  const hasAlt = /\balt\s*=/.test(src);
  // Base components lightning-* usados
  const lightningTags = uniq(allMatches(/<(lightning-[a-z0-9-]+)\b/g, src));
  return {
    slots,
    directives,
    aria,
    roles,
    hasTabindex,
    hasAlt,
    a11yScore: aria.length + roles.length + (hasTabindex ? 1 : 0) + (hasAlt ? 1 : 0),
    lightningTags,
  };
}

function extractCss(src) {
  if (!src) return null;
  // Custom properties CONSUMIDAS: var(--x)  e DEFINIDAS: --x:
  const consumed = uniq(allMatches(/var\(\s*(--[a-z0-9-]+)/gi, src));
  const defined = uniq(allMatches(/(^|[;{]\s*)(--[a-z0-9-]+)\s*:/gi, src, 2));
  const usesHost = /:host\b/.test(src);
  const usesSlds = consumed.some((v) => /^--slds-|^--lwc-|^--sds-/i.test(v));
  // Cores hardcoded: #hex, rgb()/rgba(), hsl()
  const hardcodedColors = uniq([
    ...allMatches(/#[0-9a-fA-F]{3,8}\b/g, src, 0),
    ...allMatches(/\brgba?\([^)]*\)/g, src, 0),
    ...allMatches(/\bhsla?\([^)]*\)/g, src, 0),
  ]);
  return { customPropsConsumed: consumed, customPropsDefined: defined, usesHost, usesSlds, hardcodedColors };
}

function extractMeta(src) {
  if (!src) return null;
  const apiVersion = (src.match(/<apiVersion>([^<]+)<\/apiVersion>/) || [])[1] || null;
  const isExposed = /<isExposed>\s*true\s*<\/isExposed>/i.test(src);
  const targets = uniq(allMatches(/<target>([^<]+)<\/target>/g, src));
  return { apiVersion, isExposed, targets };
}

// ---------------------------------------------------------------------------
// Naming: estilo de caixa do nome do bundle
// ---------------------------------------------------------------------------
function caseStyle(name) {
  if (/^[a-z][a-zA-Z0-9]*$/.test(name) && /[A-Z]/.test(name)) return 'camelCase';
  if (/^[a-z][a-z0-9]*$/.test(name)) return 'lowercase';
  if (/^[A-Z]/.test(name)) return 'PascalCase';
  if (name.includes('_')) return 'snake_case';
  if (name.includes('-')) return 'kebab-case';
  return 'other';
}

// Maior prefixo alfabetico comum entre 2+ nomes (>= 3 chars para valer)
function commonPrefix(names) {
  if (names.length < 2) return null;
  let p = names[0];
  for (const n of names.slice(1)) {
    let i = 0;
    while (i < p.length && i < n.length && p[i] === n[i]) i++;
    p = p.slice(0, i);
    if (!p) break;
  }
  const clean = p.replace(/[^a-zA-Z].*$/, '');
  return clean.length >= 3 ? clean : null;
}

// ---------------------------------------------------------------------------
// AGREGACAO + deteccao de divergencia entre componentes da jornada
// ---------------------------------------------------------------------------
function aggregate(components) {
  const valid = components.filter((c) => !c.missing);
  const divergences = [];

  // Naming
  const styles = valid.map((c) => c.naming?.style).filter(Boolean);
  const styleCounts = tally(styles);
  if (Object.keys(styleCounts).length > 1) {
    divergences.push({
      signal: 'naming.style',
      detail: `Estilos de nome divergentes entre os componentes: ${fmtCounts(styleCounts)}.`,
    });
  }

  // Tokens vs cor hardcoded
  const withTokens = valid.filter((c) => c.css?.usesSlds || (c.css?.customPropsConsumed || []).length);
  const withHardcoded = valid.filter((c) => (c.css?.hardcodedColors || []).length);
  if (withTokens.length && withHardcoded.length) {
    divergences.push({
      signal: 'css.colorStrategy',
      detail:
        `${withTokens.length} componente(s) usam tokens/custom properties, mas ` +
        `${withHardcoded.length} usam cor hardcoded (ex.: ${withHardcoded
          .map((c) => `${c.name}: ${(c.css.hardcodedColors || [])[0]}`)
          .slice(0, 3)
          .join(', ')}).`,
    });
  }

  // Event naming: estilo dos nomes de evento (camelCase? tem prefixo "on"?)
  const allEvents = valid.flatMap((c) => c.js?.events || []);
  if (allEvents.length) {
    const withOnPrefix = allEvents.filter((e) => /^on[A-Z]/.test(e)).length;
    if (withOnPrefix && withOnPrefix < allEvents.length) {
      divergences.push({
        signal: 'js.eventNaming',
        detail: `Nomes de evento inconsistentes: alguns com prefixo "on" e outros sem (${uniq(allEvents).join(', ')}).`,
      });
    }
  }

  // Slots: uns usam, outros nao (informativo, nao necessariamente divergencia ruim)
  const withSlots = valid.filter((c) => (c.html?.slots || []).length);

  return {
    componentsScanned: valid.length,
    // Elementos ESPECIFICOS: itens que aparecem em UM SO componente da jornada (nao
    // compartilhados). Ex.: um slot, evento, token, import ou tag lightning-* que so
    // aquele arquivo tem. A skill registra estes atrelados ao componente de origem
    // (pedido explicito do usuario), separado dos padroes compartilhados.
    componentSpecifics: computeSpecifics(valid),
    naming: {
      styleCounts,
      dominantStyle: dominant(styleCounts),
      commonPrefix: commonPrefix(valid.map((c) => c.name)),
    },
    css: {
      withTokens: withTokens.length,
      withHardcodedColors: withHardcoded.length,
      allTokensSeen: uniq(valid.flatMap((c) => c.css?.customPropsConsumed || [])),
    },
    js: {
      allEvents: uniq(allEvents),
      wireUsers: valid.filter((c) => (c.js?.decorators?.wire || 0) > 0).length,
      apexUsers: valid.filter((c) => c.js?.usesApex).length,
    },
    html: {
      componentsWithSlots: withSlots.length,
      allSlots: uniq(valid.flatMap((c) => c.html?.slots || [])),
      allLightningTags: uniq(valid.flatMap((c) => c.html?.lightningTags || [])),
      a11yAvg:
        valid.length ? Math.round((valid.reduce((s, c) => s + (c.html?.a11yScore || 0), 0) / valid.length) * 10) / 10 : 0,
    },
    divergences,
  };
}

// Elementos unicos de cada componente: para cada dimensao (slots, eventos, tokens,
// tags lightning-*, imports, diretivas, aria), lista os itens que SO aquele
// componente tem (frequencia 1 entre os analisados). Retorna so os componentes que
// tem algum item exclusivo.
function computeSpecifics(valid) {
  const dims = {
    slots: (c) => c.html?.slots || [],
    events: (c) => c.js?.events || [],
    tokens: (c) => c.css?.customPropsConsumed || [],
    lightningTags: (c) => c.html?.lightningTags || [],
    imports: (c) => c.js?.imports || [],
    directives: (c) => c.html?.directives || [],
    aria: (c) => c.html?.aria || [],
    hardcodedColors: (c) => c.css?.hardcodedColors || [],
  };
  const freq = {};
  for (const [dim, get] of Object.entries(dims)) {
    freq[dim] = {};
    for (const c of valid) for (const it of uniq(get(c))) freq[dim][it] = (freq[dim][it] || 0) + 1;
  }
  return valid
    .map((c) => {
      const unique = {};
      for (const [dim, get] of Object.entries(dims)) {
        const u = uniq(get(c)).filter((it) => freq[dim][it] === 1);
        if (u.length) unique[dim] = u;
      }
      return { component: c.name, unique };
    })
    .filter((x) => Object.keys(x.unique).length);
}

function tally(arr) {
  const o = {};
  for (const x of arr) o[x] = (o[x] || 0) + 1;
  return o;
}
function fmtCounts(o) {
  return Object.entries(o)
    .map(([k, v]) => `${k}×${v}`)
    .join(', ');
}
function dominant(o) {
  let best = null,
    n = -1;
  for (const [k, v] of Object.entries(o)) if (v > n) (best = k), (n = v);
  return best;
}

// ===========================================================================
// MAIN
// ===========================================================================
const listRoot = arg('list');
if (typeof listRoot === 'string') {
  const comps = listComponents(listRoot);
  emit({ mode: 'list', root: listRoot, count: comps.length, components: comps });
}

const compArg = arg('components');
if (typeof compArg !== 'string') {
  emit(
    {
      error:
        'Informe --components <pasta1,pasta2,...> (bundles LWC) ou --list <raiz>. ' +
        'Ex.: node pattern-extractor.mjs --components force-app/main/default/lwc/invoiceSummary --journey "Faturas"',
    },
    2
  );
}

const journey = typeof arg('journey') === 'string' ? arg('journey') : null;
const minN = Number(arg('min', 3)) || 3;

const paths = compArg.split(',').map((s) => s.trim()).filter(Boolean);
const components = paths.map((p) => {
  const c = resolveComponent(p);
  if (c.missing) return c;
  const js = extractJs(readSafe(c.files.js));
  const html = extractHtml(readSafe(c.files.html));
  const css = extractCss(readSafe(c.files.css));
  const meta = extractMeta(readSafe(c.files.meta));
  return {
    name: c.name,
    path: c.path,
    present: {
      js: !!c.files.js,
      html: !!c.files.html,
      css: !!c.files.css,
      meta: !!c.files.meta,
    },
    naming: { raw: c.name, style: caseStyle(c.name) },
    js,
    html,
    css,
    meta,
  };
});

const missing = components.filter((c) => c.missing).map((c) => c.path);
const agg = aggregate(components);
const minComponentsMet = agg.componentsScanned >= minN;

const warnings = [];
if (!minComponentsMet) {
  warnings.push(
    `Apenas ${agg.componentsScanned} componente(s) valido(s) — minimo ${minN} para documentar com confianca ` +
      `(regra 2 da arquitetura). BLOQUEIE a escrita e peca mais exemplos.`
  );
}
if (missing.length) warnings.push(`Caminhos nao encontrados: ${missing.join(', ')}.`);
if (agg.divergences.length) {
  warnings.push(
    `${agg.divergences.length} divergencia(s) de convencao detectada(s) — DOCUMENTE as variantes, ` +
      `nunca decida sozinho pela maioria (regra 3 da arquitetura).`
  );
}

emit({
  mode: 'extract',
  journey,
  min: minN,
  minComponentsMet,
  componentsScanned: agg.componentsScanned,
  components: components.filter((c) => !c.missing),
  missing: missing.length ? missing : undefined,
  aggregate: agg,
  warnings,
});
