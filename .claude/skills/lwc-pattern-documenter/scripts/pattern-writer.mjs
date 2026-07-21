#!/usr/bin/env node
/**
 * pattern-writer.mjs — Merge writer DETERMINISTICO do documento de design system.
 *
 * POR QUE EXISTE: a escrita NUNCA pode depender de o modelo lembrar de preservar o
 * resto do arquivo. Um modelo fraco ja sobrescreveu o design-patterns.md inteiro
 * (apagando uma jornada ja documentada) em vez de anexar uma secao nova. Este script
 * faz o merge mecanicamente:
 *   - Jornada nova     -> ANEXA a secao; toda jornada existente permanece intacta.
 *   - Jornada existente -> substitui SO a secao `## Padrao: <nome>` dela, mantendo o
 *                          cabecalho, a ordem e as demais jornadas.
 * E faz upsert do journeys-index.json do mesmo jeito seguro (nunca zera o array).
 *
 * Uso:
 *   node pattern-writer.mjs \
 *     --journey "Consorcio" \
 *     --components compA,compB,compC \
 *     --section /caminho/para/section.md        # o Markdown aprovado DESTA jornada
 *
 *   # a secao tambem pode vir por stdin:
 *   cat section.md | node pattern-writer.mjs --journey "X" --components a,b,c --stdin
 *
 * Opcional:
 *   --out-dir <dir>   base (padrao: .lwc-pattern-documenter/lwc-design-system)
 *   --dry-run         imprime o merge no stdout, nao grava nada
 */

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_OUT_DIR = '.lwc-pattern-documenter/lwc-design-system';
const DOC_HEADER = '# Design Patterns LWC — Documentação por Jornada';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { journey: '', components: [], sectionFile: '', stdin: false, outDir: DEFAULT_OUT_DIR, dryRun: false };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--journey': opts.journey = args[++i] || ''; break;
      case '--components': opts.components = (args[++i] || '').split(',').map((c) => c.trim()).filter(Boolean); break;
      case '--section': opts.sectionFile = args[++i] || ''; break;
      case '--stdin': opts.stdin = true; break;
      case '--out-dir': opts.outDir = args[++i] || DEFAULT_OUT_DIR; break;
      case '--dry-run': opts.dryRun = true; break;
      default: break;
    }
  }
  return opts;
}

function today() {
  // Script node normal (nao Workflow) — new Date() e permitido aqui.
  return new Date().toISOString().slice(0, 10);
}

