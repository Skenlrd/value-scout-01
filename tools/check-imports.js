#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
// no external deps - use fs recursion

const repoRoot = path.resolve(__dirname, '..');

const exts = ['.js', '.jsx', '.ts', '.tsx', '.json', '.py'];

function fileExistsAny(base) {
  for (const e of exts) {
    if (fs.existsSync(base + e)) return base + e;
  }
  // index variants
  for (const e of exts) {
    if (fs.existsSync(path.join(base, 'index' + e))) return path.join(base, 'index' + e);
  }
  return null;
}

function resolveImport(spec, filePath) {
  if (!spec) return null;
  // alias for frontend src
  if (spec.startsWith('@/')) {
    const rel = spec.slice(2);
    const candidate = path.join(repoRoot, 'frontend', 'src', rel);
    return fileExistsAny(candidate) || null;
  }
  if (spec.startsWith('./') || spec.startsWith('../')) {
    const candidate = path.resolve(path.dirname(filePath), spec);
    return fileExistsAny(candidate) || null;
  }
  if (spec.startsWith('/')) {
    const candidate = path.join(repoRoot, spec);
    return fileExistsAny(candidate) || null;
  }
  // For Python relative imports like from .module import x
  if (spec.startsWith('.')) {
    const candidate = path.resolve(path.dirname(filePath), spec);
    return fileExistsAny(candidate) || null;
  }
  // module import (node_module or builtin) - skip
  return 'external';
}

function scan() {
  const extsToMatch = ['.js', '.jsx', '.ts', '.tsx', '.py'];
  const ignoreDirs = new Set(['node_modules', '.git', 'dist']);

  const files = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) {
        if (ignoreDirs.has(e.name) || e.name === 'node_modules') continue;
        // skip frontend/node_modules and backend/node_modules when walking
        if (dir.endsWith(path.join('frontend')) && e.name === 'node_modules') continue;
        if (dir.endsWith(path.join('backend')) && e.name === 'node_modules') continue;
        walk(path.join(dir, e.name));
      } else if (e.isFile()) {
        const ext = path.extname(e.name).toLowerCase();
        if (extsToMatch.includes(ext)) files.push(path.join(dir, e.name));
      }
    }
  }

  // Only scan the main project areas to avoid long unnecessary traversal
  const scanRoots = [path.join(repoRoot, 'frontend'), path.join(repoRoot, 'backend'), path.join(repoRoot, 'ai'), path.join(repoRoot, 'tools')];
  for (const r of scanRoots) {
    if (fs.existsSync(r)) walk(r);
  }

  const problems = [];

  const importRegex = /import\s+(?:[^'"\n]+)\s+from\s+['"]([^'"]+)['"]/g;
  const importRegex2 = /import\(['"]([^'"]+)['"]\)/g; // dynamic imports
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  const pyFromRegex = /from\s+([\.\w_]+)\s+import\s+/g;
  const pyImportRegex = /(^|\n)import\s+([\w_\.]+)/g;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const relFile = path.relative(repoRoot, file);

    let m;
    while ((m = importRegex.exec(content))) {
      const spec = m[1];
      const resolved = resolveImport(spec, file);
      if (!resolved) problems.push({ file: relFile, line: getLineForIndex(content, m.index), spec });
    }
    while ((m = importRegex2.exec(content))) {
      const spec = m[1];
      const resolved = resolveImport(spec, file);
      if (!resolved) problems.push({ file: relFile, line: getLineForIndex(content, m.index), spec });
    }
    while ((m = requireRegex.exec(content))) {
      const spec = m[1];
      const resolved = resolveImport(spec, file);
      if (!resolved) problems.push({ file: relFile, line: getLineForIndex(content, m.index), spec });
    }

    // python checks for relative imports
    while ((m = pyFromRegex.exec(content))) {
      const spec = m[1];
      if (spec.startsWith('.')) {
        const resolved = resolveImport(spec, file);
        if (!resolved) problems.push({ file: relFile, line: getLineForIndex(content, m.index), spec });
      }
    }
  }

  if (problems.length === 0) {
    console.log('✅ No unresolved local imports found.');
    return 0;
  }

  console.log('❌ Unresolved imports:');
  for (const p of problems) {
    console.log(`- ${p.file}:${p.line} -> ${p.spec}`);
  }
  return 1;
}

function getLineForIndex(content, idx) {
  const substr = content.slice(0, idx);
  return substr.split('\n').length;
}

if (require.main === module) {
  const code = scan();
  process.exit(code);
}