// Normaliza um titulo de jornada para comparacao (sem acento, minusculo).
function normHeading(name) {
  return String(name).normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

// Divide o doc num cabecalho + lista ORDENADA de secoes { name, text }.
function parseDoc(content) {
  const lines = content.split('\n');
  const sections = [];
  const headerLines = [];
  let current = null;
  let inSection = false;
  for (const line of lines) {
    const m = line.match(/^##\s+Padr[aã]o:\s*(.+?)\s*$/);
    if (m) {
      if (current) sections.push(current);
      current = { name: m[1].trim(), lines: [line] };
      inSection = true;
    } else if (inSection) {
      current.lines.push(line);
    } else {
      headerLines.push(line);
    }
  }
  if (current) sections.push(current);
  return {
    header: headerLines.join('\n').replace(/\s+$/, ''),
    sections: sections.map((s) => ({ name: s.name, text: s.lines.join('\n').replace(/\s+$/, '') })),
  };
}

function buildDoc(header, sections) {
  const h = header && header.trim() ? header.trim() : DOC_HEADER;
  const parts = [h, ''];
  for (const s of sections) { parts.push(s.text.trim()); parts.push(''); }
  return parts.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '') + '\n';
}

function ensureSectionHeading(sectionMd, journey) {
  const trimmed = sectionMd.replace(/^\s+/, '').replace(/\s+$/, '');
  if (/^##\s+Padr[aã]o:/.test(trimmed)) return trimmed;
  return `## Padrao: ${journey}\n\n${trimmed}`;
}

function mergeDoc(existingContent, journey, sectionMd) {
  const section = ensureSectionHeading(sectionMd, journey);
  const target = normHeading(journey);
  if (!existingContent || !existingContent.trim()) {
    return buildDoc(DOC_HEADER, [{ name: journey, text: section }]);
  }
  const { header, sections } = parseDoc(existingContent);
  const idx = sections.findIndex((s) => normHeading(s.name) === target);
  if (idx >= 0) sections[idx] = { name: journey, text: section };
  else sections.push({ name: journey, text: section });
  return buildDoc(header, sections);
}

function mergeIndex(existingJson, journey, components) {
  let arr = [];
  if (existingJson && existingJson.trim()) {
    let parsed;
    try { parsed = JSON.parse(existingJson); } catch {
      throw new Error('journeys-index.json existe mas nao e um JSON de array valido. Corrija manualmente antes de gravar (nao vou sobrescrever para nao perder jornadas).');
    }
    if (Array.isArray(parsed)) arr = parsed;
  }
  const target = normHeading(journey);
  const idx = arr.findIndex((e) => e && normHeading(e.journey) === target);
  const entry = { journey, components: components.length ? components : idx >= 0 ? arr[idx].components : [], lastScan: today() };
  if (idx >= 0) arr[idx] = entry; else arr.push(entry);
  return arr;
}

function main() {
  const opts = parseArgs();
  if (!opts.journey) { console.error('ERRO: --journey e obrigatorio.'); process.exit(1); }

  let sectionMd = '';
  if (opts.stdin) sectionMd = fs.readFileSync(0, 'utf8');
  else if (opts.sectionFile) {
    if (!fs.existsSync(opts.sectionFile)) { console.error(`ERRO: arquivo de secao nao encontrado: ${opts.sectionFile}`); process.exit(1); }
    sectionMd = fs.readFileSync(opts.sectionFile, 'utf8');
  } else { console.error('ERRO: forneca a secao via --section <arquivo> ou --stdin.'); process.exit(1); }
  if (!sectionMd.trim()) { console.error('ERRO: a secao Markdown esta vazia. Nao vou gravar.'); process.exit(1); }

  const docPath = path.join(opts.outDir, 'design-patterns.md');
  const indexPath = path.join(opts.outDir, 'journeys-index.json');
  const existingDoc = fs.existsSync(docPath) ? fs.readFileSync(docPath, 'utf8') : '';
  const existingIndex = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';

  const beforeJourneys = existingDoc ? parseDoc(existingDoc).sections.map((s) => s.name) : [];
  const mergedDoc = mergeDoc(existingDoc, opts.journey, sectionMd);
  const mergedIndex = mergeIndex(existingIndex, opts.journey, opts.components);
  const afterJourneys = parseDoc(mergedDoc).sections.map((s) => s.name);

  // INVARIANTE DE SEGURANCA: gravar a jornada N nunca pode perder as jornadas 1..N-1.
  const lost = beforeJourneys.filter((b) => !afterJourneys.some((a) => normHeading(a) === normHeading(b)));
  if (lost.length) { console.error(`ERRO DE INTEGRIDADE: o merge perderia jornada(s): ${lost.join(', ')}. Abortando sem gravar.`); process.exit(2); }

  const isNew = !beforeJourneys.some((b) => normHeading(b) === normHeading(opts.journey));

  if (opts.dryRun) {
    console.log('===== design-patterns.md (merged) =====\n' + mergedDoc);
    console.log('===== journeys-index.json (merged) =====\n' + JSON.stringify(mergedIndex, null, 2));
    console.log('\n[dry-run] nada foi gravado.');
    return;
  }

  fs.mkdirSync(opts.outDir, { recursive: true });
  fs.writeFileSync(docPath, mergedDoc, 'utf8');
  fs.writeFileSync(indexPath, JSON.stringify(mergedIndex, null, 2) + '\n', 'utf8');

  console.log(JSON.stringify({
    ok: true, action: isNew ? 'appended' : 'updated', journey: opts.journey,
    journeysBefore: beforeJourneys.length, journeysAfter: afterJourneys.length,
    allJourneys: afterJourneys, docPath, indexPath,
  }, null, 2));
}

main();
